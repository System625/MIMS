import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  InitializePaymentRequest,
  InitializePaymentResult,
  PaymentChannel,
  PaymentStatus,
  VerifyPaymentResult,
} from '@mims/contracts';
import { AppError } from '../../common/errors/app-error';
import type { Env } from '../../config/env';
import { koboToNaira, nairaToKobo, PaystackClient, type PaystackCharge } from './paystack.client';
import { OrderPaymentsRepository, type PayableOrder } from './order-payments.repository';

/**
 * THE PAYMENT RULES.
 *
 * Four of them, and each exists because the obvious shortcut past it is how
 * online stores get taken:
 *
 *  1. NOTHING IS FULFILLED ON A REDIRECT. A customer at the callback URL proves
 *     they have a browser. The reference in that URL is whatever they typed, so
 *     arriving there triggers a server-side verify and never a settlement.
 *  2. `data.status`, NEVER the envelope `status`. The envelope says the API call
 *     worked, which is equally true of a declined card.
 *  3. THE AMOUNT AND CURRENCY MUST MATCH THE ORDER. Paystack will happily take
 *     ₦100 against a ₦400,000 order if that is what it was asked for, and
 *     initialisation is not the only way a reference gets charged.
 *  4. SETTLEMENT IS IDEMPOTENT. The same successful charge arrives two or three
 *     times as a matter of course — a webhook retry, plus the customer's own
 *     return to the callback URL — and must move the order exactly once.
 */

/** Paystack's channel strings, mapped onto ours. Anything new reads `unknown`. */
const CHANNELS: Record<string, PaymentChannel> = {
  card: 'card',
  bank: 'bank',
  bank_transfer: 'bank_transfer',
  dedicated_nuban: 'bank_transfer',
  ussd: 'ussd',
  qr: 'qr',
  mobile_money: 'mobile_money',
  eft: 'bank_transfer',
};

/** Paystack's transaction states, mapped onto ours. Unknown is not success. */
const STATUSES: Record<string, PaymentStatus> = {
  success: 'success',
  failed: 'failed',
  abandoned: 'abandoned',
  reversed: 'reversed',
  ongoing: 'pending',
  pending: 'pending',
  queued: 'pending',
  processing: 'pending',
};

export function toPaymentStatus(gatewayStatus: string): PaymentStatus {
  return STATUSES[gatewayStatus] ?? 'failed';
}

export function toPaymentChannel(channel: string | null): PaymentChannel {
  return (channel && CHANNELS[channel]) || 'unknown';
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly paystack: PaystackClient,
    private readonly orders: OrderPaymentsRepository,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async initialize(request: InitializePaymentRequest): Promise<InitializePaymentResult> {
    const order = await this.orders.findByReference(request.orderReference);
    if (order === null) throw AppError.notFound('That order');

    if (order.paymentStatus === 'success') {
      throw new AppError('CONFLICT', 'That order has already been paid for.');
    }

    const result = await this.paystack.initialize({
      reference: order.reference,
      amountNaira: order.total,
      email: this.emailFor(order.customerEmail, order.customerPhone),
      callbackUrl: request.callbackUrl,
      metadata: { orderReference: order.reference, orderId: order.id },
    });

    if (result.kind !== 'ok') {
      throw this.gatewayError(result.kind, 'reason' in result ? result.reason : null);
    }

    await this.orders.recordInitialization(order.reference, result.value.reference);

    return {
      reference: result.value.reference,
      authorizationUrl: result.value.authorizationUrl,
      accessCode: result.value.accessCode,
      amount: { amount: order.total, currency: 'NGN' },
    };
  }

  /**
   * The server-side verify. Reached from the callback URL, from a customer
   * refreshing the confirmation screen, and from the webhook — all three land
   * here, and all three are safe to repeat.
   */
  async verify(reference: string): Promise<VerifyPaymentResult> {
    const charge = await this.paystack.verify(reference);

    if (charge.kind === 'not_found') throw AppError.notFound('That payment');
    if (charge.kind !== 'ok') {
      throw this.gatewayError(charge.kind, 'reason' in charge ? charge.reason : null);
    }

    const order = await this.orders.findByReference(charge.value.reference);
    if (order === null) {
      /* A real Paystack transaction against a reference we have no order for.
         Never settle it, and log loudly: it is either a reference collision or
         somebody probing. */
      this.logger.error(`Verified charge ${charge.value.reference} matches no order`);
      throw AppError.notFound('That order');
    }

    return this.apply(order, charge.value);
  }

  /**
   * The webhook path. Signature checking happens in the controller, because a
   * request that is not signed never reaches this method at all.
   */
  async handleChargeSuccess(gatewayReference: string): Promise<void> {
    /* The webhook body is NOT the evidence, even though it is signed and
       carries an amount. Re-verifying costs one call and means there is exactly
       one code path — the one above — by which an order can be settled. */
    const charge = await this.paystack.verify(gatewayReference);
    if (charge.kind !== 'ok') {
      this.logger.warn(`Webhook for ${gatewayReference}: verify said ${charge.kind}`);
      return;
    }

    const order = await this.orders.findByReference(charge.value.reference);
    if (order === null) {
      this.logger.error(`Webhook charge ${charge.value.reference} matches no order`);
      return;
    }

    await this.apply(order, charge.value);
  }

  /**
   * Where a verified charge meets an order. Every rejection below leaves the
   * order unpaid, which is the safe direction: an order wrongly left unpaid is
   * a phone call, an order wrongly marked paid is a part on a boat.
   */
  private async apply(order: PayableOrder, charge: PaystackCharge): Promise<VerifyPaymentResult> {
    const status = toPaymentStatus(charge.gatewayStatus);
    const amount = { amount: koboToNaira(charge.amountMinor), currency: 'NGN' as const };

    const base = {
      reference: charge.reference,
      channel: toPaymentChannel(charge.channel),
      channelDetail: charge.channelDetail,
      amount,
      orderReference: order.reference,
      orderId: order.id,
    };

    if (status !== 'success') {
      await this.orders.recordFailure(
        order.reference,
        charge.reference,
        status,
        charge.failureReason,
      );
      return { ...base, status, paidAt: null, failureReason: charge.failureReason };
    }

    /* Amount and currency are checked AFTER the status, so a declined card is
       reported as declined rather than as a mismatch. Both are compared in
       minor units: two decimal strings that mean the same money can be written
       differently ("186000" and "186000.00"), and a string compare would reject
       a good payment. */
    if (charge.currency !== order.currency) {
      this.logger.error(
        `Charge ${charge.reference} paid in ${charge.currency}, order ${order.reference} is ${order.currency}`,
      );
      throw new AppError('CONFLICT', 'That payment was made in the wrong currency.');
    }

    if (charge.amountMinor !== nairaToKobo(order.total)) {
      this.logger.error(
        `Charge ${charge.reference} is ${charge.amountMinor} kobo, order ${order.reference} is ${nairaToKobo(order.total)} kobo`,
      );
      throw new AppError('CONFLICT', 'That payment does not match the order total.');
    }

    const paidAt = charge.paidAt ?? new Date().toISOString();
    const outcome = await this.orders.settle({
      orderReference: order.reference,
      gatewayReference: charge.reference,
      channel: base.channel,
      channelDetail: charge.channelDetail,
      amount: amount.amount,
      paidAt,
    });

    if (outcome === 'already_applied') {
      this.logger.log(`Charge ${charge.reference} was already applied to ${order.reference}`);
    }

    return { ...base, status: 'success', paidAt, failureReason: null };
  }

  /**
   * Paystack requires an email on initialize; guest checkout here is phone-first
   * and email is optional. Rather than inventing an address that bounces, a
   * customer without one gets a routable alias on our own domain, keyed to the
   * order — so the receipt lands somewhere a person can actually read it.
   */
  private emailFor(email: string | null, phone: string): string {
    if (email) return email;
    const domain = this.config.get('PAYSTACK_FALLBACK_EMAIL_DOMAIN', { infer: true });
    return `guest-${phone.replace(/\D/g, '')}@${domain}`;
  }

  private gatewayError(kind: 'rejected' | 'unavailable' | 'not_found', reason: string | null) {
    const detail = reason ?? 'no reason given';
    this.logger.warn(`Paystack ${kind}: ${detail}`);
    return kind === 'unavailable'
      ? new AppError('UPSTREAM_UNAVAILABLE', 'The payment gateway is not responding. Try again.')
      : new AppError('BAD_REQUEST', 'The payment gateway refused that request.');
  }
}
