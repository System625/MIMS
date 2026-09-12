import { z } from 'zod';
import { nigerianPhoneSchema, uuidSchema } from './common.js';

/**
 * Delivery and collection.
 *
 * Pickup is a peer of delivery, not a cheap alternative. Nigerian buyers prefer
 * cash on delivery because of how often they are cheated, and COD cannot survive
 * a four-week import lead time — so we are prepaid, and the whole trust burden
 * falls on this interface. Collecting a part from a counter that exists, from a
 * person, is the nearest thing to a safety net we can offer.
 */

/** The 36 states and the Federal Capital Territory. */
export const NIGERIAN_STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT — Abuja',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
] as const;

export const nigerianStateSchema = z.enum(NIGERIAN_STATES);
export type NigerianState = z.infer<typeof nigerianStateSchema>;

/**
 * The Nigerian address shape. There is no postcode field: the national system
 * exists and effectively nobody uses it, so asking for a number the customer
 * does not know — to print on a label no rider reads — costs a sale and buys
 * nothing. `landmark` is the field that actually finds the house.
 */
export const addressSchema = z.object({
  id: uuidSchema,
  label: z.string().nullable(),
  recipientName: z.string(),
  phone: z.string(),
  altPhone: z.string().nullable(),
  line1: z.string(),
  line2: z.string().nullable(),
  landmark: z.string().nullable(),
  area: z.string().nullable(),
  city: z.string(),
  state: z.string(),
  deliveryNotes: z.string().nullable(),
  isDefault: z.boolean(),
});
export type Address = z.infer<typeof addressSchema>;

export const addressInputSchema = z.object({
  label: z.string().trim().max(60).optional(),
  recipientName: z.string().trim().min(2, 'Who is receiving it?').max(120),
  phone: nigerianPhoneSchema,
  /** A second number, because the first is often off or out of credit. */
  altPhone: nigerianPhoneSchema.optional(),
  line1: z.string().trim().min(4, 'Street and number').max(200),
  line2: z.string().trim().max(200).optional(),
  /** "Opposite the second gate, after the mosque." Not decoration — this is how riders find you. */
  landmark: z.string().trim().max(200).optional(),
  area: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2).max(120),
  state: nigerianStateSchema,
  deliveryNotes: z.string().trim().max(500).optional(),
});
export type AddressInput = z.infer<typeof addressInputSchema>;

export const pickupPointSchema = z.object({
  id: uuidSchema,
  code: z.string(),
  name: z.string(),
  /** Whose counter it is — ours, or a logistics partner's station. Say which. */
  partnerName: z.string().nullable(),
  line1: z.string(),
  landmark: z.string().nullable(),
  area: z.string().nullable(),
  city: z.string(),
  state: z.string(),
  phone: z.string().nullable(),
  /** Free text, because "Mon–Sat 9am–6pm, closed public holidays" is the truth. */
  openingHours: z.string().nullable(),
  notes: z.string().nullable(),
});
export type PickupPoint = z.infer<typeof pickupPointSchema>;

export const listPickupPointsQuerySchema = z.object({
  state: z.string().trim().optional(),
  city: z.string().trim().optional(),
});
export type ListPickupPointsQuery = z.infer<typeof listPickupPointsQuerySchema>;
