import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, tables, type Database } from '@mims/db';
import type { PaymentStatus } from '@mims/contracts';
import { DATABASE } from '../../database/database.module';
import {
  OrderPaymentsRepository,
  type PayableOrder,
  type PaymentSettlement,
  type SettlementOutcome,
} from './order-payments.repository';

/**
 * THE SEAM ITEM 6 LEFT OPEN, CLOSED.
 *
 * The payment rules were finished and tested months before there was an order
 * to attach them to: verify server-side, compare the amount in minor units,
 * apply exactly once. `InMemoryOrderPayments` stood in and honestly refused
 * every reference, because there genuinely were no orders. There are now.
 *
 * IDEMPOTENCY IS ENFORCED IN THE DATABASE, NOT IN A CHECK. Paystack retries a
 * webhook it did not get a 200 for, and the customer often lands on the
 * callback at the same moment, so the same successful charge arrives two or
 * three times as a matter of course. A read-then-write ("is it paid? no? mark
 * it paid") is a race with a real window, and two concurrent deliveries would
 * both read `initialized` and both write a payment row. So `settle` moves the
 * order with a conditional UPDATE whose WHERE clause carries the precondition —
 * `status = 'awaiting_payment'` — and lets Postgres decide which one wins. The
 * loser gets zero rows back and reports `already_applied`, which is not an
 * error and must never be treated as one.
 *
 * NOT YET RUN AGAINST A DATABASE: see the note on `PostgresOrdersRepository`.
 * The rules these queries serve are covered by the 25 tests in
 * `payments.service.spec.ts`; the SQL is checked by types and review alone.
 */
@Injectable()
export class PostgresOrderPayments extends OrderPaymentsRepository {
  private readonly logger = new Logger(PostgresOrderPayments.name);

  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async findByReference(orderReference: string): Promise<PayableOrder | null> {
    const order = await this.db.query.orders.findFirst({
      where: eq(tables.orders.reference, orderReference),
    });
    if (!order) return null;

    /*
     * The payment status the service reasons about is the LATEST attempt's, not
     * the order's. A customer whose card was declined and who then pays by
     * transfer has two payment rows against one order, and the first one's
     * failure must not make the second look already-handled.
     */
    const latest = await this.db.query.payments.findFirst({
      where: eq(tables.payments.orderId, order.id),
      orderBy: (payment, { desc }) => [desc(payment.createdAt)],
    });

    return {
      id: order.id,
      reference: order.reference,
      total: order.total,
      currency: 'NGN',
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      /* An order with no attempt yet is `initialized` from the service's point
         of view: nothing has been tried, so nothing has failed. */
      paymentStatus: latest?.status ?? 'initialized',
    };
  }

  async recordInitialization(orderReference: string, gatewayReference: string): Promise<void> {
    const order = await this.db.query.orders.findFirst({
      where: eq(tables.orders.reference, orderReference),
    });
    if (!order) {
      /* The service checked this a moment ago, so reaching here means the order
         was deleted mid-checkout. Loud, because it should not happen. */
      this.logger.error(`Cannot record initialization: order ${orderReference} is gone`);
      return;
    }

    await this.db.insert(tables.payments).values({
      orderId: order.id,
      provider: 'paystack',
      status: 'initialized',
      reference: gatewayReference,
      amount: order.total,
      currency: order.currency,
    });

    await this.db.insert(tables.orderEvents).values({
      orderId: order.id,
      type: 'payment_initialized',
      summary: 'Payment started. Nothing is charged until it goes through.',
      isCustomerVisible: true,
      metadata: { gatewayReference },
    });
  }

  async settle(settlement: PaymentSettlement): Promise<SettlementOutcome> {
    const order = await this.db.query.orders.findFirst({
      where: eq(tables.orders.reference, settlement.orderReference),
    });
    if (!order) {
      this.logger.error(`Cannot settle: order ${settlement.orderReference} is gone`);
      return 'already_applied';
    }

    const paidAt = new Date(settlement.paidAt);

    return this.db.transaction(async (tx) => {
      /*
       * THE RACE IS DECIDED HERE. Only a row still awaiting payment is moved,
       * so of two concurrent deliveries of the same charge exactly one gets a
       * row back. Everything below is inside that winner's branch.
       */
      const moved = await tx
        .update(tables.orders)
        .set({ status: 'paid', paidAt, updatedAt: new Date() })
        .where(and(eq(tables.orders.id, order.id), eq(tables.orders.status, 'awaiting_payment')))
        .returning({ id: tables.orders.id });

      if (moved.length === 0) return 'already_applied';

      await tx
        .update(tables.payments)
        .set({
          status: 'success',
          providerReference: settlement.gatewayReference,
          channel: settlement.channel,
          channelDetail: settlement.channelDetail,
          amount: settlement.amount,
          paidAt,
          verifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(tables.payments.reference, settlement.gatewayReference));

      await tx.insert(tables.orderEvents).values({
        orderId: order.id,
        type: 'payment_succeeded',
        summary: settlement.channelDetail
          ? `Payment received — ${settlement.channelDetail}.`
          : 'Payment received.',
        detail: 'We place it with the supplier on the next working day.',
        isCustomerVisible: true,
        metadata: { gatewayReference: settlement.gatewayReference },
        occurredAt: paidAt,
      });

      return 'applied';
    });
  }

  async recordFailure(
    orderReference: string,
    gatewayReference: string,
    status: PaymentStatus,
    reason: string | null,
  ): Promise<void> {
    const order = await this.db.query.orders.findFirst({
      where: eq(tables.orders.reference, orderReference),
    });
    if (!order) return;

    await this.db
      .update(tables.payments)
      .set({
        status,
        providerReference: gatewayReference,
        failureReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(tables.payments.reference, gatewayReference));

    /*
     * THE ORDER IS NOT TOUCHED. A declined card is a retry, not a dead order —
     * it stays `awaiting_payment` and stays buyable, which is the difference
     * between a customer trying a different card and a customer starting again
     * from an empty basket.
     */
    await this.db.insert(tables.orderEvents).values({
      orderId: order.id,
      type: 'payment_failed',
      summary: reason
        ? `That payment did not go through — ${reason}`
        : 'That payment did not go through.',
      detail: 'Nothing has been charged. The order is still here and you can try again.',
      isCustomerVisible: true,
      metadata: { gatewayReference, status },
    });
  }
}
