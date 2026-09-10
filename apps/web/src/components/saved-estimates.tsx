'use client';

import { useState } from 'react';
import { SAVED_ESTIMATES, type SavedEstimate } from '@/mock/estimates';
import { Button, Kicker, Panel, Title } from './ui';

/**
 * My estimates — the reason to have an account at all.
 *
 * Estimates are snapshots, so a stale one keeps the figure it was run with and
 * says how old it is rather than quietly re-pricing itself. The banner on a stale
 * row is the honest version of a notification: it tells you the number you are
 * about to negotiate with is a month old, and offers to re-check.
 */
export function SavedEstimates() {
  const [showEmpty, setShowEmpty] = useState(false);
  const [removed, setRemoved] = useState<Set<string>>(new Set());

  const items = SAVED_ESTIMATES.filter((item) => !removed.has(item.reference));
  const empty = showEmpty || items.length === 0;

  return (
    <>
      <div className="mt-[8px] flex justify-end">
        <button
          type="button"
          onClick={() => {
            setShowEmpty((value) => !value);
            setRemoved(new Set());
          }}
          className="text-flag-deep font-mono text-[11px] font-bold uppercase leading-none tracking-[0.09em] underline"
        >
          {showEmpty ? 'Show list state' : 'Show empty state'}
        </button>
      </div>

      {empty ? (
        <EmptyState />
      ) : (
        <>
          <div className="mt-[18px] grid gap-[12px]">
            {items.map((item) => (
              <EstimateRow
                key={item.reference}
                item={item}
                onRemove={() => setRemoved((current) => new Set(current).add(item.reference))}
              />
            ))}
          </div>
          <p className="text-muted mt-[16px] text-[12.5px] leading-[1.55]">
            Estimates are kept indefinitely while your account exists, but prices go stale —
            anything older than 30 days is re-checked when you open it.
          </p>
        </>
      )}
    </>
  );
}

function EstimateRow({ item, onRemove }: { item: SavedEstimate; onRemove: () => void }) {
  return (
    <Panel tone={item.fresh ? 'panel' : 'dim'}>
      <div className="bg-panel-2 border-ink text-muted flex flex-wrap justify-between gap-x-[14px] gap-y-2 border-b-[1.5px] px-[13px] py-[8px] font-mono text-[11px] font-bold uppercase leading-[1.3] tracking-[0.09em]">
        <span>
          {item.reference} · {item.date}
        </span>
        <span className={item.fresh ? 'text-muted' : 'text-flag-deeper'}>{item.state}</span>
      </div>

      <div className="flex flex-wrap items-center gap-x-[16px] gap-y-[12px] p-[13px]">
        <div className="min-w-0 flex-[1_1_240px]">
          <div className="text-[16px] font-bold uppercase leading-[1.2]">{item.car}</div>
          <div className="text-muted mt-[5px] text-[12.5px] leading-[1.45]">{item.zones}</div>
        </div>

        <div className="min-w-0 flex-[1_1_170px]">
          <Kicker className="text-muted tracking-[0.1em]">Estimate</Kicker>
          <div className="mt-[5px] font-mono text-[15.5px] font-bold leading-[1.2]">
            {item.total}
          </div>
        </div>

        <div className="flex min-w-0 flex-[1_1_220px] flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            href={`/e/${item.reference}`}
            className="min-h-[44px] flex-[1_1_100px]"
          >
            Open
          </Button>
          <Button
            variant="outline"
            size="sm"
            href={`/estimate/${item.reference}/share`}
            className="min-h-[44px] flex-[1_1_100px]"
          >
            Share
          </Button>
          <button
            type="button"
            aria-label={`Delete estimate ${item.reference}`}
            onClick={onRemove}
            className="border-ink bg-panel flex h-[44px] w-[44px] flex-none items-center justify-center border-[1.5px] font-mono text-[14px] font-bold leading-none"
          >
            ×
          </button>
        </div>
      </div>

      {item.banner ? (
        <div className="bg-flag-soft border-flag flex flex-wrap items-center justify-between gap-x-[14px] gap-y-[10px] border-t-[1.5px] px-[13px] py-[11px]">
          <p className="text-ink-soft min-w-0 flex-[1_1_260px] text-[12.5px] leading-[1.5]">
            {item.banner}
          </p>
          <Button
            variant="dark"
            size="sm"
            href={`/estimate/${item.reference}/feedback`}
            className="min-h-[42px] flex-none border-[1.5px]"
          >
            {item.bannerCta}
          </Button>
        </div>
      ) : null}
    </Panel>
  );
}

function EmptyState() {
  return (
    <Panel weight="heavy" className="mt-[18px] px-[20px] py-[26px] text-center">
      <div className="hatch border-ink mx-auto h-[64px] w-[64px] border-[1.5px]" aria-hidden />
      <Title className="mt-[16px] text-[20px]">Nothing saved yet</Title>
      <p className="text-ink-soft mx-auto mt-[9px] max-w-[46ch] text-[13.5px] leading-[1.6]">
        Run an estimate and it lands here, so you can reopen it at the workshop without hunting
        through WhatsApp.
      </p>

      <div className="mt-[16px] flex flex-wrap justify-center gap-[10px]">
        <Button variant="primary" size="lg" href="/" className="min-h-[52px] flex-[0_1_240px]">
          Estimate a repair
        </Button>
        <Button
          variant="outline"
          size="md"
          href="/coverage"
          className="min-h-[52px] flex-[0_1_200px]"
        >
          Check my car&rsquo;s cover
        </Button>
      </div>

      <p className="border-rule-2 text-muted mt-[16px] border-t pt-[14px] text-[12.5px] leading-[1.55]">
        Estimates you ran before signing in are on this device for 30 days.{' '}
        <button type="button" className="underline">
          Bring them into this account
        </button>
        .
      </p>
    </Panel>
  );
}
