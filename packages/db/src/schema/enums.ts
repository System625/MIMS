import { pgEnum } from 'drizzle-orm/pg-core';

/**
 * How the user arrived at their vehicle. `manual` is a first-class path, not a
 * fallback — most Nigerian imports decode badly or not at all via vPIC.
 */
export const identificationMethod = pgEnum('identification_method', ['vin', 'manual']);

/** Side/position a part occupies. Headlights and fenders are sold per side. */
export const partPosition = pgEnum('part_position', [
  'left',
  'right',
  'front',
  'rear',
  'pair',
  'not_applicable',
]);

/**
 * Condition tiers. `used_tokunbo` is the dominant tier in this market and is a
 * genuinely different price, not a discount on the new price.
 */
export const partCondition = pgEnum('part_condition', [
  'new_oem',
  'new_aftermarket',
  'used_tokunbo',
  'refurbished',
]);

/** How a cross-referenced number relates to the part it hangs off. */
export const crossReferenceType = pgEnum('cross_reference_type', [
  'oem',
  'aftermarket',
  'supersedes',
  'superseded_by',
  'interchange',
]);

/** Provenance of a price record. Every figure shown to a user must be sourced. */
export const priceSource = pgEnum('price_source', [
  'vendor_quote',
  'market_survey',
  'dealer_list',
  'import_landed_cost',
  'manual_entry',
]);

/** How much of the requested estimate we could actually price. */
export const estimateCoverage = pgEnum('estimate_coverage', ['full', 'partial', 'none']);

export const estimateStatus = pgEnum('estimate_status', ['draft', 'complete', 'abandoned']);

/** Which "coming soon" or capture surface an email came from. */
export const waitlistSource = pgEnum('waitlist_source', [
  'landing',
  'facelift_hub',
  'accessories_store',
  'coverage_gap',
  'vehicle_not_found',
]);

export const vinLookupStatus = pgEnum('vin_lookup_status', [
  'success',
  'not_found',
  'invalid_vin',
  'upstream_error',
]);
