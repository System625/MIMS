'use client';

import { useState } from 'react';
import {
  CATALOGUE_STATS,
  COVERAGE,
  COVERAGE_ORDER,
  STATUS_BADGE,
  STATUS_BODY,
  STATUS_LABEL,
  type MakeCoverage,
} from '@/mock/coverage';
import { NotifyCapture } from './states';
import { Button, cx, FactRows, Kicker, Note, Panel, Title } from './ui';

/**
 * The coverage check.
 *
 * Placed before the estimator rather than after it, because the most common
 * early outcome is a miss and a user should be able to find that out in one tap
 * instead of four. A gap turns into a request — the count of requests is what
 * decides which make gets priced next — rather than into a dead end.
 */
export function CoverageCheck() {
  const [make, setMake] = useState('Toyota');
  const data: MakeCoverage = COVERAGE[make] ?? { status: 'none', models: [] };
  const status = data.status;

  return (
    <div className="mt-[20px] flex flex-wrap items-start gap-[20px]">
      <div className="min-w-0 flex-[2_1_460px]">
        <Panel weight="heavy" className="p-[16px]">
          <Kicker className="text-muted tracking-[0.12em]">Pick a make</Kicker>

          <div className="mt-[11px] flex flex-wrap gap-2">
            {COVERAGE_ORDER.map((name) => {
              const active = name === make;
              const badge = STATUS_BADGE[COVERAGE[name]?.status ?? 'none'];
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setMake(name)}
                  className={cx(
                    'border-ink flex min-h-[44px] items-center gap-2 border-[1.5px] px-[12px]',
                    'text-[13px] font-bold uppercase leading-none tracking-[0.02em]',
                    active ? 'bg-ink text-paper' : 'text-ink bg-white',
                  )}
                >
                  {name}
                  <span
                    className={cx(
                      'font-mono text-[11px] font-bold leading-none',
                      active ? 'text-flag' : 'text-muted',
                    )}
                  >
                    {badge}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="border-rule-2 mt-[18px] border-t-[1.5px] pt-[16px]">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-[10px]">
              <Title className="text-[22px]">{make}</Title>
              <span
                className={cx(
                  'border-ink inline-flex items-center border-[1.5px] px-[10px] py-[5px]',
                  'font-mono text-[11px] font-bold uppercase leading-[1.3] tracking-[0.1em]',
                  status === 'full' && 'bg-flag text-flag-ink',
                  status === 'partial' && 'bg-panel-2 text-muted',
                  status === 'none' && 'bg-panel-3 text-muted',
                )}
              >
                {STATUS_LABEL[status]}
              </span>
            </div>

            <p className="text-ink-soft mt-[10px] max-w-[62ch] text-[13.5px] leading-[1.55]">
              {STATUS_BODY[status]}
            </p>

            {data.models.length > 0 ? (
              <div className="border-ink mt-[14px] border-[1.5px] bg-white">
                <div className="bg-panel-2 border-ink text-muted flex gap-[10px] border-b-[1.5px] px-[11px] py-[8px] font-mono text-[11px] font-bold leading-[1.3] tracking-[0.1em]">
                  <span className="flex-[46_1_96px]">MODEL</span>
                  <span className="flex-[28_1_78px]">YEARS</span>
                  <span className="flex-[24_1_60px]">PARTS ON FILE</span>
                </div>
                {data.models.map((model) => (
                  <div
                    key={model.name}
                    className={cx(
                      'border-rule flex flex-wrap items-center gap-x-[10px] gap-y-[6px] border-b p-[11px]',
                      status === 'partial' ? 'bg-panel-4' : 'bg-white',
                    )}
                  >
                    <span className="min-w-0 flex-[46_1_96px] text-[13.5px] font-bold uppercase leading-[1.25]">
                      {model.name}
                    </span>
                    <span className="min-w-0 flex-[28_1_78px] font-mono text-[12.5px] font-bold leading-[1.3]">
                      {model.years}
                    </span>
                    <span className="min-w-0 flex-[24_1_60px] font-mono text-[12.5px] font-bold leading-[1.3]">
                      {model.parts}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {status !== 'full' ? (
              <div className="mt-[14px]">
                <NotifyCapture
                  tone="flag"
                  cta={`Request ${make}`}
                  title="Tell us and we'll price it"
                  note="Requests decide what we add next. One email when yours is ready — nothing else."
                />
              </div>
            ) : null}

            {status !== 'none' ? (
              <Button variant="primary" size="lg" full href="/" className="mt-[14px]">
                Start an estimate for a {make}
              </Button>
            ) : null}
          </div>
        </Panel>
      </div>

      <div className="grid min-w-0 max-w-[360px] flex-[1_1_260px] content-start gap-[14px]">
        <Panel className="p-[14px]">
          <Kicker className="text-muted tracking-[0.12em]">Catalogue today</Kicker>
          <FactRows
            className="mt-[11px]"
            items={[
              { label: 'Models priced', value: CATALOGUE_STATS.modelsPriced },
              { label: 'Part numbers on file', value: CATALOGUE_STATS.partNumbers },
              { label: 'Added last month', value: CATALOGUE_STATS.addedLastMonth },
              { label: 'Prices refreshed', value: CATALOGUE_STATS.refreshed },
            ]}
          />
        </Panel>

        <Panel className="p-[14px]">
          <Kicker className="text-muted tracking-[0.12em]">What &ldquo;covered&rdquo; means</Kicker>
          <p className="text-ink-soft mt-[9px] text-[12.5px] leading-[1.55]">
            Part numbers matched to your chassis code, and at least three verified Nigerian prices
            per part. Partial means we have the numbers but not the prices for every panel —
            you&rsquo;ll see exactly which.
          </p>
        </Panel>

        <Note tone="dashed">
          Front-end collision parts are covered first, because that is most of what people ask
          about. Interiors and electronics are not in the catalogue yet.
        </Note>
      </div>
    </div>
  );
}
