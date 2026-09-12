import { z } from 'zod';
import { leadTimeSchema, nigerianPhoneSchema, priceSchema, uuidSchema } from './common.js';
import {
  fitmentConfidenceSchema,
  fulfilmentMethodSchema,
  orderEventTypeSchema,
  orderStatusSchema,
  partConditionSchema,
  partPositionSchema,
  stockModelSchema,
} from './enums.js';
import { addressInputSchema, addressSchema, pickupPointSchema } from './fulfilment.js';
import { resolvedVehicleSchema } from './vehicles.js';

/**
 * ORDERS.
 *
 * Every field here is a snapshot of what the customer was told. Under the FCCPA
 * 2018 a Nigerian buyer is entitled to replacement or refund for goods that are
 * defective, counterfeit or misdescribed whatever our policy says — so "what did
 * we actually claim about this part, for this car, at this price" is a question
 * we will be asked weeks later and must be able to answer exactly.
 */

export const orderItemSchema = z.object({
  id: uuidSchema,
  sku: z.string().nullable(),
  partName: z.string(),
  mpn: z.string().nullable(),
  oemNumber: z.string().nullable(),
  position: partPositionSchema,
  condition: partConditionSchema,
  stockModel: stockModelSchema,
  quantity: z.number().int().min(1),
  unitPrice: priceSchema,
  lineTotal: priceSchema,
  /** Per line, because one order can mix held stock with a five-week pre-order. */
  leadTime: leadTimeSchema.nullable(),
  /** What we claimed about fitment when it was sold. The returns conversation starts here. */
  fitmentConfidence: fitmentConfidenceSchema,
  fitmentNote: z.string().nullable(),
});
export type OrderItem = z.infer<typeof orderItemSchema>;

/**
 * One line of the tracking timeline.
 *
 * Customs clearance stalls for weeks without warning, and to someone who has
 * prepaid a stranger, an order that stops emitting events is indistinguishable
 * from being robbed. So a stall is an event with a sentence attached, and the
 * timeline is never allowed to just stop.
 */
export const orderEventSchema = z.object({
  id: uuidSchema,
  type: orderEventTypeSchema,
  /** The line the customer reads: "Held at Apapa for inspection." */
  summary: z.string(),
  detail: z.string().nullable(),
  occurredAt: z.iso.datetime(),
});
export type OrderEvent = z.infer<typeof orderEventSchema>;

export const orderSchema = z.object({
  id: uuidSchema,
  /** Quoted on the phone and over WhatsApp, so short and unambiguous. */
  reference: z.string(),
  status: orderStatusSchema,

  customerName: z.string(),
  /** Masked to its last four digits on any shared view. Phone is the identity here. */
  customerPhone: z.string(),
  customerEmail: z.string().nullable(),

  fulfilmentMethod: fulfilmentMethodSchema,
  /** Present for delivery orders — the address as it was at the time of ordering. */
  deliveryAddress: addressSchema.omit({ id: true, isDefault: true }).nullable(),
  /** Present for pickup orders. */
  pickupPoint: pickupPointSchema.omit({ id: true }).nullable(),

  /** The car it was bought for. Fitment claims are only meaningful against this. */
  vehicle: resolvedVehicleSchema.nullable(),

  items: z.array(orderItemSchema),
  itemsSubtotal: priceSchema,
  /** Shown before payment, never introduced at the end. Zero for pickup. */
  deliveryFee: priceSchema,
  total: priceSchema,

  /** Days from payment, as a window. There is no promised date anywhere in this object. */
  leadTime: leadTimeSchema.nullable(),
  /** Reverse-chronological. Empty only before the `placed` event is written. */
  events: z.array(orderEventSchema),

  customerNote: z.string().nullable(),
  cancellationReason: z.string().nullable(),
  placedAt: z.iso.datetime(),
  paidAt: z.iso.datetime().nullable(),
  deliveredAt: z.iso.datetime().nullable(),
});
export type Order = z.infer<typeof orderSchema>;

/* ---------------------------------------------------------- checkout --- */

/**
 * Guest checkout, with phone as the identity — no account, no password, no wall
 * in front of a purchase. Email is optional here but Paystack requires one on
 * initialize, so when it is absent the payment service must supply a routable
 * fallback and the receipt goes wherever that points. Decide that deliberately.
 */
const checkoutBaseSchema = z.object({
  cartId: uuidSchema,
  customerName: z.string().trim().min(2, 'Your name').max(120),
  customerPhone: nigerianPhoneSchema,
  customerEmail: z.email('Enter a valid email address').optional(),
  customerNote: z.string().trim().max(500).optional(),
  /**
   * Set when the customer has seen and accepted that unconfirmed-fitment lines
   * are their risk. Required by the cart when any line is not `confirmed` — we do
   * not let that pass silently and then argue about it after shipping.
   */
  acceptsFitmentRisk: z.boolean().default(false),
});

export const checkoutRequestSchema = z.discriminatedUnion('fulfilmentMethod', [
  checkoutBaseSchema.extend({
    fulfilmentMethod: z.literal('delivery'),
    /** A saved address, or a new one typed at checkout. Exactly one. */
    addressId: uuidSchema.optional(),
    address: addressInputSchema.optional(),
  }),
  checkoutBaseSchema.extend({
    fulfilmentMethod: z.literal('pickup'),
    pickupPointId: uuidSchema,
  }),
]);
export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;

/**
 * Guest order lookup: the reference plus the phone it was placed with. Two facts
 * the customer has and a stranger does not, which is what stands in for auth
 * until accounts exist.
 */
export const lookupOrderRequestSchema = z.object({
  reference: z.string().trim().min(4),
  phone: nigerianPhoneSchema,
});
export type LookupOrderRequest = z.infer<typeof lookupOrderRequestSchema>;
