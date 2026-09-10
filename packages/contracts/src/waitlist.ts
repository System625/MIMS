import { z } from 'zod';
import { uuidSchema } from './common.js';
import { waitlistSourceSchema } from './enums.js';

export const joinWaitlistRequestSchema = z.object({
  email: z.email('Enter a valid email address'),
  source: waitlistSourceSchema,
  /** Free-text vehicle when this came from the coverage-gap capture. */
  vehicleNote: z.string().trim().max(500).optional(),
  estimateId: uuidSchema.optional(),
});
export type JoinWaitlistRequest = z.infer<typeof joinWaitlistRequestSchema>;

export const waitlistEntrySchema = z.object({
  id: uuidSchema,
  email: z.string(),
  source: waitlistSourceSchema,
  vehicleNote: z.string().nullable(),
  createdAt: z.iso.datetime(),
});
export type WaitlistEntry = z.infer<typeof waitlistEntrySchema>;
