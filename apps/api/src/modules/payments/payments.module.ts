import { Module } from '@nestjs/common';
import { OrderPaymentsRepository } from './order-payments.repository';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaystackClient } from './paystack.client';
import { PaystackWebhookController } from './paystack-webhook.controller';
import { PostgresOrderPayments } from './postgres-order-payments.repository';

@Module({
  controllers: [PaymentsController, PaystackWebhookController],
  providers: [
    PaymentsService,
    PaystackClient,
    /* Item 10 swapped this line, and only this line — exactly as item 6 said it
       would. `InMemoryOrderPayments` is still in `order-payments.repository.ts`
       and is still what the tests run against. */
    { provide: OrderPaymentsRepository, useClass: PostgresOrderPayments },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
