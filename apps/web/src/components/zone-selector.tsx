'use client';

import { ZONES } from '@/mock/zones';
import { CarPlan, PlanLabel, PlanOrdinal, planCellClass } from './car-plan';
import { Kicker } from './ui';

/**
 * Screen 2 — the damage selector.
 *
 * Two presentations of one selection. The design settles the "diagram or
 * checkbox list" question by refusing to: both are built, they share a single
 * selection, and the user switches between them on the same screen. The diagram
 * is the default because pointing at a dent is faster than reading nine labels;
 * the checklist is one tap away because it is the accessible route, the better
 * one under sunlight, and — as the brief suspected — quite possibly the better
 * mobile experience full stop.
 *
 * The plan view solves the "one view can't show front, rear and sides" problem
 * by not being a picture of a car. It is a plan of its panels, front at the top,
 * with the cabin struck out as not-in-catalogue. Every zone is reachable without
 * switching views, no zone hides behind another, and the smallest target
 * (a headlight) is still a 62px cell rather than a hotspot on an illustration.
 */

interface SelectorProps {
  selected: ReadonlySet<string>;
  onToggle: (code: string) => void;
}

/**
 * Screen 2's cell: a toggle. The orange fill is an overlay so the label never
 * inverts, and the layout comes from `car-plan.tsx` so the estimator's car and
 * the store's car stay the same drawing.
 */
export function ZoneDiagram({ selected, onToggle }: SelectorProps) {
  return (
    <CarPlan
      ariaLabel="Damaged areas, plan view"
      cell={(slot) => {
        const on = selected.has(slot.zone.code);
        return (
          <button
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(slot.zone.code)}
            className={planCellClass(slot)}
          >
            <span
              aria-hidden
              className="bg-flag absolute inset-0 transition-opacity"
              style={{ opacity: on ? 1 : 0 }}
            />
            <PlanOrdinal>{slot.zone.ordinal}</PlanOrdinal>
            <PlanLabel size={slot.labelSize}>{slot.zone.diagramLabel}</PlanLabel>
          </button>
        );
      }}
    />
  );
}

export function ZoneChecklist({ selected, onToggle }: SelectorProps) {
  return (
    <div className="border-ink border-[1.5px] bg-white">
      <div className="bg-panel-2 border-ink text-muted flex border-b-[1.5px] px-[11px] py-[7px] font-mono text-[11px] font-bold leading-none tracking-[0.11em]">
        <span className="w-[34px]">CODE</span>
        <span className="flex-1">ZONE</span>
        <span>TICK</span>
      </div>

      <ul>
        {ZONES.map((item) => {
          const on = selected.has(item.code);
          return (
            <li key={item.code}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onToggle(item.code)}
                className="border-rule flex min-h-[54px] w-full items-center gap-[11px] border-b px-[11px] py-[8px] text-left"
              >
                <span className="text-muted w-[24px] flex-none font-mono text-[11px] font-bold leading-none">
                  {item.ordinal}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-bold uppercase leading-[1.25]">
                    {item.name}
                  </span>
                  <span className="text-muted block text-[11.5px] leading-[1.4]">
                    {item.description}
                  </span>
                </span>
                <span
                  className="border-ink relative h-[26px] w-[26px] flex-none border-[1.5px] bg-white"
                  aria-hidden
                >
                  <span
                    className="bg-flag absolute inset-0 transition-opacity"
                    style={{ opacity: on ? 1 : 0 }}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * The selection rail. Removing a zone must be as cheap as adding one — the whole
 * chip is the target, not a 12px ×.
 */
export function SelectionRail({
  selected,
  onToggle,
  onClear,
}: SelectorProps & { onClear: () => void }) {
  const chosen = ZONES.filter((item) => selected.has(item.code));

  return (
    <div className="border-ink bg-panel border-2">
      <div className="bg-ink flex items-center justify-between gap-2 px-[12px] py-[9px]">
        <Kicker as="span" className="text-paper tracking-[0.13em]">
          Selected · {chosen.length}
        </Kicker>
        {chosen.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="text-flag font-mono text-[11px] font-bold uppercase leading-none tracking-[0.09em]"
          >
            Clear
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-[7px] p-[12px]">
        {chosen.map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => onToggle(item.code)}
            className="bg-flag-soft border-flag flex min-h-[36px] items-center gap-2 border-[1.5px] px-[10px] text-[12px] font-bold uppercase leading-none"
          >
            {item.name}
            <span className="text-flag-deep font-mono text-[11px] font-bold" aria-hidden>
              ×
            </span>
            <span className="sr-only">— remove</span>
          </button>
        ))}

        {chosen.length === 0 ? (
          <p className="text-faint text-[12.5px] leading-[1.5]">
            Nothing selected yet. Tap the panels to build your list.
          </p>
        ) : null}
      </div>
    </div>
  );
}
