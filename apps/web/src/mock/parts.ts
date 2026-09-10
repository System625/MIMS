import type { Estimate, EstimateItem, Money, PartCondition, PartPosition } from '@mims/contracts';
import { fromMinorUnits, toMinorUnits } from '@/lib/money';
import type { VehicleDetail } from './vehicles';
import { sortZoneCodes, zoneByCode, zoneName } from './zones';

/**
 * ⚠️ PLACEHOLDER CATALOGUE — NOT PRICING DATA.
 *
 * Every row below is copied verbatim out of the Claude Design canvas (B3Results,
 * B4States) so the built screens reproduce the designed ones exactly. They exist
 * to demonstrate the interface and nothing else.
 *
 * Read `README.md` § "The AI boundary" before touching this file. A model may
 * never generate or infer a part number, a price, a part name or a fitment
 * claim — those come out of Postgres or they do not appear. Nothing here was
 * inferred: parts the design does not enumerate are carried as UNPRICED with a
 * null part number, which is the honest state and also the common one while the
 * catalogue is small.
 */

const PRICED_AT = '2026-09-04T00:00:00.000Z';

/**
 * Two fields the design needs that `estimateItemSchema` has no home for yet:
 * the fitment note under each part name, and the source tag in the last column.
 * Both are catalogue data rather than presentation, so when the API is wired
 * they belong on the contract — see the note in the handover summary.
 */
export interface EstimateItemView extends EstimateItem {
  /** Diagram/table stamp, taken from the zone. */
  ordinal: string;
  /** "Primed, unpainted. Fog-lamp cut-outs for LE trim." */
  detail: string;
  /** "Aftermarket & genuine" · "Genuine only" · "Coverage gap" */
  sourceTag: string;
}

export interface EstimateView extends Estimate {
  items: EstimateItemView[];
}

interface CatalogueRow {
  zoneCode: string;
  partName: string;
  mpn: string | null;
  position: PartPosition;
  detail: string;
  sourceTag: string;
  condition: PartCondition | null;
  price: Money | null;
}

function ngn(min: string, max: string): Money {
  return { min, max, currency: 'NGN' };
}

/** One row per zone. A zone maps to a set of parts; today each set holds one. */
const CATALOGUE: readonly CatalogueRow[] = [
  {
    zoneCode: 'front_bumper',
    partName: 'Front bumper cover',
    mpn: '52119-02997',
    position: 'front',
    detail: 'Primed, unpainted. Fog-lamp cut-outs for LE trim.',
    sourceTag: 'Aftermarket & genuine',
    condition: 'new_aftermarket',
    price: ngn('148000.00', '186000.00'),
  },
  {
    zoneCode: 'hood',
    partName: 'Hood / bonnet panel',
    mpn: '53301-02330',
    position: 'front',
    detail: 'Steel panel only. Hinges and catch usually reusable.',
    sourceTag: 'Aftermarket & genuine',
    condition: 'new_aftermarket',
    price: ngn('210000.00', '265000.00'),
  },
  {
    zoneCode: 'headlight_left',
    partName: 'Headlight assembly, left',
    mpn: '81170-02B10',
    position: 'left',
    detail: 'Halogen, non-LED. Check your existing unit before ordering LED.',
    sourceTag: 'Genuine only',
    condition: 'new_oem',
    price: ngn('95000.00', '124000.00'),
  },
  {
    zoneCode: 'radiator',
    partName: 'Radiator, 1.8L',
    mpn: '16400-0T060',
    position: 'front',
    detail: 'Includes upper and lower mounts. Replace the cap with it.',
    sourceTag: 'Aftermarket',
    condition: 'new_aftermarket',
    price: ngn('72000.00', '89000.00'),
  },
  {
    zoneCode: 'fender_left',
    partName: 'Fender, left',
    mpn: '53812-02936',
    position: 'left',
    detail: 'Fits chassis ZRE172 — no verified Nigerian price yet.',
    sourceTag: 'Coverage gap',
    condition: null,
    price: null,
  },
  // Below: zones the design does not enumerate a part number for. They stay
  // unpriced with a null MPN rather than being invented.
  {
    zoneCode: 'headlight_right',
    partName: 'Headlight assembly, right',
    mpn: null,
    position: 'right',
    detail: 'Fits chassis ZRE172 — part number not yet on file.',
    sourceTag: 'Coverage gap',
    condition: null,
    price: null,
  },
  {
    zoneCode: 'fender_right',
    partName: 'Fender, right',
    mpn: null,
    position: 'right',
    detail: 'Fits chassis ZRE172 — part number not yet on file.',
    sourceTag: 'Coverage gap',
    condition: null,
    price: null,
  },
  {
    zoneCode: 'rear_bumper',
    partName: 'Rear bumper cover',
    mpn: null,
    position: 'rear',
    detail: 'Fits chassis ZRE172 — no verified Nigerian price yet.',
    sourceTag: 'Coverage gap',
    condition: null,
    price: null,
  },
  {
    zoneCode: 'rear_panel',
    partName: 'Boot lid',
    mpn: null,
    position: 'rear',
    detail: 'Fits chassis ZRE172 — no verified Nigerian price yet.',
    sourceTag: 'Coverage gap',
    condition: null,
    price: null,
  },
];

const BY_ZONE = new Map(CATALOGUE.map((row) => [row.zoneCode, row]));

function itemId(zoneCode: string): string {
  return `item-${zoneCode}`;
}

/**
 * Sums priced rows in minor units. Mirrors `EstimatesService#sum` in the API so
 * the figure the frontend renders and the figure the backend stores can never
 * disagree by a rounding step.
 */
function subtotal(items: readonly EstimateItem[]): Money | null {
  const priced = items.filter((item) => item.price !== null);
  if (priced.length === 0) return null;

  const add = (key: 'min' | 'max') =>
    priced.reduce(
      (acc, item) => acc + toMinorUnits(item.price?.[key] ?? '0') * BigInt(item.quantity),
      0n,
    );

  return { min: fromMinorUnits(add('min')), max: fromMinorUnits(add('max')), currency: 'NGN' };
}

/**
 * Deterministic prose over rows that already exist.
 *
 * This mirrors `apps/api/src/modules/narration/template.narrator.ts`: the string
 * is written from facts already retrieved, and can only ever restate them. It is
 * the single field an LLM would be allowed to produce, and even then it would
 * receive exactly these facts and no database access. Swapping the template for
 * a model must not widen what it is given.
 */
function explain(vehicle: VehicleDetail, items: readonly EstimateItemView[]): string[] {
  const priced = items.filter((item) => item.isPriced);
  const chassis = vehicle.chassisCode;
  const title = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(' ');

  const first = chassis
    ? `Your vehicle resolves to a ${title}, chassis ${chassis}${
        vehicle.engine ? `, ${vehicle.engine}` : ''
      }. Parts are matched to that chassis code rather than the model name, so these numbers fit your car and not a facelift that looks identical.`
    : `Your vehicle resolves to a ${title}. We hold no chassis code for it yet, so parts are matched at model level and should be checked against your own car before ordering.`;

  const second =
    priced.length > 0
      ? 'Each price is the middle of at least three recent quotes: one authorised dealer and two Ladipo traders. The low end is a good aftermarket part bought well; the high end is genuine. Anything quoted above the high end is worth questioning.'
      : 'We hold no verified Nigerian price for any of these parts yet. The part numbers are still worth taking to a workshop — ask them to quote against the number, not the job.';

  const unpriced = items.length - priced.length;
  const third =
    unpriced > 0
      ? `${unpriced} of ${items.length} ${unpriced === 1 ? 'part is' : 'parts are'} not counted in the total. ${unpriced === 1 ? 'It fits' : 'They fit'} your car, but ${unpriced === 1 ? 'has' : 'have'} no verified Nigerian price yet — so the total below is the floor of what you will pay, not the whole of it.`
      : null;

  return third ? [first, second, third] : [first, second];
}

/**
 * Builds the estimate a set of ticked zones produces.
 *
 * The real pipeline resolves zones → parts through `part_zones` filtered by
 * `part_fitments`, then takes each part's latest `part_prices` row. This does
 * the same shape of work over a fixed table so the interface can be built and
 * reviewed before that query exists.
 */
export function buildEstimate(
  vehicle: VehicleDetail,
  zoneCodes: readonly string[],
  reference = 'MI-4471',
  createdAt = PRICED_AT,
): EstimateView {
  const inCatalogue = vehicle.inCatalogue;

  const items: EstimateItemView[] = sortZoneCodes(zoneCodes).flatMap((code) => {
    const row = BY_ZONE.get(code);
    const zone = zoneByCode(code);
    if (!row || !zone) return [];

    // A car we do not carry produces the parts list with every price withheld,
    // never a fabricated one.
    const price = inCatalogue ? row.price : null;

    return [
      {
        id: itemId(code),
        zoneCode: code,
        ordinal: zone.ordinal,
        partName: row.partName,
        mpn: inCatalogue ? row.mpn : null,
        oemNumber: null,
        position: row.position,
        quantity: 1,
        isPriced: price !== null,
        condition: price !== null ? row.condition : null,
        price,
        priceRecordedAt: price !== null ? createdAt : null,
        detail: inCatalogue ? row.detail : 'Not in our catalogue for this vehicle yet.',
        sourceTag: price !== null ? row.sourceTag : 'Coverage gap',
      },
    ];
  });

  const pricedCount = items.filter((item) => item.isPriced).length;
  const unpricedItemCount = items.length - pricedCount;

  return {
    id: `estimate-${reference}`,
    reference,
    vehicle: {
      variantId: vehicle.variantId,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      trim: vehicle.trim,
      engine: vehicle.engine,
      inCatalogue: vehicle.inCatalogue,
    },
    identificationMethod: 'vin',
    zoneCodes: sortZoneCodes(zoneCodes),
    items,
    coverage: unpricedItemCount === 0 ? 'full' : pricedCount === 0 ? 'none' : 'partial',
    subtotal: subtotal(items),
    unpricedItemCount,
    explanation: explain(vehicle, items).join('\n\n'),
    createdAt,
  };
}

/** The narration split back into paragraphs for rendering. */
export function explanationParagraphs(estimate: EstimateView): string[] {
  return (estimate.explanation ?? '').split('\n\n').filter(Boolean);
}

/** "Front bumper, hood, headlight L" — the one-line summary used in lists. */
export function zoneSummary(zoneCodes: readonly string[]): string {
  return sortZoneCodes(zoneCodes).map(zoneName).join(', ');
}
