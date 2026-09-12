import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import {
  fitmentConfidence,
  fulfilmentMethod,
  orderEventType,
  orderStatus,
  partCondition,
  partPosition,
  stockModel,
} from './enums.js';
import { addresses, pickupPoints } from './fulfilment.js';
import { carts } from './carts.js';
import { estimates } from './estimates.js';
import { listings } from './listings.js';
import { parts } from './parts.js';
import { suppliers } from './suppliers.js';
import { vehicleVariants } from './vehicles.js';

/**
 * ORDERS ARE SNAPSHOTS, like estimates and for a harder reason.
 *
 * An estimate that has gone stale is an inconvenience. An order is a contract:
 * under the FCCPA 2018 a buyer is entitled to replacement or refund for goods
 * that are defective, counterfeit or *misdescribed*, regardless of any policy we
 * publish — so "what was this customer actually told" is a question we will be
 * asked, six weeks later, by someone who is owed a straight answer. Every part
 * name, number, price, lead time, address and fitment claim is copied onto the
 * record at the moment of ordering. Foreign keys sit alongside the copies for
 * analytics and all fall to NULL rather than taking the order with them.
 */
export const orders = pgTable(
  'orders',
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Quoted over the phone and on WhatsApp, so short and unambiguous. */
    reference: text().notNull(),
    status: orderStatus().notNull().default('awaiting_payment'),

    userId: text(),
    cartId: uuid().references(() => carts.id, { onDelete: 'set null' }),
    /** The estimator is the acquisition channel; this is how we measure that. */
    estimateId: uuid().references(() => estimates.id, { onDelete: 'set null' }),

    // --- who, by phone first ---
    customerName: text().notNull(),
    /** Identity in this flow. Checkout is guest-first and asks for this, not a password. */
    customerPhone: text().notNull(),
    customerAltPhone: text(),
    /**
     * Nullable because phone is the identity — but Paystack requires an email on
     * `transaction/initialize`, so checkout must either collect one or the
     * payment service must supply a routable fallback. Do not let that decision
     * hide here: whatever we send to Paystack is what a receipt goes to.
     */
    customerEmail: text(),

    // --- how it gets there ---
    fulfilmentMethod: fulfilmentMethod().notNull(),

    deliveryAddressId: uuid().references(() => addresses.id, { onDelete: 'set null' }),
    deliveryRecipientName: text(),
    deliveryPhone: text(),
    deliveryLine1: text(),
    deliveryLine2: text(),
    deliveryLandmark: text(),
    deliveryArea: text(),
    deliveryCity: text(),
    deliveryState: text(),
    deliveryCountryCode: text().default('NG'),
    deliveryNotes: text(),

    pickupPointId: uuid().references(() => pickupPoints.id, { onDelete: 'set null' }),
    pickupPointCode: text(),
    pickupPointName: text(),
    pickupPointAddress: text(),

    // --- the car it was bought for ---
    variantId: uuid().references(() => vehicleVariants.id, { onDelete: 'set null' }),
    vehicleYear: integer(),
    vehicleMakeText: text(),
    vehicleModelText: text(),
    vehicleChassisCode: text(),

    // --- money, all decimal strings, all NGN in phase one ---
    itemsSubtotal: numeric({ precision: 14, scale: 2 }).notNull(),
    deliveryFee: numeric({ precision: 14, scale: 2 }).notNull().default('0.00'),
    total: numeric({ precision: 14, scale: 2 }).notNull(),
    currency: text().notNull().default('NGN'),
    /**
     * The USD/NGN rate at the moment of payment. We take the money upfront and
     * the goods land weeks later, so the FX risk in between is ours — and the
     * only way to account for it afterwards is to have written the rate down.
     */
    fxRateUsdNgn: numeric({ precision: 12, scale: 4 }),

    /**
     * What the customer was promised: a window, in days, from payment. Never a
     * date. Sea freight is 3–6 weeks and customs is the part nobody can promise.
     */
    leadTimeMinDays: integer(),
    leadTimeMaxDays: integer(),

    customerNote: text(),
    cancellationReason: text(),

    placedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp({ withTimezone: true }),
    cancelledAt: timestamp({ withTimezone: true }),
    deliveredAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('orders_reference_key').on(t.reference),
    /** Order history for a guest is looked up by the phone they gave. */
    index('orders_phone_idx').on(t.customerPhone),
    index('orders_user_idx').on(t.userId),
    index('orders_status_idx').on(t.status, t.createdAt.desc()),
    index('orders_created_idx').on(t.createdAt.desc()),
  ],
);

/**
 * Order lines. The supplier is recorded per line because a single order can be
 * part held stock and part pre-order from two sources, which is also why lead
 * time is per line and the order's own window is the widest of them.
 */
export const orderItems = pgTable(
  'order_items',
  {
    id: uuid().primaryKey().defaultRandom(),
    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    listingId: uuid().references(() => listings.id, { onDelete: 'set null' }),
    partId: uuid().references(() => parts.id, { onDelete: 'set null' }),
    supplierId: uuid().references(() => suppliers.id, { onDelete: 'set null' }),

    // --- snapshot ---
    sku: text(),
    partName: text().notNull(),
    mpn: text(),
    oemNumber: text(),
    position: partPosition().notNull().default('not_applicable'),
    condition: partCondition().notNull(),
    stockModel: stockModel().notNull(),
    /** Internal, for the pick list and supplier chasing. Not shown to the customer. */
    supplierName: text(),

    quantity: integer().notNull().default(1),
    unitPrice: numeric({ precision: 14, scale: 2 }).notNull(),
    lineTotal: numeric({ precision: 14, scale: 2 }).notNull(),
    currency: text().notNull().default('NGN'),

    leadTimeMinDays: integer(),
    leadTimeMaxDays: integer(),

    /** What we claimed about fitment at the point of sale. The returns question. */
    fitmentConfidence: fitmentConfidence().notNull().default('unknown'),
    fitmentNote: text(),

    sortOrder: integer().notNull().default(0),
  },
  (t) => [index('order_items_order_idx').on(t.orderId)],
);

/**
 * The order timeline, append-only.
 *
 * This table is the tracking screen. Customs clearance stalls for weeks with no
 * warning, and an order that simply stops emitting events looks to a prepaid
 * customer exactly like being robbed — so a stall is written down as an event
 * with a plain-words summary rather than left as a gap. `isCustomerVisible`
 * separates what we tell them from what we note internally; `summary` is the
 * sentence they read, so keep it in the product's voice and never machine-shaped.
 */
export const orderEvents = pgTable(
  'order_events',
  {
    id: uuid().primaryKey().defaultRandom(),
    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    type: orderEventType().notNull(),
    /** The customer-facing line, e.g. "Held at Apapa for inspection." */
    summary: text().notNull(),
    detail: text(),
    isCustomerVisible: boolean().notNull().default(true),
    /** Structured extras — a waybill number, a Paystack reference, an HS query. */
    metadata: jsonb().$type<Record<string, unknown>>(),
    recordedBy: text(),
    occurredAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('order_events_order_idx').on(t.orderId, t.occurredAt.desc())],
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  cart: one(carts, { fields: [orders.cartId], references: [carts.id] }),
  estimate: one(estimates, { fields: [orders.estimateId], references: [estimates.id] }),
  deliveryAddress: one(addresses, {
    fields: [orders.deliveryAddressId],
    references: [addresses.id],
  }),
  pickupPoint: one(pickupPoints, { fields: [orders.pickupPointId], references: [pickupPoints.id] }),
  variant: one(vehicleVariants, { fields: [orders.variantId], references: [vehicleVariants.id] }),
  items: many(orderItems),
  events: many(orderEvents),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  listing: one(listings, { fields: [orderItems.listingId], references: [listings.id] }),
  part: one(parts, { fields: [orderItems.partId], references: [parts.id] }),
  supplier: one(suppliers, { fields: [orderItems.supplierId], references: [suppliers.id] }),
}));

export const orderEventsRelations = relations(orderEvents, ({ one }) => ({
  order: one(orders, { fields: [orderEvents.orderId], references: [orders.id] }),
}));
