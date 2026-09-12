import { z } from 'zod';
import { leadTimeSchema, paginationQuerySchema, priceSchema, uuidSchema } from './common.js';
import {
  fitmentConfidenceSchema,
  listingStatusSchema,
  partConditionSchema,
  partPositionSchema,
  stockModelSchema,
} from './enums.js';

/**
 * LISTINGS — the storefront's unit.
 *
 * A part is catalogue; a listing is a thing you can buy. One part yields several
 * listings because condition is a first-class axis here: genuine and tokunbo are
 * different goods at different prices, not a discount on each other.
 */

/** A photo reference. Object storage holds the file; we pass the key and the alt text. */
export const listingPhotoSchema = z.object({
  storageKey: z.string(),
  altText: z.string().nullable(),
  isPrimary: z.boolean(),
});
export type ListingPhoto = z.infer<typeof listingPhotoSchema>;

/**
 * THE FITMENT VERDICT — the single most important object in the marketplace.
 *
 * It answers "does this fit MY car", for one specific vehicle, and it is allowed
 * to answer "probably, and here is exactly how far our confidence goes". Around
 * half of all auto-parts returns are fitment errors, and against three to six
 * weeks of sea freight a return costs more than the part — so certainty is
 * established before the sale or it is not established at all. A returns process
 * cannot backstop this.
 *
 * `confidence: 'unknown'` is not a failure state to be hidden. It means we hold
 * no record for this vehicle, which is a truthful answer and a common one while
 * the catalogue is small.
 */
export const fitmentVerdictSchema = z.object({
  confidence: fitmentConfidenceSchema,
  /** The car the verdict is about: "2018 Toyota Corolla LE". Null when no vehicle is set. */
  vehicle: z.string().nullable(),
  /** The chassis the claim was matched against — the reason the claim is worth anything. */
  chassisCode: z.string().nullable(),
  /** Where the claim comes from: "Toyota EPC, ZRE172 section 5". Shown as evidence. */
  evidence: z.string().nullable(),
  /** Narrowing that still applies: "halogen headlamp cars only". */
  qualifier: z.string().nullable(),
  verifiedAt: z.iso.datetime().nullable(),
});
export type FitmentVerdict = z.infer<typeof fitmentVerdictSchema>;

/** One row of the evidence table on the product screen: every car we know about. */
export const listingFitmentSchema = z.object({
  variantId: uuidSchema.nullable(),
  /** "Toyota Corolla E170 · 2014–2019 · ZRE172" */
  label: z.string(),
  yearStart: z.number().int().nullable(),
  yearEnd: z.number().int().nullable(),
  confidence: fitmentConfidenceSchema,
  qualifier: z.string().nullable(),
  evidence: z.string().nullable(),
});
export type ListingFitment = z.infer<typeof listingFitmentSchema>;

/** The card shape: search results, category pages, cross-sell rows. */
export const listingSummarySchema = z.object({
  id: uuidSchema,
  sku: z.string(),
  /** Listing title where it has one, else the catalogue part name. */
  title: z.string(),
  partId: uuidSchema,
  partSlug: z.string(),
  partName: z.string(),
  /** The number a user may read aloud to a dealer. Always render selectable. */
  mpn: z.string().nullable(),
  categoryCode: z.string().nullable(),
  condition: partConditionSchema,
  stockModel: stockModelSchema,
  status: listingStatusSchema,
  /** One all-in Naira figure, duty included. Delivery is added later and shown. */
  price: priceSchema,
  /** When this price stops being honest — we carry the FX risk, so it has a window. */
  priceValidUntil: z.iso.datetime().nullable(),
  /** Null when neither the listing nor its supplier states one. */
  leadTime: leadTimeSchema.nullable(),
  /** Held stock only. Pre-order listings sell with nothing on hand, by design. */
  quantityAvailable: z.number().int().min(0),
  photo: listingPhotoSchema.nullable(),
  /**
   * Present only when the request carried a vehicle. Absent means "we were not
   * asked about a car", which must read differently from "we do not know".
   */
  fitment: fitmentVerdictSchema.nullable(),
});
export type ListingSummary = z.infer<typeof listingSummarySchema>;

/** The product screen. The business lives or dies on this one. */
export const listingDetailSchema = listingSummarySchema.extend({
  description: z.string().nullable(),
  oemNumber: z.string().nullable(),
  position: partPositionSchema,
  /** Listing-level caveat, shown next to the fitment verdict rather than buried. */
  fitmentNote: z.string().nullable(),
  manufacturerName: z.string().nullable(),
  isGenuineBrand: z.boolean(),
  photos: z.array(listingPhotoSchema),
  /** Every vehicle we hold a record for, graded. The evidence behind the verdict. */
  fitments: z.array(listingFitmentSchema),
  /** Alternate numbers that resolve to the same physical part. */
  crossReferences: z.array(z.object({ number: z.string(), referenceType: z.string() })),
  /** Same part, other condition — the tokunbo/genuine choice, stated plainly. */
  alternatives: z.array(
    z.object({
      id: uuidSchema,
      sku: z.string(),
      condition: partConditionSchema,
      price: priceSchema,
      stockModel: stockModelSchema,
    }),
  ),
});
export type ListingDetail = z.infer<typeof listingDetailSchema>;

/* ------------------------------------------------------------ search --- */

export const listingSortSchema = z.enum([
  /** Fitment-first: confirmed fits above probable above unknown. The default. */
  'fitment',
  'price_asc',
  'price_desc',
  'newest',
]);
export type ListingSort = z.infer<typeof listingSortSchema>;

/**
 * Browse and search in one query, because they are the same question asked two
 * ways. A part name, a part number, a category, or the vehicle cascade — and the
 * vehicle, when present, grades every row rather than silently filtering it.
 */
export const searchListingsQuerySchema = paginationQuerySchema.extend({
  /** Part name or part number. Numbers are matched against MPN, OEM and cross-refs. */
  q: z.string().trim().min(1).optional(),
  categoryCode: z.string().trim().optional(),
  condition: z.array(partConditionSchema).optional(),
  stockModel: stockModelSchema.optional(),
  /** The vehicle context. Grades results; does not hide the ungraded ones. */
  variantId: uuidSchema.optional(),
  year: z.coerce.number().int().min(1950).max(2100).optional(),
  /** True hides rows we cannot vouch for. Off by default — hiding is not honesty. */
  fitsOnly: z.stringbool().optional(),
  sort: listingSortSchema.default('fitment'),
});
export type SearchListingsQuery = z.infer<typeof searchListingsQuerySchema>;

/** Counts beside each filter, so a user can see what narrowing would cost them. */
export const listingFacetsSchema = z.object({
  conditions: z.array(z.object({ condition: partConditionSchema, count: z.number().int().min(0) })),
  categories: z.array(
    z.object({ code: z.string(), name: z.string(), count: z.number().int().min(0) }),
  ),
  fitment: z.array(
    z.object({ confidence: fitmentConfidenceSchema, count: z.number().int().min(0) }),
  ),
});
export type ListingFacets = z.infer<typeof listingFacetsSchema>;

/** A browsable category, as the marketplace home and the browse rail show them. */
export const storeCategorySchema = z.object({
  code: z.string(),
  name: z.string(),
  /** Null while the catalogue for it is still being built. */
  listingCount: z.number().int().min(0),
  displayOrder: z.number().int(),
});
export type StoreCategory = z.infer<typeof storeCategorySchema>;
