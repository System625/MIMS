import {
  Controller,
  ForbiddenException,
  Headers,
  HttpCode,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';
import { PaystackClient } from './paystack.client';
import { PAYSTACK_SIGNATURE_HEADER, verifyPaystackSignature } from './paystack.signature';

/** The only event we act on today. Others are acknowledged and ignored. */
const CHARGE_SUCCESS = 'charge.success';

interface PaystackEvent {
  event?: string;
  data?: { reference?: string };
}

/**
 * THE PAYSTACK WEBHOOK.
 *
 * Three properties this endpoint must have, all of them easy to lose:
 *
 * IT VERIFIES THE SIGNATURE AGAINST THE RAW BODY. Nest is booted with
 * `rawBody: true` so the original bytes survive the JSON parser; a re-serialised
 * body is a different byte sequence and would never verify. An unsigned or
 * wrongly-signed request is rejected, never skipped.
 *
 * IT ANSWERS 200 QUICKLY, AND ONLY 200. Paystack retries anything else, so an
 * event we do not handle — a refund, a transfer, a subscription we do not
 * have — is acknowledged rather than 400ed into a retry loop. The work behind
 * a `charge.success` is awaited, because a 200 we send before settling is a
 * promise we might not keep and Paystack will not repeat.
 *
 * IT IS NOT THE EVIDENCE. The signed body proves the message came from Paystack;
 * it does not become the amount we settle against. The service re-verifies, so
 * there is exactly one path by which an order can be paid.
 */
@Controller('payments/paystack')
export class PaystackWebhookController {
  private readonly logger = new Logger(PaystackWebhookController.name);

  constructor(
    private readonly payments: PaymentsService,
    private readonly paystack: PaystackClient,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  async receive(
    @Req() request: RawBodyRequest<Request>,
    @Headers(PAYSTACK_SIGNATURE_HEADER) signature: string | undefined,
  ): Promise<{ received: true }> {
    const secret = this.paystack.secretKey;

    /* No key configured means we cannot tell a real event from a forged one, so
       every event is forged as far as this endpoint is concerned. */
    if (secret.length === 0) {
      this.logger.error('Paystack webhook received but PAYSTACK_SECRET_KEY is not set');
      throw new ForbiddenException();
    }

    if (!verifyPaystackSignature(request.rawBody, signature, secret)) {
      this.logger.warn('Rejected a Paystack webhook with a bad or missing signature');
      throw new ForbiddenException();
    }

    const event = (request.body ?? {}) as PaystackEvent;
    const reference = event.data?.reference;

    if (event.event !== CHARGE_SUCCESS || typeof reference !== 'string') {
      /* Acknowledged deliberately. Returning an error for an event we do not
         handle would put Paystack into a retry loop over something that is
         working exactly as intended. */
      return { received: true };
    }

    await this.payments.handleChargeSuccess(reference);
    return { received: true };
  }
}
