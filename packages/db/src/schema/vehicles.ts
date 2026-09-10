import { relations } from 'drizzle-orm';
import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

/**
 * FITMENT MODEL
 * -------------
 * Three levels, narrowing:
 *
 *   makes            Toyota
 *   vehicle_models   Camry
 *   vehicle_variants XV50 2012-2017, LE, 2.5L I4
 *
 * A *variant* is the unit fitment targets. It carries a year RANGE rather than a
 * single year, because parts catalogues publish fitment by generation, and
 * exploding one row per model-year would multiply the table for no gain.
 *
 * `trim` and `engine` are nullable on purpose: NULL means "covers all trims /
 * all engines of this generation". Most users identifying manually will not know
 * their trim, and vPIC frequently returns it blank on imports, so the common
 * path must resolve to a variant with those fields empty rather than dead-end.
 *
 * The many-to-many lives in `part_fitments` (see parts.ts): one part fits many
 * variants, one variant takes many parts, with optional year narrowing inside
 * the variant's own range.
 */

export const makes = pgTable(
  'makes',
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    slug: text().notNull(),
    /** Country of origin, useful for sorting import-common makes to the top. */
    countryCode: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('makes_slug_key').on(t.slug)],
);

export const vehicleModels = pgTable(
  'vehicle_models',
  {
    id: uuid().primaryKey().defaultRandom(),
    makeId: uuid()
      .notNull()
      .references(() => makes.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    slug: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('vehicle_models_make_slug_key').on(t.makeId, t.slug),
    index('vehicle_models_make_idx').on(t.makeId),
  ],
);

export const vehicleVariants = pgTable(
  'vehicle_variants',
  {
    id: uuid().primaryKey().defaultRandom(),
    modelId: uuid()
      .notNull()
      .references(() => vehicleModels.id, { onDelete: 'cascade' }),
    /** Human label for the generation, e.g. "XV50" or "Mk7". Shown on confirmation. */
    label: text(),
    yearStart: integer().notNull(),
    /** NULL means still in production — treat as "up to the current year". */
    yearEnd: integer(),
    /** NULL means this variant covers every trim of the generation. */
    trim: text(),
    /** Display engine, e.g. "2.5L I4". NULL means every engine of the generation. */
    engine: text(),
    /** Manufacturer engine code where known, e.g. "2AR-FE". */
    engineCode: text(),
    bodyStyle: text(),
    notes: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('vehicle_variants_model_idx').on(t.modelId),
    index('vehicle_variants_year_idx').on(t.yearStart, t.yearEnd),
  ],
);

export const makesRelations = relations(makes, ({ many }) => ({
  models: many(vehicleModels),
}));

export const vehicleModelsRelations = relations(vehicleModels, ({ one, many }) => ({
  make: one(makes, { fields: [vehicleModels.makeId], references: [makes.id] }),
  variants: many(vehicleVariants),
}));

export const vehicleVariantsRelations = relations(vehicleVariants, ({ one }) => ({
  model: one(vehicleModels, {
    fields: [vehicleVariants.modelId],
    references: [vehicleModels.id],
  }),
}));
