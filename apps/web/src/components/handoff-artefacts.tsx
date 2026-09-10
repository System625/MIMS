'use client';

import { whatsappHref, whatsappMessage, shareUrl } from '@/lib/handoff';
import { formatRange, formatRangeCompact, formatStampDate } from '@/lib/money';
import type { EstimateView } from '@/mock/parts';
import { vehicleTitle } from '@/mock/vehicles';
import { Mark } from './mark';
import { Button, Kicker } from './ui';

/**
 * The two things that leave the app.
 *
 * Both are shown as artefacts rather than as buttons, because their content is
 * the design decision. The WhatsApp message is written to be useful with the
 * link never opened; the PDF is written to survive being printed in black and
 * white and left on a counter for a week.
 */
export function HandoffArtefacts({ estimate }: { estimate: EstimateView }) {
  const message = whatsappMessage(estimate);
  const priced = estimate.items.filter((item) => item.isPriced);
  const stamp = formatStampDate(estimate.createdAt);

  return (
    <div className="mt-[22px] flex flex-wrap items-start gap-[22px]">
      {/* -------------------------------------------------------- message -- */}
      <div className="no-print min-w-0 max-w-[420px] flex-[1_1_320px]">
        <Kicker className="text-muted tracking-[0.12em]">01 — WhatsApp message</Kicker>
        <div className="border-ink bg-panel-2 mt-[10px] border-2 p-[14px]">
          <div className="border-ink border-[1.5px] bg-white p-[12px]">
            <pre className="text-ink whitespace-pre-wrap font-sans text-[13.5px] leading-[1.65]">
              {message}
            </pre>
            <div className="text-muted-2 mt-[9px] text-right font-mono text-[11px] font-bold leading-none">
              14:22
            </div>
          </div>
          <p className="text-muted mt-[11px] text-[12px] leading-[1.5]">
            Plain text, no formatting that breaks on older clients. Numbers are indented so a
            mechanic can read one aloud without hunting.
          </p>
        </div>

        <a
          href={whatsappHref(message)}
          target="_blank"
          rel="noreferrer"
          className="bg-flag text-flag-ink border-ink mt-[12px] flex min-h-[56px] items-center justify-center border-2 px-[18px] text-[15px] font-black uppercase leading-none tracking-[0.04em]"
        >
          Send to WhatsApp
        </a>
      </div>

      {/* ------------------------------------------------------------ pdf -- */}
      <div className="min-w-0 flex-[1_1_380px]">
        <Kicker className="text-muted no-print tracking-[0.12em]">02 — PDF · A4, one page</Kicker>

        <div className="print-sheet border-ink mt-[10px] flex flex-col gap-[16px] border-2 bg-white px-[24px] py-[26px]">
          <div className="border-ink flex flex-wrap items-end justify-between gap-x-5 gap-y-[10px] border-b-2 pb-[12px]">
            <div>
              {/* Ink and deep orange, not the header's paper-on-dark pair: this
                  sheet gets printed, often in black and white on a workshop
                  laser, and the two panels have to stay separable as greys. */}
              <div className="flex items-center gap-[10px]">
                <Mark size={24} tone="light" />
                <div className="text-[20px] font-black uppercase leading-none tracking-[0.05em]">
                  MIMS
                </div>
              </div>
              <Kicker className="text-muted mt-[6px] leading-[1.4] tracking-[0.1em]">
                Parts estimate · not a quote
              </Kicker>
            </div>
            <div className="text-muted text-right font-mono text-[11px] font-bold uppercase leading-[1.6] tracking-[0.08em]">
              {estimate.reference}
              <br />
              {stamp}
              <br />
              Lagos
            </div>
          </div>

          <div>
            <Kicker className="text-muted-2 tracking-[0.11em]">Vehicle</Kicker>
            <div className="mt-[6px] text-[19px] font-bold uppercase leading-[1.2]">
              {vehicleTitle(estimate.vehicle)} · ZRE172 · 1.8L
            </div>
          </div>

          <div className="border-ink border-[1.5px]">
            <div className="bg-panel-2 border-ink text-muted flex gap-[10px] border-b-[1.5px] px-[10px] py-[7px] font-mono text-[11px] font-bold leading-[1.3] tracking-[0.09em]">
              <span className="flex-[42_1_150px]">PART</span>
              <span className="flex-[30_1_120px]">PART NO.</span>
              <span className="flex-[24_1_100px]">ESTIMATE</span>
            </div>

            {estimate.items.map((item) => (
              <div
                key={item.id}
                className={`border-rule flex gap-[10px] border-b px-[10px] py-[9px] ${
                  item.isPriced ? '' : 'bg-panel-4'
                }`}
              >
                <span
                  className={`flex-[42_1_150px] text-[13px] leading-[1.35] ${
                    item.isPriced ? '' : 'text-muted'
                  }`}
                >
                  {item.partName}
                </span>
                <span
                  className={`flex-[30_1_120px] font-mono text-[12.5px] font-bold leading-[1.35] ${
                    item.isPriced ? '' : 'text-muted'
                  }`}
                >
                  {item.mpn ?? '—'}
                </span>
                <span
                  className={`flex-[24_1_100px] font-mono font-bold leading-[1.35] ${
                    item.isPriced ? 'text-[12.5px]' : 'text-faint text-[11px] uppercase'
                  }`}
                >
                  {item.price ? formatRangeCompact(item.price) : 'Not priced'}
                </span>
              </div>
            ))}

            <div className="bg-ink flex justify-between gap-[10px] p-[10px]">
              <Kicker as="span" className="text-flag leading-[1.3] tracking-[0.09em]">
                Total · {priced.length} priced part{priced.length === 1 ? '' : 's'}
              </Kicker>
              <span className="text-paper font-mono text-[15px] font-bold leading-[1.2]">
                {estimate.subtotal ? formatRange(estimate.subtotal) : 'No priced parts'}
              </span>
            </div>
          </div>

          <p className="text-ink-soft text-[12px] leading-[1.6]">
            Prices are the middle of at least three recent Lagos quotes per part — one authorised
            dealer, two Ladipo traders — for parts only. Labour, paint and panel-beating are
            excluded. The low end reflects good aftermarket parts bought well; the high end reflects
            genuine parts. Part numbers are matched to chassis ZRE172.
          </p>

          <div className="border-ink text-muted-2 mt-auto flex flex-wrap justify-between gap-x-4 gap-y-2 border-t-[1.5px] pt-[12px] font-mono text-[11px] font-bold uppercase leading-[1.4] tracking-[0.08em]">
            <span>{shareUrl(estimate.reference)}</span>
            <span>Prices valid 30 days</span>
            <span>Page 1 of 1</span>
          </div>
        </div>

        <Button
          variant="dark"
          size="lg"
          full
          className="no-print mt-[12px]"
          onClick={() => window.print()}
        >
          Print or save as PDF
        </Button>
      </div>
    </div>
  );
}
