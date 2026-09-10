import { Controller, Get, Query } from '@nestjs/common';
import {
  listModelsQuerySchema,
  listVariantsQuerySchema,
  listYearsQuerySchema,
  type Make,
  type VehicleModel,
  type VehicleVariant,
} from '@mims/contracts';
import { zodPipe } from '../../common/pipes/zod-validation.pipe';
import { VehiclesService } from './vehicles.service';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}

  @Get('makes')
  listMakes(): Promise<Make[]> {
    return this.vehicles.listMakes();
  }

  @Get('models')
  listModels(
    @Query(zodPipe(listModelsQuerySchema)) query: { makeId: string },
  ): Promise<VehicleModel[]> {
    return this.vehicles.listModels(query.makeId);
  }

  @Get('years')
  listYears(@Query(zodPipe(listYearsQuerySchema)) query: { modelId: string }): Promise<number[]> {
    return this.vehicles.listYears(query.modelId);
  }

  @Get('variants')
  listVariants(
    @Query(zodPipe(listVariantsQuerySchema)) query: { modelId: string; year: number },
  ): Promise<VehicleVariant[]> {
    return this.vehicles.listVariants(query.modelId, query.year);
  }
}
