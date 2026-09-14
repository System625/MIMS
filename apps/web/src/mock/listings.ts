import type {
  FitmentConfidence,
  FitmentVerdict,
  ListingDetail,
  ListingFacets,
  ListingFitment,
  ListingPhoto,
  ListingSummary,
  ListingSort,
  PartCondition,
  StockModel,
} from '@mims/contracts';
import type { PartArtKind } from '@/components/part-art';
import { toMinorUnits } from '@/lib/money';
import type { VehicleDetail } from './vehicles';

/**
 * ⚠️ PLACEHOLDER STOREFRONT — NOT OFFERS, NOT PRICES, NOT FITMENT CLAIMS.
 *
 * Read `bella.md` §10 before touching this file. A model may never generate or
 * infer a part number, a price, a part name or a fitment claim. Everything
 * below is therefore DERIVED from data already in this repository, and where
 * the repository is silent this file is silent too:
 *
 *  • Part names, numbers, positions and the copy under them come verbatim from
 *    `mock/parts.ts`, which is itself a transcription of the design canvas.
 *  • Retail figures are derived from that catalogue's estimate ranges by one
 *    stated rule, below — never picked.
 *  • Supplier profiles, lead times, SKU shape and stock quantities mirror
 *    `packages/db/src/seed.ts`, so the two placeholder worlds agree.
 *  • Cross-references, manufacturer names and photographs: we hold none, so
 *    there are none here. The screens are built to render that honestly, which
 *    is the point — it is the real state of the catalogue today.
 *
 * THE PRICE DERIVATION, stated once. The estimator's narration defines its own
 * range in `mock/parts.ts`: "The low end is a good aftermarket part bought
 * well; the high end is genuine." So where the canvas tags a part
 * "Aftermarket & genuine", the two ends of its range ARE the two conditions,
 * and each becomes a listing. Where the canvas names a single condition, that
 * condition takes the HIGH end — the range then describes that one grade of
 * part, and quoting its floor would be under-quoting a price we would later
 * have to raise, which is the one thing this store cannot do to somebody who
 * came here because they think they are being overcharged.
 *
 * TOKUNBO IS DELIBERATELY ABSENT, and the zero in the condition filter is
 * information rather than an oversight. The canvas defines its low end as a new
 * aftermarket part, not a used one, so no used price is derivable from it — and
 * a used price is exactly the sort of figure that must come out of Postgres or
 * not appear. The axis is built and filterable; when real tokunbo stock is
 * listed it needs no new code.
 */

/* ------------------------------------------------------------- suppliers -- */

/**
 * The two placeholder suppliers from the seed. Suppliers are admin rows, never
 * users — there is no seller portal and there will not be one. They exist here
 * only because a listing has to hang off something, and because lead time is
 * genuinely a property of who is shipping it.
 */
const LAGOS_STOCK = {
  name: 'Placeholder Lagos supplier',
  stockModel: 'held_stock' as StockModel,
  leadTime: { minDays: 2, maxDays: 5 },
  quantityAvailable: 3,
} as const;

const SOURCED = {
  name: 'Placeholder sourcing agent',
  stockModel: 'pre_order' as StockModel,
  leadTime: { minDays: 21, maxDays: 45 },
  quantityAvailable: 0,
} as const;

/* ----------------------------------------------------------- the catalogue -- */

/** When the canvas priced these, and the window we hold a price for. */
const PRICED_AT = '2026-09-04T00:00:00.000Z';
/**
 * A placeholder 30-day validity window. The window itself is not decoration:
 * the Naira moved between ₦1,350 and ₦1,430 across 2026 with active
 * pass-through to import prices, and we take payment upfront, so a price with
 * no expiry is a promise we have not priced.
 */
const PRICE_VALID_UNTIL = '2026-10-04T00:00:00.000Z';

interface FitmentRecord {
  make: string;
  model: string;
  /** The generation, which is what a set of part numbers actually belongs to. */
  generation: string;
  yearStart: number;
  yearEnd: number;
  chassisCode: string | null;
  confidence: Exclude<FitmentConfidence, 'unknown'>;
  qualifier: string | null;
  evidence: string;
}

/**
 * The chassis the whole placeholder catalogue is written against — the demo
 * car, and the one the canvas names in every coverage-gap row it prints
 * ("Fits chassis ZRE172").
 */
const COROLLA_E170: Omit<FitmentRecord, 'qualifier' | 'confidence' | 'evidence'> = {
  make: 'Toyota',
  model: 'Corolla',
  generation: 'E170',
  yearStart: 2014,
  yearEnd: 2019,
  chassisCode: 'ZRE172',
};

const PLACEHOLDER_EVIDENCE = 'Placeholder record — carried from the design canvas, not verified.';
const PLACEHOLDER_CROSS_EVIDENCE = 'Placeholder record — cross-reference not physically confirmed.';

function confirmedOnDemoCar(qualifier: string | null = null): FitmentRecord {
  return { ...COROLLA_E170, confidence: 'confirmed', qualifier, evidence: PLACEHOLDER_EVIDENCE };
}

interface CataloguePart {
  slug: string;
  name: string;
  mpn: string | null;
  categoryCode: string;
  art: PartArtKind;
  position: 'left' | 'right' | 'front' | 'rear' | 'pair' | 'not_applicable';
  /** Canvas copy, verbatim. */
  detail: string;
  /** Canvas source tag, verbatim — it decides which listings exist. */
  sourceTag: 'Aftermarket & genuine' | 'Genuine only' | 'Aftermarket' | 'Coverage gap';
  /** Canvas estimate range in Naira, or null where the canvas holds no price. */
  range: { min: string; max: string } | null;
  fitments: FitmentRecord[];
}

/**
 * One row per part in `mock/parts.ts`, in the canvas's own order. The four rows
 * the canvas prices become listings; the five it does not stay in the catalogue
 * as parts we can name but cannot sell, which is a real and useful answer to a
 * search and is rendered as one.
 */
const CATALOGUE: readonly CataloguePart[] = [
  {
    slug: 'front-bumper-cover',
    name: 'Front bumper cover',
    mpn: '52119-02997',
    categoryCode: 'bumper',
    art: 'bumper',
    position: 'front',
    detail: 'Primed, unpainted. Fog-lamp cut-outs for LE trim.',
    sourceTag: 'Aftermarket & genuine',
    range: { min: '148000.00', max: '186000.00' },
    fitments: [confirmedOnDemoCar('LE trim — fog-lamp cut-outs')],
  },
  {
    slug: 'hood-bonnet-panel',
    name: 'Hood / bonnet panel',
    mpn: '53301-02330',
    categoryCode: 'body_panel',
    art: 'body_panel',
    position: 'front',
    detail: 'Steel panel only. Hinges and catch usually reusable.',
    sourceTag: 'Aftermarket & genuine',
    range: { min: '210000.00', max: '265000.00' },
    fitments: [confirmedOnDemoCar()],
  },
  {
    slug: 'headlight-assembly-left',
    name: 'Headlight assembly, left',
    mpn: '81170-02B10',
    categoryCode: 'lighting',
    art: 'lighting',
    position: 'left',
    detail: 'Halogen, non-LED. Check your existing unit before ordering LED.',
    sourceTag: 'Genuine only',
    range: { min: '95000.00', max: '124000.00' },
    fitments: [confirmedOnDemoCar('Halogen headlamp cars only')],
  },
  {
    slug: 'radiator-1-8l',
    name: 'Radiator, 1.8L',
    mpn: '16400-0T060',
    categoryCode: 'cooling',
    art: 'cooling',
    position: 'front',
    detail: 'Includes upper and lower mounts. Replace the cap with it.',
    sourceTag: 'Aftermarket',
    range: { min: '72000.00', max: '89000.00' },
    fitments: [
      confirmedOnDemoCar(),
      /*
       * The one graded `probable` in the whole placeholder catalogue, mirroring
       * the seed's cross-fitment. It exists because "should fit, we have not
       * confirmed it on your chassis" is a state the product screen has to
       * render, and a state with no data behind it never gets designed
       * properly. Reachable in the demo: set the car to a Toyota Camry,
       * 2008–2013.
       */
      {
        make: 'Toyota',
        model: 'Camry',
        generation: 'XV50',
        yearStart: 2012,
        yearEnd: 2017,
        chassisCode: null,
        confidence: 'probable',
        qualifier: 'Shared cooling pack',
        evidence: PLACEHOLDER_CROSS_EVIDENCE,
      },
    ],
  },
  {
    slug: 'fender-left',
    name: 'Fender, left',
    mpn: '53812-02936',
    categoryCode: 'body_panel',
    art: 'body_panel',
    position: 'left',
    detail: 'Fits chassis ZRE172 — no verified Nigerian price yet.',
    sourceTag: 'Coverage gap',
    range: null,
    fitments: [confirmedOnDemoCar()],
  },
  {
    slug: 'headlight-assembly-right',
    name: 'Headlight assembly, right',
    mpn: null,
    categoryCode: 'lighting',
    art: 'lighting',
    position: 'right',
    detail: 'Fits chassis ZRE172 — part number not yet on file.',
    sourceTag: 'Coverage gap',
    range: null,
    fitments: [confirmedOnDemoCar()],
  },
  {
    slug: 'fender-right',
    name: 'Fender, right',
    mpn: null,
    categoryCode: 'body_panel',
    art: 'body_panel',
    position: 'right',
    detail: 'Fits chassis ZRE172 — part number not yet on file.',
    sourceTag: 'Coverage gap',
    range: null,
    fitments: [confirmedOnDemoCar()],
  },
  {
    slug: 'rear-bumper-cover',
    name: 'Rear bumper cover',
    mpn: null,
    categoryCode: 'bumper',
    art: 'bumper',
    position: 'rear',
    detail: 'Fits chassis ZRE172 — no verified Nigerian price yet.',
    sourceTag: 'Coverage gap',
    range: null,
    fitments: [confirmedOnDemoCar()],
  },
  {
    slug: 'boot-lid',
    name: 'Boot lid',
    mpn: null,
    categoryCode: 'body_panel',
    art: 'body_panel',
    position: 'rear',
    detail: 'Fits chassis ZRE172 — no verified Nigerian price yet.',
    sourceTag: 'Coverage gap',
    range: null,
    fitments: [confirmedOnDemoCar()],
  },
];

/* ----------------------------------------------------------------- photos -- */

/**
 * A stored photograph, plus the one thing the contract does not carry: whether
 * it is a picture of THIS ITEM or a picture of the kind of thing.
 */
export interface StorePhoto extends ListingPhoto {
  /**
   * True while the image is stock photography of the part TYPE rather than of
   * the item we would ship.
   *
   * It is not a cosmetic flag. It drives the framing (an illustrative plate is
   * cropped to fill, a real product shot is contained so nothing is cut off the
   * part) and, more importantly, it drives the labelling: an illustrative image
   * says so on the page, every time it appears. We are merchant of record, so
   * the picture is legally our description of the goods — a stock lamp with a
   * different connector is a refund we owe under the FCCPA whatever our policy
   * says. Saying plainly that the picture is not the item is what keeps this a
   * presentation shortcut instead of a misdescription.
   *
   * Delete the flag when the photograph is genuinely of the listing. Do not
   * delete it to tidy the page up.
   */
  illustrative: boolean;
}

/**
 * LISTING PHOTOGRAPHS, keyed by part slug.
 *
 * Stock imagery, added on the founder's explicit call (2026-09-12) as a stopgap
 * until we photograph our own held stock. `apps/web/public/listings/SOURCES.md`
 * records where each one came from and under what licence.
 *
 * This is the one place an image gets attached, deliberately: adding one should
 * be a single line of data, not a code change. The value's `storageKey` is a
 * filename under `apps/web/public/listings/` while no CDN is configured, or an
 * object key in the R2 bucket once `NEXT_PUBLIC_IMAGE_BASE_URL` is set —
 * `lib/images.ts` resolves it either way, so these entries survive the move.
 *
 * ALT TEXT IS WRITTEN BY A PERSON, NEVER GENERATED, and while `illustrative` is
 * set it describes what the photograph actually shows — a yellow car, a
 * bodyshop — rather than describing the part on sale. A screen-reader user is
 * owed the same information a sighted buyer gets from looking at it, which here
 * includes noticing that the picture is not the product.
 *
 * The five catalogue parts we hold no priced offer for deliberately get NO
 * image. They are gaps, not offers, and a picture would make them look like
 * something you can buy.
 */
const PART_PHOTOS: Readonly<Record<string, StorePhoto>> = {
  'front-bumper-cover': {
    storageKey: 'front-bumper-cover.jpg',
    altText:
      'Stock photograph: the front corner of a modern white hatchback, showing where a bumper cover sits below the headlamp. Not the part on sale.',
    isPrimary: true,
    illustrative: true,
  },
  'hood-bonnet-panel': {
    storageKey: 'hood-bonnet-panel.jpg',
    altText:
      'Stock photograph: a car body panel being spray-painted in a bodyshop. Not the part on sale.',
    isPrimary: true,
    illustrative: true,
  },
  'headlight-assembly-left': {
    storageKey: 'headlight-assembly-left.jpg',
    altText:
      'Stock photograph: a close-up of a modern projector headlight fitted to a white car. Not the part on sale.',
    isPrimary: true,
    illustrative: true,
  },
  'radiator-1-8l': {
    storageKey: 'radiator-1-8l.jpg',
    altText:
      'Stock photograph: a close-up of a radiator core and cooling pack. Not the part on sale.',
    isPrimary: true,
    illustrative: true,
  },
};

/* --------------------------------------------------------------- listings -- */

/**
 * A listing as the storefront holds it. Extends the contract with the two
 * genuinely presentational fields — the URL slug and which schematic to draw —
 * exactly as `EstimateItemView` extends `EstimateItem` with its ordinal.
 */
export interface ListingSummaryView extends Omit<ListingSummary, 'fitment' | 'photo'> {
  slug: string;
  art: PartArtKind;
  fitment: FitmentVerdict | null;
  photo: StorePhoto | null;
}

export interface ListingAlternativeView {
  id: string;
  sku: string;
  /** Presentational, so an alternative can be linked rather than only named. */
  slug: string;
  condition: PartCondition;
  price: ListingSummary['price'];
  stockModel: StockModel;
}

export interface ListingDetailView extends Omit<
  ListingDetail,
  'fitment' | 'alternatives' | 'photo' | 'photos'
> {
  photo: StorePhoto | null;
  photos: StorePhoto[];
  slug: string;
  art: PartArtKind;
  fitment: FitmentVerdict | null;
  supplierName: string;
  /** The canvas line under the part name. Kept distinct from the description. */
  detail: string;
  alternatives: ListingAlternativeView[];
}

/** Which conditions a canvas source tag supports, and at which end of the range. */
const CONDITIONS_FOR: Record<
  CataloguePart['sourceTag'],
  ReadonlyArray<{ condition: PartCondition; end: 'min' | 'max' }>
> = {
  'Aftermarket & genuine': [
    { condition: 'new_aftermarket', end: 'min' },
    { condition: 'new_oem', end: 'max' },
  ],
  'Genuine only': [{ condition: 'new_oem', end: 'max' }],
  Aftermarket: [{ condition: 'new_aftermarket', end: 'max' }],
  'Coverage gap': [],
};

/** Aftermarket is what we hold in Lagos; genuine is sourced to order. */
function supplierFor(condition: PartCondition) {
  return condition === 'new_oem' ? SOURCED : LAGOS_STOCK;
}

const CONDITION_SLUG: Record<PartCondition, string> = {
  new_oem: 'genuine',
  new_aftermarket: 'aftermarket',
  used_tokunbo: 'tokunbo',
  refurbished: 'refurbished',
};

export const CONDITION_LABEL: Record<PartCondition, string> = {
  new_oem: 'Genuine',
  new_aftermarket: 'Aftermarket',
  used_tokunbo: 'Tokunbo',
  refurbished: 'Refurbished',
};

/** The longer form, used where the difference has to be explained rather than named. */
export const CONDITION_NOTE: Record<PartCondition, string> = {
  new_oem: 'New, manufacturer-branded. The part the dealer would fit.',
  new_aftermarket: 'New, made by an independent manufacturer to the same fitting.',
  used_tokunbo: 'Used, pulled from a donor car and graded before dispatch.',
  refurbished: 'Used, repaired and re-finished to a stated standard.',
};

export const STOCK_LABEL: Record<StockModel, string> = {
  held_stock: 'In stock, Lagos',
  pre_order: 'Sourced to order',
};

interface BuiltListing {
  part: CataloguePart;
  summary: Omit<ListingSummaryView, 'fitment'>;
  condition: PartCondition;
}

const LISTINGS: readonly BuiltListing[] = CATALOGUE.flatMap((part, partIndex) => {
  const range = part.range;
  if (range === null) return [];

  return CONDITIONS_FOR[part.sourceTag].map((offer, offerIndex) => {
    const supplier = supplierFor(offer.condition);
    const sequence = partIndex * 2 + offerIndex + 1;

    return {
      part,
      condition: offer.condition,
      summary: {
        id: `listing-${part.slug}-${CONDITION_SLUG[offer.condition]}`,
        slug: `${part.slug}-${CONDITION_SLUG[offer.condition]}`,
        art: part.art,
        sku: `PLACEHOLDER-SKU-${String(sequence).padStart(4, '0')}`,
        title: part.name,
        partId: `part-${part.slug}`,
        partSlug: part.slug,
        partName: part.name,
        mpn: part.mpn,
        categoryCode: part.categoryCode,
        condition: offer.condition,
        stockModel: supplier.stockModel,
        status: 'active' as const,
        price: { amount: range[offer.end], currency: 'NGN' as const },
        priceValidUntil: PRICE_VALID_UNTIL,
        leadTime: supplier.leadTime,
        quantityAvailable: supplier.quantityAvailable,
        /* Null for every listing today, because we hold no photography of these
           items. The frame renders its drawn state for exactly as long as that
           stays true — see `PART_PHOTOS` above for how one gets attached. */
        photo: PART_PHOTOS[part.slug] ?? null,
      },
    };
  });
});

/* --------------------------------------------------------------- fitment -- */

/**
 * Grades one part against one car.
 *
 * Absent (`null`) and `unknown` are different answers and are rendered
 * differently: absent means we were never told what you drive, `unknown` means
 * we were told and hold no record. Collapsing the two would turn "we don't
 * know" into "you didn't ask", which is the more flattering lie.
 */
function verdictFor(part: CataloguePart, vehicle: VehicleDetail | null): FitmentVerdict | null {
  if (vehicle === null) return null;

  const label = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(' ');

  const match = part.fitments.find(
    (record) =>
      record.make.toLowerCase() === (vehicle.make ?? '').toLowerCase() &&
      record.model.toLowerCase() === (vehicle.model ?? '').toLowerCase() &&
      vehicle.year !== null &&
      vehicle.year >= record.yearStart &&
      vehicle.year <= record.yearEnd,
  );

  if (!match) {
    return {
      confidence: 'unknown',
      vehicle: label,
      chassisCode: vehicle.chassisCode,
      evidence: null,
      qualifier: null,
      verifiedAt: null,
    };
  }

  return {
    confidence: match.confidence,
    vehicle: label,
    chassisCode: match.chassisCode ?? vehicle.chassisCode,
    evidence: match.evidence,
    qualifier: match.qualifier,
    verifiedAt: match.confidence === 'confirmed' ? PRICED_AT : null,
  };
}

function fitmentRows(part: CataloguePart): ListingFitment[] {
  return part.fitments.map((record) => ({
    variantId: null,
    label: [
      `${record.make} ${record.model} ${record.generation}`,
      `${record.yearStart}–${record.yearEnd}`,
      record.chassisCode,
    ]
      .filter(Boolean)
      .join(' · '),
    yearStart: record.yearStart,
    yearEnd: record.yearEnd,
    confidence: record.confidence,
    qualifier: record.qualifier,
    evidence: record.evidence,
  }));
}

/* ---------------------------------------------------------------- search -- */

export interface CatalogueGap {
  slug: string;
  name: string;
  mpn: string | null;
  categoryCode: string;
  art: PartArtKind;
  detail: string;
  fitment: FitmentVerdict | null;
}

export interface SearchArgs {
  q?: string;
  categoryCode?: string;
  condition?: readonly PartCondition[];
  stockModel?: StockModel;
  fitsOnly?: boolean;
  sort?: ListingSort;
  vehicle?: VehicleDetail | null;
}

export interface SearchResult {
  listings: ListingSummaryView[];
  /**
   * Parts we can name but cannot sell — matched by the same query, kept in
   * their own tier. A shopper who searches for a rear bumper we do not stock is
   * better served by its part number and an honest "not stocked" than by an
   * empty page, and the number is the thing they can walk into a workshop with.
   */
  gaps: CatalogueGap[];
  facets: ListingFacets;
  /** Every listing the query matched before `fitsOnly` narrowed it. */
  hiddenByFitment: number;
}

function matchesQuery(part: CataloguePart, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (needle.length === 0) return true;

  // Part numbers are compared with punctuation ignored: nobody reads a hyphen
  // off a casting aloud, and a dealer's terminal prints them inconsistently.
  const loose = needle.replace(/[^a-z0-9]/g, '');
  const number = (part.mpn ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

  return (
    part.name.toLowerCase().includes(needle) ||
    part.detail.toLowerCase().includes(needle) ||
    (loose.length >= 3 && number.length > 0 && number.includes(loose))
  );
}

const CONFIDENCE_RANK: Record<FitmentConfidence, number> = {
  confirmed: 0,
  probable: 1,
  unknown: 2,
};

const CATEGORY_NAMES: Record<string, string> = {
  bumper: 'Bumpers',
  lighting: 'Lighting',
  body_panel: 'Body panels',
  grille: 'Grilles',
  cooling: 'Cooling',
};

/**
 * Browse and search are the same query asked two ways, so they are one
 * function. The vehicle GRADES rows rather than filtering them: hiding what we
 * cannot vouch for would make the catalogue look more certain than it is, and
 * the customer would never learn that the part exists at all. `fitsOnly` is the
 * customer's own decision to narrow, and it reports what it cost them.
 */
export function searchListings(args: SearchArgs): SearchResult {
  const vehicle = args.vehicle ?? null;
  const q = args.q ?? '';

  const matched = LISTINGS.filter(
    (listing) =>
      matchesQuery(listing.part, q) &&
      (!args.categoryCode || listing.part.categoryCode === args.categoryCode),
  );

  // Facets count what the OTHER filters leave, so a count never reads as zero
  // for the box you are standing in.
  const facets: ListingFacets = {
    conditions: (
      ['new_oem', 'new_aftermarket', 'used_tokunbo', 'refurbished'] as PartCondition[]
    ).map((condition) => ({
      condition,
      count: matched.filter((listing) => listing.condition === condition).length,
    })),
    categories: Object.entries(CATEGORY_NAMES).map(([code, name]) => ({
      code,
      name,
      count: LISTINGS.filter(
        (listing) => matchesQuery(listing.part, q) && listing.part.categoryCode === code,
      ).length,
    })),
    fitment: (['confirmed', 'probable', 'unknown'] as FitmentConfidence[]).map((confidence) => ({
      confidence,
      count: matched.filter(
        (listing) => verdictFor(listing.part, vehicle)?.confidence === confidence,
      ).length,
    })),
  };

  const narrowed = matched.filter(
    (listing) =>
      (!args.condition?.length || args.condition.includes(listing.condition)) &&
      (!args.stockModel || listing.summary.stockModel === args.stockModel),
  );

  const graded: ListingSummaryView[] = narrowed.map((listing) => ({
    ...listing.summary,
    fitment: verdictFor(listing.part, vehicle),
  }));

  const shown = args.fitsOnly
    ? graded.filter((listing) => listing.fitment?.confidence === 'confirmed')
    : graded;

  const sort = args.sort ?? 'fitment';
  const sorted = [...shown].sort((a, b) => {
    if (sort === 'price_asc' || sort === 'price_desc') {
      const delta = Number(toMinorUnits(a.price.amount) - toMinorUnits(b.price.amount));
      return sort === 'price_asc' ? delta : -delta;
    }
    if (sort === 'newest') return a.sku.localeCompare(b.sku);

    // Fitment first — and inside a grade, the cheaper part. Without a vehicle
    // every row grades the same, so this quietly becomes price order.
    const rank =
      CONFIDENCE_RANK[a.fitment?.confidence ?? 'unknown'] -
      CONFIDENCE_RANK[b.fitment?.confidence ?? 'unknown'];
    if (rank !== 0) return rank;
    return Number(toMinorUnits(a.price.amount) - toMinorUnits(b.price.amount));
  });

  const listedSlugs = new Set(LISTINGS.map((listing) => listing.part.slug));
  const gaps: CatalogueGap[] = CATALOGUE.filter(
    (part) =>
      !listedSlugs.has(part.slug) &&
      matchesQuery(part, q) &&
      (!args.categoryCode || part.categoryCode === args.categoryCode),
  ).map((part) => ({
    slug: part.slug,
    name: part.name,
    mpn: part.mpn,
    categoryCode: part.categoryCode,
    art: part.art,
    detail: part.detail,
    fitment: verdictFor(part, vehicle),
  }));

  return { listings: sorted, gaps, facets, hiddenByFitment: graded.length - shown.length };
}

/* ---------------------------------------------------------------- detail -- */

export function listingBySlug(
  slug: string,
  vehicle: VehicleDetail | null,
): ListingDetailView | null {
  const built = LISTINGS.find((listing) => listing.summary.slug === slug);
  if (!built) return null;

  const { part, summary, condition } = built;
  const supplier = supplierFor(condition);

  return {
    ...summary,
    fitment: verdictFor(part, vehicle),
    supplierName: supplier.name,
    detail: part.detail,
    description: part.detail,
    oemNumber: null,
    position: part.position,
    fitmentNote:
      condition === 'new_aftermarket'
        ? 'Independent manufacture to the same fitting. Mounting points and connectors match; finish and badging may not.'
        : null,
    manufacturerName: null,
    isGenuineBrand: condition === 'new_oem',
    photos: PART_PHOTOS[part.slug] ? [PART_PHOTOS[part.slug]!] : [],
    fitments: fitmentRows(part),
    /* We hold no cross-reference table yet. An empty list is the honest answer
       and the screen is built to say so. */
    crossReferences: [],
    alternatives: LISTINGS.filter(
      (other) => other.part.slug === part.slug && other.summary.slug !== summary.slug,
    ).map((other) => ({
      id: other.summary.id,
      sku: other.summary.sku,
      condition: other.condition,
      price: other.summary.price,
      stockModel: other.summary.stockModel,
      /* Presentational, so the alternative can be linked rather than just named. */
      slug: other.summary.slug,
    })),
  };
}

/**
 * EVERY OFFER WE HOLD FOR ONE PART THE ESTIMATOR NAMED — build plan item 8.
 *
 * The estimator and the store were transcribed from the same canvas and so name
 * the same parts, but they are not the same list and must not be assumed to be:
 * the estimator prices a zone, the store sells a listing, and the join between
 * them is the part number. Numbers are compared with punctuation stripped, for
 * the reason `matchesQuery` gives — nobody reads a hyphen off a casting, and a
 * dealer's terminal prints them inconsistently.
 *
 * Falling back to the name is deliberate and narrow. Five of the estimator's
 * rows carry a null MPN because the canvas never gave one, and matching those
 * on an exact name is the only join available; it is exact rather than fuzzy
 * because a near-miss here would put the wrong part in somebody's basket, which
 * is worse than not finding it at all.
 *
 * An empty array is a real and common answer. It means we can name the part and
 * cannot sell it, which is the coverage gap the estimator already shows — and
 * the one thing "add to cart" must never paper over.
 */
export function offersForPart(
  mpn: string | null,
  partName: string,
  vehicle: VehicleDetail | null,
): ListingDetailView[] {
  const loose = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
  const wantedNumber = mpn === null ? null : loose(mpn);
  const wantedName = partName.trim().toLowerCase();

  const part = CATALOGUE.find((candidate) =>
    wantedNumber !== null && candidate.mpn !== null
      ? loose(candidate.mpn) === wantedNumber
      : candidate.name.toLowerCase() === wantedName,
  );
  if (!part) return [];

  return LISTINGS.filter((listing) => listing.part.slug === part.slug)
    .map((listing) => listingBySlug(listing.summary.slug, vehicle))
    .filter((listing): listing is ListingDetailView => listing !== null);
}

/** Every slug the store can render, for `generateStaticParams`. */
export function allListingSlugs(): string[] {
  return LISTINGS.map((listing) => listing.summary.slug);
}

/** The catalogue part behind a slug, for the gap tier's own pages later. */
export function categoryName(code: string): string {
  return CATEGORY_NAMES[code] ?? code;
}

/** Total listings, used only where the page states its own scale honestly. */
export const LISTING_COUNT = LISTINGS.length;
export const CATALOGUE_PART_COUNT = CATALOGUE.length;
