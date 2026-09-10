'use client';

import type { Money } from '@mims/contracts';
import { formatAmount, formatRange } from '@/lib/money';
import type { EstimateItemView } from '@/mock/parts';
import { PartNumber } from './part-number';
import { cx, Kicker } from './ui';

/**
 * The parts table.
 *
 * A real table at 380px is the design problem the brief singles out, and the
 * answer here is not a horizontal scroller. Each row is a wrapping flex block:
 * on a desktop the five fields line up under a ruled header, and on a phone the
 * same fields stack full-width with their own labels. Nothing is hidden at any
 * size, and the part number never truncates.
 */

/**
 * Column widths, shared by the header and every row so they stay in register.
 *
 * The bases are in pixels, not percentages, and that is the whole trick. A
 * percentage basis can shrink indefinitely, so on a phone the columns would
 * simply crush rather than wrap — and a part number under `overflow-wrap:
 * anywhere` in a 70px column shatters into one character per line, which is
 * precisely the string this product cannot afford to mangle. Pixel bases force
 * a real wrap instead. The grow factors carry the design's desktop proportions
 * (34 / 22 / 18 / 13), so the wide layout is unchanged.
 */
const COL = {
  code: 'flex-[0_0_40px]',
  part: 'flex-[34_1_220px]',
  mpn: 'flex-[22_1_180px]',
  price: 'flex-[18_1_130px]',
  source: 'flex-[13_1_110px]',
} as const;

/** Shown beside each field on phones, where the header row is gone. */
function MobileLabel({ children }: { children: React.ReactNode }) {
  return (
    <Kicker as="span" className="text-muted-2 mb-[4px] block tracking-[0.1em] sm:hidden">
      {children}
    </Kicker>
  );
}

export function PartsTable({
  items,
  subtotal,
  pricedCount,
}: {
  items: readonly EstimateItemView[];
  subtotal: Money | null;
  pricedCount: number;
}) {
  return (
    <div className="border-ink bg-panel border-2">
      <div className="bg-panel-2 border-ink text-muted hidden flex-wrap gap-x-[14px] gap-y-[10px] border-b-2 px-[13px] py-[8px] font-mono text-[11px] font-bold leading-none tracking-[0.11em] sm:flex">
        <span className={COL.code}>CODE</span>
        <span className={cx(COL.part, 'min-w-0')}>PART</span>
        <span className={cx(COL.mpn, 'min-w-0')}>MANUFACTURER PART NO.</span>
        <span className={cx(COL.price, 'min-w-0')}>ESTIMATE (₦)</span>
        <span className={cx(COL.source, 'min-w-0')}>SOURCE</span>
      </div>

      <ul>
        {items.map((item) => (
          <li
            key={item.id}
            className={cx(
              'border-rule flex flex-wrap items-center gap-x-[14px] gap-y-[10px] border-b px-[13px] py-[12px]',
              // Unpriced rows are dimmed, not hidden. The part is still needed;
              // we simply do not know what it costs, and that must be legible.
              item.isPriced ? 'bg-panel' : 'bg-panel-3',
            )}
          >
            <span className={cx(COL.code, 'text-muted font-mono text-[11px] font-bold')}>
              {item.ordinal}
            </span>

            <span className={cx(COL.part, 'min-w-0')}>
              <span className="block text-[15px] font-bold uppercase leading-[1.2]">
                {item.partName}
              </span>
              <span className="text-muted block text-[12px] leading-[1.45]">{item.detail}</span>
            </span>

            <span className={cx(COL.mpn, 'min-w-0')}>
              <MobileLabel>Part no.</MobileLabel>
              <PartNumber value={item.mpn} />
            </span>

            <span className={cx(COL.price, 'min-w-0')}>
              <MobileLabel>Estimate</MobileLabel>
              <span
                className={cx(
                  'block font-mono text-[16px] font-bold leading-[1.2] tracking-[-0.01em]',
                  item.isPriced ? 'text-ink' : 'text-muted',
                )}
              >
                {item.price
                  ? `${formatAmount(item.price.min)} – ${formatAmount(item.price.max)}`
                  : 'No price'}
              </span>
            </span>

            <span className={cx(COL.source, 'text-ink-soft min-w-0 text-[11px] leading-[1.35]')}>
              <MobileLabel>Source</MobileLabel>
              {item.sourceTag}
            </span>
          </li>
        ))}
      </ul>

      {/* The total repeats in the table foot as well as the page header, because
          a user photographing one screen should capture the figure either way. */}
      <div className="bg-panel-2 flex flex-wrap items-center justify-between gap-x-[14px] gap-y-[10px] p-[13px]">
        <Kicker as="span" className="text-muted tracking-[0.09em]">
          {pricedCount} of {items.length} parts priced · Total
        </Kicker>
        <span className="font-mono text-[19px] font-bold leading-[1.1]">
          {subtotal ? formatRange(subtotal) : 'No priced parts'}
        </span>
      </div>
    </div>
  );
}
