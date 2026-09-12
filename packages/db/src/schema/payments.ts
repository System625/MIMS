import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { paymentChannel, paymentProvider, paymentStatus } from './enums.js';
import { orders } from './orders.js';

/**
 * PAYMENTS — and the rules that come with Paystack.
 *
 * `amount` is Naira as a decimal string, like every other money column in this
 * schema. Paystack works in KOBO, and that conversion happens in exactly one
 * place: the Paystack adapter, at the edge. Nothing in the database, the
 * contracts or the UI is ever denominated in kobo.
 *
 * Value is granted on a verified transaction and never on a redirect. A customer
 * can arrive at our callback URL with a reference they made up, so the callback
 * proves nothing — the order moves to `paid` when a server-side
 * `GET /transaction/verify/:reference` (or a signature-checked webhook) reports
 * `data.status === 'success'` for the right amount and currency. The envelope's
 * own `status` only means the API call worked.
 *
 * One row per attempt. A customer who abandons a card and pays by transfer has
 * two payments against one order, and both are worth keeping.
 */
export const payments = pgTable(
  'payments',
  {
    id: uuid().primaryKey().defaultRandom(),
    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    provider: paymentProvider().notNull().default('paystack'),
    status: paymentStatus().notNull().default('initialized'),

    /** OUR reference, generated before initialize and unique across all attempts. */
    reference: text().notNull(),
    /** Paystack's own identifiers, kept for reconciliation against settlements. */
    providerReference: text(),
    providerTransactionId: text(),

    amount: numeric({ precision: 14, scale: 2 }).notNull(),
    currency: text().notNull().default('NGN'),
    channel: paymentChannel(),
    /** Human detail for the receipt: "Visa ending 4242", "GTBank transfer". */
    channelDetail: text(),

    /** Returned by initialize. Short-lived; not a permalink. */
    authorizationUrl: text(),
    accessCode: text(),

    /** Paystack's fee (1.5% + ₦100, capped at ₦2,000) and what actually settles, T+1. */
    feeAmount: numeric({ precision: 14, scale: 2 }),
    settledAmount: numeric({ precision: 14, scale: 2 }),

    /** Plain words from the gateway. Shown to the customer when we can. */
    failureReason: text(),

    paidAt: timestamp({ withTimezone: true }),
    /** When WE confirmed it server-side. Until this is set, nothing is owed. */
    verifiedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('payments_reference_key').on(t.reference),
    index('payments_order_idx').on(t.orderId),
    index('payments_provider_reference_idx').on(t.providerReference),
    index('payments_status_idx').on(t.status),
  ],
);

/**
 * Every webhook and verify response we act on, stored raw.
 *
 * `charge.success` arrives signed as HMAC-SHA512 of the RAW request body in
 * `x-paystack-signature` — hashed over the bytes as received, not over
 * re-serialised JSON, or it will never match. `signatureVerified` records
 * whether that check passed, because an unsigned or mis-signed event must be
 * kept and investigated rather than silently dropped.
 *
 * Handlers must be idempotent: Paystack retries, and a duplicate `charge.success`
 * must not grant value twice. The real guard is the payment's own status —
 * checked before fulfilment — and this table is the audit trail behind it.
 */
export const paymentEvents = pgTable(
  'payment_events',
  {
    id: uuid().primaryKey().defaultRandom(),
    paymentId: uuid()
      .notNull()
      .references(() => payments.id, { onDelete: 'cascade' }),
    provider: paymentProvider().notNull().default('paystack'),
    /** `charge.success`, `transfer.failed`, or `verify` for a polled check. */
    eventType: text().notNull(),
    providerEventId: text(),
    signatureVerified: boolean().notNull().default(false),
    payload: jsonb().$type<Record<string, unknown>>().notNull(),
    receivedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('payment_events_payment_idx').on(t.paymentId, t.receivedAt.desc()),
    index('payment_events_provider_event_idx').on(t.providerEventId),
  ],
);

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
  events: many(paymentEvents),
}));

export const paymentEventsRelations = relations(paymentEvents, ({ one }) => ({
  payment: one(payments, { fields: [paymentEvents.paymentId], references: [payments.id] }),
}));
