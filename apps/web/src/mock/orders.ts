import type {
  LeadTime,
  Order,
  OrderEvent,
  OrderEventType,
  OrderItem,
  OrderStatus,
} from '@mims/contracts';
import type { PartArtKind } from '@/components/part-art';
import { fromMinorUnits, toMinorUnits } from '@/lib/money';
import { listingBySlug, type StorePhoto } from './listings';
import { PICKUP_POINTS } from './pickup';
import { DEMO_VEHICLE } from './vehicles';

/**
 * ⚠️ PLACEHOLDER ORDERS — build plan item 7's stand-in for
 * `GET /api/v1/orders/:reference`.
 *
 * Same discipline as `mock/listings.ts` and `mock/cart.ts`: nothing here is
 * invented that the repository can supply. Part names, numbers, conditions,
 * prices, lead times and fitment grades are read out of the catalogue by
 * `orderLine()` below, so a placeholder order quotes the same figures the
 * product page does and no price is picked by hand. What this file DOES author
 * is the shape of a journey — which events happened, in what order, how long
 * ago — because that is the thing item 7 exists to render and the repository
 * holds no example of one.
 *
 * THREE DELIBERATE CHOICES, so they are not re-litigated:
 *
 * 1. EVERY PLACEHOLDER ORDER IS A PICKUP ORDER. `bella.md` §3 records the
 *    logistics partner as not chosen, so a delivery fee is not derivable from
 *    anything we hold and §10 forbids inventing one — the same reasoning that
 *    stops `/checkout` totalling a delivery order. `deliveryFee` is `0.00` here
 *    because that is *true* for collection, not because it is convenient. The
 *    screens still render the delivery branch; no placeholder exercises it.
 *
 * 2. THE TIMELINE IS RELATIVE TO NOW, not to a fixed date. Everywhere else in
 *    the mocks a date is frozen, because a price is a snapshot and must not
 *    drift. A tracking page is the opposite: its entire subject is elapsed
 *    time, and "no movement for 13 days" has to keep being true next month or
 *    the one screen item 7 is built for stops demonstrating itself. Hence
 *    `orderByReference(reference, now)` rather than a constant — and note that
 *    the caller supplies `now`, so nothing in this file reads the clock and
 *    nothing can differ between a server render and a client one.
 *
 * 3. ONE PLACEHOLDER CUSTOMER, ONE PLACEHOLDER NUMBER. `mock/pickup.ts` refuses
 *    to invent a street because somebody would drive to it; a Nigerian mobile
 *    number invented to look plausible is somebody's actual phone, and worse,
 *    because it would be printed on a screen next to the word "order".
 *    `08000000000` is schema-valid, obviously nobody's, and shared by all five.
 *
 * When item 10 wires the API this file goes. The views below are the contract's
 * `Order` plus the same two presentational fields `ListingSummaryView` adds, so
 * the screens should not have to change.
 */

/* --------------------------------------------------------------- the views -- */

export interface OrderItemView extends OrderItem {
  /** Presentational, so a line can be linked back to the part it was. */
  slug: string;
  art: PartArtKind | null;
  photo: StorePhoto | null;
  /** The canvas line under the part name. */
  detail: string;
}

export interface OrderView extends Omit<Order, 'items'> {
  items: OrderItemView[];
}

/* ------------------------------------------------------------ the identity -- */

/**
 * The number a customer reads back over the phone. `MI-` is an estimate and
 * `MO-` is an order: two references that arrive in the same WhatsApp thread
 * must not be confusable, and "the one starting M-I" is not a distinction
 * anybody can hear.
 */
const REFERENCE_PREFIX = 'MO-';

/**
 * Obviously nobody's number, and valid against `nigerianPhoneSchema` so the
 * lookup form can be walked end to end. See note 3 at the top of this file.
 */
export const PLACEHOLDER_PHONE = '08000000000';

const PLACEHOLDER_CUSTOMER = 'Placeholder customer';

/* ----------------------------------------------------------------- the data -- */

interface PlaceholderEvent {
  type: OrderEventType;
  /** Whole days before `now`. The most recent event is the last in the array. */
  daysAgo: number;
  summary: string;
  detail?: string;
}

interface PlaceholderOrder {
  reference: string;
  status: OrderStatus;
  /** Which counter in `PICKUP_POINTS`. */
  pickup: number;
  /** Catalogue slugs and quantities. Prices come from the catalogue, never from here. */
  lines: ReadonlyArray<{ slug: string; quantity: number }>;
  placedDaysAgo: number;
  paidDaysAgo: number | null;
  deliveredDaysAgo: number | null;
  customerNote: string | null;
  events: readonly PlaceholderEvent[];
}

/**
 * Five orders, chosen to cover the states the screen has to survive rather than
 * to look like a busy account: one before payment, one stalled in customs past
 * the point where silence is still reassuring, one mid-ocean and legitimately
 * quiet, one waiting on the customer, and one finished.
 */
const PLACEHOLDER_ORDERS: readonly PlaceholderOrder[] = [
  {
    /* Just placed. This is the confirmation screen — the same page a customer
       comes back to for the next five weeks, which is why confirmation is a
       state of the tracking page and not a dead-end thank-you. */
    reference: 'MO-2214',
    status: 'awaiting_payment',
    pickup: 0,
    lines: [{ slug: 'front-bumper-cover-aftermarket', quantity: 1 }],
    placedDaysAgo: 0,
    paidDaysAgo: null,
    deliveredDaysAgo: null,
    customerNote: null,
    events: [
      {
        type: 'placed',
        daysAgo: 0,
        summary: 'Order placed.',
        detail:
          'Nothing has been charged. The order is held for you until payment goes through, and the part is not taken off the shelf until it does.',
      },
    ],
  },
  {
    /* THE ONE ITEM 7 EXISTS FOR. Thirteen days without an event, in the stage
       that stalls: long enough that a page which simply stopped updating would
       be indistinguishable from having been robbed. */
    reference: 'MO-2211',
    status: 'customs',
    pickup: 0,
    lines: [
      { slug: 'front-bumper-cover-genuine', quantity: 1 },
      { slug: 'headlight-assembly-left-genuine', quantity: 1 },
    ],
    placedDaysAgo: 34,
    paidDaysAgo: 34,
    deliveredDaysAgo: null,
    customerNote: 'Please call before 6pm — I finish work late.',
    events: [
      { type: 'placed', daysAgo: 34, summary: 'Order placed.' },
      {
        type: 'payment_succeeded',
        daysAgo: 34,
        summary: 'Payment received in full.',
        detail: 'Paid by bank transfer through Paystack. Your receipt went to the number above.',
      },
      {
        type: 'supplier_ordered',
        daysAgo: 33,
        summary: 'Both parts ordered from the supplier.',
        detail:
          'Genuine parts are sourced to order rather than held in Lagos, which is what the three-to-six week window on your order is.',
      },
      {
        type: 'shipped',
        daysAgo: 30,
        summary: 'Left the supplier by sea.',
        detail:
          'There is normally no news at all during the crossing. That is not the same as nothing happening, and this page will say so rather than go blank.',
      },
      { type: 'arrived_port', daysAgo: 20, summary: 'Arrived at Apapa, Lagos.' },
      {
        type: 'customs_started',
        daysAgo: 19,
        summary: 'Entered customs clearance.',
        detail: 'Documents lodged. Clearing is the step with no predictable length.',
      },
      {
        type: 'customs_delayed',
        daysAgo: 13,
        summary: 'Held for physical inspection.',
        detail:
          'Your consignment was pulled for examination. We have an agent on it and we chase it every working day. We do not know when it will be released, and we would rather tell you that than invent a date.',
      },
    ],
  },
  {
    /* Mid-ocean. Eight days of silence, which at this stage is entirely normal —
       the screen has to be able to say "quiet, and that is fine" as well as
       "quiet, and that is too long". */
    reference: 'MO-2209',
    status: 'in_transit',
    pickup: 1,
    lines: [{ slug: 'hood-bonnet-panel-genuine', quantity: 1 }],
    placedDaysAgo: 16,
    paidDaysAgo: 16,
    deliveredDaysAgo: null,
    customerNote: null,
    events: [
      { type: 'placed', daysAgo: 16, summary: 'Order placed.' },
      { type: 'payment_succeeded', daysAgo: 16, summary: 'Payment received in full.' },
      { type: 'supplier_ordered', daysAgo: 15, summary: 'Panel ordered from the supplier.' },
      {
        type: 'shipped',
        daysAgo: 8,
        summary: 'Left the supplier by sea.',
        detail:
          'Expect no updates for two to three weeks. Sea freight reports at the ports, not in between.',
      },
    ],
  },
  {
    /* Waiting on the customer. Held stock, so it never touched customs — and the
       stage rail is built to leave those steps out rather than grey them in. */
    reference: 'MO-2205',
    status: 'ready_for_pickup',
    pickup: 0,
    lines: [{ slug: 'radiator-1-8l-aftermarket', quantity: 1 }],
    placedDaysAgo: 6,
    paidDaysAgo: 6,
    deliveredDaysAgo: null,
    customerNote: null,
    events: [
      { type: 'placed', daysAgo: 6, summary: 'Order placed.' },
      { type: 'payment_succeeded', daysAgo: 6, summary: 'Payment received in full.' },
      {
        type: 'note',
        daysAgo: 5,
        summary: 'Picked from Lagos stock and checked.',
        detail: 'Held stock, so there is no sourcing wait on this one.',
      },
      {
        type: 'ready_for_pickup',
        daysAgo: 3,
        summary: 'Ready to collect.',
        detail:
          'Bring the order reference and the phone number it was placed with. We hold it for you; there is no deadline on collection and nothing is returned to stock behind your back.',
      },
    ],
  },
  {
    /* Finished, and still here. An order that disappears from the list the day
       it lands is an order you cannot check a part number against six weeks
       later, which is exactly when somebody needs to. */
    reference: 'MO-2196',
    status: 'delivered',
    pickup: 0,
    lines: [{ slug: 'hood-bonnet-panel-aftermarket', quantity: 1 }],
    placedDaysAgo: 57,
    paidDaysAgo: 57,
    deliveredDaysAgo: 51,
    customerNote: null,
    events: [
      { type: 'placed', daysAgo: 57, summary: 'Order placed.' },
      { type: 'payment_succeeded', daysAgo: 57, summary: 'Payment received in full.' },
      { type: 'ready_for_pickup', daysAgo: 53, summary: 'Ready to collect.' },
      {
        type: 'delivered',
        daysAgo: 51,
        summary: 'Collected from the Lagos counter.',
        detail: 'Signed for at the counter.',
      },
    ],
  },
];

/* ------------------------------------------------------------- construction -- */

function isoDaysAgo(days: number, now: Date): string {
  return new Date(now.getTime() - days * 86_400_000).toISOString();
}

/**
 * One order line, read out of the catalogue.
 *
 * An order is a SNAPSHOT — `bella.md` §10, "part names, numbers and prices are
 * copied onto the record when it is created" — so the real thing will not do
 * this lookup. It is done here because the alternative is typing prices into
 * this file by hand, and a hand-typed price is precisely the thing that must
 * come out of the catalogue or not appear. The fitment grade is copied the same
 * way: it is what we claimed at the time, and the returns conversation starts
 * from it.
 */
function orderLine(slug: string, quantity: number, index: number): OrderItemView | null {
  const listing = listingBySlug(slug, DEMO_VEHICLE);
  if (listing === null) return null;

  const lineTotal = fromMinorUnits(toMinorUnits(listing.price.amount) * BigInt(quantity));

  return {
    id: `00000000-0000-4000-8000-0000000003${String(index).padStart(2, '0')}`,
    slug: listing.slug,
    art: listing.art,
    photo: listing.photo,
    detail: listing.detail,
    sku: listing.sku,
    partName: listing.partName,
    mpn: listing.mpn,
    oemNumber: listing.oemNumber,
    position: listing.position,
    condition: listing.condition,
    stockModel: listing.stockModel,
    quantity,
    unitPrice: listing.price,
    lineTotal: { amount: lineTotal, currency: 'NGN' },
    leadTime: listing.leadTime,
    fitmentConfidence: listing.fitment?.confidence ?? 'unknown',
    fitmentNote: listing.fitmentNote,
  };
}

function buildOrder(spec: PlaceholderOrder, now: Date): OrderView {
  const items = spec.lines
    .map((line, index) => orderLine(line.slug, line.quantity, index))
    .filter((item): item is OrderItemView => item !== null);

  const itemsSubtotal = items.reduce(
    (total, item) => fromMinorUnits(toMinorUnits(total) + toMinorUnits(item.lineTotal.amount)),
    '0.00',
  );

  /* An order arrives when its slowest line does. Same rule as the cart, and for
     the same reason: averaging two windows into a comforting middle is a lie
     that surfaces five weeks later. */
  const windows = items.map((item) => item.leadTime).filter((w): w is LeadTime => w !== null);
  const leadTime =
    windows.length === 0
      ? null
      : {
          minDays: Math.min(...windows.map((w) => w.minDays)),
          maxDays: Math.max(...windows.map((w) => w.maxDays)),
        };

  const point = PICKUP_POINTS[spec.pickup] ?? PICKUP_POINTS[0]!;
  const { id: _pickupId, ...pickupPoint } = point;

  const events: OrderEvent[] = spec.events
    .map((event, index) => ({
      id: `00000000-0000-4000-8000-0000000004${String(index).padStart(2, '0')}`,
      type: event.type,
      summary: event.summary,
      detail: event.detail ?? null,
      occurredAt: isoDaysAgo(event.daysAgo, now),
    }))
    /* The contract says reverse-chronological, and the screen renders it that
       way: somebody re-opening this page for the ninth time wants the newest
       line first, not to scroll past a month of history to find it. */
    .reverse();

  return {
    id: `00000000-0000-4000-8000-00000000${spec.reference.slice(3)}`,
    reference: spec.reference,
    status: spec.status,

    customerName: PLACEHOLDER_CUSTOMER,
    customerPhone: PLACEHOLDER_PHONE,
    customerEmail: null,

    fulfilmentMethod: 'pickup',
    deliveryAddress: null,
    pickupPoint,

    vehicle: DEMO_VEHICLE,

    items,
    itemsSubtotal: { amount: itemsSubtotal, currency: 'NGN' },
    /* True, not convenient: collection costs nothing. See note 1 at the top. */
    deliveryFee: { amount: '0.00', currency: 'NGN' },
    total: { amount: itemsSubtotal, currency: 'NGN' },

    leadTime,
    events,

    customerNote: spec.customerNote,
    cancellationReason: null,
    placedAt: isoDaysAgo(spec.placedDaysAgo, now),
    paidAt: spec.paidDaysAgo === null ? null : isoDaysAgo(spec.paidDaysAgo, now),
    deliveredAt: spec.deliveredDaysAgo === null ? null : isoDaysAgo(spec.deliveredDaysAgo, now),
  };
}

/* ------------------------------------------------------------------ lookup -- */

/** As typed: `0803…`, `+234803…` or `234803…` all mean one number. */
function normalisePhone(input: string): string {
  const compact = input.replace(/[\s-]/g, '').trim();
  if (compact.startsWith('+234')) return `0${compact.slice(4)}`;
  if (compact.startsWith('234')) return `0${compact.slice(3)}`;
  return compact;
}

/** The reference as it is spoken: case and a missing prefix should both work. */
export function normaliseReference(input: string): string {
  const compact = input.replace(/[\s-]/g, '').trim().toUpperCase();
  return compact.startsWith('MO') ? `${REFERENCE_PREFIX}${compact.slice(2)}` : compact;
}

export function orderByReference(reference: string, now: Date): OrderView | null {
  const wanted = normaliseReference(reference);
  const spec = PLACEHOLDER_ORDERS.find((order) => order.reference === wanted);
  return spec ? buildOrder(spec, now) : null;
}

/**
 * Guest order lookup — the reference plus the phone it was placed with, which
 * are two facts the customer has and a stranger does not.
 *
 * IT RETURNS ONE FAILURE, NOT TWO. "That reference exists but the number is
 * wrong" tells anybody holding a reference that the order is real and lets them
 * grind at the phone; "no such reference" tells them which references exist.
 * Both are worth more to an attacker than the extra helpfulness is worth to a
 * customer who can read their own confirmation. The real endpoint needs a rate
 * limit on top of this, which is a server concern and item 10's to add.
 */
export function lookupOrder(reference: string, phone: string, now: Date): OrderView | null {
  const order = orderByReference(reference, now);
  if (order === null) return null;
  return normalisePhone(order.customerPhone) === normalisePhone(phone) ? order : null;
}

/** Last four digits, which is all any shared view of an order may print. */
export function maskPhone(phone: string): string {
  return phone.slice(-4);
}

export function phoneLast4(phone: string): string {
  return normalisePhone(phone).slice(-4);
}

/* ------------------------------------------------------------------ stages -- */

export interface OrderStage {
  status: OrderStatus;
  label: string;
  state: 'done' | 'current' | 'future';
}

const RAIL_ORDER: readonly OrderStatus[] = [
  'awaiting_payment',
  'paid',
  'sourcing',
  'in_transit',
  'customs',
  'ready_for_pickup',
  'out_for_delivery',
  'delivered',
];

/**
 * The steps this particular order actually has.
 *
 * A radiator off the Lagos shelf never crosses an ocean, so it is not given a
 * greyed-out CUSTOMS step to worry about — a stage that cannot happen is not
 * reassurance, it is a step the customer thinks they are still waiting for.
 * Pre-order lines put the freight stages back, because for them they are real.
 */
export function stagesFor(order: OrderView): OrderStage[] {
  const imported = order.items.some((item) => item.stockModel === 'pre_order');
  const delivery = order.fulfilmentMethod === 'delivery';

  const wanted = RAIL_ORDER.filter((status) => {
    if (status === 'sourcing' || status === 'in_transit' || status === 'customs') return imported;
    if (status === 'ready_for_pickup') return !delivery;
    if (status === 'out_for_delivery') return delivery;
    return true;
  });

  /* Terminal states sit off the rail: an order that was cancelled did not reach
     the end of the journey and drawing it as if it had would be a lie. */
  if (order.status === 'cancelled' || order.status === 'refunded') {
    return wanted.map((status) => ({
      status,
      label: STAGE_LABEL[status],
      state: RAIL_ORDER.indexOf(status) <= RAIL_ORDER.indexOf('paid') ? 'done' : 'future',
    }));
  }

  const reached = wanted.indexOf(order.status);

  return wanted.map((status, index) => ({
    status,
    label: STAGE_LABEL[status],
    state: index < reached ? 'done' : index === reached ? 'current' : 'future',
  }));
}

/** The rail's own wording — short, because these sit in narrow cells. */
const STAGE_LABEL: Record<OrderStatus, string> = {
  awaiting_payment: 'Placed',
  paid: 'Paid',
  sourcing: 'With supplier',
  in_transit: 'Shipping',
  customs: 'Customs',
  ready_for_pickup: 'Ready',
  out_for_delivery: 'Out for delivery',
  delivered: 'Done',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

/** The full-sentence status, used as the headline on the order itself. */
export const STATUS_LABEL: Record<OrderStatus, string> = {
  awaiting_payment: 'Waiting for payment',
  paid: 'Paid — we are placing it with the supplier',
  sourcing: 'With the supplier',
  in_transit: 'On its way to Nigeria',
  customs: 'Clearing customs in Lagos',
  ready_for_pickup: 'Ready to collect',
  out_for_delivery: 'Out for delivery',
  delivered: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

/** Days of silence that are still normal at each stage. Null means terminal. */
export const QUIET_DAYS: Record<OrderStatus, number | null> = {
  awaiting_payment: 1,
  paid: 2,
  sourcing: 5,
  /* Sea freight reports at the ports and nowhere in between. Three weeks of
     nothing is the normal shape of this stage, not a failure of ours. */
  in_transit: 21,
  customs: 10,
  /* Waiting on the customer, so silence here is theirs to break, not ours. */
  ready_for_pickup: null,
  out_for_delivery: 2,
  delivered: null,
  cancelled: null,
  refunded: null,
};

export function daysBetween(iso: string, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000));
}

/** Every reference the placeholder store can render, for the walkthrough. */
export const PLACEHOLDER_REFERENCES: readonly string[] = PLACEHOLDER_ORDERS.map(
  (order) => order.reference,
);
