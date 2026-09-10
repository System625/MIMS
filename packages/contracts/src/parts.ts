import { z } from 'zod';
import { moneySchema, uuidSchema } from './common.js';
import { partConditionSchema, partPositionSchema, priceSourceSchema } from './enums.js';

export const partSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  slug: z.string(),
  categoryId: uuidSchema.nullable(),
  manufacturerId: uuidSchema.nullable(),
  mpn: z.string().nullable(),
  oemNumber: z.string().nullable(),
  position: partPositionSchema,
  description: z.string().nullable(),
  isActive: z.boolean(),
});
export type Part = z.infer<typeof partSchema>;

export const partPriceSchema = z.object({
  id: uuidSchema,
  partId: uuidSchema,
  condition: partConditionSchema,
  amount: moneySchema,
  source: priceSourceSchema,
  sourceNote: z.string().nullable(),
  /** Drives the "last updated" line. Never hide this. */
  recordedAt: z.iso.datetime(),
});
export type PartPrice = z.infer<typeof partPriceSchema>;

export const partWithPriceSchema = partSchema.extend({
  currentPrice: partPriceSchema.nullable(),
});
export type PartWithPrice = z.infer<typeof partWithPriceSchema>;

export const listPartsQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  categoryId: uuidSchema.optional(),
  zoneCode: z.string().optional(),
  variantId: uuidSchema.optional(),
  isActive: z.stringbool().optional(),
});
export type ListPartsQuery = z.infer<typeof listPartsQuerySchema>;
