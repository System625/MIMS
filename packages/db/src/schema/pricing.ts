import { relations } from 'drizzle-orm';
import { index, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { partCondition, priceSource } from './enums.js';
import { parts } from './parts.js';

/**
 * PRICING IS APPEND-ONLY HISTORY, NOT A COLUMN ON `parts`.
 *
 * Every row is an observation: this part, in this condition, cost this much, on
 * this date, from this source. Nothing is ever updated in place — a new price is
 * a new row. That gives us "last updated" for free and lets the results screen
 * show a sourced figure rather than a number of unknown age.
 *
 * Stored as a MIN/MAX range because the results screen shows ranges. A single
 * known figure is stored with min == max.
 *
 * `numeric(14,2)` rather than a float: Drizzle returns it as a string, which
 * forces callers to convert deliberately and makes accidental float arithmetic
 * on money impossible.
 */
export const partPrices = pgTable(
  'part_prices',
  {
    id: uuid().primaryKey().defaultRandom(),
    partId: uuid()
      .notNull()
      .references(() => parts.id, { onDelete: 'cascade' }),
    condition: partCondition().notNull(),
    amountMin: numeric({ precision: 14, scale: 2 }).notNull(),
    amountMax: numeric({ precision: 14, scale: 2 }).notNull(),
    currency: text().notNull().default('NGN'),
    source: priceSource().notNull(),
    /** Who or where, in plain words. Shown as provenance, so keep it presentable. */
    sourceNote: text(),
    /**
     * The USD/NGN rate at the time of observation. Imported parts reprice with
     * the rate, so a Naira figure without its rate cannot be aged honestly.
     */
    fxRateUsdNgn: numeric({ precision: 12, scale: 4 }),
    /** When the observation was true, which may predate when we recorded it. */
    effectiveFrom: timestamp({ withTimezone: true }).notNull().defaultNow(),
    recordedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    recordedBy: text(),
  },
  (t) => [
    index('part_prices_lookup_idx').on(t.partId, t.condition, t.effectiveFrom.desc()),
    index('part_prices_part_idx').on(t.partId),
  ],
);

export const partPricesRelations = relations(partPrices, ({ one }) => ({
  part: one(parts, { fields: [partPrices.partId], references: [parts.id] }),
}));
