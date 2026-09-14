'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { LeadTime } from '@mims/contracts';
import { useCart } from '@/lib/cart';
import { useEstimateFlow } from '@/lib/estimate-flow';
import { whatsappHref, whatsappMessage } from '@/lib/handoff';
import { formatNaira, formatRange, fromMinorUnits, toMinorUnits } from '@/lib/money';
import { formatLeadTime } from '@/mock/cart';
import {
  CONDITION_LABEL,
  CONDITION_NOTE,
  offersForPart,
  STOCK_LABEL,
  type ListingDetailView,
} from '@/mock/listings';
import { buildEstimate, type EstimateItemView, type EstimateView } from '@/mock/parts';
import { vehicleTitle } from '@/mock/vehicles';
import { chipState, FitmentChip } from './fitment';
import { ListingPhotoFrame } from './listing-photo';
import { Button, cx, Kicker, Note, Panel, PanelBar, Title } from './ui';

/**
 * ESTIMATOR → CART — build plan item 8.
 *
 * The founder settled that the estimator ends in the cart, and the WhatsApp and
 * PDF exits stay. This screen is the join, and it exists as a screen rather
 * than a button for one reason:
 *
 *   "ADD TO CART" MUST NEVER SILENTLY MEAN "ADD THE FOUR WE COULD PRICE".
 *
 * An estimate is a list of parts a car needs. A basket is a list of things we
 * can actually sell. Those are different lists and the difference is the whole
 * product: a five-zone estimate routinely contains a part we can name, number
 * and confirm the fitment of, and hold no priced offer for. A button that moved
 * four of five parts and said nothing would take the one honest thing this
 * business does — telling you where the gaps are — and hide it at exactly the
 * moment money starts moving.
 *
 * So every estimate line appears here, sorted into what we can sell and what we
 * cannot, with the second group named as loudly as the first. Nothing is added
 * until the customer presses the button, and the button counts.
 *
 * THE OTHER THING THIS SCREEN HAS TO EXPLAIN is that the estimate was a RANGE
 * and a basket is a PRICE. The estimator's own narration defines its range as
 * "the low end is a good aftermarket part bought well; the high end is
 * genuine" — so where both grades exist they are both offered here, the choice
 * is the customer's, and the estimate's own assumption is what starts selected.
 */
export function EstimateToCartScreen() {
  const router = useRouter();
  const { vehicle, zoneCodes, hydrated: flowHydrated } = useEstimateFlow();
  const { lines, add, hydrated: cartHydrated } = useCart();

  const hydrated = flowHydrated && cartHydrated;

  const estimate = useMemo<EstimateView | null>(
    () => (vehicle && zoneCodes.length > 0 ? buildEstimate(vehicle, zoneCodes) : null),
    [vehicle, zoneCodes],
  );

  const rows = useMemo(
    () =>
      (estimate?.items ?? []).map((item) => ({
        item,
        offers: offersForPart(item.mpn, item.partName, vehicle),
      })),
    [estimate, vehicle],
  );

  /* Chosen grade per line, and whether the line is going in at all. Both are
     lazily defaulted in the getters below rather than seeded into state, so a
     changed car re-grades this screen the way it re-grades the basket. */
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [excluded, setExcluded] = useState<Record<string, boolean>>({});

  if (!hydrated) {
    return (
      <Panel className="mt-[18px]">
        <div className="px-[15px] py-[26px]">
          <p className="text-muted m-0 font-mono text-[12.5px] leading-none">
            Checking the catalogue…
          </p>
        </div>
      </Panel>
    );
  }

  if (estimate === null) return <NothingToBuy hasVehicle={vehicle !== null} />;

  const sellable = rows.filter((row) => row.offers.length > 0);
  const gaps = rows.filter((row) => row.offers.length === 0);

  const chosenFor = (row: (typeof rows)[number]): ListingDetailView => {
    const picked = row.offers.find((offer) => offer.slug === chosen[row.item.id]);
    if (picked) return picked;
    /* The estimate's own assumption, where the store still offers it. Falling
       back to the cheapest is not a nudge: it is the end of the range the
       estimate quoted first, and the customer can see both. */
    return (
      row.offers.find((offer) => offer.condition === row.item.condition) ??
      [...row.offers].sort((a, b) =>
        Number(toMinorUnits(a.price.amount) - toMinorUnits(b.price.amount)),
      )[0]!
    );
  };

  const alreadyIn = (slug: string) => lines.some((line) => line.slug === slug);

  /* A line already in the basket starts unticked. Pressing the button twice
     must not quietly double somebody's order — `add` tops up a line that is
     already there, and that is the right behaviour for a deliberate second
     click and the wrong one for a page revisited. */
  const isIncluded = (row: (typeof rows)[number]) =>
    excluded[row.item.id] !== undefined ? !excluded[row.item.id] : !alreadyIn(chosenFor(row).slug);

  const going = sellable.filter(isIncluded);
  const total = going.reduce(
    (sum, row) => fromMinorUnits(toMinorUnits(sum) + toMinorUnits(chosenFor(row).price.amount)),
    '0.00',
  );
  /* An order arrives when its slowest part does. Same rule as the cart, stated
     the same way, because the two figures have to agree once these lines land
     in it. A listing with no window contributes nothing rather than a zero. */
  const windows = going
    .map((row) => chosenFor(row).leadTime)
    .filter((window): window is LeadTime => window !== null);
  const leadTime =
    windows.length === 0
      ? null
      : {
          minDays: Math.min(...windows.map((w) => w.minDays)),
          maxDays: Math.max(...windows.map((w) => w.maxDays)),
        };

  function addEverything() {
    for (const row of going) {
      const listing = chosenFor(row);
      add({
        slug: listing.slug,
        quantity: 1,
        partName: listing.partName,
        mpn: listing.mpn,
        sku: listing.sku,
        condition: listing.condition,
        stockModel: listing.stockModel,
        priceAtAdd: listing.price.amount,
        /* The grade recorded is the one we showed on THIS screen, against the
           car set right now — the same snapshot the product page takes. */
        fitmentAtAdd: listing.fitment?.confidence ?? null,
      });
    }
    router.push('/cart');
  }

  return (
    <div className="mt-[18px] grid gap-[18px] lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="grid gap-[14px]">
        <Coverage sellable={sellable.length} gaps={gaps.length} vehicle={vehicle} />

        {sellable.map((row) => (
          <BuyLine
            key={row.item.id}
            item={row.item}
            offers={row.offers}
            chosen={chosenFor(row)}
            included={isIncluded(row)}
            alreadyIn={alreadyIn(chosenFor(row).slug)}
            onChoose={(slug) => setChosen((prev) => ({ ...prev, [row.item.id]: slug }))}
            onToggle={(next) => setExcluded((prev) => ({ ...prev, [row.item.id]: !next }))}
          />
        ))}

        {gaps.length > 0 ? <CannotSell rows={gaps.map((row) => row.item)} /> : null}
      </div>

      <Summary
        estimate={estimate}
        count={going.length}
        total={total}
        leadTime={leadTime}
        gapCount={gaps.length}
        onAdd={addEverything}
      />
    </div>
  );
}

/* --------------------------------------------------------------- coverage -- */

/**
 * The count, before anything else on the page. If this estimate cannot be
 * bought in full, that is the first thing the customer reads — not a footnote
 * under a total they have already started adding up.
 */
function Coverage({
  sellable,
  gaps,
  vehicle,
}: {
  sellable: number;
  gaps: number;
  vehicle: ReturnType<typeof useEstimateFlow>['vehicle'];
}) {
  const all = sellable + gaps;

  if (gaps === 0) {
    return (
      <Note tone="rule">
        <strong className="font-bold">
          We can sell you all {all} {all === 1 ? 'part' : 'parts'} on this estimate.
        </strong>{' '}
        Check the grade on each one below — the estimate quoted a range because both aftermarket and
        genuine exist for some of these, and a basket has to pick one.
      </Note>
    );
  }

  return (
    <Panel tone="soft" weight="heavy">
      <PanelBar tone="flag" weight="heavy" right={`${sellable} of ${all}`}>
        Not all of this is buyable
      </PanelBar>
      <div className="px-[15px] py-[15px]">
        <Title className="text-[17px]">
          {sellable === 0
            ? 'We cannot sell you any of this yet'
            : `${gaps} of these ${gaps === 1 ? 'is' : 'are'} not something we can sell you`}
        </Title>
        <p className="text-ink-soft mt-[8px] max-w-[62ch] text-[13px] leading-[1.55]">
          {sellable === 0 ? (
            <>
              These parts fit
              {vehicle ? ` your ${vehicleTitle(vehicle)}` : ' your car'} and we hold no priced offer
              for any of them. The estimate is still worth having — the part numbers are real and a
              workshop can price them.
            </>
          ) : (
            <>
              We can name {gaps === 1 ? 'it' : 'them'}, number {gaps === 1 ? 'it' : 'them'} and tell
              you {gaps === 1 ? 'it fits' : 'they fit'}
              {vehicle ? ` your ${vehicleTitle(vehicle)}` : ' your car'} — we just hold no priced
              offer. {gaps === 1 ? 'It is' : 'They are'} listed at the bottom of this page and{' '}
              <strong className="font-bold">will not go into your basket</strong>. Your repair is
              not finished by what you buy here, and you should know that before you pay rather than
              after.
            </>
          )}
        </p>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------- line -- */

function BuyLine({
  item,
  offers,
  chosen,
  included,
  alreadyIn,
  onChoose,
  onToggle,
}: {
  item: EstimateItemView;
  offers: ListingDetailView[];
  chosen: ListingDetailView;
  included: boolean;
  alreadyIn: boolean;
  onChoose: (slug: string) => void;
  onToggle: (next: boolean) => void;
}) {
  return (
    <Panel tone="white" weight={included ? 'heavy' : 'light'}>
      <PanelBar
        weight={included ? 'heavy' : 'light'}
        right={
          <span className="font-mono">
            {item.ordinal} · {STOCK_LABEL[chosen.stockModel]}
          </span>
        }
      >
        {included ? 'Going in the basket' : alreadyIn ? 'Already in your basket' : 'Left out'}
      </PanelBar>

      <div className="flex flex-wrap gap-[14px] p-[13px]">
        <div className="border-rule-2 w-[110px] flex-none self-start border-[1.5px] sm:w-[132px]">
          <ListingPhotoFrame
            photo={chosen.photo}
            art={chosen.art}
            maxWidth={132}
            sizes="(max-width: 640px) 110px, 132px"
            emptyFill={included ? 'white' : 'hatch'}
          />
        </div>

        <div className="min-w-0 flex-[1_1_220px]">
          <div className="flex flex-wrap items-start justify-between gap-x-[12px] gap-y-[7px]">
            <Title className="min-w-0 text-[17px]">
              <Link href={`/parts/${chosen.slug}`} className="hover:underline">
                {item.partName}
              </Link>
            </Title>
            <label className="flex flex-none cursor-pointer items-center gap-[8px]">
              <input
                type="checkbox"
                checked={included}
                onChange={(event) => onToggle(event.target.checked)}
                className="accent-flag h-[20px] w-[20px] flex-none"
              />
              <Kicker as="span" className="text-muted tracking-[0.1em]">
                {included ? 'Include' : 'Excluded'}
              </Kicker>
            </label>
          </div>

          {item.detail ? (
            <p className="text-ink-soft m-0 mt-[6px] max-w-[58ch] text-[12.5px] leading-[1.5]">
              {item.detail}
            </p>
          ) : null}

          <div className="mt-[10px] flex flex-wrap items-center gap-[9px]">
            <FitmentChip confidence={chipState(chosen.fitment)} />
            <span className="text-muted font-mono text-[11.5px] font-bold uppercase leading-none tracking-[0.08em]">
              {chosen.mpn ?? 'No part number on file'}
            </span>
          </div>

          {alreadyIn ? (
            <Note tone="dashed" className="mt-[11px]">
              This is already in your basket. Ticking it adds another one rather than replacing what
              is there.
            </Note>
          ) : null}

          {/*
           * THE GRADE CHOICE, and why it is a choice rather than a default.
           * The estimate quoted a range whose two ends ARE these two parts. Both
           * are offered, priced, with the difference explained — a store that
           * quietly picked one and showed a single figure would be answering a
           * question the customer was never asked.
           */}
          <div className="mt-[12px] grid gap-[9px]">
            {offers.length > 1 ? (
              <Kicker className="text-muted tracking-[0.11em]">Which grade</Kicker>
            ) : null}

            {offers.map((offer) => {
              const selected = offer.slug === chosen.slug;
              const only = offers.length === 1;
              return (
                <label
                  key={offer.slug}
                  className={cx(
                    'flex gap-[11px] border-[1.5px] p-[11px]',
                    only ? 'border-rule-2 bg-panel' : 'cursor-pointer',
                    !only && (selected ? 'border-ink bg-flag-soft' : 'border-rule-2 bg-white'),
                  )}
                >
                  {only ? null : (
                    <input
                      type="radio"
                      name={`grade-${item.id}`}
                      checked={selected}
                      onChange={() => onChoose(offer.slug)}
                      className="accent-flag mt-[3px] h-[18px] w-[18px] flex-none"
                    />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-x-[12px] gap-y-[3px]">
                      <span className="text-[13.5px] font-bold leading-[1.3]">
                        {CONDITION_LABEL[offer.condition]}
                      </span>
                      <span className="flex-none font-mono text-[14px] font-bold leading-none">
                        {formatNaira(offer.price.amount)}
                      </span>
                    </span>
                    <span className="text-ink-soft mt-[5px] block text-[12px] leading-[1.45]">
                      {CONDITION_NOTE[offer.condition]}
                    </span>
                    <span className="text-muted mt-[4px] block font-mono text-[11px] font-bold uppercase leading-none tracking-[0.08em]">
                      {STOCK_LABEL[offer.stockModel]}
                      {offer.leadTime ? ` · ${formatLeadTime(offer.leadTime)}` : ''}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------- the gaps -- */

/**
 * The parts we cannot sell, printed in full with their numbers.
 *
 * This is not an apology block. A part number we can hand over is the most
 * useful thing on the page for somebody who now has to buy that one piece
 * elsewhere, and it is the reason the estimate is worth having even where the
 * store is empty.
 */
function CannotSell({ rows }: { rows: readonly EstimateItemView[] }) {
  return (
    <Panel weight="heavy" tone="dim">
      <PanelBar weight="heavy" right="Not added">
        We cannot sell you {rows.length === 1 ? 'this one' : `these ${rows.length}`}
      </PanelBar>
      <div className="grid">
        {rows.map((item, index) => (
          <div
            key={item.id}
            className={cx('px-[13px] py-[12px]', index > 0 && 'border-rule border-t-[1.5px]')}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-[12px] gap-y-[4px]">
              <span className="min-w-0 text-[14px] font-bold leading-[1.35]">{item.partName}</span>
              <span className="text-muted flex-none font-mono text-[11.5px] font-bold uppercase leading-none tracking-[0.08em]">
                {item.mpn ?? 'Number not on file'}
              </span>
            </div>
            <p className="text-ink-soft m-0 mt-[6px] max-w-[58ch] text-[12.5px] leading-[1.5]">
              {item.detail}
            </p>
          </div>
        ))}
      </div>
      <div className="bg-panel-2 border-ink border-t-[1.5px] px-[13px] py-[12px]">
        <p className="text-ink-soft m-0 max-w-[62ch] text-[12.5px] leading-[1.5]">
          {rows.some((item) => item.mpn !== null)
            ? 'Take the numbers above to a workshop or a trader — they are real and they are matched to your chassis, which is the part of this that is hard to get right.'
            : 'We have not got a part number on file for these yet, which is why they are not priced. The estimate still tells a workshop which panels the job needs.'}
        </p>
      </div>
    </Panel>
  );
}

/* ---------------------------------------------------------------- summary -- */

function Summary({
  estimate,
  count,
  total,
  leadTime,
  gapCount,
  onAdd,
}: {
  estimate: EstimateView;
  count: number;
  total: string;
  leadTime: LeadTime | null;
  gapCount: number;
  onAdd: () => void;
}) {
  return (
    <div className="grid gap-[14px] lg:sticky lg:top-[14px]">
      <Panel weight="heavy">
        <PanelBar tone="dark" weight="heavy" right="NGN">
          What goes in the basket
        </PanelBar>
        <div className="px-[15px] py-[15px]">
          <Kicker as="div" className="text-muted tracking-[0.1em]">
            {count === 0 ? 'Nothing selected' : `${count} ${count === 1 ? 'part' : 'parts'}`}
          </Kicker>
          <div className="mt-[6px] font-mono text-[27px] font-black leading-none">
            {formatNaira(total)}
          </div>

          {/*
           * THE TWO FIGURES WILL NOT MATCH, and the customer will notice. An
           * estimate is a negotiating range across two grades of part; a basket
           * is one price for the parts actually chosen, minus anything we
           * cannot supply. Saying that here is cheaper than being asked it
           * after the money has moved.
           */}
          {estimate.subtotal ? (
            <div className="border-rule-2 mt-[13px] border-t-[1.5px] pt-[12px]">
              <Kicker as="div" className="text-muted-2 tracking-[0.1em]">
                Your estimate said
              </Kicker>
              <div className="mt-[5px] font-mono text-[14px] font-bold leading-[1.3]">
                {formatRange(estimate.subtotal)}
              </div>
              <p className="text-ink-soft m-0 mt-[8px] text-[12.5px] leading-[1.5]">
                A range, because its low end is a good aftermarket part and its high end is genuine.
                This figure is what you have actually picked
                {gapCount > 0 ? ', and it leaves out what we cannot supply' : ''}.
              </p>
            </div>
          ) : null}

          {leadTime ? (
            <p className="text-ink-soft mt-[12px] text-[12.5px] leading-[1.5]">
              Arrives in <strong className="font-bold">{formatLeadTime(leadTime)}</strong> from
              payment. Anything sourced abroad is quoted in weeks because that is the truth about
              sea freight and customs.
            </p>
          ) : null}
        </div>
      </Panel>

      <Panel weight="heavy" tone={count > 0 ? 'soft' : 'panel'}>
        <div className="px-[15px] py-[15px]">
          <Button variant="primary" size="lg" full disabled={count === 0} onClick={onAdd}>
            {count === 0
              ? 'Nothing to add'
              : `Add ${count} ${count === 1 ? 'part' : 'parts'} to the basket`}
          </Button>
          <p className="text-ink-soft m-0 mt-[11px] text-[12.5px] leading-[1.5]">
            Nothing is charged. The basket re-checks every line against your car each time you open
            it, and you can still change your mind there.
          </p>
        </div>
      </Panel>

      {/*
       * The exits the founder kept. They are not a lesser path: a mechanic
       * reading part numbers out of a WhatsApp thread is still the most common
       * way this estimate gets used, and buying from us is one option rather
       * than the only one.
       */}
      <Panel>
        <PanelBar>Or take it away instead</PanelBar>
        <div className="grid gap-[9px] p-[13px]">
          <Button variant="dark" size="md" full href={whatsappHref(whatsappMessage(estimate))}>
            Send to WhatsApp
          </Button>
          <Button variant="outline" size="md" full href={`/estimate/${estimate.reference}/share`}>
            Download the PDF
          </Button>
          <p className="text-muted m-0 text-center text-[12px] leading-[1.45]">
            <Link href="/estimate" className="underline">
              Back to the estimate
            </Link>
          </p>
        </div>
      </Panel>
    </div>
  );
}

/* ---------------------------------------------------------------- empties -- */

function NothingToBuy({ hasVehicle }: { hasVehicle: boolean }) {
  return (
    <Panel weight="heavy" className="mt-[18px]">
      <PanelBar weight="heavy">There is no estimate to buy from</PanelBar>
      <div className="px-[15px] py-[18px]">
        <p className="text-ink-soft m-0 text-[13px] leading-[1.55]">
          {hasVehicle
            ? 'Mark which panels are damaged and we will match the parts, price what we can, and say plainly what we cannot.'
            : 'Start with the car. Parts are matched to its chassis code rather than its model name, and nothing on this site means anything until we know which car it is about.'}
        </p>
        <div className="mt-[16px] flex flex-wrap gap-[10px]">
          <Button variant="primary" size="lg" href={hasVehicle ? '/damage' : '/estimate/new'}>
            {hasVehicle ? 'Mark the damage' : 'Identify the vehicle'}
          </Button>
          <Button variant="outline" size="lg" href="/parts">
            Browse the catalogue
          </Button>
        </div>
      </div>
    </Panel>
  );
}
