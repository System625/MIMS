import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { listingStatus, partCondition, stockModel } from './enums.js';
import { parts } from './parts.js';
import { suppliers } from './suppliers.js';

/**
 * A LISTING IS THE SELLABLE UNIT; A PART IS THE CATALOGUE UNIT.
 *
 * One part becomes several listings, because condition is a first-class axis in
 * this market: a genuine Toyota headlight and a tokunbo one are not a discount
 * on each other, they are different goods at different prices with different
 * buyers. Same part, same fitment, two listings.
 *
 * Fitment deliberately does NOT live here. It is a property of the physical
 * part — see `part_fitments` in parts.ts, which carries the confidence grade the
 * product screen renders as evidence.
 *
 * PRICE IS ONE ALL-IN NAIRA FIGURE. Duty, port charges and VAT are already
 * inside `retailPrice`; only delivery is added later, and it is shown before
 * payment. Nothing may appear for the first time at the last step — a customs
 * surprise on arrival would destroy exactly the trust the estimator earns.
 */
export const listings = pgTable(
  'listings',
  {
    id: uuid().primaryKey().defaultRandom(),
    partId: uuid()
      .notNull()
      .references(() => parts.id, { onDelete: 'cascade' }),
    /** Suppliers are archived, never deleted — sales history depends on them. */
    supplierId: uuid()
      .notNull()
      .references(() => suppliers.id, { onDelete: 'restrict' }),

    /** Internal stock code, printed on the pick list. Unique across the store. */
    sku: text().notNull(),
    /**
     * Overrides the part name on the storefront where the listing needs to say
     * more than the catalogue does — "Front bumper cover, tokunbo, Japan-pulled".
     * NULL means "use the part name", which is the common case.
     */
    title: text(),
    description: text(),

    condition: partCondition().notNull(),
    stockModel: stockModel().notNull(),
    status: listingStatus().notNull().default('draft'),

    /** The one figure the customer sees. Duty-inclusive. NGN only in phase one. */
    retailPrice: numeric({ precision: 14, scale: 2 }).notNull(),
    currency: text().notNull().default('NGN'),
    /**
     * When this price stops being honest. The Naira moved between ₦1,350 and
     * ₦1,430 to the dollar across 2026 with active pass-through to import
     * prices, and we take payment upfront, so we carry the FX risk between order
     * and landing. A price past its window must be re-quoted, not sold.
     */
    priceValidUntil: timestamp({ withTimezone: true }),

    /** Meaningful for `held_stock`. A `pre_order` listing sells at zero on hand. */
    quantityAvailable: integer().notNull().default(0),

    /**
     * Lead time as a RANGE, never a date. NULL falls back to the supplier's
     * default. Sea freight from China runs 3–6 weeks before customs, and customs
     * is the part we cannot promise.
     */
    leadTimeMinDays: integer(),
    leadTimeMaxDays: integer(),

    /**
     * The landed-cost basis behind `retailPrice`, recorded so the admin margin
     * view and a later re-pricing can both see what was assumed. The stack is
     * duty (5–35% by HS code) on CIF, +7% port surcharge on the duty, +1% CISS,
     * +0.5% ETLS, then 7.5% VAT on the assembled base, plus freight. The
     * customer never sees any of it.
     */
    hsCode: text(),
    unitCostUsd: numeric({ precision: 14, scale: 2 }),
    freightCostNgn: numeric({ precision: 14, scale: 2 }),
    dutyRate: numeric({ precision: 5, scale: 4 }),
    landedCostNgn: numeric({ precision: 14, scale: 2 }),
    /** The rate the landed cost was computed at. A Naira cost without it cannot be aged. */
    fxRateUsdNgn: numeric({ precision: 12, scale: 4 }),
    costRecordedAt: timestamp({ withTimezone: true }),

    /** Listing-level fitment caveat, e.g. "halogen headlamp cars only". */
    fitmentNote: text(),

    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('listings_sku_key').on(t.sku),
    index('listings_part_idx').on(t.partId),
    index('listings_supplier_idx').on(t.supplierId),
    /** The storefront query: active listings for a part, cheapest first. */
    index('listings_browse_idx').on(t.status, t.partId, t.retailPrice),
    index('listings_condition_idx').on(t.condition),
  ],
);

/** Object storage holds the image; only the key lives here, as with estimate photos. */
export const listingPhotos = pgTable(
  'listing_photos',
  {
    id: uuid().primaryKey().defaultRandom(),
    listingId: uuid()
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    storageKey: text().notNull(),
    mimeType: text().notNull(),
    sizeBytes: integer().notNull(),
    /** Written by a human. A part photo with no description is useless to a screen reader. */
    altText: text(),
    isPrimary: boolean().notNull().default(false),
    displayOrder: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('listing_photos_listing_idx').on(t.listingId, t.displayOrder)],
);

/**
 * Retail price history, append-only.
 *
 * `part_prices` records observations of what the market charges; this records
 * decisions about what WE charge, which is a different thing and belongs in its
 * own ledger. The current price stays a column on `listings` because a cart has
 * to read it on every line without a windowed query — but no change is ever
 * lost, and a customer disputing "it was cheaper yesterday" can be answered.
 */
export const listingPriceChanges = pgTable(
  'listing_price_changes',
  {
    id: uuid().primaryKey().defaultRandom(),
    listingId: uuid()
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    /** NULL on the first price. */
    previousPrice: numeric({ precision: 14, scale: 2 }),
    newPrice: numeric({ precision: 14, scale: 2 }).notNull(),
    currency: text().notNull().default('NGN'),
    fxRateUsdNgn: numeric({ precision: 12, scale: 4 }),
    /** Plain words: "FX pass-through", "supplier re-quote", "correction". */
    reason: text(),
    changedBy: text(),
    effectiveFrom: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('listing_price_changes_listing_idx').on(t.listingId, t.effectiveFrom.desc())],
);

export const listingsRelations = relations(listings, ({ one, many }) => ({
  part: one(parts, { fields: [listings.partId], references: [parts.id] }),
  supplier: one(suppliers, { fields: [listings.supplierId], references: [suppliers.id] }),
  photos: many(listingPhotos),
  priceChanges: many(listingPriceChanges),
}));

export const listingPhotosRelations = relations(listingPhotos, ({ one }) => ({
  listing: one(listings, { fields: [listingPhotos.listingId], references: [listings.id] }),
}));

export const listingPriceChangesRelations = relations(listingPriceChanges, ({ one }) => ({
  listing: one(listings, { fields: [listingPriceChanges.listingId], references: [listings.id] }),
}));
