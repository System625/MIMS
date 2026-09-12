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

/**
 * THE NIGERIAN ADDRESS SHAPE.
 *
 * Street, area (the LGA or the name locals actually use), city, state — and a
 * LANDMARK, which is not decoration. A dispatch rider in Lagos finds an address
 * by landmark and a phone call, in that order. There is a national postcode
 * system and effectively nobody uses it, so there is no postcode field: asking
 * for a number the customer does not know, to put on a label no rider reads,
 * costs a conversion and buys nothing.
 *
 * Phone is the identity in this flow, not email. Checkout is guest-first, so a
 * saved address hangs off a phone number until accounts exist, and `userId` is
 * filled in later for the same rows.
 */
export const addresses = pgTable(
  'addresses',
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Set once accounts exist; anonymous is the norm in phase one. */
    userId: text(),
    /** The customer's own label — "Home", "Workshop", "Mum's place". */
    label: text(),

    recipientName: text().notNull(),
    /** Nigerian mobile, stored as given and normalised in the service layer. */
    phone: text().notNull(),
    /** A second number, because the first one is often off or out of credit. */
    altPhone: text(),

    line1: text().notNull(),
    line2: text(),
    /** "Opposite the second gate, after the mosque." The field riders use. */
    landmark: text(),
    /** LGA or the local area name. */
    area: text(),
    city: text().notNull(),
    state: text().notNull(),
    countryCode: text().notNull().default('NG'),

    deliveryNotes: text(),
    isDefault: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('addresses_phone_idx').on(t.phone), index('addresses_user_idx').on(t.userId)],
);

/**
 * Collection points.
 *
 * Pickup matters more than it looks. Nigerian buyers prefer cash on delivery out
 * of scam fear, and COD cannot survive a four-week import lead time — so we are
 * prepaid, and the entire trust burden lands on the interface. Collecting a part
 * from a real counter, from a person, in a place that exists, is the closest
 * thing to a safety net we can offer, which is why pickup is a peer of delivery
 * here and not a cheaper afterthought.
 */
export const pickupPoints = pgTable(
  'pickup_points',
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Stable code, snapshotted onto orders — never rename in place. */
    code: text().notNull(),
    name: text().notNull(),
    /** Whose counter it is: ours, or a logistics partner's station. */
    partnerName: text(),

    line1: text().notNull(),
    landmark: text(),
    area: text(),
    city: text().notNull(),
    state: text().notNull(),
    phone: text(),
    /** Free text, because "Mon–Sat 9am–6pm, closed public holidays" is the truth. */
    openingHours: text(),

    latitude: numeric({ precision: 9, scale: 6 }),
    longitude: numeric({ precision: 9, scale: 6 }),

    isActive: boolean().notNull().default(true),
    displayOrder: integer().notNull().default(0),
    notes: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('pickup_points_code_key').on(t.code),
    index('pickup_points_state_idx').on(t.state, t.isActive),
  ],
);

export const addressesRelations = relations(addresses, () => ({}));
export const pickupPointsRelations = relations(pickupPoints, () => ({}));
