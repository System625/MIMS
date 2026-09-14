import type { WaitlistSource } from '@mims/contracts';
import type { PartArtKind } from '@/components/part-art';

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
  /**
   * Which schematic to draw. Not a photograph, and deliberately so — see the
   * note at the top of `components/part-art.tsx`. A category signpost may say
   * "this is the kind of thing"; only a real listing photograph may say "this is
   * the item", and we hold none yet.
   */
  art: PartArtKind;
}

export const STORE_CATEGORIES: readonly StoreCategoryCard[] = [
  {
    code: 'bumper',
    art: 'bumper',
    name: 'Bumpers',
    blurb: 'Front and rear covers, reinforcements, brackets and clips.',
  },
  {
    code: 'lighting',
    art: 'lighting',
    name: 'Lighting',
    blurb: 'Headlight and tail-light assemblies, per side. Halogen and LED differ.',
  },
  {
    code: 'body_panel',
    art: 'body_panel',
    name: 'Body panels',
    blurb: 'Hoods, fenders, doors and rear panels. Primed, not painted.',
  },
  {
    code: 'grille',
    art: 'grille',
    name: 'Grilles',
    blurb: 'Upper and lower grilles, mouldings and the trim around them.',
  },
  {
    code: 'cooling',
    art: 'cooling',
    name: 'Cooling',
    blurb: 'Radiators, condensers, fans and the packs they sit in.',
  },
];

/**
 * THE SHELVES THAT ARE NOT BUILT YET, one page each at `/soon/[shelf]`.
 *
 * Each has a `waitlist_source` enum value behind it, so the capture is real
 * even though the shelf is not — `tokunbo_shelf` was added with build plan
 * item 9 for exactly this.
 *
 * These are pages rather than two teaser boxes on the home page because of what
 * `why` says on each one. Every shelf here is missing for a specific reason
 * that is interesting to the customer — usually a fitment or a photography
 * problem we have not solved rather than a shelf we have not got round to
 * stocking — and "coming soon" over a picture tells them none of it. Asking for
 * an email after explaining is a fairer trade than asking for one under a
 * teaser, which is the version of this every other store ships.
 */
export interface ComingSoonShelf {
  /** URL segment at `/soon/[shelf]`. */
  slug: string;
  /** The `waitlist_source` this shelf's captures are recorded under. */
  source: WaitlistSource;
  title: string;
  /** One line, for the card on the home page. */
  note: string;
  lede: string;
  /**
   * Schematics for what the shelf will hold. EMPTY IS A REAL VALUE and draws
   * empty slots — see `slotNote`. A shelf whose range we have not decided
   * cannot be illustrated without deciding it by accident.
   */
  slots: readonly PartArtKind[];
  slotNote: string;
  /** Why it is not open. The reason is the point of the page. */
  why: readonly string[];
  /** What an address on this list actually decides. Not a marketing promise. */
  signal: string;
}

export const COMING_SOON: readonly ComingSoonShelf[] = [
  {
    slug: 'facelift-kits',
    source: 'facelift_hub',
    title: 'Facelift kits',
    note: 'Whole front ends — older shape to newer, matched as a set so the panels actually line up.',
    lede: 'Converting an older car to the newer shape: bumper, grille, headlights and the brackets between them, bought as one matched set rather than assembled out of four separate guesses.',
    slots: ['bumper', 'grille', 'lighting'],
    slotNote:
      'Three of the eight or so pieces a front-end conversion actually takes. The set is the product — buying them one at a time is how people end up with a car that is half converted.',
    why: [
      'A facelift kit is not a list of parts, it is one compatibility claim made across all of them at once. We can tell you a bumper fits your chassis. Telling you a 2018 front end fits your 2015 is a claim about mounting points, headlight connectors, wiring, washer jets and the line of the bonnet simultaneously, and being wrong about any single one of them strands you with a car in pieces.',
      'That needs its own fitment data — conversion by conversion, confirmed on a real car — and it is not a filter over the catalogue we already hold. Selling it before we have that would be the store breaking its own rule on the most expensive thing it sells.',
    ],
    signal:
      'Which conversion we build the data for first. Tell us the car you want converted and to what — that is the whole message.',
  },
  {
    slug: 'tokunbo',
    source: 'tokunbo_shelf',
    title: 'Tokunbo parts',
    note: 'Used, pulled from donor cars and graded. Named on every listing here, stocked on none of them yet.',
    lede: 'The condition this market actually runs on. We name it on every listing, the browse filter carries it as its own axis, and it returns nothing — because a tokunbo part is a harder thing to sell honestly than a new one, not because we forgot.',
    slots: ['bumper', 'body_panel', 'lighting'],
    slotNote:
      'The same parts as the rest of the catalogue. What is different is not the shape, it is that each one is a specific object with its own history.',
    why: [
      'A new part is a catalogue line: one number, one price, any of them will do. A tokunbo part is a single specific object — this bumper, off this car, with this scuff on the lower left — and the price follows the condition of that one piece. There is no honest way to list it as a line item with a stock figure.',
      'So every tokunbo listing needs its own photographs and its own grade before it can go up, and we do not photograph anything yet. That is the same open question as the illustrative stock images on the rest of the store, and it is the one blocking this shelf outright rather than merely embarrassing us.',
    ],
    signal:
      'Which parts to buy in first. A donor car is bought whole, so the list decides what we go looking for at the yard.',
  },
  {
    slug: 'accessories',
    source: 'accessories_store',
    title: 'Accessories',
    note: 'Mats, covers, mirrors, badges. The things you buy because you want them, not because something broke.',
    lede: 'The shelf for the car you are keeping rather than the car you have just damaged. Easy to stock, and deliberately last.',
    slots: [],
    slotNote:
      'Drawn empty on purpose. We have not decided what goes in these, and a picture of a range we have not chosen would be us choosing it by accident.',
    why: [
      'It is the easiest shelf here to fill and the least like the rest of the store. Almost nothing on it needs a chassis code, a fitment verdict or a landed-cost calculation — it would be the first thing we sell the ordinary way, and we would rather finish the hard half first and be worth trusting on it.',
      'Badges are their own problem. We will not put another manufacturer\u2019s mark on something that is not their part, which is a rule that rules out most of what a shelf like this usually carries, so it opens narrower than you would expect or it does not open.',
    ],
    signal:
      'Whether this is worth doing at all. It is the shelf we are least sure anyone wants from us specifically.',
  },
];

/** Looked up by the `/soon/[shelf]` route. */
export function shelfBySlug(slug: string): ComingSoonShelf | undefined {
  return COMING_SOON.find((shelf) => shelf.slug === slug);
}

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
