import { Injectable } from '@nestjs/common';
import type { Make, VehicleModel, VehicleVariant } from '@mims/contracts';

/**
 * Manual identification cascade: make → model → year → variant.
 *
 * Stubbed with mock rows shaped exactly like the contract. Replacing each method
 * with a Drizzle query is the whole of the implementation work — no caller
 * changes.
 */
@Injectable()
export class VehiclesService {
  listMakes(): Promise<Make[]> {
    // TODO: select from makes order by name.
    return Promise.resolve([
      { id: MOCK.toyotaId, name: 'Toyota', slug: 'toyota', countryCode: 'JP' },
      { id: MOCK.hondaId, name: 'Honda', slug: 'honda', countryCode: 'JP' },
    ]);
  }

  listModels(makeId: string): Promise<VehicleModel[]> {
    // TODO: select from vehicle_models where make_id = makeId.
    return Promise.resolve([
      { id: MOCK.camryId, makeId, name: 'Camry', slug: 'camry' },
      { id: MOCK.corollaId, makeId, name: 'Corolla', slug: 'corolla' },
    ]);
  }

  /**
   * Years are derived from the variants' ranges rather than stored, so a
   * generation spanning 2012-2017 offers six selectable years.
   */
  listYears(_modelId: string): Promise<number[]> {
    // TODO: expand variant year ranges for this model, descending, deduplicated.
    return Promise.resolve([2017, 2016, 2015, 2014, 2013, 2012]);
  }

  listVariants(modelId: string, _year: number): Promise<VehicleVariant[]> {
    // TODO: select variants where model_id = modelId and year between yearStart/yearEnd.
    return Promise.resolve([
      {
        id: MOCK.variantId,
        modelId,
        label: 'XV50',
        yearStart: 2012,
        yearEnd: 2017,
        // null trim and engine: the variant covers the whole generation, which is
        // what a user who does not know their trim will land on.
        trim: null,
        engine: null,
        bodyStyle: 'Sedan',
      },
    ]);
  }
}

const MOCK = {
  toyotaId: '00000000-0000-4000-8000-000000000001',
  hondaId: '00000000-0000-4000-8000-000000000002',
  camryId: '00000000-0000-4000-8000-000000000011',
  corollaId: '00000000-0000-4000-8000-000000000012',
  variantId: '00000000-0000-4000-8000-000000000021',
} as const;
