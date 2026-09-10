import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { VinModule } from './modules/vin/vin.module';
import { ZonesModule } from './modules/zones/zones.module';
import { PartsModule } from './modules/parts/parts.module';
import { EstimatesModule } from './modules/estimates/estimates.module';
import { WaitlistModule } from './modules/waitlist/waitlist.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    DatabaseModule,
    HealthModule,
    VehiclesModule,
    VinModule,
    ZonesModule,
    PartsModule,
    EstimatesModule,
    WaitlistModule,
  ],
})
export class AppModule {}
