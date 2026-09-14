'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useEstimateFlow } from '@/lib/estimate-flow';
import { formatLongDate, formatNaira } from '@/lib/money';
import { imageDeliveryConfigured } from '@/lib/images';
import {
  categoryName,
  CONDITION_LABEL,
  CONDITION_NOTE,
  listingBySlug,
  STOCK_LABEL,
} from '@/mock/listings';
import { AddToCart } from './add-to-cart';
import { FitmentTable, FitmentVerdictPanel } from './fitment';
import { leadTimeSentence } from './listing-row';
import { ListingPhotoFrame } from './listing-photo';
import { PartNumber } from './part-number';
import { Kicker, Note, Panel, PanelBar, QuantityStepper, StatCells, Title } from './ui';

/**
 * THE PRODUCT SCREEN — build plan item 4, and the screen the business lives or
 * dies on.
 *
 * Everything above the buy button is arranged as one argument, in the order a
 * careful buyer actually asks it: what is this part, does it fit MY car, what
 * will you charge me, when does it arrive. Fitment sits ABOVE the price
 * deliberately. A shopper who reads the price first has started negotiating
 * with themselves before they know whether the part bolts on, and against three
 * to six weeks of sea freight that is the expensive order to ask the questions
 * in.
 *
 * What this screen refuses to do is as much of the design as what it does.
 * There is no countdown, no "3 left in stock" where the number is not real, no
 * struck-through price, no urgency of any kind. The customer arrived here
 * suspecting the whole trade of overcharging them; every one of those devices
 * would confirm it.
 */
export function ListingDetailScreen({ slug }: { slug: string }) {
  const { vehicle, hydrated } = useEstimateFlow();
  const [quantity, setQuantity] = useState(1);

  // Grading waits for the device store, exactly as the search screen does —
  // "car not set" flashed at somebody who set one an hour ago reads as us
  // having lost it.
  const listing = listingBySlug(slug, hydrated ? vehicle : null);
  if (!listing) return null;

  return (
    <>
      <nav aria-label="Breadcrumb" className="mt-[16px]">
        <ol className="text-muted flex flex-wrap items-center gap-x-[8px] gap-y-[4px] font-mono text-[11px] font-bold uppercase leading-none tracking-[0.09em]">
          <li>
            <Link href="/parts" className="underline">
              Catalogue
            </Link>
          </li>
          <li aria-hidden>·</li>
          <li>
            <Link href={`/parts?category=${listing.categoryCode}`} className="underline">
              {categoryName(listing.categoryCode ?? '')}
            </Link>
          </li>
        </ol>
      </nav>

      <div className="mt-[14px] flex flex-wrap items-start gap-[22px]">
        {/* ------------------------------------------------ the part itself -- */}
        <div className="min-w-0 flex-[2_1_420px]">
          <Kicker as="div" className="text-flag-deep tracking-[0.16em]">
            {CONDITION_LABEL[listing.condition]} · {STOCK_LABEL[listing.stockModel]}
          </Kicker>
          <h1 className="mt-[9px] text-[26px] font-black uppercase leading-[1.05] tracking-[-0.02em] sm:text-[30px]">
            {listing.title}
          </h1>
          <p className="text-ink-soft mt-[10px] max-w-[58ch] text-[14px] leading-[1.55]">
            {listing.detail}
          </p>

          <Panel weight="heavy" className="mt-[16px]">
            <ListingPhotoFrame
              photo={listing.photos[0] ?? null}
              art={listing.art}
              maxWidth={640}
              sizes="(max-width: 900px) 100vw, 560px"
              stamp
            />
          </Panel>

          {/*
           * Said in words under the frame, not left for the reader to work out.
           * Three cases and three sentences, because the difference between
           * them is exactly what a buyer needs and would otherwise guess at.
           *
           * The middle case is the one that matters. We are merchant of record,
           * so the picture is our description of the goods: an unlabelled stock
           * photograph is a misdescription the moment the customer's part
           * arrives with a different connector, and under the FCCPA that is a
           * refund whatever our policy says. Labelling it does not make the
           * shortcut free, but it is the difference between a presentation
           * stopgap and a claim we cannot stand behind.
           */}
          {listing.photos.length === 0 ? (
            <Note tone="dashed" className="mt-[10px]">
              <strong className="font-bold">This is a drawing, not the item.</strong> We hold no
              photograph of this part yet, so the picture above is our schematic of the kind of part
              it is.
              {imageDeliveryConfigured() ? null : ' Listing photography is being set up now.'}
            </Note>
          ) : listing.photos[0]?.illustrative ? (
            <Note tone="rule" className="mt-[10px]">
              <strong className="font-bold">
                This photograph shows the kind of part, not the one you will receive.
              </strong>{' '}
              It is a stock image we are using while we photograph our own stock. Do not judge the
              colour, the finish, the connector or the badging from it — judge fitment from the
              verdict and the part number, which are about your car and are the things we stand
              behind. If anything we ship is not what we described, that is a refund.
            </Note>
          ) : null}

          {/* ------------------------------------------------ the numbers -- */}
          <section aria-labelledby="identity-heading" className="mt-[24px]">
            <div className="border-ink border-b-2 pb-[10px]">
              <Title as="h2" id="identity-heading" className="text-[17px]">
                What to quote
              </Title>
            </div>
            <div className="mt-[13px] flex flex-wrap gap-[16px]">
              <div className="min-w-0 flex-[1_1_260px]">
                <Kicker as="div" className="text-muted tracking-[0.11em]">
                  Manufacturer part number
                </Kicker>
                <div className="mt-[7px]">
                  <PartNumber value={listing.mpn} />
                </div>
                <p className="text-muted mt-[8px] text-[12px] leading-[1.45]">
                  Read this to a dealer rather than describing the job. A number is quoted against;
                  a description is estimated against.
                </p>
              </div>
              <div className="min-w-0 flex-[1_1_240px]">
                <StatCells
                  items={[
                    {
                      label: 'Fits position',
                      value: positionLabel(listing.position),
                      basis: '120px',
                    },
                    { label: 'Grade', value: CONDITION_LABEL[listing.condition], basis: '120px' },
                    { label: 'Our stock code', value: listing.sku, basis: '200px' },
                  ]}
                />
              </div>
            </div>

            {/*
             * Cross-references are empty and say so. A shopper holding a part
             * with a different number stamped on it is exactly who this block
             * is for, and pretending we can match it would be the invented part
             * number the whole product forbids.
             */}
            <div className="mt-[14px]">
              <Kicker as="div" className="text-muted tracking-[0.11em]">
                Other numbers for the same part
              </Kicker>
              {listing.crossReferences.length > 0 ? (
                <ul className="mt-[8px] flex flex-wrap gap-[8px]">
                  {listing.crossReferences.map((reference) => (
                    <li
                      key={reference.number}
                      className="border-rule-2 select-part-number border-[1.5px] bg-white px-[8px] py-[5px] font-mono text-[12px] font-bold leading-none"
                    >
                      {reference.number}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted mt-[7px] max-w-[62ch] text-[12.5px] leading-[1.5]">
                  We hold no cross-references for this part yet. If the number on your old part is
                  different from the one above, that does not mean it is the wrong part — send it to
                  us and we will check it against the catalogue before you buy.
                </p>
              )}
            </div>
          </section>

          {/* ------------------------------------------------- the evidence -- */}
          <section aria-labelledby="fitment-heading" className="mt-[24px]">
            <div className="border-ink flex flex-wrap items-end justify-between gap-x-[16px] gap-y-[4px] border-b-2 pb-[10px]">
              <Title as="h2" id="fitment-heading" className="text-[17px]">
                Every car we hold a record for
              </Title>
              <Kicker as="span" className="text-muted tracking-[0.11em]">
                {listing.fitments.length} record{listing.fitments.length === 1 ? '' : 's'}
              </Kicker>
            </div>
            <p className="text-ink-soft mt-[10px] max-w-[66ch] text-[13px] leading-[1.55]">
              This is the whole of what we know about this part, printed so the verdict beside it
              can be checked rather than taken on trust. It is a short list, and that is the
              truthful size of a catalogue we are still building — a car missing from it has told
              you something real.
            </p>
            <div className="mt-[13px]">
              <FitmentTable rows={listing.fitments} />
            </div>
          </section>

          {/* ---------------------------------------------- the other grade -- */}
          {listing.alternatives.length > 0 ? (
            <section aria-labelledby="alternatives-heading" className="mt-[24px]">
              <div className="border-ink border-b-2 pb-[10px]">
                <Title as="h2" id="alternatives-heading" className="text-[17px]">
                  The same part, other grades
                </Title>
              </div>
              <p className="text-ink-soft mt-[10px] max-w-[66ch] text-[13px] leading-[1.55]">
                Genuine and aftermarket are different goods, not a discount on each other. Same
                part, same fitment, different manufacture — stated plainly so you can pick rather
                than be steered.
              </p>
              <ul className="mt-[13px] grid gap-[10px]">
                {listing.alternatives.map((alternative) => (
                  <li key={alternative.id}>
                    <Link
                      href={`/parts/${alternative.slug}`}
                      className="border-ink bg-panel hover:bg-panel-4 flex flex-wrap items-center justify-between gap-x-[16px] gap-y-[8px] border-[1.5px] px-[13px] py-[11px]"
                    >
                      <span className="min-w-0 flex-[1_1_240px]">
                        <span className="block text-[14px] font-bold uppercase leading-[1.2]">
                          {CONDITION_LABEL[alternative.condition]}
                        </span>
                        <span className="text-muted mt-[4px] block text-[12px] leading-[1.4]">
                          {CONDITION_NOTE[alternative.condition]}
                        </span>
                      </span>
                      <span className="flex flex-none items-baseline gap-[10px]">
                        <span className="font-mono text-[16px] font-bold leading-none">
                          {formatNaira(alternative.price.amount)}
                        </span>
                        <span className="text-flag-deep font-mono text-[11px] font-bold uppercase leading-none tracking-[0.09em]">
                          View →
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <Note tone="dashed" className="mt-[24px]">
              <strong className="font-bold">
                We list only the {CONDITION_LABEL[listing.condition].toLowerCase()} grade of this
                part today.
              </strong>{' '}
              Where we can source a second grade we list it beside the first rather than replacing
              it — the choice between genuine and tokunbo is the customer&rsquo;s, and it is a real
              choice, not a discount.
            </Note>
          )}
        </div>

        {/* ------------------------------------------------------ the buy -- */}
        <div className="min-w-0 flex-[1_1_300px] lg:sticky lg:top-[16px]">
          <div className="grid gap-[14px]">
            <FitmentVerdictPanel
              verdict={listing.fitment}
              fitmentNote={listing.fitmentNote}
              onSetVehicle={
                <p className="text-ink-soft m-0 text-[12.5px] leading-[1.45]">
                  Use the <strong className="font-bold">Set your car</strong> band at the top of the
                  page. It takes four taps and it is remembered.
                </p>
              }
            />

            <Panel weight="heavy">
              <PanelBar weight="heavy" tone="dark" right="Duty included">
                All-in price
              </PanelBar>
              <div className="p-[15px]">
                <div className="font-mono text-[30px] font-bold leading-none tracking-[-0.02em]">
                  {formatNaira(listing.price.amount)}
                </div>
                <p className="text-muted mt-[9px] text-[12px] leading-[1.45]">
                  Import duty, clearing and VAT are already inside this figure. Delivery is added
                  once, before you pay. Nothing appears for the first time at the last step.
                </p>

                {listing.priceValidUntil ? (
                  /*
                   * The FX window, shown rather than buried. The Naira moved
                   * between ₦1,350 and ₦1,430 across 2026 with active
                   * pass-through into import prices, and we take payment
                   * upfront — so we carry that risk, and the honest form of
                   * that is a price with a stated shelf life instead of a
                   * figure that quietly changes under the customer.
                   */
                  <p className="border-rule-2 text-muted mt-[11px] border-t pt-[10px] text-[12px] leading-[1.45]">
                    This price is held until{' '}
                    <span className="text-ink font-mono text-[12px] font-bold">
                      {formatLongDate(listing.priceValidUntil)}
                    </span>
                    . After that it is re-quoted against the rate of the day, up or down.
                  </p>
                ) : null}

                <div className="border-rule-2 mt-[12px] border-t pt-[12px]">
                  <Kicker as="div" className="text-muted tracking-[0.11em]">
                    {listing.stockModel === 'held_stock' ? 'In stock' : 'Sourced to order'}
                  </Kicker>
                  <p className="text-ink-soft mt-[6px] text-[12.5px] leading-[1.45]">
                    {listing.leadTime
                      ? `${leadTimeSentence(listing.leadTime.minDays, listing.leadTime.maxDays)}.`
                      : 'Lead time not stated for this listing.'}
                    {listing.stockModel === 'pre_order' ? (
                      <>
                        {' '}
                        Sea freight and customs are a range, never a date — customs in particular
                        stalls without warning, and we would rather quote you the spread than a day
                        we cannot hold.
                      </>
                    ) : null}
                  </p>
                </div>

                <div className="mt-[15px] flex flex-wrap items-center gap-[12px]">
                  <QuantityStepper
                    value={quantity}
                    onChange={setQuantity}
                    label="Quantity"
                    max={
                      listing.stockModel === 'held_stock'
                        ? Math.max(1, listing.quantityAvailable)
                        : 99
                    }
                  />
                  <span className="text-muted min-w-0 flex-1 text-[12px] leading-[1.4]">
                    {listing.stockModel === 'held_stock'
                      ? `${listing.quantityAvailable} on the shelf in Lagos`
                      : 'Ordered in for you'}
                  </span>
                </div>

                <AddToCart listing={listing} quantity={quantity} />
              </div>
            </Panel>

            <Panel>
              <PanelBar>Getting it to you</PanelBar>
              <div className="p-[13px]">
                <ul className="grid gap-[9px]">
                  {[
                    ['Door delivery', 'To your address, quoted at checkout before you pay.'],
                    ['Pickup', 'Collect from a counter. Neither is the default; you pick.'],
                    ['Paying', 'Card, bank transfer, USSD or bank account, through Paystack.'],
                  ].map(([term, note]) => (
                    <li key={term} className="flex gap-[10px]">
                      <span className="bg-flag mt-[6px] h-[9px] w-[9px] flex-none" aria-hidden />
                      <span className="min-w-0 text-[12.5px] leading-[1.5]">
                        <strong className="font-bold">{term}.</strong> {note}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Panel>

            {/*
             * The lawful position, stated on the screen where the money is
             * committed rather than only on a policy page. "No return, no
             * refund" is contrary to the FCCPA 2018 and the FCCPC has said so —
             * defective, counterfeit or misdescribed goods are a replacement or
             * a refund whatever any store's policy claims.
             */}
            <Note tone="rule">
              <strong className="font-bold">If it is our mistake, it is our cost.</strong>{' '}
              Defective, counterfeit, or not what we described — you get a replacement or your money
              back, and no policy of ours overrides that. What we cannot absorb is a part that was
              described correctly and ordered against the wrong car, which is why we are so careful
              about the verdict above.
            </Note>
          </div>
        </div>
      </div>
    </>
  );
}

function positionLabel(position: string): string {
  const LABELS: Record<string, string> = {
    left: 'Left',
    right: 'Right',
    front: 'Front',
    rear: 'Rear',
    pair: 'Sold as a pair',
    not_applicable: '—',
  };
  return LABELS[position] ?? position;
}
