/**
 * MONEY IS A DECIMAL STRING, AND ARITHMETIC ON IT GOES THROUGH HERE.
 *
 * `numeric(14,2)` in Postgres, strings on the wire, converted only where it is
 * displayed — that rule (bella.md §10) is kept honest by never letting a Naira
 * figure become a float. `0.1 + 0.2` is the canonical demonstration and a
 * bumper is not the place to discover it: an order line that computes
 * ₦148,500.00000000001 either fails the gateway's amount check or, worse,
 * passes it and leaves a kobo of drift in the ledger for somebody to chase.
 *
 * So everything below works in MINOR UNITS as `bigint` and converts back at the
 * edge. Kobo is the minor unit of the Naira; Paystack also speaks kobo, but that
 * is a coincidence of currency rather than a shared concern, which is why the
 * gateway's own vocabulary stays in `paystack.client.ts` and delegates here for
 * the arithmetic.
 */

/** `"186000.00"` → `18600000n`. Rejects anything that is not a plain decimal. */
export function toMinor(decimal: string): bigint {
  const trimmed = decimal.trim();
  if (!/^-?\d+(\.\d{1,2})?$/.test(trimmed)) {
    throw new Error(`Not a money value: ${decimal}`);
  }
  const negative = trimmed.startsWith('-');
  const [whole = '0', fraction = ''] = (negative ? trimmed.slice(1) : trimmed).split('.');
  const minor = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  return negative ? -minor : minor;
}

/** `18600000n` → `"186000.00"`. Always two decimal places, never exponential. */
export function fromMinor(minor: bigint): string {
  const negative = minor < 0n;
  const value = negative ? -minor : minor;
  return `${negative ? '-' : ''}${value / 100n}.${String(value % 100n).padStart(2, '0')}`;
}

/**
 * A line total. Quantity is a whole number of parts — nobody buys half a
 * bumper — so this is an exact integer multiplication with no rounding step to
 * argue about.
 */
export function multiplyMoney(decimal: string, quantity: number): string {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error(`Not a quantity: ${quantity}`);
  }
  return fromMinor(toMinor(decimal) * BigInt(quantity));
}

export function sumMoney(decimals: readonly string[]): string {
  return fromMinor(decimals.reduce((total, decimal) => total + toMinor(decimal), 0n));
}

export function addMoney(a: string, b: string): string {
  return fromMinor(toMinor(a) + toMinor(b));
}

/** Compares by value, so `"1000"` and `"1000.00"` are the same money. */
export function moneyEquals(a: string, b: string): boolean {
  return toMinor(a) === toMinor(b);
}

export const ZERO_MONEY = '0.00';
