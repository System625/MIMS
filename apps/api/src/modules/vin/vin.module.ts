import { Module } from '@nestjs/common';
import { VinController } from './vin.controller';
import { VinService } from './vin.service';
import { VpicClient } from './vpic.client';

@Module({
  controllers: [VinController],
  providers: [VinService, VpicClient],
  exports: [VinService],
})
export class VinModule {}
