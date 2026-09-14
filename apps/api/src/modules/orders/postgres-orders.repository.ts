import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, inArray, tables, type Database, type SQL } from '@mims/db';
import type { FitmentConfidence } from '@mims/contracts';
import { DATABASE } from '../../database/database.module';
import {
  DuplicateOrderReferenceError,
  OrdersRepository,
  type CheckoutCart,
  type CheckoutLine,
  type OrderDraft,
  type PickupPointSnapshot,
  type StoredOrder,
} from './orders.repository';

/**
 * THE SQL BEHIND ORDER PLACEMENT.
 *
 * The first code in this system to actually query Postgres — every other
 * service is still a placeholder — so it is also where the house style for
 * data access gets set. Three things it does deliberately:
 *
 *  • THE WHOLE ORDER IS ONE TRANSACTION. Order, lines, the `placed` event and
 *    the cart's status change together or not at all. A half-written order is
 *    worse than a failed checkout, because the customer sees an error, tries
 *    again, and ends up owning two of them.
 *
 *  • THE UNIQUE VIOLATION ON `reference` IS TRANSLATED, NOT SWALLOWED. Postgres
 *    error 23505 on `orders_reference_key` is the collision the service is
 *    prepared to retry; anything else is a real fault and is rethrown with its
 *    own message intact.
 *
 *  • THE GUEST LOOKUP IS ONE QUERY WITH BOTH HALVES IN THE `WHERE`. Resolving
 *    the reference and then comparing the phone in JavaScript would make the
 *    two failures distinguishable by timing, and "that reference exists, the
 *    number is wrong" is the fact an attacker is missing.
 *
 * NOT YET RUN AGAINST A DATABASE. There is no Postgres on the machine this was
 * written on, so these queries are checked by the type system and by review and
 * nothing else. The rules that matter are in `orders.service.ts` and are tested
 * against a fake; what is unverified here is the SQL itself.
 */
@Injectable()
export class PostgresOrdersRepository extends OrdersRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async findCheckoutCart(cartId: string): Promise<CheckoutCart | null> {
    const cart = await this.db.query.carts.findFirst({
      where: eq(tables.carts.id, cartId),
      with: {
        items: {
          with: {
            listing: {
              with: {
                part: true,
                supplier: true,
              },
            },
          },
        },
      },
    });

    if (!cart) return null;

    /*
     * Fitment is re-derived here rather than read off the cart row, because the
     * cart's copy is what was true when the line was added and the order has to
     * record what was true when the money moved. One query for the whole basket
     * rather than one per line.
     */
    const fitments = await this.fitmentsFor(
      cart.variantId,
      cart.items.map((item) => item.listing?.partId ?? null),
    );

    const lines: CheckoutLine[] = cart.items.map((item) => {
      const listing = item.listing ?? null;
      const fitment = listing ? (fitments.get(listing.partId) ?? null) : null;

      return {
        cartItemId: item.id,
        quantity: item.quantity,
        snapshot: {
          partName: item.partName,
          mpn: item.mpn,
          condition: item.condition,
          stockModel: item.stockModel,
          unitPrice: item.unitPrice,
        },
        listing: listing
          ? {
              id: listing.id,
              partId: listing.partId,
              supplierId: listing.supplierId,
              supplierName: listing.supplier?.name ?? null,
              sku: listing.sku,
              /* The listing's own title where it says more than the catalogue
                 does — "Front bumper cover, tokunbo, Japan-pulled". */
              partName: listing.title ?? listing.part.name,
              mpn: listing.part.mpn,
              oemNumber: listing.part.oemNumber,
              position: listing.part.position,
              condition: listing.condition,
              stockModel: listing.stockModel,
              status: listing.status,
              retailPrice: listing.retailPrice,
              currency: listing.currency,
              priceValidUntil: listing.priceValidUntil,
              quantityAvailable: listing.quantityAvailable,
              leadTimeMinDays: listing.leadTimeMinDays,
              leadTimeMaxDays: listing.leadTimeMaxDays,
              fitmentNote: listing.fitmentNote,
            }
          : null,
        fitment: {
          confidence: fitment?.confidence ?? 'unknown',
          qualifier: fitment?.qualifier ?? null,
        },
      };
    });

    return {
      id: cart.id,
      status: cart.status,
      currency: cart.currency,
      estimateId: cart.estimateId,
      vehicle: {
        variantId: cart.variantId,
        year: cart.vehicleYear,
        makeText: cart.vehicleMakeText,
        modelText: cart.vehicleModelText,
        chassisCode: cart.vehicleChassisCode,
      },
      lines,
    };
  }

  /**
   * Fitment for a basket, by part, against one variant.
   *
   * No vehicle on the cart means no fitment claim is possible — not a weak one,
   * none — so the map comes back empty and every line grades `unknown`. The cart
   * screen says the same thing in words: ungraded because no car is set, not
   * because the parts are doubtful.
   */
  private async fitmentsFor(
    variantId: string | null,
    partIds: Array<string | null>,
  ): Promise<Map<string, { confidence: FitmentConfidence; qualifier: string | null }>> {
    const wanted = [...new Set(partIds.filter((id): id is string => id !== null))];
    if (!variantId || wanted.length === 0) return new Map();

    const rows = await this.db.query.partFitments.findMany({
      where: and(
        eq(tables.partFitments.variantId, variantId),
        inArray(tables.partFitments.partId, wanted),
      ),
    });

    const byPart = new Map<string, { confidence: FitmentConfidence; qualifier: string | null }>();
    for (const row of rows) {
      /* A part can hold several fitment rows for one variant, split by year
         range. Keep the strongest claim: it is the one the product screen shows
         and therefore the one the customer bought against. */
      const existing = byPart.get(row.partId);
      if (!existing || rank(row.confidence) > rank(existing.confidence)) {
        byPart.set(row.partId, { confidence: row.confidence, qualifier: row.qualifier });
      }
    }
    return byPart;
  }

  async findPickupPoint(id: string): Promise<PickupPointSnapshot | null> {
    const point = await this.db.query.pickupPoints.findFirst({
      where: eq(tables.pickupPoints.id, id),
    });
    if (!point) return null;

    return {
      id: point.id,
      code: point.code,
      name: point.name,
      /* One printable line, which is what the confirmation and the tracking
         screen show. See the note on the pickup gap in `orders.service.ts`. */
      address: [point.line1, point.area, point.city, point.state].filter(Boolean).join(', '),
      isActive: point.isActive,
    };
  }

  async create(draft: OrderDraft): Promise<StoredOrder> {
    try {
      const orderId = await this.db.transaction(async (tx) => {
        const [order] = await tx
          .insert(tables.orders)
          .values({
            reference: draft.reference,
            status: 'awaiting_payment',
            cartId: draft.cartId,
            estimateId: draft.estimateId,
            customerName: draft.customerName,
            customerPhone: draft.customerPhone,
            customerEmail: draft.customerEmail,
            customerNote: draft.customerNote,
            fulfilmentMethod: draft.fulfilmentMethod,
            pickupPointId: draft.pickupPoint?.id ?? null,
            pickupPointCode: draft.pickupPoint?.code ?? null,
            pickupPointName: draft.pickupPoint?.name ?? null,
            pickupPointAddress: draft.pickupPoint?.address ?? null,
            variantId: draft.vehicle.variantId,
            vehicleYear: draft.vehicle.year,
            vehicleMakeText: draft.vehicle.makeText,
            vehicleModelText: draft.vehicle.modelText,
            vehicleChassisCode: draft.vehicle.chassisCode,
            itemsSubtotal: draft.itemsSubtotal,
            deliveryFee: draft.deliveryFee,
            total: draft.total,
            currency: draft.currency,
            leadTimeMinDays: draft.leadTimeMinDays,
            leadTimeMaxDays: draft.leadTimeMaxDays,
          })
          .returning({ id: tables.orders.id });

        if (!order) throw new Error('Order insert returned no row');

        await tx.insert(tables.orderItems).values(
          draft.items.map((item) => ({
            orderId: order.id,
            listingId: item.listingId,
            partId: item.partId,
            supplierId: item.supplierId,
            supplierName: item.supplierName,
            sku: item.sku,
            partName: item.partName,
            mpn: item.mpn,
            oemNumber: item.oemNumber,
            position: item.position,
            condition: item.condition,
            stockModel: item.stockModel,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            currency: item.currency,
            leadTimeMinDays: item.leadTimeMinDays,
            leadTimeMaxDays: item.leadTimeMaxDays,
            fitmentConfidence: item.fitmentConfidence,
            fitmentNote: item.fitmentNote,
            sortOrder: item.sortOrder,
          })),
        );

        await tx.insert(tables.orderEvents).values({
          orderId: order.id,
          type: 'placed',
          summary: draft.placedSummary,
          isCustomerVisible: true,
        });

        /*
         * The cart closes with the order. Leaving it `active` would let a
         * refresh of the checkout page place the same basket twice, and the
         * customer would have no way of telling that they had.
         */
        await tx
          .update(tables.carts)
          .set({ status: 'ordered', orderedAt: new Date(), updatedAt: new Date() })
          .where(eq(tables.carts.id, draft.cartId));

        return order.id;
      });

      const stored = await this.findById(orderId);
      if (!stored) throw new Error(`Order ${orderId} vanished immediately after insert`);
      return stored;
    } catch (error) {
      if (isDuplicateReference(error)) {
        throw new DuplicateOrderReferenceError(draft.reference);
      }
      throw error;
    }
  }

  async findByReferenceAndPhone(
    normalisedReference: string,
    normalisedPhone: string,
  ): Promise<StoredOrder | null> {
    return this.findOne(
      and(
        eq(tables.orders.reference, normalisedReference),
        eq(tables.orders.customerPhone, normalisedPhone),
      ),
    );
  }

  private findById(id: string): Promise<StoredOrder | null> {
    return this.findOne(eq(tables.orders.id, id));
  }

  /**
   * The one shape an order is ever read in: lines in the order they were
   * bought, timeline newest first, which is how the tracking screen reads it.
   *
   * One method rather than a shared config object, because the `with` clause is
   * what tells Drizzle's inference that the row carries `items` and `events` —
   * hoisting it into a constant loses exactly that and the mapper below stops
   * being typechecked against the real row.
   */
  private async findOne(where: SQL | undefined): Promise<StoredOrder | null> {
    const row = await this.db.query.orders.findFirst({
      where,
      with: {
        items: { orderBy: asc(tables.orderItems.sortOrder) },
        events: { orderBy: desc(tables.orderEvents.occurredAt) },
      },
    });
    return row ? toStoredOrder(row) : null;
  }
}

/** The order row as `findOne` reads it: its own columns, plus both relations. */
type OrderRow = typeof tables.orders.$inferSelect & {
  items: Array<typeof tables.orderItems.$inferSelect>;
  events: Array<typeof tables.orderEvents.$inferSelect>;
};

const CONFIDENCE_RANK: Record<FitmentConfidence, number> = {
  unknown: 0,
  probable: 1,
  confirmed: 2,
};

function rank(confidence: FitmentConfidence): number {
  return CONFIDENCE_RANK[confidence];
}

/** Postgres 23505 on the reference index — the collision the service retries. */
function isDuplicateReference(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as { code?: unknown; constraint_name?: unknown; constraint?: unknown };
  if (candidate.code !== '23505') return false;
  const constraint = candidate.constraint_name ?? candidate.constraint;
  return constraint === 'orders_reference_key' || constraint === undefined;
}

/**
 * Written out field by field rather than cast.
 *
 * A cast here would compile and then quietly ship whatever the row happens to
 * hold — including, the day somebody adds a column, a field the contract never
 * meant to expose. The order row carries the customer's phone, their address
 * and their note; naming every field that leaves this function is how those
 * stay deliberate.
 */
function toStoredOrder(row: OrderRow): StoredOrder {
  return {
    id: row.id,
    reference: row.reference,
    status: row.status,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    customerEmail: row.customerEmail,
    fulfilmentMethod: row.fulfilmentMethod,
    pickupPointCode: row.pickupPointCode,
    pickupPointName: row.pickupPointName,
    pickupPointAddress: row.pickupPointAddress,
    deliveryLine1: row.deliveryLine1,
    deliveryLine2: row.deliveryLine2,
    deliveryLandmark: row.deliveryLandmark,
    deliveryArea: row.deliveryArea,
    deliveryCity: row.deliveryCity,
    deliveryState: row.deliveryState,
    deliveryRecipientName: row.deliveryRecipientName,
    deliveryPhone: row.deliveryPhone,
    vehicleYear: row.vehicleYear,
    vehicleMakeText: row.vehicleMakeText,
    vehicleModelText: row.vehicleModelText,
    vehicleChassisCode: row.vehicleChassisCode,
    itemsSubtotal: row.itemsSubtotal,
    deliveryFee: row.deliveryFee,
    total: row.total,
    currency: row.currency,
    leadTimeMinDays: row.leadTimeMinDays,
    leadTimeMaxDays: row.leadTimeMaxDays,
    customerNote: row.customerNote,
    cancellationReason: row.cancellationReason,
    placedAt: row.placedAt,
    paidAt: row.paidAt,
    deliveredAt: row.deliveredAt,
    items: row.items.map((item) => ({
      id: item.id,
      sku: item.sku,
      partName: item.partName,
      mpn: item.mpn,
      oemNumber: item.oemNumber,
      position: item.position,
      condition: item.condition,
      stockModel: item.stockModel,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      currency: item.currency,
      leadTimeMinDays: item.leadTimeMinDays,
      leadTimeMaxDays: item.leadTimeMaxDays,
      fitmentConfidence: item.fitmentConfidence,
      fitmentNote: item.fitmentNote,
    })),
    events: row.events.map((event) => ({
      id: event.id,
      type: event.type,
      summary: event.summary,
      detail: event.detail,
      occurredAt: event.occurredAt,
    })),
  };
}
