import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppHeader, PageHeading, Shell, SiteFooter } from '@/components/chrome';
import { PartArt } from '@/components/part-art';
import { NotifyCapture } from '@/components/states';
import { Kicker, Note, Panel, PanelBar, SquareList, Title } from '@/components/ui';
import { COMING_SOON, shelfBySlug } from '@/mock/store';

/**
 * A SHELF WE HAVE NOT OPENED — build plan item 9.
 *
 * Three of these: facelift kits, tokunbo and accessories. Their content is in
 * `mock/store.ts` and the reason they are pages rather than teaser boxes is in
 * the comment above `COMING_SOON` — briefly, each one is missing for a reason
 * the customer would find interesting, and "coming soon" tells them none of it.
 *
 * The shape of the page is deliberate: what it will carry, THEN why it is not
 * open, THEN the ask. Every "notify me" box on the internet is arranged the
 * other way round, and the reason is that the explanation usually does not
 * survive contact with the customer. Ours is the strongest thing on the page —
 * two of these three shelves are shut because of a fitment or photography
 * problem we refuse to paper over, which is the same argument the rest of the
 * store is making about the things it does sell.
 *
 * What is deliberately absent: a launch date, a countdown, a waiting-list
 * position, and any number at all about how many people are on the list.
 */
export function generateStaticParams() {
  return COMING_SOON.map((shelf) => ({ shelf: shelf.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shelf: string }>;
}): Promise<Metadata> {
  const shelf = shelfBySlug((await params).shelf);
  if (!shelf) return { title: 'Not stocked yet' };

  return {
    title: `${shelf.title} — not stocked yet`,
    description: shelf.lede,
  };
}

export default async function ShelfPage({ params }: { params: Promise<{ shelf: string }> }) {
  const shelf = shelfBySlug((await params).shelf);
  if (!shelf) notFound();

  const others = COMING_SOON.filter((other) => other.slug !== shelf.slug);

  return (
    <>
      <AppHeader label={shelf.title} />
      <main>
        <Shell width="read" className="px-[20px] pt-[24px]">
          <PageHeading kicker="Not stocked yet" title={shelf.title} lede={shelf.lede} ledeBelow />

          {/* What it will hold, drawn. An empty `slots` array draws empty slots
              rather than nothing — see `slotNote` on the accessories shelf. */}
          <Panel className="mt-[22px]" weight="heavy">
            <PanelBar weight="heavy">What goes on it</PanelBar>
            <div className="px-[15px] py-[15px]">
              <div className="flex items-stretch gap-[10px]">
                {(shelf.slots.length > 0 ? shelf.slots : EMPTY_SLOTS).map((slot, index) => (
                  <div
                    key={index}
                    className={
                      slot === null
                        ? 'border-muted-2 bg-panel-3 min-w-0 flex-1 border-[1.5px] border-dashed'
                        : 'border-rule-2 min-w-0 flex-1 border-[1.5px] bg-white'
                    }
                  >
                    <div
                      className={
                        slot === null
                          ? 'border-muted-2 flex items-center justify-between border-b-[1.5px] border-dashed px-[7px] py-[4px]'
                          : 'border-rule-2 flex items-center justify-between border-b-[1.5px] px-[7px] py-[4px]'
                      }
                    >
                      <span className="text-muted-2 font-mono text-[10px] font-bold leading-none tracking-[0.1em]">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={
                          slot === null ? 'bg-muted-2 h-[6px] w-[6px]' : 'bg-flag h-[6px] w-[6px]'
                        }
                        aria-hidden
                      />
                    </div>
                    <div className="h-[74px] px-[6px] py-[7px]">
                      {slot === null ? null : <PartArt kind={slot} />}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-muted mt-[11px] text-[12.5px] leading-[1.5]">{shelf.slotNote}</p>
            </div>
          </Panel>

          {/* The reason. The point of the page. */}
          <section aria-labelledby="why-heading" className="mt-[18px]">
            <div className="border-ink flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b-2 pb-[11px]">
              <Title as="h2" id="why-heading" className="text-[19px]">
                Why it is not open
              </Title>
              <Kicker as="span" className="text-muted tracking-[0.11em]">
                The honest version
              </Kicker>
            </div>
            <SquareList className="mt-[14px]" items={shelf.why} />
          </section>

          {/* The ask, last, and it says what the address is actually for. */}
          <Panel weight="heavy" className="mt-[18px]">
            <PanelBar tone="dark" weight="heavy">
              Tell us you want it
            </PanelBar>
            <div className="px-[15px] py-[15px]">
              <p className="text-ink-soft m-0 max-w-[64ch] text-[13.5px] leading-[1.55]">
                {shelf.signal}
              </p>
              <div className="mt-[13px]">
                <NotifyCapture
                  title={`Email me when ${shelf.title.toLowerCase()} open`}
                  note="One email when this shelf opens, and nothing else. No newsletter, no offers, and we do not pass it on."
                  cta="Tell me when"
                />
              </div>
            </div>
          </Panel>

          <Note tone="dashed" className="mt-[14px]">
            <strong className="font-bold">Meanwhile, the catalogue that is open.</strong> Bumpers,
            lighting, body panels, grilles and cooling, priced with duty inside and matched to your
            chassis rather than your model name —{' '}
            <Link href="/parts" className="text-flag-deep underline">
              browse the parts
            </Link>{' '}
            or{' '}
            <Link href="/estimate/new" className="text-flag-deep underline">
              price a repair
            </Link>
            .
          </Note>

          {/* The other two. A shelf page is a dead end otherwise. */}
          <section aria-labelledby="others-heading" className="mt-[26px]">
            <Title
              as="h2"
              id="others-heading"
              className="border-ink border-b-2 pb-[10px] text-[16px]"
            >
              Also not stocked yet
            </Title>
            <div className="mt-[14px] flex flex-wrap gap-[14px]">
              {others.map((other) => (
                <Link
                  key={other.slug}
                  href={`/soon/${other.slug}`}
                  className="border-ink bg-panel hover:bg-panel-2 min-w-0 flex-[1_1_260px] border-[1.5px] p-[14px] no-underline"
                >
                  <Title className="text-[14px] leading-[1.25]">{other.title}</Title>
                  <p className="text-muted mt-[6px] text-[12.5px] leading-[1.5]">{other.note}</p>
                  <Kicker
                    as="span"
                    className="text-flag-deep mt-[9px] inline-block tracking-[0.1em]"
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

/** Three empty slots, for a shelf whose range we have not chosen. */
const EMPTY_SLOTS = [null, null, null] as const;
