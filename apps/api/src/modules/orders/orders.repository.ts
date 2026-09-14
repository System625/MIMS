import type {
  FitmentConfidence,
  FulfilmentMethod,
  OrderStatus,
  PartCondition,
  PartPosition,
  StockModel,
} from '@mims/contracts';

/**
 * WHAT PLACING AN ORDER NEEDS FROM THE DATABASE, AND NOTHING ELSE.
 *
 * A port rather than a Drizzle call inside the service, for the same reason
 * `OrderPaymentsRepository` is one: the rules that matter here — never trust a
 * client's price, refuse a stale one, refuse unacknowledged fitment risk, write
 * the whole order or none of it — are the part that must be tested, and they
 * cannot be tested against a database that is not running. The fake in
 * `orders.service.spec.ts` implements this interface in about forty lines.
 *
 * It also keeps the SQL in one file where the joins can be read together.
 */

/**
 * A cart line as the SERVER sees it at the moment of checkout: the customer's
 * snapshot from when they added it, beside what the listing says right now.
 *
 * Both halves are here on purpose. The snapshot is what they were shown; the
 * live figures are what is true. Item 5 settled that the cart screen derives
 * price, lead time and fitment fresh on every read and keeps the snapshot only
 * for comparison — placement follows the same rule, and the service decides
 * what to do when the two disagree.
 */
export interface CheckoutLine {
  cartItemId: string;
  quantity: number;

  /** Snapshotted when the line was added. Survives the listing being withdrawn. */
  snapshot: {
    partName: string;
    mpn: string | null;
    condition: PartCondition;
    stockModel: StockModel;
    unitPrice: string;
  };

  /**
   * Null when the listing has been withdrawn or deleted since. A withdrawn line
   * is not a line we can sell, and the service refuses rather than guessing.
   */
  listing: {
    id: string;
    partId: string;
    supplierId: string;
    supplierName: string | null;
    sku: string;
    /** The listing's own title where it has one; the part name otherwise. */
    partName: string;
    mpn: string | null;
    oemNumber: string | null;
    position: PartPosition;
    condition: PartCondition;
    stockModel: StockModel;
    status: string;
    /** Live, duty-inclusive, NGN decimal string. The only price we will charge. */
    retailPrice: string;
    currency: string;
    /** Past this, the price must be re-quoted rather than sold. Null never expires. */
    priceValidUntil: Date | null;
    quantityAvailable: number;
    leadTimeMinDays: number | null;
    leadTimeMaxDays: number | null;
    fitmentNote: string | null;
  } | null;

  /**
   * Re-derived against the cart's vehicle at checkout time, not copied from the
   * cart row. `unknown` when we hold no record, which includes the case where
   * the cart carries no vehicle at all.
   */
  fitment: {
    confidence: FitmentConfidence;
    qualifier: string | null;
  };
}

export interface CheckoutCart {
  id: string;
  status: string;
  currency: string;
  estimateId: string | null;
  vehicle: {
    variantId: string | null;
    year: number | null;
    makeText: string | null;
    modelText: string | null;
    chassisCode: string | null;
  };
  lines: CheckoutLine[];
}

export interface PickupPointSnapshot {
  id: string;
  code: string;
  name: string;
  address: string;
  isActive: boolean;
}

/** Everything the transaction writes, assembled and priced by the service. */
export interface OrderDraft {
  reference: string;
  cartId: string;
  estimateId: string | null;

  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerNote: string | null;

  fulfilmentMethod: FulfilmentMethod;
  pickupPoint: PickupPointSnapshot | null;

  vehicle: CheckoutCart['vehicle'];

  itemsSubtotal: string;
  deliveryFee: string;
  total: string;
  currency: string;
  leadTimeMinDays: number | null;
  leadTimeMaxDays: number | null;

  items: OrderDraftItem[];

  /** The customer-facing first line of the timeline. */
  placedSummary: string;
}

export interface OrderDraftItem {
  listingId: string;
  partId: string;
  supplierId: string;
  supplierName: string | null;
  sku: string;
  partName: string;
  mpn: string | null;
  oemNumber: string | null;
  position: PartPosition;
  condition: PartCondition;
  stockModel: StockModel;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  currency: string;
  leadTimeMinDays: number | null;
  leadTimeMaxDays: number | null;
  fitmentConfidence: FitmentConfidence;
  fitmentNote: string | null;
  sortOrder: number;
}

/** What the tracking screen and the guest lookup read back. */
export interface StoredOrder {
  id: string;
  reference: string;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  fulfilmentMethod: FulfilmentMethod;
  pickupPointCode: string | null;
  pickupPointName: string | null;
  pickupPointAddress: string | null;
  deliveryLine1: string | null;
  deliveryLine2: string | null;
  deliveryLandmark: string | null;
  deliveryArea: string | null;
  deliveryCity: string | null;
  deliveryState: string | null;
  deliveryRecipientName: string | null;
  deliveryPhone: string | null;
  vehicleYear: number | null;
  vehicleMakeText: string | null;
  vehicleModelText: string | null;
  vehicleChassisCode: string | null;
  itemsSubtotal: string;
  deliveryFee: string;
  total: string;
  currency: string;
  leadTimeMinDays: number | null;
  leadTimeMaxDays: number | null;
  customerNote: string | null;
  cancellationReason: string | null;
  placedAt: Date;
  paidAt: Date | null;
  deliveredAt: Date | null;
  items: StoredOrderItem[];
  events: StoredOrderEvent[];
}

export interface StoredOrderItem {
  id: string;
  sku: string | null;
  partName: string;
  mpn: string | null;
  oemNumber: string | null;
  position: PartPosition;
  condition: PartCondition;
  stockModel: StockModel;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  currency: string;
  leadTimeMinDays: number | null;
  leadTimeMaxDays: number | null;
  fitmentConfidence: FitmentConfidence;
  fitmentNote: string | null;
}

export interface StoredOrderEvent {
  id: string;
  type: string;
  summary: string;
  detail: string | null;
  occurredAt: Date;
}

/** Thrown by `create` when the generated reference was taken. The service retries. */
export class DuplicateOrderReferenceError extends Error {
  constructor(reference: string) {
    super(`Order reference ${reference} already exists.`);
    this.name = 'DuplicateOrderReferenceError';
  }
}

export abstract class OrdersRepository {
  /** The cart, its lines, the live listings behind them, and fresh fitment. */
  abstract findCheckoutCart(cartId: string): Promise<CheckoutCart | null>;

  abstract findPickupPoint(id: string): Promise<PickupPointSnapshot | null>;

  /**
   * Writes the order, its lines, the `placed` event and the cart's new status in
   * ONE transaction. A half-written order is worse than a failed checkout: the
   * customer sees an error, tries again, and now owns two.
   */
  abstract create(draft: OrderDraft): Promise<StoredOrder>;

  /**
   * The guest lookup, resolved by BOTH halves in one query.
   *
   * Item 7 established why this signature matters: if the reference is resolved
   * first and the phone checked after, the two failures are distinguishable —
   * by timing if nothing else — and "that reference exists, the number is wrong"
   * hands an attacker the fact they were missing. One query, one null.
   */
  abstract findByReferenceAndPhone(
    normalisedReference: string,
    normalisedPhone: string,
  ): Promise<StoredOrder | null>;
}
