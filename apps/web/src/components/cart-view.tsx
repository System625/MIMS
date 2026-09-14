'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { useEstimateFlow } from '@/lib/estimate-flow';
import { formatNaira } from '@/lib/money';
import { CONDITION_LABEL, STOCK_LABEL } from '@/mock/listings';
import { formatLeadTime, resolveCart, type CartItemView, type CartView } from '@/mock/cart';
import { chipState, FitmentChip } from './fitment';
import { ListingPhotoFrame } from './listing-photo';
import { ReturnsPosition } from './returns-position';
import { Button, Kicker, Note, Panel, PanelBar, QuantityStepper, Title, cx } from './ui';

/**
 * THE CART — build plan item 5.
 *
 * A basket is usually the dullest screen in a store. Here it is the last place
 * an expensive mistake can still be caught for free, so it is built to raise
 * problems rather than to hurry past them:
 *
 *  • Every line is re-graded against the car on each read. Change your car and
 *    the basket is re-graded, never emptied — throwing away a basket because
 *    somebody corrected their own trim would be the rudest possible answer to
 *    being told the truth.
 *  • Lines needing a decision are counted at the top and marked in place, and
 *    checkout says how many are unresolved instead of quietly proceeding.
 *  • Mixed lead times are shown as two answers, because a basket holding one
 *    part off the Lagos shelf and one sourced from abroad HAS two answers to
 *    "when", and averaging them into a comforting middle is a lie that surfaces
 *    five weeks later when the customer is angry and already paid.
 *
 * There is no upsell rail, no "customers also bought", no free-delivery
 * threshold nudging the total upward. The total goes up when the customer says
 * it does.
 */
export function CartScreen() {
  const { lines, hydrated: cartHydrated, setQuantity, remove } = useCart();
  const { vehicle, hydrated: vehicleHydrated } = useEstimateFlow();

  const hydrated = cartHydrated && vehicleHydrated;
  const cart = resolveCart(hydrated ? lines : [], hydrated ? vehicle : null);

  /*
   * Until both device stores have been read, this says it is checking. The
   * empty-basket copy below is a strong claim — "nothing is in here" — and
   * flashing it at somebody who added three parts this morning is precisely how
   * a customer concludes the site lost their basket and goes back to WhatsApp.
   */
  if (!hydrated) {
    return (
      <Panel className="mt-[18px]">
        <div className="px-[15px] py-[26px]">
          <p className="text-muted m-0 font-mono text-[12.5px] leading-none">
            Checking your basket…
          </p>
        </div>
      </Panel>
    );
  }

  if (cart.items.length === 0) return <EmptyCart />;

  return (
    <div className="mt-[18px] grid gap-[18px] lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start">
      <div className="grid gap-[14px]">
        {cart.needsAttentionCount > 0 ? <AttentionBanner cart={cart} /> : null}

        {cart.items.map((item) => (
          <CartLine
            key={item.id}
            item={item}
            onQuantity={(next) => setQuantity(item.slug, next)}
            onRemove={() => remove(item.slug)}
          />
        ))}
      </div>

      <CartSummary cart={cart} hasVehicle={vehicle !== null} />
    </div>
  );
}

/* ------------------------------------------------------------- attention -- */

function AttentionBanner({ cart }: { cart: CartView }) {
  const count = cart.needsAttentionCount;

  return (
    <Note tone="rule">
      <strong className="font-bold">
        {count === 1 ? 'One line needs a look' : `${count} lines need a look`}
      </strong>{' '}
      before you pay. Nothing here is broken and nothing has been changed for you — these are the
      things we cannot vouch for yet, and we would rather raise them now than after five weeks of
      freight. Each one is marked below.
    </Note>
  );
}

/* ------------------------------------------------------------------ line -- */

function CartLine({
  item,
  onQuantity,
  onRemove,
}: {
  item: CartItemView;
  onQuantity: (next: number) => void;
  onRemove: () => void;
}) {
  const gone = item.availability !== 'available';

  return (
    <Panel tone="white" className={cx(gone && 'opacity-[0.92]')}>
      <PanelBar
        tone={gone ? 'flag' : 'light'}
        right={
          <span className="font-mono">
            {CONDITION_LABEL[item.condition]} · {STOCK_LABEL[item.stockModel]}
          </span>
        }
      >
        {gone
          ? item.availability === 'withdrawn'
            ? 'No longer listed'
            : 'Out of stock'
          : 'In your basket'}
      </PanelBar>

      <div className="flex flex-wrap gap-[14px] p-[13px]">
        {item.art !== null ? (
          /* Sized like a search row, and for the same reason: below ~130px the
             "Illustrative" marker truncates to an ellipsis, and a disclosure
             that reads as a rendering glitch is not a disclosure. */
          <div className="border-rule-2 w-[132px] flex-none self-start border-[1.5px] sm:w-[168px]">
            <ListingPhotoFrame
              photo={item.photo}
              art={item.art}
              maxWidth={168}
              sizes="(max-width: 640px) 132px, 168px"
              emptyFill={gone ? 'hatch' : 'white'}
            />
          </div>
        ) : null}

        {/* Basis 200, not 300: at 400px the thumbnail is 132 and the gutters
            eat 40, so a 300 basis pushes the part name onto its own line and
            strands the picture beside empty space on the narrowest phones this
            store is actually used on. */}
        <div className="min-w-0 flex-[1_1_200px]">
          <Title className="text-[17px]">
            {gone ? (
              item.partName
            ) : (
              <Link href={`/parts/${item.slug}`} className="hover:underline">
                {item.partName}
              </Link>
            )}
          </Title>

          {item.detail ? (
            <p className="text-ink-soft mt-[5px] text-[12.5px] leading-[1.45]">{item.detail}</p>
          ) : null}

          <div className="mt-[9px] flex flex-wrap items-center gap-[8px]">
            {/*
             * A withdrawn line gets no grade at all, not even "car not set".
             * There is no listing left to check against, and "you haven't told
             * us your car" would be a different — and flattering — answer to
             * the one that is true: we can no longer check this at all.
             */}
            {item.availability !== 'withdrawn' ? (
              <FitmentChip confidence={chipState(item.fitmentNow)} />
            ) : null}
            {item.mpn ? (
              <span className="text-muted font-mono text-[11.5px] font-bold leading-none tracking-[0.04em]">
                {item.mpn}
              </span>
            ) : null}
          </div>

          <LineChanges item={item} />

          <div className="mt-[12px] flex flex-wrap items-center gap-[12px]">
            {gone ? (
              <span className="border-edge-2 text-muted flex h-[44px] items-center border-[1.5px] border-dashed px-[11px] font-mono text-[12px] font-bold uppercase leading-none tracking-[0.08em]">
                {item.quantity} × unavailable
              </span>
            ) : (
              <QuantityStepper
                value={item.quantity}
                onChange={onQuantity}
                max={item.maxQuantity}
                label={`Quantity of ${item.partName}`}
              />
            )}
            <Button variant="quiet" size="sm" onClick={onRemove}>
              Remove
            </Button>
          </div>
        </div>

        <div className="flex-[1_1_150px] sm:text-right">
          <Kicker as="div" className="text-muted-2 tracking-[0.1em]">
            {gone ? 'Not in the total' : item.quantity > 1 ? 'Line total' : 'Price'}
          </Kicker>
          <div className="mt-[5px] font-mono text-[19px] font-black leading-none">
            {gone ? '—' : formatNaira(item.lineTotal.amount)}
          </div>
          {!gone && item.quantity > 1 && item.currentPrice ? (
            <div className="text-muted mt-[5px] font-mono text-[11.5px] leading-none">
              {formatNaira(item.currentPrice.amount)} each
            </div>
          ) : null}
          {!gone && item.leadTime ? (
            <div className="text-ink-soft mt-[8px] text-[12px] leading-[1.35]">
              Arrives in {formatLeadTime(item.leadTime)}
            </div>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}

/**
 * What moved since this line was added, said plainly and without a verdict
 * attached. Both figures are shown on a price change: re-pricing a basket under
 * somebody and showing them only the new number is the behaviour this whole
 * store exists to be an alternative to.
 */
function LineChanges({ item }: { item: CartItemView }) {
  const notes: React.ReactNode[] = [];

  if (item.availability === 'withdrawn') {
    notes.push(
      <>
        <strong className="font-bold">This listing has been withdrawn.</strong> The part number
        above is still yours to take to a workshop, and we have kept the line so you can see what it
        was rather than finding a gap where it used to be.
      </>,
    );
  } else if (item.availability === 'out_of_stock') {
    notes.push(
      <>
        <strong className="font-bold">The Lagos shelf is empty for this one.</strong> We have not
        swapped it for a sourced version or a different grade — that is your call, not ours.
      </>,
    );
  }

  if (item.changes.priceChanged && item.currentPrice) {
    const up = Number(item.currentPrice.amount) > Number(item.priceAtAdd.amount);
    notes.push(
      <>
        <strong className="font-bold">The price {up ? 'went up' : 'came down'}.</strong> You added
        it at {formatNaira(item.priceAtAdd.amount)}; it is {formatNaira(item.currentPrice.amount)}{' '}
        today. The Naira moved, and we re-quote rather than absorb it in either direction.
      </>,
    );
  }

  /* Everything below grades the line against the car. A withdrawn listing
     cannot be graded, so the note above is the whole of what we can say. */
  if (item.availability === 'withdrawn') {
    return <ChangeList notes={notes} />;
  }

  if (item.changes.fitmentChanged && item.fitmentNow) {
    notes.push(
      <>
        <strong className="font-bold">The fitment answer changed</strong> when your car did. It read{' '}
        {item.fitmentAtAdd} when you added this, and reads {item.fitmentNow.confidence} now.
      </>,
    );
  } else if (item.fitmentNow === null) {
    notes.push(
      <>
        <strong className="font-bold">We do not know if this fits you.</strong> Set your car in the
        band above and this line is re-graded — nothing is removed.
      </>,
    );
  } else if (item.fitmentNow.confidence === 'unknown') {
    notes.push(
      <>
        <strong className="font-bold">We hold no fitment record</strong> for this part on{' '}
        {item.fitmentNow.vehicle}. It may still be right; we just cannot say so, and we will not
        pretend otherwise to close a sale.
      </>,
    );
  } else if (item.fitmentNow.confidence === 'probable') {
    notes.push(
      <>
        <strong className="font-bold">Probable, not confirmed.</strong>{' '}
        {item.fitmentNow.qualifier ??
          'Check the qualifier on the part page against your own car before you pay.'}
      </>,
    );
  }

  return <ChangeList notes={notes} />;
}

function ChangeList({ notes }: { notes: readonly React.ReactNode[] }) {
  if (notes.length === 0) return null;

  return (
    <ul className="mt-[10px] grid gap-[7px]">
      {notes.map((note, index) => (
        <li key={index} className="flex gap-[9px]">
          <span className="bg-flag mt-[6px] h-[9px] w-[9px] flex-none" aria-hidden />
          <span className="text-ink-soft min-w-0 text-[12.5px] leading-[1.5]">{note}</span>
        </li>
      ))}
    </ul>
  );
}

/* --------------------------------------------------------------- summary -- */

function CartSummary({ cart, hasVehicle }: { cart: CartView; hasVehicle: boolean }) {
  return (
    <div className="grid gap-[14px] lg:sticky lg:top-[14px]">
      <Panel weight="heavy">
        <PanelBar tone="dark" weight="heavy" right="NGN">
          Basket total
        </PanelBar>
        <div className="px-[15px] py-[15px]">
          <Kicker as="div" className="text-muted tracking-[0.1em]">
            Parts subtotal
          </Kicker>
          <div className="mt-[6px] font-mono text-[27px] font-black leading-none">
            {formatNaira(cart.itemsSubtotal)}
          </div>

          {/*
           * Duty is already inside these figures — that is the store's whole
           * pricing promise and it is repeated here rather than assumed
           * remembered. Delivery is the one number we genuinely do not have
           * yet, because it depends on an address, so it is named as missing
           * instead of shown as zero. A zero would read as free.
           */}
          <p className="text-ink-soft mt-[10px] text-[12.5px] leading-[1.5]">
            Import duty and clearing are already inside that figure. Delivery is not — it is quoted
            at checkout once we know where it is going, and you see it before you pay anything.
          </p>

          <LeadTimeBlock cart={cart} />

          <div className="mt-[15px] grid gap-[9px]">
            <Button
              variant="primary"
              size="lg"
              full
              href="/checkout"
              disabled={!cart.hasBuyableLines}
            >
              {cart.hasBuyableLines ? 'Checkout' : 'Nothing to check out'}
            </Button>
            <Button variant="outline" size="md" full href="/parts">
              Keep shopping
            </Button>
          </div>

          {cart.needsAttentionCount > 0 ? (
            <p className="text-ink-soft mt-[11px] text-[12px] leading-[1.45]">
              You can check out with {cart.needsAttentionCount === 1 ? 'that line' : 'those lines'}{' '}
              as they are — it is your car and your call. We would just rather you did it knowing.
            </p>
          ) : null}
        </div>
      </Panel>

      {!hasVehicle ? (
        <Note tone="flag">
          <strong className="font-bold">No car set.</strong> Every line above is ungraded because of
          that, not because the parts are doubtful. Set it in the band at the top of the page and
          the whole basket is re-checked in place.
        </Note>
      ) : null}

      {/* Under the total, because this is the question somebody asks themselves
          in the pause before pressing Checkout, and the answer should not be
          one page away at that moment. Same words as the product screen. */}
      <ReturnsPosition />
    </div>
  );
}

/**
 * The "when" answer. A basket with one shelf part and one sourced part gets both
 * windows and the option to split, rather than the slower one presented as the
 * whole truth.
 */
function LeadTimeBlock({ cart }: { cart: CartView }) {
  if (cart.leadTime === null) return null;

  const shelf = cart.items.filter(
    (item) => item.availability === 'available' && item.stockModel === 'held_stock',
  );
  const sourced = cart.items.filter(
    (item) => item.availability === 'available' && item.stockModel === 'pre_order',
  );

  return (
    <div className="border-rule-2 mt-[14px] border-t pt-[12px]">
      <Kicker as="div" className="text-muted tracking-[0.11em]">
        When it arrives
      </Kicker>

      {cart.hasMixedLeadTimes ? (
        <>
          <p className="text-ink-soft mt-[7px] text-[12.5px] leading-[1.5]">
            Your basket has two answers, and both are true.
          </p>
          <dl className="mt-[9px] grid gap-[7px]">
            <SplitRow
              term={`${shelf.length} from the Lagos shelf`}
              value={shelf[0]?.leadTime ? formatLeadTime(shelf[0].leadTime) : '—'}
            />
            <SplitRow
              term={`${sourced.length} sourced to order`}
              value={sourced[0]?.leadTime ? formatLeadTime(sourced[0].leadTime) : '—'}
            />
          </dl>
          <p className="text-ink-soft mt-[9px] text-[12.5px] leading-[1.5]">
            Ordered together they ship together, so everything lands on the slower date. If you need
            the shelf parts now, check them out separately — remove the sourced lines, pay, then add
            them back. We will say this again at checkout rather than let you find out afterwards.
          </p>
        </>
      ) : (
        <p className="text-ink-soft mt-[7px] text-[12.5px] leading-[1.5]">
          {formatLeadTime(cart.leadTime)} from payment.{' '}
          {sourced.length > 0
            ? 'Sea freight and customs are a range, never a date — customs in particular stalls without warning, and we would rather quote the spread than a day we cannot hold.'
            : 'Held in Lagos, so this is a delivery window rather than a sourcing one.'}
        </p>
      )}
    </div>
  );
}

function SplitRow({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-[12.5px] leading-[1.4]">
      <dt className="text-muted min-w-0">{term}</dt>
      <dd className="m-0 flex-none font-mono text-[12.5px] font-bold leading-none">{value}</dd>
    </div>
  );
}

/* ----------------------------------------------------------------- empty -- */

/**
 * An empty basket that says it is empty — and, crucially, says nothing was
 * lost. That sentence is doing real work: the previous version of this route
 * was a holding page precisely because an empty basket on a store you already
 * half-suspect is how people decide the site is broken.
 */
function EmptyCart() {
  return (
    <Panel weight="heavy" className="mt-[18px]">
      <PanelBar weight="heavy" right="Nothing lost">
        Your basket is empty
      </PanelBar>
      <div className="px-[15px] py-[18px]">
        <Title className="text-[18px]">Nothing in here yet</Title>
        <p className="text-ink-soft mt-[8px] text-[13px] leading-[1.55]">
          Your basket is saved on this device, so anything you add stays here if you close the tab
          and come back. If you had parts in here and they are gone, they were removed from this
          browser — not by us.
        </p>
        <div className="mt-[16px] flex flex-wrap gap-[10px]">
          <Button variant="primary" size="lg" href="/parts">
            Browse the catalogue
          </Button>
          <Button variant="outline" size="lg" href="/estimate/new">
            Get a parts estimate
          </Button>
        </div>
      </div>
    </Panel>
  );
}
