import { pgEnum } from 'drizzle-orm/pg-core';

/**
 * How the user arrived at their vehicle. `manual` is a first-class path, not a
 * fallback — most Nigerian imports decode badly or not at all via vPIC.
 */
export const identificationMethod = pgEnum('identification_method', ['vin', 'manual']);

/** Side/position a part occupies. Headlights and fenders are sold per side. */
export const partPosition = pgEnum('part_position', [
  'left',
  'right',
  'front',
  'rear',
  'pair',
  'not_applicable',
]);

/**
 * Condition tiers. `used_tokunbo` is the dominant tier in this market and is a
 * genuinely different price, not a discount on the new price.
 */
export const partCondition = pgEnum('part_condition', [
  'new_oem',
  'new_aftermarket',
  'used_tokunbo',
  'refurbished',
]);

/** How a cross-referenced number relates to the part it hangs off. */
export const crossReferenceType = pgEnum('cross_reference_type', [
  'oem',
  'aftermarket',
  'supersedes',
  'superseded_by',
  'interchange',
]);

/** Provenance of a price record. Every figure shown to a user must be sourced. */
export const priceSource = pgEnum('price_source', [
  'vendor_quote',
  'market_survey',
  'dealer_list',
  'import_landed_cost',
  'manual_entry',
]);

/** How much of the requested estimate we could actually price. */
export const estimateCoverage = pgEnum('estimate_coverage', ['full', 'partial', 'none']);

export const estimateStatus = pgEnum('estimate_status', ['draft', 'complete', 'abandoned']);

/**
 * Which "coming soon" or capture surface an email came from. The three shelf
 * values are the pages at `/soon/[shelf]`; `tokunbo_shelf` is the one that
 * decides which used stock we buy first.
 */
export const waitlistSource = pgEnum('waitlist_source', [
  'landing',
  'facelift_hub',
  'accessories_store',
  'tokunbo_shelf',
  'coverage_gap',
  'vehicle_not_found',
]);

export const vinLookupStatus = pgEnum('vin_lookup_status', [
  'success',
  'not_found',
  'invalid_vin',
  'upstream_error',
]);

/* ------------------------------------------------------------- commerce -- */

/**
 * How confident we are that a part fits a given vehicle. This is the
 * marketplace's central honesty problem: about half of all auto-parts returns
 * are fitment errors, and against 3–6 week sea freight a return costs more than
 * the part. So `probable` is a designed, displayed state — "this should fit, we
 * have not confirmed it on your chassis" — never rounded up to `confirmed`.
 *
 * The absence of a fitment row is the fourth case, `unknown`, and is not stored.
 */
export const fitmentConfidence = pgEnum('fitment_confidence', ['confirmed', 'probable', 'unknown']);

/** Suppliers are admin rows, not users — there is no seller portal. */
export const supplierStatus = pgEnum('supplier_status', ['active', 'paused', 'archived']);

/**
 * Held stock ships from Lagos in days; pre-order is sourced against a supplier
 * and lands in weeks. Both are first-class — the UI states which one it is and
 * gives a lead-time RANGE rather than a delivery date.
 */
export const stockModel = pgEnum('stock_model', ['held_stock', 'pre_order']);

export const listingStatus = pgEnum('listing_status', [
  'draft',
  'active',
  'out_of_stock',
  'archived',
]);

export const cartStatus = pgEnum('cart_status', ['active', 'ordered', 'abandoned']);

/** Door delivery and pickup coexist; neither is the default. */
export const fulfilmentMethod = pgEnum('fulfilment_method', ['delivery', 'pickup']);

/**
 * The order lifecycle, including `customs` — which stalls unpredictably and for
 * weeks. It is a named state rather than a silence so that a stalled order can
 * look stalled instead of looking broken.
 */
export const orderStatus = pgEnum('order_status', [
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

/**
 * The customer-facing timeline vocabulary. `customs_delayed` exists because the
 * alternative — an order that simply stops moving — reads as abandonment to
 * someone who has already prepaid a stranger for a part from China.
 */
export const orderEventType = pgEnum('order_event_type', [
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

export const paymentProvider = pgEnum('payment_provider', ['paystack']);

export const paymentStatus = pgEnum('payment_status', [
  'initialized',
  'pending',
  'success',
  'failed',
  'abandoned',
  'reversed',
]);

/** Paystack's channels. `unknown` covers a verify response we cannot map. */
export const paymentChannel = pgEnum('payment_channel', [
  'card',
  'bank_transfer',
  'ussd',
  'bank',
  'qr',
  'mobile_money',
  'unknown',
]);
