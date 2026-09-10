import type { Metadata } from 'next';
import { AppHeader, PageHeading, Shell, SiteFooter } from '@/components/chrome';
import { Button, Kicker, Panel, SquareList, StatCells, Title } from '@/components/ui';
import { CATALOGUE_STATS } from '@/mock/coverage';

export const metadata: Metadata = {
  title: 'Where these numbers come from',
  description:
    'How MIMS prices parts: chassis-code matching, three quotes minimum per part, ranges rather than averages, and where we are likely to be wrong.',
};

/**
 * How we price parts.
 *
 * An estimate is only useful if you can argue with it, so this page is written
 * to be argued with. Claim 04 lists what the number excludes and claim 05 says
 * where we are likely to be wrong — that admission is the part that makes the
 * other four believable, and it is why it is on the page rather than in a
 * footnote.
 */
export default function HowWePricePage() {
  return (
    <>
      <AppHeader label="How we price parts" />
      <main>
        <Shell width="read" className="px-[20px] pt-[24px]">
          <PageHeading
            title="Where these numbers come from"
            lede="An estimate is only useful if you can argue with it. This page says exactly how each figure is produced, what it excludes, and where it is likely to be wrong."
            ledeBelow
          />

          <div className="mt-[22px] grid gap-[14px]">
            <Claim
              number="01"
              title="Your car is reduced to a chassis code"
              body={
                <>
                  A &ldquo;2018 Corolla&rdquo; is not one car. We decode the VIN, or your
                  make-model-year-trim, down to a chassis code — ZRE172, for example. Parts are then
                  matched to that code, which is why the numbers differ between a 2018 and a 2019
                  that look identical.
                </>
              }
            />

            <Claim
              number="02"
              title="Three quotes minimum, per part"
              body={
                <>
                  For every part number we hold at least three recent Nigerian prices: one
                  authorised dealer counter, and two independent traders — mostly Ladipo in Lagos,
                  with Kano and Onitsha coming. Cash prices, no credit terms.
                </>
              }
            >
              <StatCells
                className="mt-[12px]"
                items={[
                  { label: 'Dealer counter', value: '1 SOURCE', basis: '140px' },
                  { label: 'Market traders', value: '2–4 SOURCES', basis: '140px' },
                  { label: 'Refreshed', value: 'WEEKLY', basis: '140px' },
                ]}
              />
            </Claim>

            <Claim
              number="03"
              title="The range is the answer, not the average"
              body={
                <>
                  We show a low and a high because one number would be a lie. The low end is a good
                  aftermarket part bought well. The high end is genuine, from a dealer. Both are
                  real prices somebody paid this month.
                </>
              }
            >
              <div className="border-ink mt-[13px] border-[1.5px] bg-white p-[13px]">
                <Kicker className="text-muted-2 tracking-[0.1em]">
                  Example · front bumper cover, 52119-02997
                </Kicker>

                {/* The quoted band, with the tails that were thrown away either
                    side of it. Showing the discards is the argument. */}
                <div className="border-ink mt-[12px] flex h-[16px] border-[1.5px]">
                  <div className="bg-panel-2 flex-[3]" />
                  <div className="bg-flag flex-[5]" />
                  <div className="bg-panel-2 flex-[3]" />
                </div>
                <div className="text-muted mt-[7px] flex flex-wrap justify-between gap-x-[14px] gap-y-[6px] font-mono text-[11px] font-bold leading-[1.4] tracking-[0.06em]">
                  <span>₦120k SEEN ONCE</span>
                  <span className="text-ink">₦148k – ₦186k QUOTED RANGE</span>
                  <span>₦230k OUTLIER</span>
                </div>
                <p className="text-ink-soft mt-[10px] text-[12.5px] leading-[1.5]">
                  Outliers are dropped, not averaged in. A single suspiciously cheap or expensive
                  quote does not move your estimate.
                </p>
              </div>
            </Claim>

            {/* Inverted on purpose: what the number excludes is the thing a user
                is most likely to be caught out by, so it gets the loud panel. */}
            <div className="border-ink bg-flag-soft flex flex-wrap gap-[14px] border-2 p-[16px]">
              <div className="bg-ink border-ink text-flag flex h-[46px] flex-[0_0_46px] items-center justify-center border-[1.5px] font-mono text-[15px] font-bold leading-none">
                04
              </div>
              <div className="min-w-0 flex-[1_1_300px]">
                <Title className="text-[17px] leading-[1.2]">What we do not include</Title>
                <SquareList
                  tone="ink"
                  className="mt-[11px]"
                  items={[
                    <>
                      <strong className="font-bold">Labour, paint and panel-beating.</strong> On a
                      front-end job in Lagos, expect ₦40,000–₦90,000 on top.
                    </>,
                    <>
                      <strong className="font-bold">Hidden damage.</strong> A bent slam panel behind
                      an intact bumper only shows once the car is opened up.
                    </>,
                    <>
                      <strong className="font-bold">Consumables.</strong> Clips, bolts, coolant and
                      gaskets. Small individually, ₦5,000–₦15,000 together.
                    </>,
                    <>
                      <strong className="font-bold">Anything outside Lagos.</strong> Prices
                      upcountry run higher once transport is added.
                    </>,
                  ]}
                />
              </div>
            </div>

            <Claim
              number="05"
              title="Where we are likely to be wrong"
              body={
                <>
                  Parts prices track the exchange rate, so a figure four weeks old can be low. Rare
                  trims, imported facelift variants and anything electronic are our weakest areas.
                  If a workshop quotes above our high end and can name the part number, they may
                  simply be right — the number to argue about is the part, not the total.
                </>
              }
            />

            <Panel className="p-[16px]">
              <Kicker className="text-muted tracking-[0.12em]">Corrections</Kicker>
              <p className="text-ink-soft mt-[9px] max-w-[62ch] text-[13.5px] leading-[1.6]">
                If you paid a different price, tell us. Real receipts are the best data we get, and
                they are how the catalogue becomes accurate rather than merely large.
              </p>
              <div className="mt-[13px] flex flex-wrap gap-[10px]">
                <Button
                  variant="primary"
                  size="md"
                  href="/estimate/MI-4471/feedback"
                  className="min-h-[50px] flex-[1_1_220px]"
                >
                  Report a price you paid
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  href="/coverage"
                  className="min-h-[50px] flex-[1_1_200px]"
                >
                  See coverage by make
                </Button>
              </div>
            </Panel>
          </div>

          <div className="text-muted-2 mt-[20px] flex flex-wrap gap-x-4 gap-y-2 font-mono text-[11px] font-bold uppercase leading-[1.5] tracking-[0.09em]">
            <span>Last catalogue refresh {CATALOGUE_STATS.lastRefresh}</span>
            <span aria-hidden>·</span>
            <span>{CATALOGUE_STATS.partNumbers} part numbers</span>
            <span aria-hidden>·</span>
            <span>{CATALOGUE_STATS.modelsPriced} models</span>
          </div>
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}

function Claim({
  number,
  title,
  body,
  children,
}: {
  number: string;
  title: string;
  body: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Panel className="flex flex-wrap gap-[14px] p-[16px]">
      <div className="bg-flag border-ink text-flag-ink flex h-[46px] flex-[0_0_46px] items-center justify-center border-[1.5px] font-mono text-[15px] font-bold leading-none">
        {number}
      </div>
      <div className="min-w-0 flex-[1_1_300px]">
        <Title className="text-[17px] leading-[1.2]">{title}</Title>
        <p className="text-ink-soft mt-[8px] text-[13.5px] leading-[1.6]">{body}</p>
        {children}
      </div>
    </Panel>
  );
}
