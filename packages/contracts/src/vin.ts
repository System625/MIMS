import { z } from 'zod';
import { resolvedVehicleSchema } from './vehicles.js';

/** VINs exclude I, O and Q to avoid confusion with 1 and 0. */
export const vinSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(17, 'A VIN is exactly 17 characters')
  .regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'A VIN contains no I, O or Q');

export const decodeVinRequestSchema = z.object({ vin: vinSchema });
export type DecodeVinRequest = z.infer<typeof decodeVinRequestSchema>;

export const vinDecodeOutcomeSchema = z.enum([
  'decoded',
  'not_found',
  'invalid_vin',
  'upstream_unavailable',
]);
export type VinDecodeOutcome = z.infer<typeof vinDecodeOutcomeSchema>;

/**
 * A VIN decode always returns 200 with an outcome. A failed decode is a normal
 * result routing the user to the manual cascade, not an HTTP error — the manual
 * path is a sibling of the VIN path, not its exception handler.
 */
export const vinDecodeResultSchema = z.object({
  outcome: vinDecodeOutcomeSchema,
  vin: z.string(),
  vehicle: resolvedVehicleSchema.nullable(),
  /** Plain-language reason to show when `vehicle` is null. */
  message: z.string(),
});
export type VinDecodeResult = z.infer<typeof vinDecodeResultSchema>;
