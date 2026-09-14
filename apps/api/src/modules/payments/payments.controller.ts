import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  initializePaymentRequestSchema,
  type InitializePaymentRequest,
  type InitializePaymentResult,
  type VerifyPaymentResult,
} from '@mims/contracts';
import { zodPipe } from '../../common/pipes/zod-validation.pipe';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('initialize')
  initialize(
    @Body(zodPipe(initializePaymentRequestSchema)) body: InitializePaymentRequest,
  ): Promise<InitializePaymentResult> {
    return this.payments.initialize(body);
  }

  /**
   * The confirmation screen calls this on arrival from the gateway, and again on
   * every refresh. It is a GET because it is a question, and it is safe to ask
   * repeatedly: the settlement behind it is idempotent.
   *
   * The reference in the URL is the customer's, which is to say it is
   * untrusted — this route asks Paystack what happened rather than believing it.
   */
  @Get('verify/:reference')
  verify(@Param('reference') reference: string): Promise<VerifyPaymentResult> {
    return this.payments.verify(reference);
  }
}
