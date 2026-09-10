import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import {
  estimateCoverage,
  estimateStatus,
  identificationMethod,
  partCondition,
  partPosition,
} from './enums.js';
import { damageZones } from './zones.js';
import { parts } from './parts.js';
import { partPrices } from './pricing.js';
import { vehicleVariants } from './vehicles.js';

/**
 * ESTIMATES ARE SNAPSHOTS.
 *
 * Part names, numbers and prices are copied onto the estimate at the moment it
 * is produced. A user may show this to a mechanic weeks later, or read a part
 * number off it aloud — it must still say exactly what they were shown, even if
 * the catalogue has since been re-priced or the part renamed. Foreign keys are
 * kept alongside the copies for analytics, and are all nullable-on-delete.
 */
export const estimates = pgTable(
  'estimates',
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Short human-readable code the user can quote back to us, e.g. "MIMS-7QX4K2". */
    reference: text().notNull(),
    identificationMethod: identificationMethod().notNull(),
    vin: text(),
    variantId: uuid().references(() => vehicleVariants.id, { onDelete: 'set null' }),

    // --- vehicle snapshot ---
    vehicleYear: integer(),
    vehicleMakeText: text().notNull(),
    vehicleModelText: text().notNull(),
    vehicleTrimText: text(),
    vehicleEngineText: text(),

    status: estimateStatus().notNull().default('draft'),
    coverage: estimateCoverage().notNull().default('none'),

    /** Sum of the priced items only. NULL when nothing could be priced. */
    subtotalMin: numeric({ precision: 14, scale: 2 }),
    subtotalMax: numeric({ precision: 14, scale: 2 }),
    currency: text().notNull().default('NGN'),
    /** Count of requested parts we had no price for — drives the partial-coverage copy. */
    unpricedItemCount: integer().notNull().default(0),

    contactEmail: text(),
    /** Set only once accounts exist; anonymous estimates are the norm in phase one. */
    userId: text(),

    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('estimates_reference_key').on(t.reference),
    index('estimates_created_idx').on(t.createdAt.desc()),
    index('estimates_variant_idx').on(t.variantId),
  ],
);

export const estimateZones = pgTable(
  'estimate_zones',
  {
    estimateId: uuid()
      .notNull()
      .references(() => estimates.id, { onDelete: 'cascade' }),
    zoneId: uuid().references(() => damageZones.id, { onDelete: 'set null' }),
    /** Snapshot, so a renamed or deleted zone does not rewrite history. */
    zoneCode: text().notNull(),
    zoneName: text().notNull(),
  },
  (t) => [primaryKey({ columns: [t.estimateId, t.zoneCode] })],
);

export const estimateItems = pgTable(
  'estimate_items',
  {
    id: uuid().primaryKey().defaultRandom(),
    estimateId: uuid()
      .notNull()
      .references(() => estimates.id, { onDelete: 'cascade' }),
    partId: uuid().references(() => parts.id, { onDelete: 'set null' }),
    priceId: uuid().references(() => partPrices.id, { onDelete: 'set null' }),
    zoneCode: text().notNull(),

    // --- part snapshot ---
    partName: text().notNull(),
    mpn: text(),
    oemNumber: text(),
    position: partPosition().notNull().default('not_applicable'),
    quantity: integer().notNull().default(1),

    // --- price snapshot; all NULL when isPriced is false ---
    /** False means "you need this part and we don't have a price yet" — shown explicitly. */
    isPriced: boolean().notNull().default(false),
    condition: partCondition(),
    priceMin: numeric({ precision: 14, scale: 2 }),
    priceMax: numeric({ precision: 14, scale: 2 }),
    priceRecordedAt: timestamp({ withTimezone: true }),

    sortOrder: integer().notNull().default(0),
  },
  (t) => [index('estimate_items_estimate_idx').on(t.estimateId)],
);

/** Optional, never required. Uploaded to object storage; only the key lives here. */
export const estimatePhotos = pgTable(
  'estimate_photos',
  {
    id: uuid().primaryKey().defaultRandom(),
    estimateId: uuid()
      .notNull()
      .references(() => estimates.id, { onDelete: 'cascade' }),
    storageKey: text().notNull(),
    mimeType: text().notNull(),
    sizeBytes: integer().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('estimate_photos_estimate_idx').on(t.estimateId)],
);

export const estimatesRelations = relations(estimates, ({ one, many }) => ({
  variant: one(vehicleVariants, {
    fields: [estimates.variantId],
    references: [vehicleVariants.id],
  }),
  zones: many(estimateZones),
  items: many(estimateItems),
  photos: many(estimatePhotos),
}));

export const estimateItemsRelations = relations(estimateItems, ({ one }) => ({
  estimate: one(estimates, { fields: [estimateItems.estimateId], references: [estimates.id] }),
  part: one(parts, { fields: [estimateItems.partId], references: [parts.id] }),
}));

export const estimateZonesRelations = relations(estimateZones, ({ one }) => ({
  estimate: one(estimates, { fields: [estimateZones.estimateId], references: [estimates.id] }),
}));

export const estimatePhotosRelations = relations(estimatePhotos, ({ one }) => ({
  estimate: one(estimates, { fields: [estimatePhotos.estimateId], references: [estimates.id] }),
}));
