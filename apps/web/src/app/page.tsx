import type { Metadata } from 'next';
import Link from 'next/link';
import { CartLink } from '@/components/cart-link';
import { AppHeader, PageHeading, Shell, SiteFooter } from '@/components/chrome';
import {
  Button,
  Kicker,
  Note,
  Panel,
  PanelBar,
  SquareList,
  StatCells,
  Title,
} from '@/components/ui';
import { CarPlanArt, PartArt, PartsClusterArt } from '@/components/part-art';
import { VehicleContext } from '@/components/vehicle-context';
import { COMING_SOON, HOW_BUYING_WORKS, STORE_CATEGORIES } from '@/mock/store';

export const metadata: Metadata = {
  title: 'Car parts in Nigeria, priced before you buy',
  description:
    'Body parts for Nigerian cars at one all-in Naira price, duty included. Set your car once and see what actually fits it. Delivery or pickup, card, transfer or USSD.',
};

/**
 * THE MARKETPLACE HOME — the front door.
 *
 * The estimator used to live here and now starts at `/estimate/new`. That is the
 * right way round: someone who knows the part they need should not have to walk
 * through a damage assessment to buy it, and someone who does not know should be
 * offered the estimator by name rather than left to guess.
 *
 * The tone is the hard part. E-commerce convention pulls towards urgency badges,
 * crossed-out prices, "23 people are viewing this", confetti at checkout — and
 * every one of those, to a Nigerian buyer who already suspects they are being
 * cheated, reads as the behaviour of someone about to overcharge them. So there
 * is no scarcity here, no countdown, no struck-through price, and no number on
 * this page that we cannot source. It is built to read like a parts counter that
 * tells you the truth, which is the only durable advantage this business has.
 */
export default function StoreHomePage() {
  return (
    <>
      <AppHeader
        label="Parts store · Nigeria"
        meta="NGN · Duty included · Rev 2026.09"
        action={<CartLink />}
      />
      <VehicleContext />

      <main>
        <Shell>
          <PageHeading
            kicker="Body parts · genuine and tokunbo"
            title="What the part costs, before you buy it"
            lede="Set your car once. Every price you then see is one all-in Naira figure with duty and clearing already inside it, and every part says how sure we are that it fits your chassis."
          />

          {/* Two ways in, built as siblings. Someone who knows their part number
              and someone staring at a broken bumper are both customers, and
              neither route is the fallback for the other. */}
          <div className="mt-[22px] flex flex-wrap items-stretch gap-[20px]">
            <div className="min-w-0 flex-[1_1_360px]">
              <Panel weight="heavy" className="flex h-full flex-col">
                <PanelBar weight="heavy" right="Part name or number">
                  If you know the part
                </PanelBar>
                <div className="border-rule-2 bg-panel-4 border-b-[1.5px] p-[13px]">
                  <PartsClusterArt />
                </div>
                <div className="flex flex-1 flex-col px-[15px] py-[16px]">
                  <Title className="text-[19px]">Search the catalogue</Title>
                  <p className="text-ink-soft mt-[9px] text-[13.5px] leading-[1.55]">
                    Search by part name, by the number on the old part, or browse a category. With
                    your car set, every result is graded against it — and the ones we cannot vouch
                    for are still shown, marked, not quietly hidden.
                  </p>
                  <div className="mt-auto pt-[14px]">
                    <Button variant="primary" size="lg" full href="/parts">
                      Browse parts
                    </Button>
                  </div>
                </div>
              </Panel>
            </div>

            <div className="min-w-0 flex-[1_1_360px]">
              <Panel weight="heavy" className="flex h-full flex-col">
                <PanelBar weight="heavy" right="Free · No sign-in">
                  If you only know the damage
                </PanelBar>
                {/* The same plan the user meets on screen 2, two panels marked.
                    It explains the estimator faster than the paragraph below it,
                    and it balances the parts diagram in the panel opposite. */}
                <div className="border-rule-2 bg-panel-4 flex flex-wrap items-center gap-[16px] border-b-[1.5px] p-[13px]">
                  <div className="h-[104px] flex-none">
                    <CarPlanArt />
                  </div>
                  <dl className="min-w-0 flex-1">
                    {[
                      { swatch: 'bg-flag border-ink', term: 'Damaged', note: 'You tap it.' },
                      {
                        swatch: 'bg-panel-3 border-ink border-dashed',
                        term: 'No outer panel',
                        note: 'Radiator, behind the grille.',
                      },
                      {
                        swatch: 'bg-panel-2 border-edge',
                        term: 'Not carried',
                        note: 'Cabin and interior.',
                      },
                    ].map((row) => (
                      <div key={row.term} className="mb-[9px] flex items-start gap-[8px] last:mb-0">
                        <span
                          aria-hidden
                          className={`mt-[2px] h-[12px] w-[12px] flex-none border-[1.5px] ${row.swatch}`}
                        />
                        <div className="min-w-0">
                          <dt className="text-[12.5px] font-bold leading-[1.2]">{row.term}</dt>
                          <dd className="text-muted m-0 text-[11.5px] leading-[1.35]">
                            {row.note}
                          </dd>
                        </div>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="flex flex-1 flex-col px-[15px] py-[16px]">
                  <Title className="text-[19px]">Get a parts estimate</Title>
                  <p className="text-ink-soft mt-[9px] text-[13.5px] leading-[1.55]">
                    Mark where the car is damaged and we will tell you which parts that means, with
                    part numbers and Naira ranges you can take to any workshop. Buy them here
                    afterwards, or do not — the list is yours either way.
                  </p>
                  <div className="mt-auto pt-[14px]">
                    <Button variant="dark" size="lg" full href="/estimate/new">
                      Start an estimate
                    </Button>
                  </div>
                </div>
              </Panel>
            </div>
          </div>

          {/* ------------------------------------------------- categories -- */}
          <section aria-labelledby="browse-heading" className="mt-[34px]">
            <div className="border-ink flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b-2 pb-[11px]">
              <Title as="h2" id="browse-heading" className="text-[19px]">
                Browse by category
              </Title>
              <Kicker as="span" className="text-muted tracking-[0.11em]">
                Crash and body parts first
              </Kicker>
            </div>

            <ul className="mt-[16px] grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-[14px]">
              {STORE_CATEGORIES.map((category) => (
                <li key={category.code} className="min-w-0">
                  <Link
                    href={`/parts?category=${category.code}`}
                    className="border-ink bg-panel hover:bg-panel-4 group flex h-full flex-col border-[1.5px]"
                  >
                    <div className="border-ink border-b-[1.5px] bg-white px-[12px] py-[10px]">
                      <PartArt kind={category.art} className="h-[92px]" />
                    </div>
                    <div className="flex flex-1 flex-col p-[14px]">
                      <Title as="div" className="text-[15px]">
                        {category.name}
                      </Title>
                      <p className="text-muted mt-[7px] text-[12.5px] leading-[1.5]">
                        {category.blurb}
                      </p>
                      <span className="text-flag-deep mt-auto pt-[12px] font-mono text-[11px] font-bold uppercase leading-none tracking-[0.1em]">
                        Browse →
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* ---------------------------------------------- how it works -- */}
          <section aria-labelledby="how-heading" className="mt-[34px]">
            <div className="border-ink border-b-2 pb-[11px]">
              <Title as="h2" id="how-heading" className="text-[19px]">
                How buying works
              </Title>
            </div>

            <ol className="mt-[16px] grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-[14px]">
              {HOW_BUYING_WORKS.map((item) => (
                <li key={item.step} className="min-w-0">
                  <Panel className="flex h-full flex-col p-[14px]">
                    <Kicker as="div" className="text-flag-deep tracking-[0.16em]">
                      {item.step}
                    </Kicker>
                    <Title as="div" className="mt-[8px] text-[15px]">
                      {item.title}
                    </Title>
                    <p className="text-ink-soft mt-[7px] text-[12.5px] leading-[1.55]">
                      {item.body}
                    </p>
                  </Panel>
                </li>
              ))}
            </ol>

            <StatCells
              className="mt-[16px]"
              items={[
                { label: 'Prices in', value: 'NGN only', basis: '150px' },
                { label: 'Duty & VAT', value: 'In the price', basis: '150px' },
                { label: 'Pay with', value: 'Card · Transfer · USSD', basis: '210px' },
                { label: 'Collect or receive', value: 'Both offered', basis: '170px' },
              ]}
            />
          </section>

          {/* --------------------------------------------------- the deal -- */}
          <section aria-labelledby="terms-heading" className="mt-[34px]">
            <div className="border-ink border-b-2 pb-[11px]">
              <Title as="h2" id="terms-heading" className="text-[19px]">
                What we will and will not do
              </Title>
            </div>

            <div className="mt-[16px] flex flex-wrap gap-[20px]">
              <div className="min-w-0 flex-[1_1_380px]">
                <SquareList
                  items={[
                    <>
                      <strong className="font-bold">We say how sure we are.</strong> Confirmed fit,
                      probable fit, or no record — and we show you what the claim is based on.
                    </>,
                    <>
                      <strong className="font-bold">One price, stated once.</strong> Duty and
                      clearing are inside it. Delivery is shown before you pay, never after.
                    </>,
                    <>
                      <strong className="font-bold">Lead times are ranges.</strong> Anything shipped
                      in is quoted in weeks, not on a date we cannot control.
                    </>,
                    <>
                      <strong className="font-bold">Wrong or faulty is ours.</strong> If a part is
                      defective, counterfeit or not what we described, you get a replacement or your
                      money back.
                    </>,
                  ]}
                />
              </div>

              <div className="min-w-0 flex-[1_1_300px]">
                <Note tone="rule">
                  <strong className="font-bold">Why we are so careful about fitment.</strong> About
                  half of all car-part returns are the wrong fit, and a panel sourced from abroad
                  takes weeks to arrive — long enough that sending it back costs more than the part
                  did. So we would rather tell you we are not certain, and lose the sale, than take
                  your money for something that will not bolt on.{' '}
                  <Link href="/how-we-price" className="text-flag-deep underline">
                    How we price parts
                  </Link>{' '}
                  ·{' '}
                  <Link href="/coverage" className="text-flag-deep underline">
                    Which cars we cover
                  </Link>
                </Note>
              </div>
            </div>
          </section>

          {/* ------------------------------------------------ coming soon -- */}
          <section aria-labelledby="soon-heading" className="mt-[34px]">
            <div className="border-ink flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b-2 pb-[11px]">
              <Title as="h2" id="soon-heading" className="text-[19px]">
                Not stocked yet
              </Title>
              <Kicker as="span" className="text-muted tracking-[0.11em]">
                And why each one is shut
              </Kicker>
            </div>

            {/*
             * Links rather than three email boxes. Each shelf is shut for a
             * reason worth a paragraph — a fitment claim we cannot make, a
             * photograph we do not have — and asking for an address under two
             * lines of teaser gets the address without ever making the argument.
             * The capture lives on the page, after the explanation.
             */}
            <div className="mt-[16px] flex flex-wrap gap-[14px]">
              {COMING_SOON.map((shelf) => (
                <Link
                  key={shelf.source}
                  href={`/soon/${shelf.slug}`}
                  className="border-ink bg-panel hover:bg-panel-2 min-w-0 flex-[1_1_300px] border-[1.5px] p-[15px] no-underline"
                >
                  <Title className="text-[15px] leading-[1.25]">{shelf.title}</Title>
                  <p className="text-muted mt-[7px] text-[12.5px] leading-[1.5]">{shelf.note}</p>
                  <Kicker
                    as="span"
                    className="text-flag-deep mt-[10px] inline-block tracking-[0.1em]"
                  >
                    Why it is not open →
                  </Kicker>
                </Link>
              ))}
            </div>
          </section>
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
