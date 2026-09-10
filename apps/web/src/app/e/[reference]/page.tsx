import type { Metadata } from 'next';
import Link from 'next/link';
import { AppHeader, Shell } from '@/components/chrome';
import { PartNumber } from '@/components/part-number';
import { CopyAllNumbers } from '@/components/copy-all';
import { Button, Kicker, Note, Panel, PanelBar } from '@/components/ui';
import { formatRange, formatRangeCompact, formatStampDate } from '@/lib/money';
import { SHARE_LINK_EXPIRES, SHARED_ESTIMATE } from '@/mock/estimates';
import { vehicleTitle } from '@/mock/vehicles';

export const metadata: Metadata = {
  title: 'Shared estimate',
  description: 'A read-only parts estimate shared by a vehicle owner. No account needed.',
  robots: { index: false, follow: false },
};

/**
 * The shared estimate — what the mechanic opens.
 *
 * Read-only, no account, and no sign-in wall, because a workshop should not have
 * to register to see a parts list. The caveat is unavoidable rather than
 * tucked in a footer: this page is going to be argued over, and it works better
 * for everyone if both sides can see what it does and does not claim.
 *
 * Every share link resolves to the same demo estimate for now; the reference in
 * the URL becomes a lookup once `GET /api/v1/estimates/:reference` is wired.
 */
export default async function SharedEstimatePage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const estimate = SHARED_ESTIMATE;
  const priced = estimate.items.filter((item) => item.isPriced);
  const numbers = estimate.items
    .filter((item) => item.mpn)
    .map((item) => `${item.partName}: ${item.mpn}`)
    .join('\n');

  return (
    <>
      <AppHeader label="Shared estimate · read only" />
      <main>
        <Shell width="sheet" className="px-[18px] pb-[30px] pt-[20px]">
          {/* --------------------------------------------------- vehicle -- */}
          <Panel weight="heavy">
            <PanelBar weight="heavy" right={`ISSUED ${formatStampDate(estimate.createdAt)}`}>
              Estimate {reference.toUpperCase()}
            </PanelBar>
            <div className="px-[15px] py-[16px]">
              <Kicker className="text-flag-deep tracking-[0.13em]">
                Sent to you by the vehicle owner
              </Kicker>
              <h1 className="mt-[9px] text-[25px] font-black uppercase leading-[1.05] tracking-[-0.015em]">
                {vehicleTitle(estimate.vehicle)}
              </h1>
              <dl className="mt-[9px] flex flex-wrap gap-x-[22px] gap-y-2">
                {[
                  { label: 'Chassis', value: 'ZRE172', mono: true },
                  { label: 'Engine', value: estimate.vehicle.engine ?? '—', mono: false },
                  { label: 'Zones marked', value: String(estimate.zoneCodes.length), mono: false },
                ].map((fact) => (
                  <div key={fact.label}>
                    <dt>
                      <Kicker className="text-muted-2 tracking-[0.1em]">{fact.label}</Kicker>
                    </dt>
                    <dd
                      className={
                        fact.mono
                          ? 'mt-[4px] font-mono text-[14px] font-bold leading-[1.2]'
                          : 'mt-[4px] text-[14px] leading-[1.2]'
                      }
                    >
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Panel>

          {/* ----------------------------------------------------- parts -- */}
          <Panel weight="heavy" className="mt-[14px]">
            <PanelBar tone="dark" weight="heavy">
              Parts required
            </PanelBar>
            <ul>
              {estimate.items.map((item) => (
                <li
                  key={item.id}
                  className={`border-rule flex flex-wrap items-center gap-x-[14px] gap-y-2 border-b px-[13px] py-[12px] ${
                    item.isPriced ? 'bg-panel' : 'bg-panel-3'
                  }`}
                >
                  <span className="text-muted flex-[0_0_34px] font-mono text-[12px] font-bold leading-none">
                    {item.ordinal}
                  </span>
                  <span className="min-w-0 flex-[36_1_200px] text-[15px] font-bold uppercase leading-[1.2]">
                    {item.partName}
                  </span>
                  <span className="min-w-0 flex-[29_1_180px]">
                    <PartNumber value={item.mpn} />
                  </span>
                  <span
                    className={`min-w-0 flex-[20_1_120px] font-mono text-[15px] font-bold leading-[1.2] ${
                      item.isPriced ? 'text-ink' : 'text-muted'
                    }`}
                  >
                    {item.price ? formatRangeCompact(item.price) : 'No price'}
                  </span>
                </li>
              ))}
            </ul>
            <div className="bg-panel-2 flex flex-wrap items-center justify-between gap-x-[14px] gap-y-2 p-[13px]">
              <Kicker as="span" className="text-muted tracking-[0.09em]">
                {priced.length} of {estimate.items.length} parts priced · Total
              </Kicker>
              <span className="font-mono text-[19px] font-bold leading-[1.1]">
                {estimate.subtotal ? formatRange(estimate.subtotal) : 'No priced parts'}
              </span>
            </div>
          </Panel>

          {/* --------------------------------------------------- caveats -- */}
          <div className="border-ink bg-flag-soft mt-[14px] flex gap-[11px] border-[1.5px] p-[13px]">
            <div className="bg-flag w-[5px] flex-none" aria-hidden />
            <p className="text-ink-soft text-[13px] leading-[1.55]">
              <strong className="font-bold">This is an estimate, not a quote.</strong> Prices are
              the middle of at least three recent Lagos quotes — one authorised dealer, two Ladipo
              traders — for parts only. Labour, paint and panel-beating are not included. Genuine
              parts sit at the top of each range.
            </p>
          </div>

          <Panel className="mt-[14px] p-[14px]">
            <Kicker className="text-muted tracking-[0.12em]">If you are the workshop</Kicker>
            <p className="text-ink-soft mt-[9px] text-[13px] leading-[1.55]">
              Part numbers above are matched to chassis ZRE172. If you are pricing a different part
              number, or a part not listed here, say which — that is usually where a disagreement
              comes from.
            </p>
            <div className="mt-[12px] flex flex-wrap gap-[9px]">
              <CopyAllNumbers numbers={numbers} className="min-h-[48px] flex-[1_1_170px]" />
              <Button
                variant="outline"
                size="md"
                href={`/estimate/${reference}/share`}
                className="min-h-[48px] flex-[1_1_170px]"
              >
                Download as PDF
              </Button>
            </div>
          </Panel>

          {/* One quiet conversion prompt, at the bottom, after the useful part. */}
          <Note tone="dashed" className="mt-[14px] p-[14px] text-center">
            <div className="text-[14px] font-bold uppercase leading-[1.3]">
              Own a car? Check your own repair costs
            </div>
            <div className="text-muted mt-[5px] text-[12.5px] leading-[1.5]">
              Free. No account needed.
            </div>
            <Button variant="primary" size="md" href="/" className="mt-[11px] min-h-[48px]">
              Start an estimate
            </Button>
          </Note>

          <div className="text-muted-2 mt-[16px] flex flex-wrap gap-x-4 gap-y-[6px] font-mono text-[11px] font-bold uppercase leading-[1.5] tracking-[0.09em]">
            <span>Link expires {formatStampDate(SHARE_LINK_EXPIRES)}</span>
            <span aria-hidden>·</span>
            <Link href="/how-we-price" className="underline">
              How we source prices
            </Link>
            <span aria-hidden>·</span>
            <Link href="/privacy" className="underline">
              Privacy
            </Link>
          </div>
        </Shell>
      </main>
    </>
  );
}
