import type { PickupPoint } from '@mims/contracts';

/**
 * COLLECTION POINTS — mirrored from `packages/db/src/seed.ts`, exactly as
 * `mock/listings.ts` mirrors the supplier profiles. The two placeholder worlds
 * agree, and neither invents a place.
 *
 * THE ADDRESSES ARE DELIBERATELY NOT PLAUSIBLE, and that is copied from the
 * seed's own note: an invented street that resolves to a real place is worse
 * than an obvious placeholder. Somebody would drive there.
 *
 * Pickup is a peer of delivery rather than the cheap option. Nigerian buyers
 * prefer cash on delivery because of how often they are cheated, and COD cannot
 * survive a four-week import lead time — so we are prepaid, and collecting a
 * part from a counter that exists, from a person, is the nearest thing to a
 * safety net this business can offer. It is listed first for that reason and
 * for no other.
 */
export const PICKUP_POINTS: readonly PickupPoint[] = [
  {
    id: 'pickup-placeholder-lag-01',
    code: 'PLACEHOLDER-LAG-01',
    name: 'Placeholder counter, Lagos',
    partnerName: null,
    line1: 'PLACEHOLDER — no real address',
    landmark: null,
    area: null,
    city: 'Lagos',
    state: 'Lagos',
    phone: null,
    openingHours: 'Mon–Sat 9am–6pm',
    notes: 'Placeholder seed pickup point.',
  },
  {
    id: 'pickup-placeholder-abj-01',
    code: 'PLACEHOLDER-ABJ-01',
    name: 'Placeholder counter, Abuja',
    partnerName: null,
    line1: 'PLACEHOLDER — no real address',
    landmark: null,
    area: null,
    city: 'Abuja',
    state: 'FCT — Abuja',
    phone: null,
    openingHours: 'Mon–Fri 9am–5pm',
    notes: 'Placeholder seed pickup point.',
  },
];

/**
 * WHY THERE IS NO DELIVERY FEE ANYWHERE IN THIS CODEBASE.
 *
 * `bella.md` §3 records the logistics partner as **not chosen** — GIG, Kwik,
 * Sendbox and Jumia Delivery are the field and none of them is picked. A
 * delivery fee is therefore not derivable from anything in this repository, and
 * §10 forbids inventing one: a number a customer would plan around must come out
 * of a real rate card or not appear.
 *
 * So the checkout quotes delivery as a figure a person confirms before payment,
 * and says so. Pickup, which costs nothing, totals exactly today. That asymmetry
 * is real and the screen shows it rather than hiding it behind a plausible
 * ₦3,500 that would become the first thing we were caught being wrong about.
 */
export const DELIVERY_FEE_IS_QUOTED_BY_HAND = true;
