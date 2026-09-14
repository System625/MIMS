import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fromMinor, toMinor } from '../../common/money';
import type { Env } from '../../config/env';

/**
 * THE PAYSTACK ADAPTER — the only place in this system that speaks kobo.
 *
 * Everywhere else money is a Naira decimal string. Paystack wants an integer
 * minor unit, so the conversion happens here and nowhere else, in integer
 * arithmetic: `Number('186000.00') * 100` is a float multiplication and floats
 * are how a customer gets charged ₦185,999.99999.
 *
 * Like `VpicClient`, this never throws. A gateway that is slow, down, or
 * answering nonsense is an ordinary Tuesday; every failure comes back as an
 * outcome the caller routes deliberately. The one thing it must never do is
 * report success it is not certain of.
 */

/** Paystack's envelope. `status` here says the API CALL worked — nothing more. */
interface PaystackEnvelope<T> {
  status?: boolean;
  message?: string;
  data?: T;
}

interface InitializeData {
  authorization_url?: string;
  access_code?: string;
  reference?: string;
}

interface VerifyData {
  status?: string;
  reference?: string;
  amount?: number;
  currency?: string;
  paid_at?: string | null;
  paidAt?: string | null;
  channel?: string | null;
  gateway_response?: string | null;
  authorization?: {
    channel?: string | null;
    brand?: string | null;
    last4?: string | null;
    bank?: string | null;
  } | null;
}

export interface PaystackInitialized {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export interface PaystackCharge {
  reference: string;
  /** Paystack's own `data.status`: `success`, `failed`, `abandoned`, `ongoing`… */
  gatewayStatus: string;
  /** Minor units, exactly as the gateway reported them. Compared, never trusted. */
  amountMinor: number;
  currency: string;
  paidAt: string | null;
  channel: string | null;
  /** "Visa ending 4242", "GTBank transfer" — for the receipt, in plain words. */
  channelDetail: string | null;
  failureReason: string | null;
}

export type PaystackOutcome<T> =
  | { kind: 'ok'; value: T }
  | { kind: 'not_found' }
  | { kind: 'rejected'; reason: string }
  | { kind: 'unavailable'; reason: string };

/**
 * `"186000.00"` → `18600000`. Integer arithmetic only; no float ever sees this.
 *
 * Kobo is the Naira's minor unit and also Paystack's own wire format, so the
 * conversion is the shared one in `common/money.ts` and these two keep only the
 * gateway's vocabulary. One implementation: two that drift by a kobo would show
 * up as a gateway amount mismatch on a real customer's real order.
 */
export function nairaToKobo(decimal: string): number {
  return Number(toMinor(decimal));
}

/** `18600000` → `"186000.00"`, for comparing a gateway amount against an order. */
export function koboToNaira(kobo: number): string {
  return fromMinor(BigInt(Math.trunc(kobo)));
}

/**
 * Paystack's channel vocabulary, rendered as something a customer would say on
 * the phone. Unknown channels pass through rather than being flattened to
 * "card" — a receipt that names the wrong payment method is a dispute.
 */
function describeChannel(data: VerifyData): string | null {
  const auth = data.authorization ?? null;
  const channel = data.channel ?? auth?.channel ?? null;

  if (channel === 'card' && auth?.brand && auth.last4) {
    return `${auth.brand} ending ${auth.last4}`;
  }
  if ((channel === 'bank' || channel === 'bank_transfer') && auth?.bank) {
    return `${auth.bank} transfer`;
  }
  return channel;
}

@Injectable()
export class PaystackClient {
  private readonly logger = new Logger(PaystackClient.name);

  constructor(private readonly config: ConfigService<Env, true>) {}

  /** False when no secret key is configured — the caller must refuse to take money. */
  get configured(): boolean {
    return (this.config.get('PAYSTACK_SECRET_KEY', { infer: true }) ?? '').length > 0;
  }

  get secretKey(): string {
    return this.config.get('PAYSTACK_SECRET_KEY', { infer: true }) ?? '';
  }

  /**
   * Starts a transaction and returns the short-lived authorization URL.
   *
   * `email` is required by Paystack. Checkout here is guest checkout with phone
   * as the identity, so when a customer gives no email the caller supplies a
   * routable fallback — deliberately, and knowing the receipt goes there.
   */
  async initialize(args: {
    reference: string;
    amountNaira: string;
    email: string;
    callbackUrl?: string;
    metadata?: Record<string, unknown>;
  }): Promise<PaystackOutcome<PaystackInitialized>> {
    const result = await this.call<InitializeData>('POST', '/transaction/initialize', {
      reference: args.reference,
      amount: nairaToKobo(args.amountNaira),
      currency: 'NGN',
      email: args.email,
      callback_url: args.callbackUrl,
      metadata: args.metadata,
    });

    if (result.kind !== 'ok') return result;

    const { authorization_url, access_code, reference } = result.value;
    if (!authorization_url || !access_code) {
      return {
        kind: 'rejected',
        reason: 'Paystack accepted the call but returned no checkout URL',
      };
    }

    return {
      kind: 'ok',
      value: {
        authorizationUrl: authorization_url,
        accessCode: access_code,
        /* Our reference is what we verify against, so we keep ours if Paystack
           echoes nothing back. */
        reference: reference ?? args.reference,
      },
    };
  }

  /**
   * Asks Paystack what actually happened to a reference.
   *
   * This is the only thing that may move value. A customer arriving at the
   * callback URL proves they have a browser, not that they paid: the reference
   * in that URL is whatever they typed.
   */
  async verify(reference: string): Promise<PaystackOutcome<PaystackCharge>> {
    const result = await this.call<VerifyData>(
      'GET',
      `/transaction/verify/${encodeURIComponent(reference)}`,
    );
    if (result.kind !== 'ok') return result;

    const data = result.value;
    /* `data.status`, never the envelope's `status`. The envelope reports that
       the API call succeeded, which is true of a failed payment too — reading
       it as the payment's status is the classic way to ship a store that hands
       out goods for declined cards. */
    const gatewayStatus = data.status;
    if (typeof gatewayStatus !== 'string' || typeof data.amount !== 'number') {
      return {
        kind: 'rejected',
        reason: 'Paystack returned a transaction with no status or amount',
      };
    }

    return {
      kind: 'ok',
      value: {
        reference: data.reference ?? reference,
        gatewayStatus,
        amountMinor: data.amount,
        currency: data.currency ?? 'NGN',
        paidAt: data.paid_at ?? data.paidAt ?? null,
        channel: data.channel ?? null,
        channelDetail: describeChannel(data),
        failureReason: gatewayStatus === 'success' ? null : (data.gateway_response ?? null),
      },
    };
  }

  private async call<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
  ): Promise<PaystackOutcome<T>> {
    if (!this.configured) {
      return { kind: 'unavailable', reason: 'PAYSTACK_SECRET_KEY is not configured' };
    }

    const base = this.config.get('PAYSTACK_BASE_URL', { infer: true });
    const timeout = this.config.get('PAYSTACK_TIMEOUT_MS', { infer: true });

    let response: Response;
    try {
      response = await fetch(`${base}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(timeout),
      });
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : 'unknown network error';
      this.logger.warn(`Paystack ${method} ${path} failed: ${reason}`);
      return { kind: 'unavailable', reason };
    }

    /* A 404 on verify means "no such transaction", which is an answer rather
       than a fault — usually a reference someone made up. */
    if (response.status === 404) return { kind: 'not_found' };

    let payload: PaystackEnvelope<T>;
    try {
      payload = (await response.json()) as PaystackEnvelope<T>;
    } catch {
      return { kind: 'unavailable', reason: `Paystack returned non-JSON (${response.status})` };
    }

    if (!response.ok || payload.status !== true || payload.data === undefined) {
      const reason = payload.message ?? `Paystack returned ${response.status}`;
      /* 5xx is theirs and worth retrying; 4xx is ours and is not. The caller
         needs to tell those apart to decide whether to show "try again". */
      return response.status >= 500
        ? { kind: 'unavailable', reason }
        : { kind: 'rejected', reason };
    }

    return { kind: 'ok', value: payload.data };
  }
}
