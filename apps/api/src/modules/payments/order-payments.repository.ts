import type { PaymentChannel, PaymentStatus } from '@mims/contracts';

/**
 * THE SEAM BETWEEN PAYMENTS AND ORDERS.
 *
 * The payment rules — verify server-side, match the amount, apply once — are
 * finished and testable today. Orders are not: `apps/api` has no commerce
 * module until build plan item 10, so this narrow port is what payments needs
 * from an order and nothing more.
 *
 * Item 10 implements it against Postgres. Until then `InMemoryOrderPayments`
 * stands in, holding nothing, so every endpoint answers "no such order" — which
 * is the truth, rather than a stub that pretends an order exists and lets a
 * payment appear to succeed against it.
 *
 * Keeping it this narrow is also what makes the rules testable without a
 * database: the fake in the tests implements four methods.
 */

export interface PayableOrder {
  id: string;
  /** What the customer quotes on the phone, and what we initialise Paystack with. */
  reference: string;
  /** Naira decimal string. The gateway's figure is compared against this, never trusted. */
  total: string;
  currency: 'NGN';
  customerPhone: string;
  /** Null for a guest who gave none — the payment service supplies the fallback. */
  customerEmail: string | null;
  paymentStatus: PaymentStatus;
}

export interface PaymentSettlement {
  orderReference: string;
  gatewayReference: string;
  channel: PaymentChannel;
  channelDetail: string | null;
  /** Naira decimal, as reported by the gateway AFTER it matched the order total. */
  amount: string;
  paidAt: string;
}

/**
 * `already_applied` is not an error and must not be treated as one. Paystack
 * retries a webhook it did not get a 200 for, and the customer may also land on
 * the callback URL and trigger a verify at the same moment — so the same
 * successful charge arrives two or three times as a matter of course. Applying
 * it twice would write two payment rows against one order.
 */
export type SettlementOutcome = 'applied' | 'already_applied';

export abstract class OrderPaymentsRepository {
  abstract findByReference(orderReference: string): Promise<PayableOrder | null>;

  /** Records the intent to pay, before the customer leaves for the gateway. */
  abstract recordInitialization(orderReference: string, gatewayReference: string): Promise<void>;

  /** Idempotent by contract: the second call for one order changes nothing. */
  abstract settle(settlement: PaymentSettlement): Promise<SettlementOutcome>;

  /**
   * A charge that did not succeed. The order stays awaiting payment and stays
   * buyable — a declined card is a retry, not a dead order.
   */
  abstract recordFailure(
    orderReference: string,
    gatewayReference: string,
    status: PaymentStatus,
    reason: string | null,
  ): Promise<void>;
}

/**
 * The placeholder. Holds nothing and finds nothing, so the endpoints are wired,
 * signed, verified and honest — and refuse every reference, because today there
 * genuinely are no orders.
 */
export class InMemoryOrderPayments extends OrderPaymentsRepository {
  async findByReference(): Promise<PayableOrder | null> {
    return null;
  }
  async recordInitialization(): Promise<void> {}
  async settle(): Promise<SettlementOutcome> {
    return 'applied';
  }
  async recordFailure(): Promise<void> {}
}
