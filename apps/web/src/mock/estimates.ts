import { buildEstimate, type EstimateView } from './parts';
import { DEMO_VEHICLE } from './vehicles';

/**
 * Stored estimates.
 *
 * Note that these are snapshots, not queries. An estimate records what a part
 * cost on the day it was run; reopening one must never silently recompute it,
 * or the figure a user took to a workshop last week would change under them.
 * That is also why the list below carries a staleness state rather than a fresh
 * total — "prices 29 days old" is information, not a defect.
 */

/** The estimate behind every share link, PDF and follow-up in the design. */
export const REFERENCE = 'MI-4471';

const SHARED_ZONES = ['front_bumper', 'hood', 'headlight_left', 'radiator', 'fender_left'];

export const SHARED_ESTIMATE: EstimateView = buildEstimate(
  DEMO_VEHICLE,
  SHARED_ZONES,
  REFERENCE,
  '2026-09-04T00:00:00.000Z',
);

export const SHARE_LINK_EXPIRES = '2026-10-04T00:00:00.000Z';

export interface SavedEstimate {
  reference: string;
  date: string;
  car: string;
  zones: string;
  total: string;
  state: string;
  /** False dims the row and reddens its state label. */
  fresh: boolean;
  banner: string | null;
  bannerCta: string | null;
}

export const SAVED_ESTIMATES: readonly SavedEstimate[] = [
  {
    reference: 'MI-4471',
    date: '04 SEP 2026',
    car: '2018 Toyota Corolla LE',
    zones: 'Front bumper, hood, headlight L, radiator, fender L',
    total: '₦525,000 – ₦664,000',
    state: '4 OF 5 PRICED',
    fresh: true,
    banner: 'You marked this car as visited a workshop. What did the front bumper actually cost?',
    bannerCta: 'Report the price',
  },
  {
    reference: 'MI-4402',
    date: '27 AUG 2026',
    car: '2012 Honda Accord EX',
    zones: 'Rear bumper, boot lid',
    total: '₦188,000 – ₦241,000',
    state: 'FULLY PRICED',
    fresh: true,
    banner: null,
    bannerCta: null,
  },
  {
    reference: 'MI-4310',
    date: '12 AUG 2026',
    car: '2018 Toyota Corolla LE',
    zones: 'Headlight R',
    total: '₦95,000 – ₦124,000',
    state: 'PRICES 29 DAYS OLD',
    fresh: false,
    banner: 'Prices for this estimate are nearly a month old. Re-check before you negotiate.',
    bannerCta: 'Re-check prices',
  },
  {
    reference: 'MI-4188',
    date: '21 JUL 2026',
    car: '2011 Peugeot 508',
    zones: 'Front bumper, fender L',
    total: 'Not priced',
    state: 'CAR NOT COVERED',
    fresh: false,
    banner: null,
    bannerCta: null,
  },
];
