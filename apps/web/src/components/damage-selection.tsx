'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useEstimateFlow } from '@/lib/estimate-flow';
import { Button, Kicker, Panel, Segmented, Title } from './ui';
import { SelectionRail, ZoneChecklist, ZoneDiagram } from './zone-selector';

type View = 'diagram' | 'list';

export function DamageSelection() {
  const router = useRouter();
  const { vehicle, zoneCodes, toggleZone, clearZones, hydrated, photoCount } = useEstimateFlow();
  const [view, setView] = useState<View>('diagram');

  const selected = useMemo(() => new Set(zoneCodes), [zoneCodes]);
  const count = zoneCodes.length;

  // Deep links and refreshes are normal here — the user may have closed the tab
  // on a bad connection. Send them back rather than rendering a car-less screen.
  if (hydrated && !vehicle) {
    return (
      <Panel weight="heavy" className="mt-[22px] max-w-[520px] p-[16px]">
        <Title>Which car is it?</Title>
        <p className="text-ink-soft mt-[9px] text-[13.5px] leading-[1.55]">
          We need the vehicle before the damage — part numbers are matched to the chassis, so a
          panel on its own tells us nothing.
        </p>
        <Button variant="dark" size="md" href="/" className="mt-[14px]">
          Identify the vehicle
        </Button>
      </Panel>
    );
  }

  return (
    <div className="mt-[22px] flex flex-wrap items-start gap-[20px]">
      {/* ------------------------------------------------------- selector -- */}
      <div className="min-w-0 flex-[2_1_460px]">
        <Panel weight="heavy">
          <div className="bg-panel-2 border-ink flex flex-wrap items-center justify-between gap-[10px] border-b-2 px-[12px] py-[8px]">
            <Segmented
              label="Selection method"
              value={view}
              onChange={setView}
              options={[
                { value: 'diagram', label: 'Diagram' },
                { value: 'list', label: 'Checklist' },
              ]}
              className="min-h-0 [&>button]:min-h-[36px] [&>button]:text-[11.5px]"
            />
            <Kicker as="span" className="text-muted tracking-[0.11em]">
              {view === 'diagram' ? 'Plan view · front at top' : '9 zones · tap to tick'}
            </Kicker>
          </div>

          <div className="px-[15px] py-[18px]">
            {view === 'diagram' ? (
              <ZoneDiagram selected={selected} onToggle={toggleZone} />
            ) : (
              <ZoneChecklist selected={selected} onToggle={toggleZone} />
            )}
          </div>
        </Panel>
      </div>

      {/* ----------------------------------------------------------- rail -- */}
      <div className="grid min-w-0 max-w-[400px] flex-[1_1_280px] content-start gap-[14px]">
        <SelectionRail selected={selected} onToggle={toggleZone} onClear={clearZones} />

        {/* Optional, and it has to look optional. No badge, no red dot, no
            blocking — it helps us, and the estimate works without it. */}
        <Link
          href="/photos"
          className="border-muted-2 hover:bg-panel flex items-center gap-[11px] border-[1.5px] border-dashed p-[13px]"
        >
          <span className="border-ink flex h-[38px] w-[38px] flex-none items-center justify-center border-[1.5px] font-mono text-[16px] font-bold leading-none">
            +
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] font-bold uppercase leading-[1.2]">
              Photos — optional
            </span>
            <span className="text-muted mt-[3px] block text-[11.5px] leading-[1.4]">
              {photoCount > 0
                ? `${photoCount} added. Tap to review or add more.`
                : 'Helps us sanity-check the estimate. Skip if data is tight.'}
            </span>
          </span>
        </Link>

        <div>
          <Button
            variant="primary"
            size="lg"
            full
            disabled={count === 0}
            onClick={() => router.push('/estimate')}
          >
            {count > 0 ? `Get parts & prices · ${count} zones` : 'Select at least one panel'}
          </Button>
          <p className="text-muted mt-[9px] text-[11.5px] leading-[1.5]">
            Prices come from authorised dealers and Ladipo traders, refreshed weekly. Labour and
            paint are not included.
          </p>
        </div>
      </div>
    </div>
  );
}
