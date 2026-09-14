import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';
import { PostgresOrdersRepository } from './postgres-orders.repository';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, { provide: OrdersRepository, useClass: PostgresOrdersRepository }],
  exports: [OrdersService],
})
export class OrdersModule {}
