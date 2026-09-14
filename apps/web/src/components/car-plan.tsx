import { Fragment, type ReactNode } from 'react';
import { ZONES, type ZoneView } from '@/mock/zones';
import { cx } from './ui';

/**
 * THE CAR IN PLAN — the drawing itself, with nothing decided about what tapping
 * a panel does.
 *
 * This was the estimator's damage selector and is now shared, because build
 * plan item 12 needs the same figure pointed at the catalogue instead of at a
 * damage report: a car, dissected, with each panel offering the parts that
 * belong to it. Two drawings of the same car that drift apart would be two
 * different cars to a customer who meets both — and they will, because the
 * estimator and the store are one site.
 *
 * WHY A PLAN AND NOT A PICTURE OF A CAR. One photograph cannot show the front,
 * the rear and both sides, and a 3D model that can was costed and rejected: a
 * 320px car photograph is ~20 KB against ~5 MB for a compressed glTF, on a
 * market of cheap Android phones paying by the megabyte, to show four panels at
 * a time where a flat plan shows all nine at once. The parts this store sells
 * are all on the outside of the car, so the plan loses nothing.
 *
 * The layout is load bearing and belongs here rather than at either call site:
 * front at the top, the fenders spanning the depth of the wing as they do on
 * the car, the radiator drawn dashed because it has no exterior surface to tap,
 * and the cabin struck out because we do not carry it. The callers supply only
 * what goes INSIDE a cell.
 */

export interface PlanSlot {
  zone: ZoneView;
  /** Layout for this panel's cell: its height, and any row or column span. */
  className: string;
  /**
   * How the panel's own name is set inside it. Not decoration: a wide cell can
   * hold its label on one line where a 62px headlight cell has to wrap, and the
   * hood is the one panel with room to be read at a glance.
   */
  labelSize: 'sm' | 'md' | 'lg';
}

function zone(code: string): ZoneView {
  const found = ZONES.find((item) => item.code === code);
  if (!found) throw new Error(`Unknown damage zone: ${code}`);
  return found;
}

/**
 * The panels in drawing order, which is neither `displayOrder` nor selection
 * order — it is the order the CSS grid consumes cells in.
 */
const SLOTS: readonly PlanSlot[] = [
  { zone: zone('headlight_left'), className: 'h-[62px]', labelSize: 'sm' },
  { zone: zone('front_bumper'), className: 'h-[62px]', labelSize: 'md' },
  { zone: zone('headlight_right'), className: 'h-[62px]', labelSize: 'sm' },
  { zone: zone('fender_left'), className: 'row-span-2', labelSize: 'sm' },
  { zone: zone('radiator'), className: 'h-[52px] flex-row gap-[7px]', labelSize: 'sm' },
  { zone: zone('fender_right'), className: 'row-span-2', labelSize: 'sm' },
  { zone: zone('hood'), className: 'h-[96px] gap-[4px]', labelSize: 'lg' },
];

/** Drawn between the hood and the rear panel, in both views. */
const TAIL_SLOTS: readonly PlanSlot[] = [
  {
    zone: zone('rear_panel'),
    className: 'col-span-3 h-[66px] flex-row gap-[8px]',
    labelSize: 'md',
  },
  {
    zone: zone('rear_bumper'),
    className: 'col-span-3 h-[52px] flex-row gap-[8px]',
    labelSize: 'md',
  },
];

/**
 * The chrome every cell shares, whatever it is — a button in the estimator, a
 * link in the store. Kept in one place so a panel cannot end up looking like a
 * panel in one view and a tile in the other.
 */
export function planCellClass(
  slot: PlanSlot,
  options: {
    extra?: string;
    /**
     * Forces the cell to stack its contents whatever the slot says. The wide
     * cells lay their label out in a row, which is right when a cell holds a
     * stamp and a name — and wrong the moment it holds a name and a count as
     * well, where "Radiator · internal" and "1 to buy" fight for the same
     * 52px line. The store view stacks every cell for that reason.
     */
    stacked?: boolean;
  } = {},
): string {
  const layout = options.stacked
    ? slot.className.replace('flex-row', '').replace(/\s+/g, ' ').trim()
    : slot.className;

  return cx(
    'border-ink relative flex flex-col items-center justify-center gap-[3px] overflow-hidden border-[1.5px]',
    slot.zone.isInternal ? 'bg-panel-2 border-dashed' : 'bg-white',
    layout,
    options.extra,
  );
}

const LABEL_SIZE = {
  sm: 'text-[11px] leading-[1.15]',
  md: 'text-[12px] leading-[1.2] tracking-[0.02em]',
  lg: 'text-[15px] leading-none tracking-[0.03em]',
} as const;

export function PlanLabel({
  children,
  size = 'sm',
}: {
  children: ReactNode;
  size?: PlanSlot['labelSize'];
}) {
  return (
    <span className={cx('relative text-center font-bold uppercase', LABEL_SIZE[size])}>
      {children}
    </span>
  );
}

export function PlanOrdinal({ children }: { children: ReactNode }) {
  return (
    <span className="relative font-mono text-[11px] font-bold leading-none tracking-[0.08em]">
      {children}
    </span>
  );
}

export function CarPlan({
  ariaLabel,
  cell,
}: {
  ariaLabel: string;
  /** Renders one panel. Pass `planCellClass(slot)` to the element you return. */
  cell: (slot: PlanSlot) => ReactNode;
}) {
  return (
    <div>
      <div
        className="bg-panel-2 border-ink mx-auto grid w-full max-w-[440px] gap-[4px] border-2 p-[9px]"
        style={{ gridTemplateColumns: '1fr 1.55fr 1fr' }}
        role="group"
        aria-label={ariaLabel}
      >
        {SLOTS.map((slot) => (
          <Fragment key={slot.zone.code}>{cell(slot)}</Fragment>
        ))}

        {/* Not a zone. Struck out so somebody with a caved-in door learns it
            here rather than by tapping and failing. */}
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

        {TAIL_SLOTS.map((slot) => (
          <Fragment key={slot.zone.code}>{cell(slot)}</Fragment>
        ))}
      </div>

      <div className="text-muted-2 mx-auto mt-[8px] flex max-w-[440px] justify-between font-mono text-[11px] leading-none tracking-[0.1em]">
        <span>FRONT ↑</span>
        <span>REAR ↓</span>
      </div>
    </div>
  );
}
