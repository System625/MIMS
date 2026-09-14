import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { ConfigService } from '@nestjs/config';
import type { PaymentStatus } from '@mims/contracts';
import { AppError } from '../../common/errors/app-error';
import type { Env } from '../../config/env';
import {
  OrderPaymentsRepository,
  type PayableOrder,
  type PaymentSettlement,
  type SettlementOutcome,
} from './order-payments.repository';
import { PaymentsService } from './payments.service';
import type { PaystackCharge, PaystackClient, PaystackOutcome } from './paystack.client';

/**
 * The settlement rules, exercised without a network or a database.
 *
 * Every test here is a way a store gets taken: a declined card reported as paid,
 * a ₦100 charge against a ₦400,000 order, a webhook retry writing a second
 * payment, a spoofed reference. The gateway is faked; the rules are real.
 */

const ORDER_TOTAL = '396000.00';
const ORDER_KOBO = 39_600_000;

function anOrder(overrides: Partial<PayableOrder> = {}): PayableOrder {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    reference: 'MIMS-8F31',
    total: ORDER_TOTAL,
    currency: 'NGN',
    customerPhone: '08031234567',
    customerEmail: null,
    paymentStatus: 'initialized',
    ...overrides,
  };
}

function aCharge(overrides: Partial<PaystackCharge> = {}): PaystackCharge {
  return {
    reference: 'MIMS-8F31',
    gatewayStatus: 'success',
    amountMinor: ORDER_KOBO,
    currency: 'NGN',
    paidAt: '2026-09-14T10:15:00.000Z',
    channel: 'card',
    channelDetail: 'Visa ending 4242',
    failureReason: null,
    ...overrides,
  };
}

/** Counts what actually happened, which is what idempotency is a claim about. */
class FakeOrders extends OrderPaymentsRepository {
  settlements: PaymentSettlement[] = [];
  failures: Array<{ status: PaymentStatus; reason: string | null }> = [];
  initializations: string[] = [];
  private settled = new Set<string>();

  constructor(private order: PayableOrder | null = anOrder()) {
    super();
  }

  async findByReference(reference: string): Promise<PayableOrder | null> {
    return this.order && this.order.reference === reference ? this.order : null;
  }

  async recordInitialization(_ref: string, gatewayReference: string): Promise<void> {
    this.initializations.push(gatewayReference);
  }

  async settle(settlement: PaymentSettlement): Promise<SettlementOutcome> {
    if (this.settled.has(settlement.orderReference)) return 'already_applied';
    this.settled.add(settlement.orderReference);
    this.settlements.push(settlement);
    return 'applied';
  }

  async recordFailure(
    _ref: string,
    _gatewayReference: string,
    status: PaymentStatus,
    reason: string | null,
  ): Promise<void> {
    this.failures.push({ status, reason });
  }
}

class FakePaystack {
  verifyCalls = 0;
  constructor(private outcome: PaystackOutcome<PaystackCharge>) {}
  get secretKey() {
    return 'sk_test_fake';
  }
  get configured() {
    return true;
  }
  async verify(): Promise<PaystackOutcome<PaystackCharge>> {
    this.verifyCalls += 1;
    return this.outcome;
  }
  async initialize(): Promise<PaystackOutcome<never>> {
    throw new Error('not used in these tests');
  }
}

const config = {
  get: () => 'receipts.mims.ng',
} as unknown as ConfigService<Env, true>;

function makeService(charge: PaystackOutcome<PaystackCharge>, orders = new FakeOrders()) {
  const paystack = new FakePaystack(charge);
  const service = new PaymentsService(paystack as unknown as PaystackClient, orders, config);
  return { service, orders, paystack };
}

describe('PaymentsService.verify', () => {
  it('settles an order once for a successful charge of the right amount', async () => {
    const { service, orders } = makeService({ kind: 'ok', value: aCharge() });

    const result = await service.verify('MIMS-8F31');

    assert.equal(result.status, 'success');
    assert.equal(result.amount.amount, ORDER_TOTAL);
    assert.equal(result.channel, 'card');
    assert.equal(result.channelDetail, 'Visa ending 4242');
    assert.equal(result.paidAt, '2026-09-14T10:15:00.000Z');
    assert.equal(orders.settlements.length, 1);
  });

  /*
   * THE CLASSIC TRAP. Paystack answers 200 with envelope `status: true` for a
   * declined card; the payment's own status is in `data.status`. A handler that
   * reads the envelope hands out goods for every failed card.
   */
  it('does not settle a failed charge, and reports why', async () => {
    const { service, orders } = makeService({
      kind: 'ok',
      value: aCharge({
        gatewayStatus: 'failed',
        failureReason: 'Insufficient funds',
        paidAt: null,
      }),
    });

    const result = await service.verify('MIMS-8F31');

    assert.equal(result.status, 'failed');
    assert.equal(result.failureReason, 'Insufficient funds');
    assert.equal(result.paidAt, null);
    assert.equal(orders.settlements.length, 0);
    assert.deepEqual(orders.failures, [{ status: 'failed', reason: 'Insufficient funds' }]);
  });

  it('treats abandoned and pending as not-paid, and an unknown status as failed', async () => {
    for (const [gatewayStatus, expected] of [
      ['abandoned', 'abandoned'],
      ['ongoing', 'pending'],
      ['something_new', 'failed'],
    ] as const) {
      const { service, orders } = makeService({ kind: 'ok', value: aCharge({ gatewayStatus }) });
      const result = await service.verify('MIMS-8F31');
      assert.equal(result.status, expected, gatewayStatus);
      assert.equal(orders.settlements.length, 0, gatewayStatus);
    }
  });

  it('refuses a successful charge for less than the order total', async () => {
    const { service, orders } = makeService({
      kind: 'ok',
      value: aCharge({ amountMinor: 10_000 }),
    });

    await assert.rejects(
      () => service.verify('MIMS-8F31'),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, 'CONFLICT');
        return true;
      },
    );
    assert.equal(orders.settlements.length, 0);
  });

  it('accepts a total written with a different number of decimals', async () => {
    // "396000" and "396000.00" are the same money; a string compare would not agree.
    const orders = new FakeOrders(anOrder({ total: '396000' }));
    const { service } = makeService({ kind: 'ok', value: aCharge() }, orders);

    const result = await service.verify('MIMS-8F31');

    assert.equal(result.status, 'success');
    assert.equal(orders.settlements.length, 1);
  });

  it('refuses a charge made in the wrong currency', async () => {
    const { service, orders } = makeService({
      kind: 'ok',
      value: aCharge({ currency: 'USD' }),
    });

    await assert.rejects(() => service.verify('MIMS-8F31'), AppError);
    assert.equal(orders.settlements.length, 0);
  });

  it('reports a declined card as declined rather than as an amount mismatch', async () => {
    // Status is checked before the amount, so the customer is told the useful thing.
    const { service } = makeService({
      kind: 'ok',
      value: aCharge({ gatewayStatus: 'failed', amountMinor: 1, failureReason: 'Declined' }),
    });

    const result = await service.verify('MIMS-8F31');
    assert.equal(result.status, 'failed');
  });

  it('refuses a reference that matches no order rather than inventing one', async () => {
    const orders = new FakeOrders(null);
    const { service } = makeService({ kind: 'ok', value: aCharge() }, orders);

    await assert.rejects(
      () => service.verify('MADE-UP'),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, 'NOT_FOUND');
        return true;
      },
    );
  });

  it('surfaces a gateway outage as upstream-unavailable, not as a failed payment', async () => {
    const { service, orders } = makeService({ kind: 'unavailable', reason: 'timeout' });

    await assert.rejects(
      () => service.verify('MIMS-8F31'),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, 'UPSTREAM_UNAVAILABLE');
        return true;
      },
    );
    assert.equal(orders.failures.length, 0);
  });

  it('settles against the amount the gateway reported, not the one asked for', async () => {
    const { service, orders } = makeService({ kind: 'ok', value: aCharge() });
    await service.verify('MIMS-8F31');
    assert.equal(orders.settlements[0]?.amount, ORDER_TOTAL);
  });
});

describe('PaymentsService.handleChargeSuccess', () => {
  let orders: FakeOrders;

  beforeEach(() => {
    orders = new FakeOrders();
  });

  /*
   * Paystack retries any webhook it did not get a 200 for, and the customer's
   * own return to the callback URL triggers a verify at the same moment. The
   * same charge arriving three times must move the order exactly once.
   */
  it('applies one charge once, however many times it arrives', async () => {
    const { service } = makeService({ kind: 'ok', value: aCharge() }, orders);

    await service.handleChargeSuccess('MIMS-8F31');
    await service.handleChargeSuccess('MIMS-8F31');
    await service.verify('MIMS-8F31');

    assert.equal(orders.settlements.length, 1);
  });

  /* The signed body carries an amount, and it is still not the evidence. */
  it('re-verifies with the gateway rather than trusting the webhook body', async () => {
    const { service, paystack } = makeService({ kind: 'ok', value: aCharge() }, orders);
    await service.handleChargeSuccess('MIMS-8F31');
    assert.equal(paystack.verifyCalls, 1);
  });

  it('does nothing, and does not throw, for a reference with no order', async () => {
    const { service } = makeService({ kind: 'ok', value: aCharge() }, new FakeOrders(null));
    await service.handleChargeSuccess('SPOOFED');
  });

  it('does nothing when the gateway cannot be reached, so Paystack will retry', async () => {
    const { service } = makeService({ kind: 'unavailable', reason: 'timeout' }, orders);
    await service.handleChargeSuccess('MIMS-8F31');
    assert.equal(orders.settlements.length, 0);
  });
});
