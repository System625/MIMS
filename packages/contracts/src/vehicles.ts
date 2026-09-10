import { z } from 'zod';
import { uuidSchema } from './common.js';

export const makeSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  slug: z.string(),
  countryCode: z.string().nullable(),
});
export type Make = z.infer<typeof makeSchema>;

export const vehicleModelSchema = z.object({
  id: uuidSchema,
  makeId: uuidSchema,
  name: z.string(),
  slug: z.string(),
});
export type VehicleModel = z.infer<typeof vehicleModelSchema>;

export const vehicleVariantSchema = z.object({
  id: uuidSchema,
  modelId: uuidSchema,
  label: z.string().nullable(),
  yearStart: z.number().int(),
  /** null means "still current" — resolve against the present year for display. */
  yearEnd: z.number().int().nullable(),
  /** null means the variant covers every trim of the generation. */
  trim: z.string().nullable(),
  engine: z.string().nullable(),
  bodyStyle: z.string().nullable(),
});
export type VehicleVariant = z.infer<typeof vehicleVariantSchema>;

/** The fully resolved vehicle shown on the confirmation step and stored on estimates. */
export const resolvedVehicleSchema = z.object({
  variantId: uuidSchema.nullable(),
  make: z.string(),
  model: z.string(),
  year: z.number().int().nullable(),
  trim: z.string().nullable(),
  engine: z.string().nullable(),
  /** True when we hold catalogue data for this vehicle. False drives the coverage-gap screen. */
  inCatalogue: z.boolean(),
});
export type ResolvedVehicle = z.infer<typeof resolvedVehicleSchema>;

// --- the manual cascade: each request narrows the next ---

export const listModelsQuerySchema = z.object({ makeId: uuidSchema });
export const listYearsQuerySchema = z.object({ modelId: uuidSchema });
export const listVariantsQuerySchema = z.object({
  modelId: uuidSchema,
  year: z.coerce.number().int().min(1950).max(2100),
});

export const manualVehicleSelectionSchema = z.object({
  variantId: uuidSchema,
  year: z.number().int().min(1950).max(2100),
});
export type ManualVehicleSelection = z.infer<typeof manualVehicleSelectionSchema>;
