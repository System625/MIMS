import { z } from 'zod';

/**
 * Mirrors of the Postgres enums in `@mims/db`. Kept as literal unions here so the
 * frontends can import them without pulling in a database driver. If one of these
 * drifts from the schema, `pnpm typecheck` in the API fails — the API assigns DB
 * rows straight into these contract types.
 */

export const identificationMethodSchema = z.enum(['vin', 'manual']);
export type IdentificationMethod = z.infer<typeof identificationMethodSchema>;

export const partPositionSchema = z.enum([
  'left',
  'right',
  'front',
  'rear',
  'pair',
  'not_applicable',
]);
export type PartPosition = z.infer<typeof partPositionSchema>;

export const partConditionSchema = z.enum([
  'new_oem',
  'new_aftermarket',
  'used_tokunbo',
  'refurbished',
]);
export type PartCondition = z.infer<typeof partConditionSchema>;

export const estimateCoverageSchema = z.enum(['full', 'partial', 'none']);
export type EstimateCoverage = z.infer<typeof estimateCoverageSchema>;

export const waitlistSourceSchema = z.enum([
  'landing',
  'facelift_hub',
  'accessories_store',
  'coverage_gap',
  'vehicle_not_found',
]);
export type WaitlistSource = z.infer<typeof waitlistSourceSchema>;

export const priceSourceSchema = z.enum([
  'vendor_quote',
  'market_survey',
  'dealer_list',
  'import_landed_cost',
  'manual_entry',
]);
export type PriceSource = z.infer<typeof priceSourceSchema>;
