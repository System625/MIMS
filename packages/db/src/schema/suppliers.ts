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
import { supplierStatus } from './enums.js';

/**
 * SUPPLIERS ARE ROWS, NOT USERS.
 *
 * MIMS is the merchant of record on a consignment model — a supplier agrees a
 * wholesale price, MIMS sets retail and owns pricing, support and returns. There
 * is therefore no seller portal, no onboarding flow, no per-supplier payout and
 * no Paystack subaccount or transaction split. A supplier is a record an admin
 * keys in, and the customer never sees one.
 *
 * If you find yourself adding an auth relation to this table, the model has
 * drifted into a semi-managed marketplace, which is not what was decided.
 */
export const suppliers = pgTable(
  'suppliers',
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    slug: text().notNull(),
    status: supplierStatus().notNull().default('active'),

    contactName: text(),
    phone: text(),
    email: text(),
    /** ISO country of dispatch. Drives which lead-time band is plausible. */
    countryCode: text().notNull().default('NG'),
    city: text(),

    /**
     * House default lead time, in days, used when a listing does not state its
     * own. A RANGE, because "three to five weeks" is true and "arrives on the
     * 14th" is not — sea freight and customs both slip.
     */
    defaultLeadTimeMinDays: integer(),
    defaultLeadTimeMaxDays: integer(),

    /**
     * Agreed commission the supplier concedes off retail, where the arrangement
     * is expressed that way rather than as a wholesale price per part. Kept for
     * the admin margin view; never shown to a customer.
     */
    commissionRate: numeric({ precision: 5, scale: 4 }),

    notes: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('suppliers_slug_key').on(t.slug), index('suppliers_status_idx').on(t.status)],
);

export const suppliersRelations = relations(suppliers, () => ({}));
