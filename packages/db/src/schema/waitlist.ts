import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { waitlistSource } from './enums.js';
import { estimates } from './estimates.js';

/**
 * Email captures. `source` distinguishes which surface the address came from —
 * the two "coming soon" sections, the landing footer, and the coverage-gap
 * capture shown when we have no data for someone's vehicle.
 *
 * The coverage-gap case carries the vehicle they were looking for in `metadata`,
 * which is the demand signal that tells us which catalogue to build next.
 */
export const waitlistEntries = pgTable(
  'waitlist_entries',
  {
    id: uuid().primaryKey().defaultRandom(),
    email: text().notNull(),
    source: waitlistSource().notNull(),
    /** Free-text vehicle description when the structured lookup found nothing. */
    vehicleNote: text(),
    metadata: jsonb().$type<Record<string, unknown>>(),
    estimateId: uuid().references(() => estimates.id, { onDelete: 'set null' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('waitlist_entries_email_source_key').on(t.email, t.source),
    index('waitlist_entries_created_idx').on(t.createdAt.desc()),
  ],
);
