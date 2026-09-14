import { Module } from '@nestjs/common';
import { InMemoryOrderPayments, OrderPaymentsRepository } from './order-payments.repository';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaystackClient } from './paystack.client';
import { PaystackWebhookController } from './paystack-webhook.controller';

@Module({
  controllers: [PaymentsController, PaystackWebhookController],
  providers: [
    PaymentsService,
    PaystackClient,
    /* Build plan item 10 swaps this one line for the Postgres-backed
       implementation. Nothing else in the module changes. */
    { provide: OrderPaymentsRepository, useClass: InMemoryOrderPayments },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
