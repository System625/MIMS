import { Injectable, Logger } from '@nestjs/common';
import type { CheckoutRequest, LookupOrderRequest, Order, OrderItem } from '@mims/contracts';
import { AppError, type AppErrorDetail } from '../../common/errors/app-error';
import { addMoney, multiplyMoney, sumMoney, ZERO_MONEY } from '../../common/money';
import {
  DuplicateOrderReferenceError,
  OrdersRepository,
  type CheckoutCart,
  type CheckoutLine,
  type OrderDraftItem,
  type PickupPointSnapshot,
  type StoredOrder,
} from './orders.repository';
import { generateOrderReference, normalisePhone, normaliseOrderReference } from './order-reference';

/**
 * ORDER PLACEMENT — build plan item 10, and the last stop in the store.
 *
 * Everything else in the checkout was already built: the form, its validation,
 * and a Paystack integration that verifies server-side and settles once. This
 * is the piece between them, and it is where a store is robbed if it is written
 * carelessly. Four rules do most of the work.
 *
 * 1. THE CLIENT NEVER SENDS A PRICE. Look at `checkoutRequestSchema`: a cart id,
 *    a name, a phone, a fulfilment choice. No amounts, anywhere. So every figure
 *    on the order is computed here from `listings.retailPrice` at the moment of
 *    placing, and a browser that wants to buy a ₦400,000 bumper for ₦100 has
 *    nothing to tamper with. This is not a check we perform; it is a shape that
 *    makes the attack unexpressible.
 *
 * 2. A PRICE PAST ITS WINDOW IS NOT SELLABLE. The Naira moved between ₦1,350 and
 *    ₦1,430 to the dollar across 2026 with active pass-through to import prices,
 *    and we take the money weeks before the goods land, so the FX risk in the
 *    middle is entirely ours. `priceValidUntil` is how the catalogue says "this
 *    figure has aged out" and the answer is to re-quote, not to sell and absorb.
 *
 * 3. UNCONFIRMED FITMENT MUST BE ACKNOWLEDGED IN WRITING. Around half of all
 *    car-part returns are fitment, and against three to six weeks of sea freight
 *    a wrong panel cannot be fixed by a refund. `acceptsFitmentRisk` is the
 *    customer saying they saw the caveat. If it is absent and any line is not
 *    `confirmed`, the order does not exist — we do not take the money and argue
 *    about the verdict afterwards, which is the whole reason /returns can draw
 *    the line where it does.
 *
 * 4. FITMENT AND PRICE ARE RE-DERIVED, NOT COPIED OFF THE CART. Item 5 settled
 *    this for the basket — snapshot the identity, derive the volatile — and an
 *    order has the stronger version of the same duty, because the snapshot it
 *    writes is the one we will be asked to defend under the FCCPA six weeks
 *    from now. What goes onto `order_items` is what was true at the moment the
 *    money was committed, not what was true when somebody clicked "add".
 */
@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly repository: OrdersRepository) {}

  async place(request: CheckoutRequest): Promise<Order> {
    const cart = await this.loadPlaceableCart(request.cartId);
    const pickupPoint = await this.resolveFulfilment(request);

    const lines = this.priceLines(cart);
    this.requireFitmentAcknowledgement(lines, request.acceptsFitmentRisk);

    const itemsSubtotal = sumMoney(lines.map((line) => line.lineTotal));
    /*
     * Zero, and not because collection is free of charge to us — because a
     * pickup order genuinely has no delivery leg. The delivery case never
     * reaches here; see `resolveFulfilment`.
     */
    const deliveryFee = ZERO_MONEY;

    const stored = await this.createWithUniqueReference({
      cartId: cart.id,
      estimateId: cart.estimateId,
      customerName: request.customerName,
      customerPhone: normalisePhone(request.customerPhone),
      customerEmail: request.customerEmail ?? null,
      customerNote: request.customerNote ?? null,
      fulfilmentMethod: request.fulfilmentMethod,
      pickupPoint,
      vehicle: cart.vehicle,
      itemsSubtotal,
      deliveryFee,
      total: addMoney(itemsSubtotal, deliveryFee),
      currency: cart.currency,
      ...leadTimeWindow(lines),
      items: lines,
      placedSummary:
        request.fulfilmentMethod === 'pickup'
          ? 'Order placed. We are holding it against your name and waiting for the payment.'
          : 'Order placed. We are waiting for the payment.',
    });

    return toContractOrder(stored);
  }

  /**
   * Guest order lookup: the reference plus the phone it was placed with.
   *
   * ONE FAILURE FOR BOTH HALVES, and item 7 is where that was decided. "That
   * reference exists but the number is wrong" hands somebody the one fact they
   * were missing, and a store whose references are short enough to read down a
   * phone line cannot afford to confirm which ones are real. The repository
   * resolves both halves in a single query so the two cases cannot even be
   * separated by timing.
   */
  async lookup(request: LookupOrderRequest): Promise<Order> {
    const stored = await this.repository.findByReferenceAndPhone(
      normaliseOrderReference(request.reference),
      normalisePhone(request.phone),
    );

    if (!stored) {
      throw new AppError(
        'NOT_FOUND',
        'We could not find an order with that reference and phone number. Check both — the reference is on the confirmation, and the number is the one the order was placed with.',
      );
    }

    return toContractOrder(stored);
  }

  /* ------------------------------------------------------------- loading -- */

  private async loadPlaceableCart(cartId: string): Promise<CheckoutCart> {
    const cart = await this.repository.findCheckoutCart(cartId);
    if (!cart) throw AppError.notFound('That basket');

    if (cart.status === 'ordered') {
      /*
       * Almost always a double-submitted form or a back button, not an attack.
       * Say what happened rather than "conflict": somebody who has just pressed
       * pay twice needs to know whether they have been charged twice.
       */
      throw new AppError(
        'CONFLICT',
        'This basket has already been ordered. Look it up under your phone number rather than placing it again.',
      );
    }
    if (cart.status !== 'active') {
      throw new AppError('CONFLICT', 'This basket is no longer active.');
    }
    if (cart.lines.length === 0) {
      throw new AppError('CONFLICT', 'There is nothing in this basket to order.');
    }

    return cart;
  }

  /**
   * DELIVERY IS NOT OPEN, AND THAT IS A BUSINESS FACT RATHER THAN A BUG.
   *
   * bella.md §3 records that no logistics partner has been chosen. `/checkout`
   * already refuses to total a delivery order for exactly this reason and says
   * so on the screen. The API has to hold the same line, and more firmly: a
   * delivery order placed here would be payable at a total with no delivery in
   * it, so the customer would prepay and then be asked for more money later —
   * which is the one thing duty-inclusive pricing exists to prevent.
   *
   * When a partner is signed, this method resolves an address and quotes a fee,
   * and `deliveryFee` in `place` stops being a constant. Until then it refuses,
   * loudly and with a reason a customer can act on.
   */
  private async resolveFulfilment(request: CheckoutRequest): Promise<PickupPointSnapshot | null> {
    if (request.fulfilmentMethod === 'delivery') {
      throw new AppError(
        'CONFLICT',
        'We cannot total a delivery order yet — we have not signed a courier, so there is no rate to quote you from. Choose collection, which totals exactly, and we will call you when delivery opens.',
      );
    }

    const point = await this.repository.findPickupPoint(request.pickupPointId);
    if (!point || !point.isActive) {
      throw AppError.notFound('That collection point');
    }
    return point;
  }

  /* -------------------------------------------------------------- pricing -- */

  /**
   * Every line, priced from the live listing and snapshotted.
   *
   * All the refusals are collected before any is thrown, because a basket with
   * three problems should say three things once rather than send the customer
   * round the loop three times.
   */
  private priceLines(cart: CheckoutCart): OrderDraftItem[] {
    const problems: AppErrorDetail[] = [];
    const items: OrderDraftItem[] = [];
    const now = new Date();

    cart.lines.forEach((line, index) => {
      const path = `items.${index}`;
      const listing = line.listing;

      if (!listing) {
        problems.push({
          path,
          message: `${line.snapshot.partName} is no longer for sale. Remove it and the rest of the basket can go through.`,
        });
        return;
      }

      if (listing.status !== 'active') {
        problems.push({
          path,
          message: `${listing.partName} is not currently available. Remove it and the rest of the basket can go through.`,
        });
        return;
      }

      if (listing.priceValidUntil && listing.priceValidUntil.getTime() <= now.getTime()) {
        problems.push({
          path,
          message: `The price we quoted for ${listing.partName} has aged out and has to be re-quoted before we can sell it. Open the basket again and it will show the current figure.`,
        });
        return;
      }

      /* Pre-order has no shelf to run out of — that is what pre-order means, and
         `quantityAvailable` is 0 on every sourced listing by design. Only held
         stock can be short. */
      if (listing.stockModel === 'held_stock' && listing.quantityAvailable < line.quantity) {
        problems.push({
          path,
          message:
            listing.quantityAvailable === 0
              ? `${listing.partName} has just gone out of stock.`
              : `We only have ${listing.quantityAvailable} of ${listing.partName} left.`,
        });
        return;
      }

      if (listing.currency !== cart.currency) {
        /* Cannot happen while the store is NGN-only, and is a data fault rather
           than something a customer can fix, so it is logged and refused. */
        this.logger.error(
          `Listing ${listing.id} is ${listing.currency} in a ${cart.currency} basket ${cart.id}`,
        );
        problems.push({ path, message: 'We cannot price that line. Please contact us.' });
        return;
      }

      items.push({
        listingId: listing.id,
        partId: listing.partId,
        supplierId: listing.supplierId,
        supplierName: listing.supplierName,
        sku: listing.sku,
        partName: listing.partName,
        mpn: listing.mpn,
        oemNumber: listing.oemNumber,
        position: listing.position,
        condition: listing.condition,
        stockModel: listing.stockModel,
        quantity: line.quantity,
        unitPrice: listing.retailPrice,
        lineTotal: multiplyMoney(listing.retailPrice, line.quantity),
        currency: listing.currency,
        leadTimeMinDays: listing.leadTimeMinDays,
        leadTimeMaxDays: listing.leadTimeMaxDays,
        fitmentConfidence: line.fitment.confidence,
        fitmentNote: fitmentNote(line, listing.fitmentNote),
        sortOrder: index,
      });
    });

    if (problems.length > 0) {
      throw new AppError(
        'CONFLICT',
        problems.length === 1
          ? 'One line in your basket cannot be ordered as it stands.'
          : `${problems.length} lines in your basket cannot be ordered as they stand.`,
        problems,
      );
    }

    return items;
  }

  private requireFitmentAcknowledgement(lines: OrderDraftItem[], accepted: boolean): void {
    if (accepted) return;

    const unconfirmed = lines.filter((line) => line.fitmentConfidence !== 'confirmed');
    if (unconfirmed.length === 0) return;

    throw new AppError(
      'VALIDATION_FAILED',
      unconfirmed.length === 1
        ? 'One part in this basket is not a confirmed fit for your car, and we need you to say you have seen that before we take the money.'
        : `${unconfirmed.length} parts in this basket are not confirmed fits for your car, and we need you to say you have seen that before we take the money.`,
      unconfirmed.map((line) => ({
        path: 'acceptsFitmentRisk',
        message: `${line.partName}: ${line.fitmentConfidence === 'probable' ? 'probable fit, not confirmed on your chassis' : 'we hold no fitment record for your car'}.`,
      })),
    );
  }

  /* ------------------------------------------------------------ reference -- */

  /**
   * References are random rather than sequential, so a collision is possible
   * rather than impossible. Seven digits against any realistic order book makes
   * it rare, and the unique index makes it harmless — but "rare" is not "never",
   * and the customer on the other end of the one collision that does happen
   * should get an order rather than a 500.
   */
  private async createWithUniqueReference(
    draft: Omit<Parameters<OrdersRepository['create']>[0], 'reference'>,
  ): Promise<StoredOrder> {
    for (let attempt = 0; attempt < REFERENCE_ATTEMPTS; attempt += 1) {
      const reference = generateOrderReference();
      try {
        return await this.repository.create({ ...draft, reference });
      } catch (error) {
        if (error instanceof DuplicateOrderReferenceError) {
          this.logger.warn(`Order reference ${reference} collided; retrying`);
          continue;
        }
        throw error;
      }
    }

    throw new AppError(
      'INTERNAL_ERROR',
      'We could not create an order reference. Nothing has been charged — please try again.',
    );
  }
}

const REFERENCE_ATTEMPTS = 5;

/**
 * What we claimed about fitment, in one sentence, frozen onto the line.
 *
 * The listing's own caveat ("halogen headlamp cars only") and the fitment
 * record's qualifier are different claims and both belong here — this string is
 * what a returns conversation is argued from, so it records what was actually
 * shown rather than a tidied summary of it.
 */
function fitmentNote(line: CheckoutLine, listingNote: string | null): string | null {
  const parts = [line.fitment.qualifier, listingNote].filter(
    (part): part is string => part !== null && part.trim().length > 0,
  );
  return parts.length > 0 ? parts.join(' · ') : null;
}

/**
 * The order's window across mixed lines.
 *
 * The narrow reading is that an order arrives when its SLOWEST line does, which
 * would make the minimum the largest of the minimums. We take the wider one —
 * lowest low, highest high — because that is what `mock/cart.ts` computes and
 * therefore what the customer read on the basket and checkout screens before
 * they paid. An order that quotes a tighter window than the page they bought
 * from is a promise nobody made them, and this is not the place to introduce a
 * figure they have not already seen.
 */
function leadTimeWindow(items: OrderDraftItem[]): {
  leadTimeMinDays: number | null;
  leadTimeMaxDays: number | null;
} {
  const windows = items.filter(
    (item): item is OrderDraftItem & { leadTimeMinDays: number; leadTimeMaxDays: number } =>
      item.leadTimeMinDays !== null && item.leadTimeMaxDays !== null,
  );

  if (windows.length === 0) return { leadTimeMinDays: null, leadTimeMaxDays: null };

  return {
    leadTimeMinDays: Math.min(...windows.map((item) => item.leadTimeMinDays)),
    leadTimeMaxDays: Math.max(...windows.map((item) => item.leadTimeMaxDays)),
  };
}

/* --------------------------------------------------------------- mapping -- */

export function toContractOrder(stored: StoredOrder): Order {
  return {
    id: stored.id,
    reference: stored.reference,
    status: stored.status,
    customerName: stored.customerName,
    customerPhone: stored.customerPhone,
    customerEmail: stored.customerEmail,
    fulfilmentMethod: stored.fulfilmentMethod,
    deliveryAddress:
      stored.fulfilmentMethod === 'delivery' && stored.deliveryLine1
        ? {
            label: null,
            recipientName: stored.deliveryRecipientName ?? stored.customerName,
            phone: stored.deliveryPhone ?? stored.customerPhone,
            altPhone: null,
            line1: stored.deliveryLine1,
            line2: stored.deliveryLine2,
            landmark: stored.deliveryLandmark,
            area: stored.deliveryArea,
            city: stored.deliveryCity ?? '',
            state: stored.deliveryState ?? '',
            deliveryNotes: null,
          }
        : null,
    /*
     * KNOWN GAP, recorded rather than smoothed over. `orders` snapshots a pickup
     * point as three columns — code, name and one address string — while
     * `pickupPointSchema` carries the counter broken into line1, area, city,
     * state, opening hours and a phone. The snapshot holds the printable
     * address, which is what the tracking screen shows, so nothing a customer
     * reads is missing; the structured fields are null because inventing them
     * from a joined live row would break "orders are snapshots" to fill in
     * boxes nobody renders. The fix is additive columns on `orders`, and it
     * belongs with the admin work rather than here.
     */
    pickupPoint: stored.pickupPointCode
      ? {
          code: stored.pickupPointCode,
          name: stored.pickupPointName ?? stored.pickupPointCode,
          partnerName: null,
          line1: stored.pickupPointAddress ?? '',
          landmark: null,
          area: null,
          city: '',
          state: '',
          phone: null,
          openingHours: null,
          notes: null,
        }
      : null,
    vehicle:
      stored.vehicleMakeText || stored.vehicleModelText
        ? {
            variantId: null,
            make: stored.vehicleMakeText ?? '',
            model: stored.vehicleModelText ?? '',
            year: stored.vehicleYear,
            trim: null,
            engine: null,
            chassisCode: stored.vehicleChassisCode,
            bodyStyle: null,
            inCatalogue: true,
          }
        : null,
    items: stored.items.map(toContractOrderItem),
    itemsSubtotal: { amount: stored.itemsSubtotal, currency: 'NGN' },
    deliveryFee: { amount: stored.deliveryFee, currency: 'NGN' },
    total: { amount: stored.total, currency: 'NGN' },
    leadTime:
      stored.leadTimeMinDays !== null && stored.leadTimeMaxDays !== null
        ? { minDays: stored.leadTimeMinDays, maxDays: stored.leadTimeMaxDays }
        : null,
    events: stored.events.map((event) => ({
      id: event.id,
      type: event.type as Order['events'][number]['type'],
      summary: event.summary,
      detail: event.detail,
      occurredAt: event.occurredAt.toISOString(),
    })),
    customerNote: stored.customerNote,
    cancellationReason: stored.cancellationReason,
    placedAt: stored.placedAt.toISOString(),
    paidAt: stored.paidAt?.toISOString() ?? null,
    deliveredAt: stored.deliveredAt?.toISOString() ?? null,
  };
}

function toContractOrderItem(item: StoredOrder['items'][number]): OrderItem {
  return {
    id: item.id,
    sku: item.sku,
    partName: item.partName,
    mpn: item.mpn,
    oemNumber: item.oemNumber,
    position: item.position,
    condition: item.condition,
    stockModel: item.stockModel,
    quantity: item.quantity,
    unitPrice: { amount: item.unitPrice, currency: 'NGN' },
    lineTotal: { amount: item.lineTotal, currency: 'NGN' },
    leadTime:
      item.leadTimeMinDays !== null && item.leadTimeMaxDays !== null
        ? { minDays: item.leadTimeMinDays, maxDays: item.leadTimeMaxDays }
        : null,
    fitmentConfidence: item.fitmentConfidence,
    fitmentNote: item.fitmentNote,
  };
}
