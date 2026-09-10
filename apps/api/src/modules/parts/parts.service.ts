import { Injectable } from '@nestjs/common';
import type { ListPartsQuery, PaginationQuery, PartWithPrice } from '@mims/contracts';
import { PaginatedResult } from '../../common/interceptors/response.interceptor';

/**
 * Catalogue reads for the admin dashboard and, via the estimate builder, for the
 * consumer app.
 *
 * `currentPrice` is the most recent `part_prices` row for the part — a query
 * against append-only history, never a column read.
 */
@Injectable()
export class PartsService {
  list(_query: ListPartsQuery, page: PaginationQuery): Promise<PaginatedResult<PartWithPrice>> {
    // TODO: join parts → latest part_prices, filtered by search/category/zone/fitment.
    const items = [MOCK_PART];
    return Promise.resolve(
      new PaginatedResult(items, {
        page: page.page,
        perPage: page.perPage,
        total: items.length,
        totalPages: 1,
      }),
    );
  }

  findById(_id: string): Promise<PartWithPrice | null> {
    // TODO: select part with latest price, or null.
    return Promise.resolve(MOCK_PART);
  }
}

/** ⚠️ Placeholder. The part number and price below are invented, not catalogue data. */
const MOCK_PART: PartWithPrice = {
  id: '00000000-0000-4000-8000-000000000031',
  name: 'Front bumper cover',
  slug: 'front-bumper-cover-placeholder',
  categoryId: null,
  manufacturerId: null,
  mpn: 'PLACEHOLDER-BUM-0001',
  oemNumber: null,
  position: 'front',
  description: 'Placeholder mock part — not catalogue data.',
  isActive: true,
  currentPrice: {
    id: '00000000-0000-4000-8000-000000000041',
    partId: '00000000-0000-4000-8000-000000000031',
    condition: 'new_aftermarket',
    amount: { min: '85000.00', max: '120000.00', currency: 'NGN' },
    source: 'manual_entry',
    sourceNote: 'Placeholder seed price — invented figure.',
    recordedAt: '2026-09-01T00:00:00.000Z',
  },
};
