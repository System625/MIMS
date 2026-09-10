import type { Money } from '@mims/contracts';

/**
 * Money arrives as a decimal string and stays one until the moment it is drawn
 * on screen. Nothing here parses to a float: totals are summed in minor units
 * with BigInt, exactly as the API does, so a Naira figure can never drift by a
 * rounding error between the two.
 */

export function toMinorUnits(decimal: string): bigint {
  const [whole = '0', fraction = ''] = decimal.split('.');
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0').slice(0, 2));
}

export function fromMinorUnits(minor: bigint): string {
  return `${minor / 100n}.${String(minor % 100n).padStart(2, '0')}`;
}

/** Sums a column of decimal strings without ever leaving integer arithmetic. */
export function sumDecimals(values: readonly string[]): string {
  return fromMinorUnits(values.reduce((acc, value) => acc + toMinorUnits(value), 0n));
}

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** `"148000.00"` → `"₦148,000"`. Kobo are dropped: no part is priced in kobo. */
export function formatNaira(decimal: string): string {
  const [whole = '0'] = decimal.split('.');
  return `₦${groupThousands(whole)}`;
}

/** `"148000.00"` → `"148,000"` — for columns where the ₦ sits in the header. */
export function formatAmount(decimal: string): string {
  const [whole = '0'] = decimal.split('.');
  return groupThousands(whole);
}

/**
 * The full range, which is the actual answer the product gives. A single figure
 * would be a lie, so the range is never collapsed for display.
 */
export function formatRange(money: Money): string {
  return `${formatNaira(money.min)} – ${formatNaira(money.max)}`;
}

/** `"₦148–186k"` — the tight form used in cards, lists and the shared estimate. */
export function formatRangeCompact(money: Money): string {
  const min = toMinorUnits(money.min) / 100n;
  const max = toMinorUnits(money.max) / 100n;
  const k = (naira: bigint) =>
    naira >= 1000n ? `${(naira / 1000n).toString()}k` : naira.toString();
  return `₦${k(min)}–${k(max)}`;
}

/** `"4 September 2026"` — long form, because a stale price must be obvious. */
export function formatLongDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** `"04 SEP 2026"` — the stamped form used in header bands and the PDF. */
export function formatStampDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = d.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }).toUpperCase();
  return `${day} ${month} ${d.getUTCFullYear()}`;
}

export function daysSince(iso: string, now: Date = new Date()): number {
  const ms = now.getTime() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}
