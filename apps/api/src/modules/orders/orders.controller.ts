import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  checkoutRequestSchema,
  lookupOrderRequestSchema,
  type CheckoutRequest,
  type LookupOrderRequest,
  type Order,
} from '@mims/contracts';
import { LookupRateLimitGuard } from '../../common/guards/lookup-rate-limit.guard';
import { zodPipe } from '../../common/pipes/zod-validation.pipe';
import { OrdersService } from './orders.service';

/**
 * Two routes, and both are POSTs.
 *
 * The lookup is a POST rather than `GET /orders/:reference?phone=…` because the
 * phone number is the credential. A query string is written to every access log
 * and proxy cache between here and the customer, and it is the first thing that
 * ends up in a screenshot pasted into a WhatsApp group. It goes in a body.
 */
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  place(@Body(zodPipe(checkoutRequestSchema)) request: CheckoutRequest): Promise<Order> {
    return this.orders.place(request);
  }

  /**
   * 200 rather than 201: this creates nothing. And rate limited, because the
   * one-failure-for-both-halves rule upstairs is only a defence if the
   * reference space cannot simply be walked.
   */
  @Post('lookup')
  @HttpCode(200)
  @UseGuards(LookupRateLimitGuard)
  lookup(@Body(zodPipe(lookupOrderRequestSchema)) request: LookupOrderRequest): Promise<Order> {
    return this.orders.lookup(request);
  }
}
