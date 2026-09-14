import { randomInt } from 'node:crypto';

/**
 * THE NUMBER A CUSTOMER READS BACK OVER THE PHONE.
 *
 * `MI-` is an estimate and `MO-` is an order. Two references that land in the
 * same WhatsApp thread must not be confusable, and "the one starting M-I" is
 * not a distinction anybody can hear — so the prefix carries the difference and
 * the body never does.
 *
 * DIGITS ONLY, deliberately. This string is spoken down a bad line, written on
 * the back of a receipt, and typed into `/orders` by somebody who is anxious.
 * Letters introduce B/V, M/N, F/S and the whole 0/O, 1/I family; digits survive
 * every accent and every handwriting. Seven of them is ten million references,
 * which is more than enough and still short enough to say in one breath.
 *
 * RANDOM, NOT SEQUENTIAL. A counter would be shorter and would sort nicely in
 * the admin queue, and it would also tell anybody who ordered twice exactly how
 * much business we did in between. A new store cannot afford to publish that.
 * `randomInt` is the CSPRNG rather than `Math.random`, because the reference is
 * half of the guest lookup's evidence — the phone number is the other half, and
 * neither half should be predictable.
 */
const PREFIX = 'MO-';
const DIGITS = 7;

export function generateOrderReference(): string {
  const body = String(randomInt(0, 10 ** DIGITS)).padStart(DIGITS, '0');
  return `${PREFIX}${body}`;
}

/**
 * The reference as it is actually spoken and typed: case is not meaningful, the
 * hyphen is decoration, and people drop the prefix.
 *
 * This MUST match `normaliseReference` in `apps/web/src/mock/orders.ts`. A
 * lookup that succeeds on the tracking screen and fails against the API — or
 * the reverse — is a support call about nothing, and the customer will be
 * certain the fault is ours because from where they are standing it is.
 */
export function normaliseOrderReference(input: string): string {
  const compact = input.replace(/[\s-]/g, '').trim().toUpperCase();
  return compact.startsWith('MO') ? `${PREFIX}${compact.slice(2)}` : compact;
}

/**
 * Nigerian numbers are given as `0803…`, `+234803…`, `234803…` and with spaces
 * in every combination. We store and compare one form.
 *
 * Also mirrors the web's `normalisePhone`, and for the same reason: the guest
 * lookup compares a typed phone against a stored one, and "the number I always
 * use" must match whichever way they happened to write it that day.
 */
export function normalisePhone(input: string): string {
  const compact = input.replace(/[\s-]/g, '').trim();
  if (compact.startsWith('+234')) return `0${compact.slice(4)}`;
  if (compact.startsWith('234')) return `0${compact.slice(3)}`;
  return compact;
}
