import { z } from 'zod';
import { uuidSchema } from './common.js';

export const damageZoneSchema = z.object({
  id: uuidSchema,
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  /** Radiator and similar: no exterior surface, so the diagram cannot offer a tap target. */
  isInternal: z.boolean(),
  displayOrder: z.number().int(),
});
export type DamageZone = z.infer<typeof damageZoneSchema>;
