import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { cartStatus, fitmentConfidence, partCondition, stockModel } from './enums.js';
import { estimates } from './estimates.js';
import { listings } from './listings.js';
import { vehicleVariants } from './vehicles.js';

/**
 * A CART CARRIES A VEHICLE.
 *
 * Everywhere else a basket is a list of things; here it is a list of things
 * *for a particular car*, and that is the whole product. Fitment has to be
 * settled before payment — roughly half of auto-parts returns are fitment
 * errors, and a wrong bumper that took five weeks to arrive cannot be fixed by a
 * returns policy — so the vehicle is a column on the cart, not a filter the user
 * happened to have applied when they clicked buy.
 *
 * The vehicle is also snapshotted in text. If the catalogue later re-labels a
 * variant, an old cart must still say what the customer was shown.
 */
export const carts = pgTable(
  'carts',
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Opaque cookie value. Guest carts are the norm; there is no sign-in wall. */
    token: text().notNull(),
    userId: text(),
    status: cartStatus().notNull().default('active'),

    // --- vehicle context ---
    variantId: uuid().references(() => vehicleVariants.id, { onDelete: 'set null' }),
    vehicleYear: integer(),
    vehicleMakeText: text(),
    vehicleModelText: text(),
    /** Parts match to the chassis, not the model name. Snapshotted for the same reason. */
    vehicleChassisCode: text(),

    /** Set when the cart was built from an estimate, which is the main funnel. */
    estimateId: uuid().references(() => estimates.id, { onDelete: 'set null' }),

    currency: text().notNull().default('NGN'),
    /** Abandonment sweep boundary; also the point a held-stock reservation lapses. */
    expiresAt: timestamp({ withTimezone: true }),
    orderedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('carts_token_key').on(t.token),
    index('carts_user_idx').on(t.userId),
    index('carts_status_idx').on(t.status, t.updatedAt.desc()),
  ],
);

/**
 * Cart lines snapshot what the customer was shown when they added them.
 *
 * The listing still holds the live price, and the difference between the two is
 * information the customer is owed: "this went up by ₦4,000 since you added it"
 * is a sentence we can only say because the old figure is here. Same for lead
 * time and for fitment confidence — the cart screen rechecks every line against
 * the cart's vehicle and says which ones changed.
 */
export const cartItems = pgTable(
  'cart_items',
  {
    id: uuid().primaryKey().defaultRandom(),
    cartId: uuid()
      .notNull()
      .references(() => carts.id, { onDelete: 'cascade' }),
    listingId: uuid().references(() => listings.id, { onDelete: 'set null' }),
    quantity: integer().notNull().default(1),

    // --- snapshot taken when the line was added ---
    partName: text().notNull(),
    mpn: text(),
    condition: partCondition().notNull(),
    stockModel: stockModel().notNull(),
    unitPrice: numeric({ precision: 14, scale: 2 }).notNull(),
    currency: text().notNull().default('NGN'),
    leadTimeMinDays: integer(),
    leadTimeMaxDays: integer(),
    /** How sure we were, against this cart's vehicle, at the moment of adding. */
    fitmentConfidence: fitmentConfidence().notNull().default('unknown'),
    fitmentNote: text(),

    addedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    /** One line per listing; adding the same listing again raises the quantity. */
    uniqueIndex('cart_items_cart_listing_key').on(t.cartId, t.listingId),
    index('cart_items_cart_idx').on(t.cartId),
  ],
);

export const cartsRelations = relations(carts, ({ one, many }) => ({
  variant: one(vehicleVariants, { fields: [carts.variantId], references: [vehicleVariants.id] }),
  estimate: one(estimates, { fields: [carts.estimateId], references: [estimates.id] }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  listing: one(listings, { fields: [cartItems.listingId], references: [listings.id] }),
}));
