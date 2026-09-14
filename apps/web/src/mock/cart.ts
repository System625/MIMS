import type { CartItem, CartItemAvailability, FitmentVerdict, LeadTime } from '@mims/contracts';
import type { PartArtKind } from '@/components/part-art';
import type { StoredLine } from '@/lib/cart';
import { fromMinorUnits, toMinorUnits } from '@/lib/money';
import { listingBySlug, type StorePhoto } from './listings';
import type { VehicleDetail } from './vehicles';

/**
 * THE BASKET, RE-DERIVED.
 *
 * `lib/cart.tsx` remembers a handful of references and snapshots. This turns
 * them back into a cart, against the catalogue and the car *as they are right
 * now* — which means this runs on every render, and is meant to.
 *
 * It is the placeholder for `GET /api/v1/cart`. When build plan item 10 wires
 * the API, the server does exactly this work against Postgres and returns the
 * same `Cart` shape; this file goes, and the stored lines become the body of the
 * guest-cart hand-off. Nothing in the screens should have to change, which is
 * why the output is contract-shaped rather than convenient.
 *
 * The one deliberate divergence from `cartSchema`: `fitmentNow` is the full
 * verdict and may be null. Null means no car is set — a different answer to
 * `unknown`, which means we were told and hold no record. The API collapses the
 * two because a server-side cart always has a vehicle or has none explicitly;
 * the screen must not.
 */

export interface CartItemView extends Omit<CartItem, 'fitmentNow' | 'fitmentAtAdd' | 'addedAt'> {
  /** Presentational, exactly as `ListingSummaryView` adds them. */
  slug: string;
  /** Null on a withdrawn line: we no longer know what the thing looked like. */
  art: PartArtKind | null;
  photo: StorePhoto | null;
  /** The canvas line under the part name. */
  detail: string;
  /** Null when no car was set at the time, or is set now. */
  fitmentNow: FitmentVerdict | null;
  fitmentAtAdd: CartItem['fitmentAtAdd'] | null;
  addedAt: string;
  /** How many of this line can still be ordered. Held stock is finite; sourcing is not. */
  maxQuantity: number;
}

export interface CartView {
  items: CartItemView[];
  itemCount: number;
  itemsSubtotal: string;
  leadTime: LeadTime | null;
  hasMixedLeadTimes: boolean;
  needsAttentionCount: number;
  /** True when at least one line can actually be paid for. */
  hasBuyableLines: boolean;
}

export const EMPTY_CART: CartView = {
  items: [],
  itemCount: 0,
  itemsSubtotal: '0.00',
  leadTime: null,
  hasMixedLeadTimes: false,
  needsAttentionCount: 0,
  hasBuyableLines: false,
};

/** The contract's cap, repeated here so the stepper and the store agree. */
const MAX_LINE_QUANTITY = 20;

function resolveLine(line: StoredLine, vehicle: VehicleDetail | null): CartItemView {
  const listing = listingBySlug(line.slug, vehicle);

  /* The listing is gone. Everything the line can still say comes from the
     snapshot taken when it was added — which is the reason the snapshot is
     taken. It stays in the basket, priced at nothing, saying what it was. */
  if (listing === null) {
    return {
      id: line.slug,
      listingId: null,
      slug: line.slug,
      art: null,
      photo: null,
      detail: '',
      sku: line.sku,
      partName: line.partName,
      mpn: line.mpn,
      condition: line.condition,
      stockModel: line.stockModel,
      quantity: line.quantity,
      priceAtAdd: { amount: line.priceAtAdd, currency: 'NGN' },
      currentPrice: null,
      lineTotal: { amount: '0.00', currency: 'NGN' },
      leadTime: null,
      fitmentAtAdd: line.fitmentAtAdd,
      fitmentNow: null,
      fitmentNote: null,
      availability: 'withdrawn',
      changes: { priceChanged: false, fitmentChanged: false, availabilityChanged: true },
      addedAt: line.addedAt,
      maxQuantity: line.quantity,
    };
  }

  /* Pre-order has no shelf to run out of — that is what pre-order means, and
     `quantityAvailable` is 0 for every sourced listing by design. Only held
     stock can be sold out. */
  const finite = listing.stockModel === 'held_stock';
  const maxQuantity = finite
    ? Math.min(MAX_LINE_QUANTITY, listing.quantityAvailable)
    : MAX_LINE_QUANTITY;

  const availability: CartItemAvailability =
    finite && listing.quantityAvailable <= 0 ? 'out_of_stock' : 'available';

  const buyable = availability === 'available';
  const quantity = line.quantity;

  const lineTotal = buyable
    ? fromMinorUnits(toMinorUnits(listing.price.amount) * BigInt(quantity))
    : '0.00';

  const fitmentNow = listing.fitment;

  return {
    id: line.slug,
    listingId: listing.id,
    slug: listing.slug,
    art: listing.art,
    photo: listing.photo,
    detail: listing.detail,
    sku: listing.sku,
    /* The name and number are read back from the snapshot, not the catalogue.
       If the two have diverged, what the customer agreed to is the one they
       were shown — and the price comparison below is where a divergence that
       actually costs them money surfaces. */
    partName: line.partName,
    mpn: line.mpn,
    condition: listing.condition,
    stockModel: listing.stockModel,
    quantity,
    priceAtAdd: { amount: line.priceAtAdd, currency: 'NGN' },
    currentPrice: listing.price,
    lineTotal: { amount: lineTotal, currency: 'NGN' },
    leadTime: listing.leadTime,
    fitmentAtAdd: line.fitmentAtAdd,
    fitmentNow,
    fitmentNote: listing.fitmentNote,
    availability,
    changes: {
      priceChanged: toMinorUnits(listing.price.amount) !== toMinorUnits(line.priceAtAdd),
      /* Only a grade we actually showed can be said to have changed. Adding a
         part with no car set and then setting one is new information, not a
         changed answer, and must not be dressed up as one. */
      fitmentChanged:
        line.fitmentAtAdd !== null &&
        fitmentNow !== null &&
        fitmentNow.confidence !== line.fitmentAtAdd,
      availabilityChanged: !buyable,
    },
    addedAt: line.addedAt,
    maxQuantity,
  };
}

/**
 * A line needs a decision before checkout when we cannot vouch for it, when the
 * price moved under it, or when it cannot be supplied. Confirmed fitment on an
 * available line at the price you were quoted is the only quiet state.
 *
 * `unknown` and absent fitment both count. Around half of all auto-parts returns
 * are fitment errors, and against three to six weeks of sea freight a return
 * costs more than the part — so an ungraded line is a question, not a detail.
 */
function needsAttention(item: CartItemView): boolean {
  if (item.availability !== 'available') return true;
  if (item.changes.priceChanged) return true;
  return item.fitmentNow === null || item.fitmentNow.confidence !== 'confirmed';
}

export function resolveCart(lines: readonly StoredLine[], vehicle: VehicleDetail | null): CartView {
  if (lines.length === 0) return EMPTY_CART;

  const items = lines.map((line) => resolveLine(line, vehicle));
  const buyable = items.filter((item) => item.availability === 'available');

  /* An order arrives when its slowest part does, so the window spans every
     buyable line rather than averaging them into a comforting middle. The
     mixed-lead-time flag is what lets the screen offer the alternative — split
     the order — instead of only delivering the bad news. */
  const windows = buyable.map((item) => item.leadTime).filter((w): w is LeadTime => w !== null);
  const leadTime =
    windows.length === 0
      ? null
      : {
          minDays: Math.min(...windows.map((w) => w.minDays)),
          maxDays: Math.max(...windows.map((w) => w.maxDays)),
        };

  return {
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    itemsSubtotal: buyable.reduce(
      (total, item) => fromMinorUnits(toMinorUnits(total) + toMinorUnits(item.lineTotal.amount)),
      '0.00',
    ),
    leadTime,
    hasMixedLeadTimes:
      buyable.some((item) => item.stockModel === 'held_stock') &&
      buyable.some((item) => item.stockModel === 'pre_order'),
    needsAttentionCount: items.filter(needsAttention).length,
    hasBuyableLines: buyable.length > 0,
  };
}

/** `{ minDays: 21, maxDays: 45 }` → `"3–7 weeks"`. Days below a fortnight stay days. */
export function formatLeadTime(window: LeadTime): string {
  if (window.maxDays <= 14) {
    return window.minDays === window.maxDays
      ? `${window.maxDays} days`
      : `${window.minDays}–${window.maxDays} days`;
  }
  const weeks = (days: number) => Math.round(days / 7);
  const min = weeks(window.minDays);
  const max = weeks(window.maxDays);
  return min === max ? `${max} weeks` : `${min}–${max} weeks`;
}
