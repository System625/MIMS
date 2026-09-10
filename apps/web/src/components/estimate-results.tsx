'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useEstimateFlow } from '@/lib/estimate-flow';
import { whatsappHref, whatsappMessage } from '@/lib/handoff';
import { formatLongDate, formatRange } from '@/lib/money';
import { buildEstimate, explanationParagraphs, type EstimateView } from '@/mock/parts';
import { vehicleStamp } from '@/mock/vehicles';
import { LoadingPanel, NotifyCapture, SlowConnectionPanel } from './states';
import { PageHeading } from './chrome';
import { PartsTable } from './parts-table';
import { Button, Kicker, Note, Panel, StatCells, Title } from './ui';

/**
 * Screen 3 — the answer.
 *
 * Nothing on this screen may read as a guess. Every figure is a range with a
 * date attached, the number of sources behind it is stated, and what the total
 * excludes is said twice — once beside the total and once in the prose. The
 * value here is not convenience, it is ammunition: a user should be able to walk
 * into a workshop and argue from it.
 */

// A short, honest wait. The real fetch is a POST /api/v1/estimates; this stands
// in for it so the loading state ships built rather than illustrated.
const FETCH_MS = 900;
const SLOW_MS = 6000;

type Phase = 'loading' | 'slow' | 'ready';

export function EstimateResults() {
  const { vehicle, zoneCodes, hydrated } = useEstimateFlow();
  const [phase, setPhase] = useState<Phase>('loading');
  const [elapsed, setElapsed] = useState(0);

  const estimate = useMemo<EstimateView | null>(
    () => (vehicle && zoneCodes.length > 0 ? buildEstimate(vehicle, zoneCodes) : null),
    [vehicle, zoneCodes],
  );

  useEffect(() => {
    if (!hydrated || !estimate) return;
    const ready = setTimeout(() => setPhase('ready'), FETCH_MS);
    const slow = setTimeout(() => setPhase((p) => (p === 'loading' ? 'slow' : p)), SLOW_MS);
    return () => {
      clearTimeout(ready);
      clearTimeout(slow);
    };
  }, [hydrated, estimate]);

  useEffect(() => {
    if (phase !== 'slow') return;
    const tick = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(tick);
  }, [phase]);

  if (!hydrated) {
    return <div className="mt-[22px] max-w-[420px]" aria-hidden />;
  }

  if (!vehicle || zoneCodes.length === 0) {
    return (
      <Panel weight="heavy" className="mt-[22px] max-w-[520px] p-[16px]">
        <Title>Nothing to price yet</Title>
        <p className="text-ink-soft mt-[9px] text-[13.5px] leading-[1.55]">
          {vehicle
            ? 'Mark which panels are damaged and we will match the parts.'
            : 'Start with the car — parts are matched to its chassis code, not to the model name.'}
        </p>
        <Button variant="dark" size="md" href={vehicle ? '/damage' : '/'} className="mt-[14px]">
          {vehicle ? 'Mark the damage' : 'Identify the vehicle'}
        </Button>
      </Panel>
    );
  }

  if (!estimate) return null;

  if (phase === 'loading') {
    return (
      <div className="mt-[22px] max-w-[420px]">
        <LoadingPanel
          framed={false}
          zoneCount={zoneCodes.length}
          fetched={Math.max(1, zoneCodes.length - 2)}
          total={zoneCodes.length}
        />
      </div>
    );
  }

  if (phase === 'slow') {
    return (
      <div className="mt-[22px] max-w-[420px]">
        <SlowConnectionPanel
          framed={false}
          seconds={Math.floor(SLOW_MS / 1000) + elapsed}
          readyCount={estimate.items.filter((item) => item.isPriced).length}
          onShowPartial={() => setPhase('ready')}
        />
      </div>
    );
  }

  return <ResultsBody estimate={estimate} />;
}

function ResultsBody({ estimate }: { estimate: EstimateView }) {
  const { vehicle } = useEstimateFlow();
  const priced = estimate.items.filter((item) => item.isPriced);
  const unpriced = estimate.items.filter((item) => !item.isPriced);
  const message = whatsappMessage(estimate);
  const [copiedAll, setCopiedAll] = useState(false);

  const lede =
    unpriced.length === 0
      ? `All ${estimate.items.length} parts are priced in our catalogue.`
      : priced.length === 0
        ? 'These parts fit your car, but none of them has a verified Nigerian price yet.'
        : `${priced.length} of ${estimate.items.length} parts are priced in our catalogue. The ${
            unpriced.length === 1 ? 'other one fits' : `other ${unpriced.length} fit`
          } your car but ${unpriced.length === 1 ? 'has' : 'have'} no verified Nigerian price yet.`;

  async function copyAllNumbers() {
    const numbers = estimate.items
      .filter((item) => item.mpn)
      .map((item) => `${item.partName}: ${item.mpn}`)
      .join('\n');
    try {
      await navigator.clipboard.writeText(numbers);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1600);
    } catch {
      /* Selectable in place; see PartNumber. */
    }
  }

  return (
    <>
      <PageHeading
        kicker={`${vehicle ? vehicleStamp(vehicle) : ''} · ${estimate.zoneCodes.length} zones`}
        title="Parts you'll need"
        lede={lede}
        ledeBelow
        aside={
          <div className="border-ink bg-ink text-paper min-w-0 max-w-[400px] flex-[1_1_300px] border-2 px-[16px] py-[15px]">
            <Kicker className="text-flag tracking-[0.13em]">Estimated parts total</Kicker>
            <div className="mt-[9px] font-mono text-[27px] font-bold leading-[1.05] tracking-[-0.02em]">
              {estimate.subtotal ? (
                <>
                  {formatRange(estimate.subtotal).split(' – ')[0]}
                  <span className="text-muted-2"> – </span>
                  {formatRange(estimate.subtotal).split(' – ')[1]}
                </>
              ) : (
                'No verified price'
              )}
            </div>
            <p className="border-night-rule text-night-muted-2 mt-[10px] border-t pt-[10px] text-[11.5px] leading-[1.5]">
              Parts only. Labour, paint and panel-beating add roughly ₦40,000–₦90,000 for this job.
            </p>
          </div>
        }
      />

      <Note tone="rule" className="mt-[14px]">
        <strong className="font-bold">
          Prices last checked {formatLongDate(estimate.createdAt)}, Lagos.
        </strong>{' '}
        Parts prices move with the exchange rate. Treat these as a negotiating range, not a quote.
      </Note>

      <div className="mt-[18px]">
        <PartsTable
          items={estimate.items}
          subtotal={estimate.subtotal}
          pricedCount={priced.length}
        />
      </div>

      <div className="mt-[18px] flex flex-wrap items-start gap-[20px]">
        {/* --------------------------------------------------- narration -- */}
        <Panel className="min-w-0 flex-[2_1_420px] p-[16px]">
          <Kicker className="text-muted tracking-[0.13em]">How we matched this</Kicker>
          {explanationParagraphs(estimate).map((paragraph, index) => (
            <p key={index} className="text-ink-soft mt-[10px] text-[13.5px] leading-[1.6]">
              {paragraph}
            </p>
          ))}

          <StatCells
            className="mt-[14px]"
            items={[
              { label: 'Sources / part', value: '3 – 5' },
              { label: 'Price basis', value: 'Lagos, cash' },
              { label: 'Excludes', value: 'Labour, paint' },
            ]}
          />

          <p className="text-muted mt-[12px] text-[12px] leading-[1.55]">
            <Link href="/how-we-price" className="underline">
              How we price parts
            </Link>{' '}
            — including where we are likely to be wrong.
          </p>
        </Panel>

        {/* ------------------------------------------------------- exits -- */}
        <div className="grid min-w-0 max-w-[400px] flex-[1_1_280px] content-start gap-[10px]">
          <Kicker className="text-muted tracking-[0.13em]">Take it with you</Kicker>

          <a
            href={whatsappHref(message)}
            target="_blank"
            rel="noreferrer"
            className="bg-flag text-flag-ink border-ink flex min-h-[56px] items-center justify-center border-2 px-[18px] text-center text-[15px] font-black uppercase leading-[1.2] tracking-[0.04em]"
          >
            Send to WhatsApp
          </a>
          <p className="text-muted text-[11.5px] leading-[1.5]">
            Sends part numbers and price ranges as plain text — readable to a mechanic without
            opening a link.
          </p>

          <div className="flex flex-wrap gap-[9px]">
            <Button
              variant="outline"
              size="md"
              href={`/estimate/${estimate.reference}/share`}
              className="min-h-[46px] flex-[1_1_130px]"
            >
              Download PDF
            </Button>
            <Button
              variant="outline"
              size="md"
              href="/signin"
              className="min-h-[46px] flex-[1_1_130px]"
            >
              Save estimate
            </Button>
          </div>

          <Button variant="outline" size="md" className="min-h-[46px]" onClick={copyAllNumbers}>
            {copiedAll ? 'Copied all part numbers' : 'Copy all part numbers'}
          </Button>

          <Note tone="flag" className="mt-[4px]">
            Keep estimate <strong className="font-bold">{estimate.reference}</strong> to hand. If a
            workshop quotes far above the high end, ask which part number they are pricing.
          </Note>

          {unpriced.length > 0 && unpriced[0] ? (
            <NotifyCapture
              title={`Tell me when the ${unpriced[0].partName.toLowerCase()} is priced`}
              note={
                unpriced[0].mpn
                  ? `One email, when part ${unpriced[0].mpn} gets a verified price.`
                  : 'One email, when we have a verified price for it.'
              }
            />
          ) : null}
        </div>
      </div>

      <div className="mt-[18px] flex flex-wrap gap-[10px]">
        <Button variant="outline" size="md" href="/damage">
          Change what&rsquo;s damaged
        </Button>
        <Button variant="outline" size="md" href={`/e/${estimate.reference}`}>
          Preview what the mechanic sees
        </Button>
      </div>
    </>
  );
}
