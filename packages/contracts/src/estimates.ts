import { z } from 'zod';
import { moneySchema, uuidSchema } from './common.js';
import {
  estimateCoverageSchema,
  identificationMethodSchema,
  partConditionSchema,
  partPositionSchema,
} from './enums.js';
import { resolvedVehicleSchema } from './vehicles.js';

export const createEstimateRequestSchema = z
  .object({
    identificationMethod: identificationMethodSchema,
    /** Present when identificationMethod is 'vin'. */
    vin: z.string().optional(),
    /** Present when the vehicle resolved to something in our catalogue. */
    variantId: uuidSchema.optional(),
    year: z.number().int().min(1950).max(2100).optional(),
    /** Free-text fallback for a vehicle we do not carry — still produces a record. */
    makeText: z.string().trim().min(1).optional(),
    modelText: z.string().trim().min(1).optional(),
    zoneCodes: z.array(z.string()).min(1, 'Select at least one damaged area'),
    contactEmail: z.email().optional(),
  })
  .refine((v) => Boolean(v.variantId) || Boolean(v.makeText && v.modelText), {
    message: 'Provide either a catalogue variant or a free-text make and model',
    path: ['variantId'],
  });
export type CreateEstimateRequest = z.infer<typeof createEstimateRequestSchema>;

export const estimateItemSchema = z.object({
  id: uuidSchema,
  zoneCode: z.string(),
  partName: z.string(),
  /** Long alphanumeric string the user may read aloud to a dealer. Always render selectable. */
  mpn: z.string().nullable(),
  oemNumber: z.string().nullable(),
  position: partPositionSchema,
  quantity: z.number().int().min(1),
  /** False means: this part is needed, and we do not have a price. Say so explicitly. */
  isPriced: z.boolean(),
  condition: partConditionSchema.nullable(),
  price: moneySchema.nullable(),
  priceRecordedAt: z.iso.datetime().nullable(),
});
export type EstimateItem = z.infer<typeof estimateItemSchema>;

export const estimateSchema = z.object({
  id: uuidSchema,
  reference: z.string(),
  vehicle: resolvedVehicleSchema,
  identificationMethod: identificationMethodSchema,
  zoneCodes: z.array(z.string()),
  items: z.array(estimateItemSchema),
  coverage: estimateCoverageSchema,
  subtotal: moneySchema.nullable(),
  unpricedItemCount: z.number().int().min(0),
  /**
   * Prose written over the rows above, explaining how parts were matched and why
   * they cost what they do. See `apps/api/src/modules/narration` — this string is
   * the ONLY field an AI model may ever produce, and it is generated from the
   * already-retrieved items, never allowed to invent one.
   */
  explanation: z.string().nullable(),
  createdAt: z.iso.datetime(),
});
export type Estimate = z.infer<typeof estimateSchema>;
