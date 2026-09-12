import { z } from 'zod';
import { leadTimeSchema, priceSchema, uuidSchema } from './common.js';
import { fitmentConfidenceSchema, partConditionSchema, stockModelSchema } from './enums.js';
import { resolvedVehicleSchema } from './vehicles.js';

/**
 * THE CART CARRIES A CAR.
 *
 * Elsewhere a basket is a list of things. Here it is a list of things *for one
 * vehicle*, and every line is rechecked against that vehicle each time the cart
 * is read — because fitment must be settled before payment, not after a five-week
 * wait. Changing the car does not empty the cart; it re-grades it, which is the
 * more useful and more honest behaviour.
 */

/** What changed since a line was added. All three can be true at once. */
export const cartLineChangeSchema = z.object({
  /** The listing's price moved. We show both figures and let the customer decide. */
  priceChanged: z.boolean(),
  /** Confidence moved — usually because the cart's vehicle changed under it. */
  fitmentChanged: z.boolean(),
  /** Held stock ran out, or the listing was withdrawn entirely. */
  availabilityChanged: z.boolean(),
});
export type CartLineChange = z.infer<typeof cartLineChangeSchema>;

export const cartItemAvailabilitySchema = z.enum(['available', 'out_of_stock', 'withdrawn']);
export type CartItemAvailability = z.infer<typeof cartItemAvailabilitySchema>;

export const cartItemSchema = z.object({
  id: uuidSchema,
  /** Null once a listing has been withdrawn. The line stays, and says so. */
  listingId: uuidSchema.nullable(),
  sku: z.string().nullable(),
  partName: z.string(),
  mpn: z.string().nullable(),
  condition: partConditionSchema,
  stockModel: stockModelSchema,
  quantity: z.number().int().min(1),

  /** What the customer was shown when they added it. */
  priceAtAdd: priceSchema,
  /** What it costs now. Null when the listing is gone. */
  currentPrice: priceSchema.nullable(),
  lineTotal: priceSchema,

  leadTime: leadTimeSchema.nullable(),
  fitmentAtAdd: fitmentConfidenceSchema,
  /** Rechecked on every read against the cart's current vehicle. */
  fitmentNow: fitmentConfidenceSchema,
  fitmentNote: z.string().nullable(),

  availability: cartItemAvailabilitySchema,
  changes: cartLineChangeSchema,
  addedAt: z.iso.datetime(),
});
export type CartItem = z.infer<typeof cartItemSchema>;

export const cartSchema = z.object({
  id: uuidSchema,
  /** Null until a car is set. The cart is usable without one; fitment is not. */
  vehicle: resolvedVehicleSchema.nullable(),
  items: z.array(cartItemSchema),
  itemCount: z.number().int().min(0),
  itemsSubtotal: priceSchema,
  /**
   * The widest window across the lines, because an order arrives when its slowest
   * part does. A cart mixing held stock with a pre-order says both, and does not
   * average them into a comforting middle.
   */
  leadTime: leadTimeSchema.nullable(),
  /** True when any line is held stock and any other is pre-order. Drives the split copy. */
  hasMixedLeadTimes: z.boolean(),
  /** Lines needing a decision before checkout: unconfirmed fitment, gone, re-priced. */
  needsAttentionCount: z.number().int().min(0),
  updatedAt: z.iso.datetime(),
});
export type Cart = z.infer<typeof cartSchema>;

export const addToCartRequestSchema = z.object({
  listingId: uuidSchema,
  quantity: z.number().int().min(1).max(20).default(1),
  /**
   * Sets the cart's vehicle if it has none. A part added from a product page the
   * customer reached with a car in context keeps that context.
   */
  variantId: uuidSchema.optional(),
  year: z.number().int().min(1950).max(2100).optional(),
});
export type AddToCartRequest = z.infer<typeof addToCartRequestSchema>;

/** Quantity 0 is a removal, so the UI needs one call and no special case. */
export const updateCartItemRequestSchema = z.object({
  quantity: z.number().int().min(0).max(20),
});
export type UpdateCartItemRequest = z.infer<typeof updateCartItemRequestSchema>;

export const setCartVehicleRequestSchema = z
  .object({
    variantId: uuidSchema.optional(),
    year: z.number().int().min(1950).max(2100).optional(),
    /** Free text for a car we do not carry. The cart still works; fitment reads unknown. */
    makeText: z.string().trim().min(1).optional(),
    modelText: z.string().trim().min(1).optional(),
  })
  .refine((v) => Boolean(v.variantId) || Boolean(v.makeText && v.modelText), {
    message: 'Provide either a catalogue variant or a free-text make and model',
    path: ['variantId'],
  });
export type SetCartVehicleRequest = z.infer<typeof setCartVehicleRequestSchema>;
