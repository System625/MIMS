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

/* ------------------------------------------------------------- commerce -- */

/**
 * How sure we are that a part fits a particular car. `probable` is a real,
 * displayed answer — "this should fit, we have not confirmed it on your
 * chassis" — and must never be rendered as if it were `confirmed`. `unknown`
 * means we hold no fitment record for that vehicle at all.
 */
export const fitmentConfidenceSchema = z.enum(['confirmed', 'probable', 'unknown']);
export type FitmentConfidence = z.infer<typeof fitmentConfidenceSchema>;

/** Held stock ships in days; pre-order is sourced and lands in weeks. */
export const stockModelSchema = z.enum(['held_stock', 'pre_order']);
export type StockModel = z.infer<typeof stockModelSchema>;

export const listingStatusSchema = z.enum(['draft', 'active', 'out_of_stock', 'archived']);
export type ListingStatus = z.infer<typeof listingStatusSchema>;

export const supplierStatusSchema = z.enum(['active', 'paused', 'archived']);
export type SupplierStatus = z.infer<typeof supplierStatusSchema>;

/** Door delivery and pickup coexist; neither is the default. */
export const fulfilmentMethodSchema = z.enum(['delivery', 'pickup']);
export type FulfilmentMethod = z.infer<typeof fulfilmentMethodSchema>;

/** `customs` is a named state because a stall must look stalled, not broken. */
export const orderStatusSchema = z.enum([
  'awaiting_payment',
  'paid',
  'sourcing',
  'in_transit',
  'customs',
  'ready_for_pickup',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'refunded',
]);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const orderEventTypeSchema = z.enum([
  'placed',
  'payment_initialized',
  'payment_succeeded',
  'payment_failed',
  'supplier_ordered',
  'shipped',
  'arrived_port',
  'customs_started',
  'customs_delayed',
  'customs_cleared',
  'ready_for_pickup',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'refund_initiated',
  'refunded',
  'note',
]);
export type OrderEventType = z.infer<typeof orderEventTypeSchema>;

export const paymentStatusSchema = z.enum([
  'initialized',
  'pending',
  'success',
  'failed',
  'abandoned',
  'reversed',
]);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const paymentChannelSchema = z.enum([
  'card',
  'bank_transfer',
  'ussd',
  'bank',
  'qr',
  'mobile_money',
  'unknown',
]);
export type PaymentChannel = z.infer<typeof paymentChannelSchema>;

export const cartStatusSchema = z.enum(['active', 'ordered', 'abandoned']);
export type CartStatus = z.infer<typeof cartStatusSchema>;
