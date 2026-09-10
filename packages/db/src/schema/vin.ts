import { index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { vinLookupStatus } from './enums.js';
import { vehicleVariants } from './vehicles.js';

/**
 * Cache and audit log for NHTSA vPIC decodes. Two jobs:
 *
 *  1. Cache — vPIC is free but slow and occasionally down, and a roadside user
 *     on bad data should not wait on it twice.
 *  2. Evidence — every failed decode is a row telling us which vehicles the
 *     manual path is carrying, which is exactly the coverage we need to add.
 *
 * `rawResponse` keeps the untouched upstream payload so a later change to our
 * normalisation can be re-run over history without re-fetching.
 */
export const vinLookups = pgTable(
  'vin_lookups',
  {
    id: uuid().primaryKey().defaultRandom(),
    vin: text().notNull(),
    /** World Manufacturer Identifier — first three VIN characters. */
    wmi: text(),
    status: vinLookupStatus().notNull(),
    rawResponse: jsonb().$type<Record<string, unknown>>(),

    // --- normalised to our vehicle shape; any of these may be absent ---
    decodedMake: text(),
    decodedModel: text(),
    decodedYear: integer(),
    decodedTrim: text(),
    decodedEngine: text(),

    /** Set when the decode resolved to something in our own catalogue. */
    matchedVariantId: uuid().references(() => vehicleVariants.id, { onDelete: 'set null' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('vin_lookups_vin_idx').on(t.vin),
    index('vin_lookups_created_idx').on(t.createdAt.desc()),
  ],
);
