import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  createEstimateRequestSchema,
  type CreateEstimateRequest,
  type Estimate,
} from '@mims/contracts';
import { zodPipe } from '../../common/pipes/zod-validation.pipe';
import { AppError } from '../../common/errors/app-error';
import { EstimatesService } from './estimates.service';

@Controller('estimates')
export class EstimatesController {
  constructor(private readonly estimates: EstimatesService) {}

  @Post()
  create(
    @Body(zodPipe(createEstimateRequestSchema)) body: CreateEstimateRequest,
  ): Promise<Estimate> {
    return this.estimates.create(body);
  }

  /** Looked up by reference, not id — this is the code on a shared or saved result. */
  @Get(':reference')
  async findByReference(@Param('reference') reference: string): Promise<Estimate> {
    const estimate = await this.estimates.findByReference(reference);
    if (!estimate) throw AppError.notFound('That estimate');
    return estimate;
  }
}
