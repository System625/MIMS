import Link from 'next/link';
import { formatNaira } from '@/lib/money';
import {
  CONDITION_LABEL,
  STOCK_LABEL,
  type CatalogueGap,
  type ListingSummaryView,
} from '@/mock/listings';
import { chipState, FitmentChip } from './fitment';
import { ListingPhotoFrame } from './listing-photo';
import { cx, Kicker, Title } from './ui';

/**
 * A SEARCH RESULT.
 *
 * Laid out as a row rather than a card grid, and that is the tone decision this
 * screen turns on. A grid of glossy tiles is a shopping experience; a ruled row
 * carrying a picture, a number, a grade and a price is a parts counter handing
 * you a line off the catalogue. The second is what this business is, and it is
 * also what the customer — who suspects everyone in this trade of overcharging
 * — is able to trust.
 *
 * Order within the row is deliberate: the drawing first because a part is
 * recognised by sight long before its number is read, then the name and number,
 * then the fitment grade, and the price last. Nothing is struck through,
 * nothing counts down, and no row claims to be nearly sold out.
 */
export function ListingRow({ listing }: { listing: ListingSummaryView }) {
  const href = `/parts/${listing.slug}`;

  return (
    <article className="border-ink bg-panel flex flex-wrap items-stretch gap-0 border-[1.5px]">
      {/*
       * The basis values below are set for a 400px phone, not for the desktop
       * the design canvas was drawn at. At 132px wide with a 320px text column
       * the text wrapped to its own line and left the drawing sitting in the
       * corner of an empty strip; 104px against a 190px column keeps the
       * picture and the part name on one line, which is the pairing that makes
       * a catalogue row scannable at all.
       */}
      <div className="border-rule-2 w-[104px] flex-none border-r-[1.5px] sm:w-[168px]">
        <ListingPhotoFrame
          photo={listing.photo}
          art={listing.art}
          maxWidth={168}
          sizes="(max-width: 640px) 104px, 168px"
          className="h-full"
          emptyFill="white"
        />
      </div>

      <div className="flex min-w-0 flex-[1_1_190px] flex-col gap-[9px] p-[13px]">
        <div className="flex flex-wrap items-start justify-between gap-x-[12px] gap-y-[7px]">
          <Title as="h3" className="min-w-0 flex-[1_1_180px] text-[15px]">
            <Link href={href} className="hover:text-flag-deep underline-offset-2 hover:underline">
              {listing.title}
            </Link>
          </Title>
          <FitmentChip confidence={chipState(listing.fitment)} />
        </div>

        {/*
         * The part number, selectable but not the copy control — that lives on
         * the product screen, where somebody is actually about to read it to a
         * dealer. A row of copy buttons would be five affordances competing
         * with the one that matters, which is opening the part.
         */}
        <div className="flex flex-wrap items-center gap-x-[10px] gap-y-[6px]">
          {listing.mpn ? (
            <span className="select-part-number border-rule-2 border-[1.5px] bg-white px-[7px] py-[4px] font-mono text-[12px] font-bold leading-none tracking-[0.03em]">
              {listing.mpn}
            </span>
          ) : (
            <span className="border-edge-2 text-faint border-[1.5px] border-dashed px-[7px] py-[4px] font-mono text-[10.5px] font-bold uppercase leading-none tracking-[0.1em]">
              No part number on file
            </span>
          )}
          <Kicker as="span" className="text-muted tracking-[0.1em]">
            {CONDITION_LABEL[listing.condition]}
          </Kicker>
          {/* The separator travels with the label it precedes, so a wrap at
              phone width cannot leave a middot orphaned at the end of a line. */}
          <Kicker as="span" className="text-muted tracking-[0.1em]">
            <span className="text-edge-2" aria-hidden>
              ·{' '}
            </span>
            {STOCK_LABEL[listing.stockModel]}
          </Kicker>
        </div>

        {listing.fitment?.qualifier ? (
          <p className="text-ink-soft m-0 text-[12px] leading-[1.45]">
            <span className="text-flag-deep font-mono text-[10.5px] font-bold uppercase tracking-[0.1em]">
              Only{' '}
            </span>
            {listing.fitment.qualifier}
          </p>
        ) : null}
      </div>

      {/*
       * The price column. One figure, duty inside it, stated once — and the
       * lead time immediately under it, because on a four-week import those two
       * numbers are one fact and separating them is how a customer is
       * surprised.
       */}
      <div className="border-rule-2 flex flex-[1_1_190px] flex-col justify-between gap-[10px] border-t-[1.5px] p-[13px] sm:border-l-[1.5px] sm:border-t-0">
        <div>
          <Kicker as="div" className="text-muted-2 tracking-[0.1em]">
            All-in, duty included
          </Kicker>
          <div className="mt-[6px] font-mono text-[19px] font-bold leading-none tracking-[-0.01em]">
            {formatNaira(listing.price.amount)}
          </div>
          {listing.leadTime ? (
            <div className="text-muted mt-[7px] text-[12px] leading-[1.4]">
              {leadTimeSentence(listing.leadTime.minDays, listing.leadTime.maxDays)}
            </div>
          ) : null}
        </div>

        <Link
          href={href}
          className="border-ink bg-panel-2 hover:bg-panel-4 inline-flex min-h-[40px] items-center justify-center border-[1.5px] px-[12px] text-center font-mono text-[11.5px] font-bold uppercase leading-none tracking-[0.06em]"
        >
          See fitment & buy
        </Link>
      </div>
    </article>
  );
}

/**
 * Lead time is always a range and never a date. Sea freight from China runs
 * three to six weeks before customs, and customs is precisely the part nobody
 * can promise, so a date here would be a promise we cannot keep.
 */
export function leadTimeSentence(minDays: number, maxDays: number): string {
  if (maxDays <= 7) return `Ships in ${minDays}–${maxDays} working days`;
  const weeks = (days: number) => Math.round(days / 7);
  return `Arrives in about ${weeks(minDays)}–${weeks(maxDays)} weeks`;
}

/**
 * A PART WE CAN NAME BUT CANNOT SELL.
 *
 * Kept as its own tier below the listings rather than mixed in or dropped. A
 * shopper who searches for a rear bumper we do not stock is better served by
 * its part number and a plain "not stocked" than by an empty page: the number
 * is the thing they can carry into any workshop, which is the estimator's whole
 * argument and it does not stop being true at the shop door. Dropping these
 * rows would also quietly teach them we have nothing, when what we have is no
 * stock and a good answer.
 */
export function CatalogueGapRow({ gap }: { gap: CatalogueGap }) {
  return (
    <article className="border-edge-2 bg-panel-3 flex flex-wrap items-stretch border-[1.5px] border-dashed">
      <div className="border-edge w-[92px] flex-none border-r-[1.5px] border-dashed">
        <ListingPhotoFrame
          photo={null}
          art={gap.art}
          maxWidth={92}
          sizes="92px"
          className="h-full"
          emptyFill="hatch"
        />
      </div>

      <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-[7px] p-[12px]">
        <div className="flex flex-wrap items-start justify-between gap-x-[12px] gap-y-[6px]">
          <Title as="h3" className="text-muted min-w-0 flex-[1_1_180px] text-[14px]">
            {gap.name}
          </Title>
          <FitmentChip confidence={chipState(gap.fitment)} />
        </div>

        <div className="flex flex-wrap items-center gap-[8px]">
          {gap.mpn ? (
            <span className="select-part-number border-edge border-[1.5px] bg-white px-[7px] py-[4px] font-mono text-[12px] font-bold leading-none">
              {gap.mpn}
            </span>
          ) : null}
          <Kicker as="span" className="text-muted-2 tracking-[0.1em]">
            Not stocked yet
          </Kicker>
        </div>

        <p className="text-muted m-0 text-[12px] leading-[1.45]">
          {gap.mpn
            ? 'We can name and number this part but hold no priced offer for it. The number is still worth taking to a workshop — ask them to quote against the number, not the job.'
            : 'We know this part is what your car needs, and we do not yet hold its number or a price. Neither is worth inventing.'}
        </p>
      </div>
    </article>
  );
}

/** Shared framing for the two tiers, so they read as one list with two grades. */
export function ResultTierHeading({
  title,
  count,
  note,
  className,
}: {
  title: string;
  count: number;
  note?: string;
  className?: string;
}) {
  return (
    <div
      className={cx(
        'border-ink flex flex-wrap items-end justify-between gap-x-[16px] gap-y-[4px] border-b-2 pb-[9px]',
        className,
      )}
    >
      <Title as="h2" className="text-[16px]">
        {title}
      </Title>
      <Kicker as="span" className="text-muted tracking-[0.11em]">
        {note ? `${note} · ` : ''}
        {count} {count === 1 ? 'result' : 'results'}
      </Kicker>
    </div>
  );
}
