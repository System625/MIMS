import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

/**
 * The seven zones the user taps on the damage selector. `isInternal` flags zones
 * with no exterior surface (radiator) so the UI can surface them separately from
 * the body diagram instead of inventing a tap target for them.
 */
export const damageZones = pgTable(
  'damage_zones',
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Stable machine code — snapshotted onto estimates, so never rename in place. */
    code: text().notNull(),
    name: text().notNull(),
    description: text(),
    isInternal: boolean().notNull().default(false),
    displayOrder: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('damage_zones_code_key').on(t.code)],
);

export const damageZonesRelations = relations(damageZones, () => ({}));
