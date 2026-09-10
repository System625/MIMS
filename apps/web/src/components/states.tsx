'use client';

import { useState } from 'react';
import type { Money } from '@mims/contracts';
import { formatRange, formatRangeCompact } from '@/lib/money';
import { Button, cx, Field, Kicker, Note, Panel, PanelBar, TextInput, Title } from './ui';

/**
 * Screen 4 — the answers that are not a price.
 *
 * The design is emphatic that these are the common outcomes while the catalogue
 * is small, not edge cases, so they are built as first-class components used by
 * the live flow rather than as illustrations. Each one keeps the user moving and
 * says plainly what we do and do not know.
 */

function StateBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="border-ink bg-panel-2 inline-flex border-[1.5px] px-[8px] py-[4px] font-mono text-[11px] font-bold uppercase leading-[1.3] tracking-[0.1em]">
      {children}
    </span>
  );
}

/* ------------------------------------------------------ 01 · VIN not found -- */

export function VinNotFoundPanel({
  vin,
  onChooseManually,
  onRetry,
  framed = true,
}: {
  vin: string;
  onChooseManually: () => void;
  onRetry: () => void;
  /** False drops the STATE 01 bar — used when this replaces the live VIN panel. */
  framed?: boolean;
}) {
  const entered = vin.length;
  // The tail is highlighted because a mistyped VIN is nearly always a wrong or
  // missing last group, and that is the fastest thing for the user to check.
  const head = vin.slice(0, Math.max(0, entered - 4));
  const tail = vin.slice(Math.max(0, entered - 4));

  return (
    <Panel>
      {framed ? <PanelBar right="VIN NOT FOUND">STATE 01</PanelBar> : null}
      <div className="px-[15px] py-[16px]">
        <StateBadge>No match</StateBadge>
        <Title className="mt-[11px]">That VIN didn&rsquo;t decode</Title>
        <p className="text-ink-soft mt-[9px] text-[13.5px] leading-[1.55]">
          Used imports often carry VINs our decoder hasn&rsquo;t seen. It is not a problem with your
          car.
        </p>

        <div className="border-ink mt-[12px] border-[1.5px] bg-white p-[11px] font-mono text-[14px] font-bold leading-[1.2] [overflow-wrap:anywhere]">
          {head}
          <span className="text-flag-deep">{tail}</span>
          {entered === 0 ? <span className="text-faint">Nothing entered</span> : null}
        </div>
        <div className="text-muted mt-[6px] text-[11.5px] leading-[1.45]">
          {entered === 17
            ? '17 characters, but no match in the decoder. Check for a mistyped 0 or O.'
            : `${entered} character${entered === 1 ? '' : 's'} entered — a VIN has 17. Check the last group.`}
        </div>

        <div className="mt-[14px] grid gap-[9px]">
          <Button variant="dark" size="md" full onClick={onChooseManually}>
            Choose the car yourself
          </Button>
          <Button variant="outline" size="md" full onClick={onRetry}>
            Re-enter the VIN
          </Button>
        </div>
        <p className="text-muted mt-[10px] text-[11.5px] leading-[1.5]">
          Choosing it yourself gives the same parts list for most cars.
        </p>
      </div>
    </Panel>
  );
}

/* --------------------------------------------------- 02 · not in catalogue -- */

export function NotInCataloguePanel({
  vehicleLabel,
  makeName,
  framed = true,
}: {
  vehicleLabel: string;
  makeName: string;
  framed?: boolean;
}) {
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);

  return (
    <Panel weight="heavy">
      {framed ? (
        <PanelBar tone="dark" weight="heavy" right="NOT IN CATALOGUE">
          <span className="text-flag">STATE 02</span>
        </PanelBar>
      ) : (
        <PanelBar tone="dark" weight="heavy" right="NOT IN CATALOGUE">
          <span className="text-flag">COVERAGE GAP</span>
        </PanelBar>
      )}

      <div className="px-[15px] py-[16px]">
        <Kicker className="text-muted tracking-[0.11em]">{vehicleLabel}</Kicker>
        <Title className="mt-[10px]">We don&rsquo;t price this car yet</Title>
        <p className="text-ink-soft mt-[9px] text-[13.5px] leading-[1.55]">
          We&rsquo;d rather say so than show numbers we can&rsquo;t stand behind. We cover 41 models
          properly today, and {makeName} isn&rsquo;t one of them.
        </p>

        <div className="bg-rule-2 border-rule-2 mt-[13px] grid gap-px border">
          {[
            { label: 'Models covered today', value: '41' },
            { label: 'Added last month', value: '+9' },
            { label: `Requests for ${makeName}`, value: '37' },
          ].map((row) => (
            <div
              key={row.label}
              className="flex justify-between gap-3 bg-white px-[10px] py-[9px] text-[12.5px] leading-[1.4]"
            >
              <span className="text-muted">{row.label}</span>
              <span className="font-mono text-[12px] font-bold leading-none">{row.value}</span>
            </div>
          ))}
        </div>

        <div className="bg-flag-soft border-flag mt-[14px] border-[1.5px] p-[13px]">
          {joined ? (
            <>
              <Title className="text-[13px]">On the list</Title>
              <p className="text-ink-soft mt-[4px] text-[12px] leading-[1.5]">
                We&rsquo;ll email <strong className="font-bold">{email}</strong> once, when a{' '}
                {makeName} is priced. Nothing else.
              </p>
            </>
          ) : (
            <>
              <Title className="text-[13px]">Get told when we add it</Title>
              <p className="text-ink-soft mt-[4px] text-[12px] leading-[1.5]">
                We&rsquo;ll email once, when your car is priced. Nothing else.
              </p>
              <form
                className="mt-[10px] flex flex-wrap gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (email.trim()) setJoined(true);
                }}
              >
                <TextInput
                  type="email"
                  required
                  weight="light"
                  aria-label="Your email address"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-[46px] flex-[1_1_160px]"
                />
                <Button variant="dark" size="md" type="submit" className="min-h-[46px]">
                  Notify me
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-muted mt-[11px] text-[12px] leading-[1.5]">
          Meanwhile: ask your mechanic for part numbers, not just a total. Any quote should name the
          parts it covers.
        </p>
      </div>
    </Panel>
  );
}

/* ---------------------------------------------------- 03 · partial coverage -- */

export function PartialCoveragePanel({
  priced,
  unpriced,
  subtotal,
  framed = true,
  onShare,
}: {
  priced: ReadonlyArray<{ name: string; range: Money }>;
  unpriced: ReadonlyArray<{ name: string }>;
  subtotal: Money | null;
  framed?: boolean;
  onShare?: () => void;
}) {
  const total = priced.length + unpriced.length;

  return (
    <Panel>
      {framed ? <PanelBar right="PARTIAL COVERAGE">STATE 03</PanelBar> : null}
      <div className="px-[15px] py-[16px]">
        <Title>
          {priced.length} of {total} parts priced
        </Title>
        <p className="text-ink-soft mt-[9px] text-[13.5px] leading-[1.55]">
          Here&rsquo;s what we&rsquo;re sure about and what we&rsquo;re not. The total counts only
          the {priced.length} we can price.
        </p>

        {/* One bar, split by what we actually know. Solid is knowledge; hatched is not. */}
        <div className="border-ink mt-[13px] flex h-[14px] border-[1.5px]">
          <div className="bg-flag" style={{ flex: priced.length }} />
          <div className="hatch-unknown" style={{ flex: unpriced.length }} />
        </div>
        <div className="text-muted mt-[6px] flex justify-between font-mono text-[11px] font-bold leading-[1.3] tracking-[0.09em]">
          <span>{priced.length} PRICED</span>
          <span>{unpriced.length} UNKNOWN</span>
        </div>

        <div className="bg-rule-2 border-rule-2 mt-[13px] grid gap-px border">
          {priced.map((row) => (
            <div key={row.name} className="flex items-center gap-[9px] bg-white px-[10px] py-[9px]">
              <span className="bg-flag h-[9px] w-[9px] flex-none" aria-hidden />
              <span className="flex-1 text-[12.5px] font-bold uppercase leading-[1.3]">
                {row.name}
              </span>
              <span className="font-mono text-[11.5px] font-bold leading-none">
                {formatRangeCompact(row.range)}
              </span>
            </div>
          ))}
          {unpriced.map((row) => (
            <div
              key={row.name}
              className="bg-panel-3 flex items-center gap-[9px] px-[10px] py-[9px]"
            >
              <span className="border-faint h-[9px] w-[9px] flex-none border-[1.5px]" aria-hidden />
              <span className="text-muted flex-1 text-[12.5px] font-bold uppercase leading-[1.3]">
                {row.name}
              </span>
              <span className="text-faint font-mono text-[11px] font-bold leading-none">
                NO PRICE
              </span>
            </div>
          ))}
        </div>

        <div className="bg-ink text-paper mt-[13px] p-[13px]">
          <Kicker className="text-flag tracking-[0.13em]">Priced parts only</Kicker>
          <div className="mt-[8px] font-mono text-[21px] font-bold leading-[1.05]">
            {subtotal ? formatRange(subtotal) : 'No priced parts'}
          </div>
          <p className="text-night-muted-2 mt-[9px] text-[11.5px] leading-[1.5]">
            {unpriced.length} {unpriced.length === 1 ? 'part is' : 'parts are'} missing from this
            figure. Don&rsquo;t read it as the full repair.
          </p>
        </div>

        {onShare ? (
          <Button variant="primary" size="md" full className="mt-[11px]" onClick={onShare}>
            Send the {priced.length} we know to WhatsApp
          </Button>
        ) : null}
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------- 04 · loading -- */

export function LoadingPanel({
  zoneCount,
  fetched,
  total,
  framed = true,
}: {
  zoneCount: number;
  fetched: number;
  total: number;
  framed?: boolean;
}) {
  const steps: ReadonlyArray<{ label: React.ReactNode; state: 'done' | 'active' | 'waiting' }> = [
    { label: 'Vehicle identified', state: 'done' },
    { label: `${zoneCount} zone${zoneCount === 1 ? '' : 's'} read`, state: 'done' },
    {
      label: (
        <>
          Fetching prices{' '}
          <span className="text-muted font-mono text-[11px] font-bold">
            {fetched} OF {total}
          </span>
        </>
      ),
      state: fetched >= total ? 'done' : 'active',
    },
    { label: 'Building your estimate', state: 'waiting' },
  ];

  return (
    <Panel>
      {framed ? <PanelBar right="LOADING">STATE 04</PanelBar> : null}
      <div className="px-[15px] py-[16px]">
        <Title className="text-[17px] leading-[1.2]">Matching parts</Title>
        <ol className="mt-[13px] grid gap-[10px]">
          {steps.map((step, index) => (
            <li key={index} className="flex items-center gap-[11px]">
              <span
                className={cx(
                  'h-[18px] w-[18px] flex-none border-[1.5px]',
                  step.state === 'done' && 'bg-flag border-ink',
                  step.state === 'active' && 'border-ink bg-white',
                  step.state === 'waiting' && 'border-edge-2',
                )}
                aria-hidden
              />
              <span
                className={cx(
                  'text-[13px] leading-[1.3]',
                  step.state === 'waiting' && 'text-faint',
                )}
              >
                {step.label}
              </span>
            </li>
          ))}
        </ol>

        {/* Skeleton rows sized like the parts table that is about to replace them. */}
        <div className="mt-[14px] grid gap-[7px]" aria-hidden>
          <div className="bg-panel-2 border-rule-3 h-[12px] border" />
          <div className="bg-panel-2 border-rule-3 h-[12px] w-[78%] border" />
          <div className="bg-panel-2 border-rule-3 h-[12px] w-[54%] border" />
        </div>
      </div>
    </Panel>
  );
}

/* ----------------------------------------------------- 05 · slow connection -- */

export function SlowConnectionPanel({
  seconds,
  readyCount,
  framed = true,
  onEmailInstead,
  onShowPartial,
}: {
  seconds: number;
  readyCount: number;
  framed?: boolean;
  onEmailInstead?: () => void;
  onShowPartial?: () => void;
}) {
  return (
    <Panel>
      {framed ? <PanelBar right="SLOW CONNECTION">STATE 05</PanelBar> : null}
      <div className="px-[15px] py-[16px]">
        <Title className="text-[17px] leading-[1.2]">Still working — your network is slow</Title>
        <p className="text-ink-soft mt-[9px] text-[13px] leading-[1.55]">
          Nothing is broken. Your car and damage list are saved, so you can leave this page and come
          back.
        </p>
        <div className="border-ink mt-[12px] border-[1.5px] bg-white p-[11px] text-[12.5px] leading-[1.45]">
          Waiting on prices ·{' '}
          <span className="font-mono text-[12px] font-bold leading-none">{seconds}s</span>
        </div>
        <div className="mt-[12px] grid gap-[9px]">
          <Button variant="dark" size="md" full onClick={onEmailInstead}>
            Email me the estimate instead
          </Button>
          <Button variant="outline" size="md" full onClick={onShowPartial}>
            Show the {readyCount} parts we already have
          </Button>
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------- gap capture -- */

/**
 * The "tell me when this is priced" capture, used on the results screen and the
 * coverage page. A small moment of commitment — one field, one promise, no modal.
 */
export function NotifyCapture({
  title,
  note,
  cta = 'Notify me',
  tone = 'plain',
}: {
  title: string;
  note: React.ReactNode;
  cta?: string;
  tone?: 'plain' | 'flag';
}) {
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);

  if (joined) {
    return (
      <Note tone={tone === 'flag' ? 'flag' : 'plain'}>
        <Title className="text-[13px]">You&rsquo;re on the list</Title>
        <p className="mt-[4px] text-[12px] leading-[1.5]">
          One email to <strong className="font-bold">{email}</strong>, and nothing else.
        </p>
      </Note>
    );
  }

  return (
    <Note tone={tone === 'flag' ? 'flag' : 'plain'}>
      <Title className="text-[12.5px] leading-[1.3]">{title}</Title>
      <div className="text-muted mt-[4px] text-[11.5px] leading-[1.45]">{note}</div>
      <form
        className="mt-[9px] flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (email.trim()) setJoined(true);
        }}
      >
        <Field className="flex-[1_1_150px]">
          <TextInput
            type="email"
            required
            weight="light"
            aria-label="Your email address"
            placeholder="your@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-[44px]"
          />
        </Field>
        <Button variant="dark" size="md" type="submit" className="min-h-[44px]">
          {cta}
        </Button>
      </form>
    </Note>
  );
}
