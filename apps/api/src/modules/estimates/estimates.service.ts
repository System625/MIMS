import { Inject, Injectable } from '@nestjs/common';
import type { CreateEstimateRequest, Estimate, EstimateItem } from '@mims/contracts';
import { NARRATOR, type NarrationFacts, type Narrator } from '../narration/narration.types';
import { ZonesService } from '../zones/zones.service';

/**
 * Builds an estimate. The real pipeline, once wired:
 *
 *   1. resolve the vehicle (variant id, or free text for an uncatalogued car)
 *   2. selected zones → parts, via part_zones filtered by part_fitments
 *   3. each part → its latest part_prices row for the chosen condition
 *   4. snapshot every name, number and price onto estimate_items
 *   5. hand the retrieved rows — and only those — to the narrator for prose
 *
 * Step 5 comes last on purpose. Prose is written over data that already exists;
 * it never contributes to it. See `narration/narration.types.ts`.
 */
@Injectable()
export class EstimatesService {
  constructor(
    @Inject(NARRATOR) private readonly narrator: Narrator,
    private readonly zones: ZonesService,
  ) {}

  async create(request: CreateEstimateRequest): Promise<Estimate> {
    // TODO: steps 1-4 against Postgres, inside a transaction.
    const items = MOCK_ITEMS.filter((item) => request.zoneCodes.includes(item.zoneCode));
    const priced = items.filter((i) => i.isPriced);
    const unpriced = items.length - priced.length;

    // The narrator writes prose for a reader, so it gets display names — never
    // the machine codes that travel over the wire.
    const allZones = await this.zones.list();
    const zoneNameByCode = new Map(allZones.map((zone) => [zone.code, zone.name]));
    const nameFor = (code: string): string => zoneNameByCode.get(code) ?? code;

    const facts: NarrationFacts = {
      makeName: request.makeText ?? 'Toyota',
      modelName: request.modelText ?? 'Camry',
      year: request.year ?? null,
      matchedFromCatalogue: Boolean(request.variantId),
      zoneNames: request.zoneCodes.map(nameFor),
      items: items.map((item) => ({
        partName: item.partName,
        zoneName: nameFor(item.zoneCode),
        isPriced: item.isPriced,
        priceMin: item.price?.min ?? null,
        priceMax: item.price?.max ?? null,
        priceRecordedAt: item.priceRecordedAt,
      })),
      pricedCount: priced.length,
      unpricedCount: unpriced,
      subtotalMin: sum(priced, 'min'),
      subtotalMax: sum(priced, 'max'),
      currency: 'NGN',
    };

    const explanation = await this.narrator.narrate(facts);

    return {
      id: '00000000-0000-4000-8000-000000000051',
      reference: 'MIMS-PLACEHOLDER',
      vehicle: {
        variantId: request.variantId ?? null,
        make: facts.makeName,
        model: facts.modelName,
        year: facts.year,
        trim: null,
        engine: null,
        inCatalogue: facts.matchedFromCatalogue,
      },
      identificationMethod: request.identificationMethod,
      zoneCodes: request.zoneCodes,
      items,
      coverage: unpriced === 0 ? 'full' : priced.length === 0 ? 'none' : 'partial',
      subtotal:
        priced.length > 0
          ? { min: facts.subtotalMin ?? '0.00', max: facts.subtotalMax ?? '0.00', currency: 'NGN' }
          : null,
      unpricedItemCount: unpriced,
      explanation,
      createdAt: new Date().toISOString(),
    };
  }

  findByReference(_reference: string): Promise<Estimate | null> {
    // TODO: select the snapshot rows; do not recompute prices on read.
    return Promise.resolve(null);
  }
}

/**
 * Sums decimal strings in minor units, without ever routing money through a
 * float. `"85000.00"` becomes 8500000n directly from the digits.
 */
function sum(items: EstimateItem[], key: 'min' | 'max'): string | null {
  if (items.length === 0) return null;
  const total = items.reduce((acc, item) => {
    const value = item.price?.[key];
    if (!value) return acc;
    return acc + toMinorUnits(value) * BigInt(item.quantity);
  }, 0n);
  return `${total / 100n}.${String(total % 100n).padStart(2, '0')}`;
}

function toMinorUnits(decimal: string): bigint {
  const [whole = '0', fraction = ''] = decimal.split('.');
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0').slice(0, 2));
}

/** ⚠️ Placeholder rows. Part numbers and prices are invented, not catalogue data. */
const MOCK_ITEMS: EstimateItem[] = [
  {
    id: '00000000-0000-4000-8000-000000000061',
    zoneCode: 'front_bumper',
    partName: 'Front bumper cover',
    mpn: 'PLACEHOLDER-BUM-0001',
    oemNumber: null,
    position: 'front',
    quantity: 1,
    isPriced: true,
    condition: 'new_aftermarket',
    price: { min: '85000.00', max: '120000.00', currency: 'NGN' },
    priceRecordedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: '00000000-0000-4000-8000-000000000062',
    zoneCode: 'headlights',
    partName: 'Headlight assembly, left',
    mpn: 'PLACEHOLDER-HLL-0004',
    oemNumber: null,
    position: 'left',
    quantity: 1,
    isPriced: true,
    condition: 'new_aftermarket',
    price: { min: '95000.00', max: '145000.00', currency: 'NGN' },
    priceRecordedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    // The partial-coverage case, present from day one because it is the common one.
    id: '00000000-0000-4000-8000-000000000063',
    zoneCode: 'radiator',
    partName: 'Radiator assembly',
    mpn: 'PLACEHOLDER-RAD-0007',
    oemNumber: null,
    position: 'front',
    quantity: 1,
    isPriced: false,
    condition: null,
    price: null,
    priceRecordedAt: null,
  },
];
