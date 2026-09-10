'use client';

import { ZONES, type ZoneView } from '@/mock/zones';
import { cx, Kicker } from './ui';

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

/** Shared cell chrome: the orange fill is an overlay so the label never inverts. */
function ZoneCell({
  zone,
  selected,
  onToggle,
  className,
  style,
  children,
}: {
  zone: ZoneView;
  selected: boolean;
  onToggle: (code: string) => void;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onToggle(zone.code)}
      style={style}
      className={cx(
        'border-ink relative flex flex-col items-center justify-center gap-[3px] overflow-hidden',
        zone.isInternal ? 'bg-panel-2 border-dashed' : 'bg-white',
        'border-[1.5px]',
        className,
      )}
    >
      <span
        aria-hidden
        className="bg-flag absolute inset-0 transition-opacity"
        style={{ opacity: selected ? 1 : 0 }}
      />
      {children}
    </button>
  );
}

function CellLabel({ children, size = 'sm' }: { children: React.ReactNode; size?: 'sm' | 'lg' }) {
  return (
    <span
      className={cx(
        'relative text-center font-bold uppercase',
        size === 'lg' ? 'text-[15px] leading-none tracking-[0.03em]' : 'text-[11px] leading-[1.15]',
      )}
    >
      {children}
    </span>
  );
}

function CellOrdinal({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative font-mono text-[11px] font-bold leading-none tracking-[0.08em]">
      {children}
    </span>
  );
}

function zone(code: string): ZoneView {
  const found = ZONES.find((item) => item.code === code);
  if (!found) throw new Error(`Unknown damage zone: ${code}`);
  return found;
}

export function ZoneDiagram({ selected, onToggle }: SelectorProps) {
  const cell = (code: string) => ({
    zone: zone(code),
    selected: selected.has(code),
    onToggle,
  });

  return (
    <div>
      <div
        className="bg-panel-2 border-ink mx-auto grid w-full max-w-[440px] gap-[4px] border-2 p-[9px]"
        style={{ gridTemplateColumns: '1fr 1.55fr 1fr' }}
        role="group"
        aria-label="Damaged areas, plan view"
      >
        <ZoneCell {...cell('headlight_left')} className="h-[62px]">
          <CellOrdinal>03</CellOrdinal>
          <CellLabel>
            Headlight
            <br />
            left
          </CellLabel>
        </ZoneCell>

        <ZoneCell {...cell('front_bumper')} className="h-[62px]">
          <CellOrdinal>01</CellOrdinal>
          <CellLabel>
            <span className="text-[12px] tracking-[0.02em]">Front bumper</span>
          </CellLabel>
        </ZoneCell>

        <ZoneCell {...cell('headlight_right')} className="h-[62px]">
          <CellOrdinal>04</CellOrdinal>
          <CellLabel>
            Headlight
            <br />
            right
          </CellLabel>
        </ZoneCell>

        {/* Fenders run the full depth of the front wing, which is what they do
            on the car — so they span both the radiator and hood rows. */}
        <ZoneCell {...cell('fender_left')} className="row-span-2">
          <CellOrdinal>06</CellOrdinal>
          <CellLabel>
            Fender
            <br />
            left
          </CellLabel>
        </ZoneCell>

        {/* The internal zone. Dashed and labelled rather than given a fake panel:
            there is no exterior surface here to point at. */}
        <ZoneCell {...cell('radiator')} className="h-[52px] flex-row gap-[7px]">
          <CellOrdinal>05</CellOrdinal>
          <CellLabel>
            <span className="text-[11px] leading-none tracking-[0.02em]">Radiator · internal</span>
          </CellLabel>
        </ZoneCell>

        <ZoneCell {...cell('fender_right')} className="row-span-2">
          <CellOrdinal>07</CellOrdinal>
          <CellLabel>
            Fender
            <br />
            right
          </CellLabel>
        </ZoneCell>

        <ZoneCell {...cell('hood')} className="h-[96px] gap-[4px]">
          <CellOrdinal>02</CellOrdinal>
          <CellLabel size="lg">Hood</CellLabel>
        </ZoneCell>

        {/* Not a zone. Struck out so a user with a caved-in door learns
            immediately that we cannot price it, rather than tapping and failing. */}
        <div
          className="hatch-dense border-edge-2 col-span-3 flex h-[112px] items-center justify-center border-[1.5px]"
          aria-hidden
        >
          <span className="text-stone text-center font-mono text-[11px] font-bold leading-[1.5] tracking-[0.11em]">
            CABIN / DOORS
            <br />
            NOT IN CATALOGUE
          </span>
        </div>

        <ZoneCell {...cell('rear_panel')} className="col-span-3 h-[66px] flex-row gap-[8px]">
          <CellOrdinal>09</CellOrdinal>
          <CellLabel>
            <span className="text-[12px] leading-none tracking-[0.02em]">Rear panel / boot</span>
          </CellLabel>
        </ZoneCell>

        <ZoneCell {...cell('rear_bumper')} className="col-span-3 h-[52px] flex-row gap-[8px]">
          <CellOrdinal>08</CellOrdinal>
          <CellLabel>
            <span className="text-[12px] leading-none tracking-[0.02em]">Rear bumper</span>
          </CellLabel>
        </ZoneCell>
      </div>

      <div className="text-muted-2 mx-auto mt-[8px] flex max-w-[440px] justify-between font-mono text-[11px] leading-none tracking-[0.1em]">
        <span>FRONT ↑</span>
        <span>REAR ↓</span>
      </div>
    </div>
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
