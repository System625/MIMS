import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  listPartsQuerySchema,
  paginationQuerySchema,
  uuidSchema,
  type ListPartsQuery,
  type PaginationQuery,
  type PartWithPrice,
} from '@mims/contracts';
import { zodPipe } from '../../common/pipes/zod-validation.pipe';
import { AppError } from '../../common/errors/app-error';
import type { PaginatedResult } from '../../common/interceptors/response.interceptor';
import { PartsService } from './parts.service';

@Controller('parts')
export class PartsController {
  constructor(private readonly parts: PartsService) {}

  @Get()
  list(
    @Query(zodPipe(listPartsQuerySchema)) query: ListPartsQuery,
    @Query(zodPipe(paginationQuerySchema)) page: PaginationQuery,
  ): Promise<PaginatedResult<PartWithPrice>> {
    return this.parts.list(query, page);
  }

  @Get(':id')
  async findById(@Param('id', zodPipe(uuidSchema)) id: string): Promise<PartWithPrice> {
    const part = await this.parts.findById(id);
    if (!part) throw AppError.notFound('That part');
    return part;
  }
}
