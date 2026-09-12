/**
 * The storefront's own copy and taxonomy.
 *
 * The categories are the five in `packages/db/src/seed.ts` — real repo data, not
 * a wish list. What is deliberately absent is numbers: no "1,200 parts in
 * stock", no per-category counts, no "23 people viewing this". Those come out of
 * Postgres when the API is wired (build plan item 10) or they do not appear.
 * Inventing a catalogue size to make a front page feel busy is the same lie as
 * inventing a price, and this store's whole argument is that we do not do that.
 */

export interface StoreCategoryCard {
  /** Matches `part_categories.code`, so the browse link survives the API wiring. */
  code: string;
  name: string;
  /** What a shopper would call the things inside it. */
  blurb: string;
}

export const STORE_CATEGORIES: readonly StoreCategoryCard[] = [
  {
    code: 'bumper',
    name: 'Bumpers',
    blurb: 'Front and rear covers, reinforcements, brackets and clips.',
  },
  {
    code: 'lighting',
    name: 'Lighting',
    blurb: 'Headlight and tail-light assemblies, per side. Halogen and LED differ.',
  },
  {
    code: 'body_panel',
    name: 'Body panels',
    blurb: 'Hoods, fenders, doors and rear panels. Primed, not painted.',
  },
  {
    code: 'grille',
    name: 'Grilles',
    blurb: 'Upper and lower grilles, mouldings and the trim around them.',
  },
  {
    code: 'cooling',
    name: 'Cooling',
    blurb: 'Radiators, condensers, fans and the packs they sit in.',
  },
];

/**
 * The two shelves that are not built yet. Both already have a `waitlist_source`
 * enum value behind them, so the capture is real even though the shelf is not.
 */
export const COMING_SOON = [
  {
    source: 'facelift_hub' as const,
    title: 'Facelift kits',
    note: 'Whole front ends — older shape to newer, matched as a set so the panels actually line up.',
  },
  {
    source: 'accessories_store' as const,
    title: 'Accessories',
    note: 'Mats, covers, mirrors, badges. The things you buy because you want them, not because something broke.',
  },
] as const;

/** How buying works, in the order a customer experiences it. */
export const HOW_BUYING_WORKS = [
  {
    step: '01',
    title: 'Set your car',
    body: 'Once, at the top of the page. Every part number, price and fitment note after that is about your chassis — not your model name, which is not the same thing.',
  },
  {
    step: '02',
    title: 'We say how sure we are',
    body: 'Confirmed fit, probable fit, or no record. We will not round the middle one up to the first. Half of all parts returns are fitment mistakes, and a wrong panel that took five weeks to arrive cannot be fixed by a refund.',
  },
  {
    step: '03',
    title: 'One Naira price',
    body: 'Duty, clearing and VAT are already inside it. Delivery is added once, before you pay, and nothing appears for the first time at the last step.',
  },
  {
    step: '04',
    title: 'Delivery or pickup',
    body: 'To your address, or collect from a counter. Held stock moves in days; anything sourced abroad is quoted as a range of weeks, because that is the truth about sea freight and customs.',
  },
] as const;
