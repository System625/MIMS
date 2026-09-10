import { relations } from 'drizzle-orm';
import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { crossReferenceType, partPosition } from './enums.js';
import { damageZones } from './zones.js';
import { vehicleVariants } from './vehicles.js';

export const manufacturers = pgTable(
  'manufacturers',
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    slug: text().notNull(),
    /** True for the vehicle maker's own brand (Toyota Genuine), false for TYC, Depo, etc. */
    isOem: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('manufacturers_slug_key').on(t.slug)],
);

/** Taxonomy for browsing and admin filtering. Zone membership is NOT derived from this. */
export const partCategories = pgTable(
  'part_categories',
  {
    id: uuid().primaryKey().defaultRandom(),
    code: text().notNull(),
    name: text().notNull(),
    parentId: uuid().references((): AnyPgColumn => partCategories.id, { onDelete: 'set null' }),
    displayOrder: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('part_categories_code_key').on(t.code)],
);

export const parts = pgTable(
  'parts',
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    slug: text().notNull(),
    categoryId: uuid().references(() => partCategories.id, { onDelete: 'set null' }),
    manufacturerId: uuid().references(() => manufacturers.id, { onDelete: 'set null' }),
    /** Manufacturer part number — the string a user may read aloud to a dealer. */
    mpn: text(),
    /** OEM number, where this part is an aftermarket equivalent. */
    oemNumber: text(),
    position: partPosition().notNull().default('not_applicable'),
    description: text(),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('parts_slug_key').on(t.slug),
    index('parts_mpn_idx').on(t.mpn),
    index('parts_oem_number_idx').on(t.oemNumber),
    index('parts_category_idx').on(t.categoryId),
  ],
);

/** Alternate numbers that resolve to the same physical part. Searchable in admin. */
export const partCrossReferences = pgTable(
  'part_cross_references',
  {
    id: uuid().primaryKey().defaultRandom(),
    partId: uuid()
      .notNull()
      .references(() => parts.id, { onDelete: 'cascade' }),
    referenceType: crossReferenceType().notNull(),
    number: text().notNull(),
    manufacturerId: uuid().references(() => manufacturers.id, { onDelete: 'set null' }),
    notes: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('part_cross_references_number_idx').on(t.number),
    uniqueIndex('part_cross_references_unique').on(t.partId, t.referenceType, t.number),
  ],
);

/**
 * Zone membership, stated directly on the part (as the brief specifies) rather
 * than inherited from its category — a radiator support belongs to the radiator
 * zone for one vehicle and the front bumper zone for another, and category
 * inheritance cannot express that.
 */
export const partZones = pgTable(
  'part_zones',
  {
    partId: uuid()
      .notNull()
      .references(() => parts.id, { onDelete: 'cascade' }),
    zoneId: uuid()
      .notNull()
      .references(() => damageZones.id, { onDelete: 'cascade' }),
    /** Typical quantity needed when this zone is damaged (headlights: 1 per side). */
    quantity: integer().notNull().default(1),
  },
  (t) => [primaryKey({ columns: [t.partId, t.zoneId] }), index('part_zones_zone_idx').on(t.zoneId)],
);

/**
 * THE FITMENT JOIN. One part fits many variants; one variant takes many parts.
 *
 * `yearStart`/`yearEnd` are NULL for the common case, meaning "the whole of the
 * variant's year range". They exist for mid-generation changes — a facelift that
 * altered the bumper in 2015 within a 2012-2017 variant.
 */
export const partFitments = pgTable(
  'part_fitments',
  {
    id: uuid().primaryKey().defaultRandom(),
    partId: uuid()
      .notNull()
      .references(() => parts.id, { onDelete: 'cascade' }),
    variantId: uuid()
      .notNull()
      .references(() => vehicleVariants.id, { onDelete: 'cascade' }),
    yearStart: integer(),
    yearEnd: integer(),
    /** Free-text narrowing, e.g. "with fog lamp holes", "halogen only". */
    qualifier: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('part_fitments_unique').on(t.partId, t.variantId, t.yearStart, t.yearEnd),
    index('part_fitments_variant_idx').on(t.variantId),
    index('part_fitments_part_idx').on(t.partId),
  ],
);

export const partsRelations = relations(parts, ({ one, many }) => ({
  category: one(partCategories, { fields: [parts.categoryId], references: [partCategories.id] }),
  manufacturer: one(manufacturers, {
    fields: [parts.manufacturerId],
    references: [manufacturers.id],
  }),
  crossReferences: many(partCrossReferences),
  zones: many(partZones),
  fitments: many(partFitments),
}));

export const partZonesRelations = relations(partZones, ({ one }) => ({
  part: one(parts, { fields: [partZones.partId], references: [parts.id] }),
  zone: one(damageZones, { fields: [partZones.zoneId], references: [damageZones.id] }),
}));

export const partFitmentsRelations = relations(partFitments, ({ one }) => ({
  part: one(parts, { fields: [partFitments.partId], references: [parts.id] }),
  variant: one(vehicleVariants, {
    fields: [partFitments.variantId],
    references: [vehicleVariants.id],
  }),
}));

export const partCrossReferencesRelations = relations(partCrossReferences, ({ one }) => ({
  part: one(parts, { fields: [partCrossReferences.partId], references: [parts.id] }),
}));
