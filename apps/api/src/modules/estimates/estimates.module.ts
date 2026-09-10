import { Module } from '@nestjs/common';
import { NarrationModule } from '../narration/narration.module';
import { ZonesModule } from '../zones/zones.module';
import { EstimatesController } from './estimates.controller';
import { EstimatesService } from './estimates.service';

@Module({
  imports: [NarrationModule, ZonesModule],
  controllers: [EstimatesController],
  providers: [EstimatesService],
})
export class EstimatesModule {}
