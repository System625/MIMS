import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * PAYSTACK WEBHOOK SIGNATURES.
 *
 * Paystack signs every webhook as HMAC-SHA512 of the request body, keyed with
 * the secret key, and sends it hex-encoded in `x-paystack-signature`.
 *
 * THREE THINGS ARE EASY TO GET WRONG HERE, and all three are silent:
 *
 * 1. It is the RAW body. A body that has been parsed to JSON and re-serialised
 *    is a different sequence of bytes — different key order, different spacing,
 *    different unicode escaping — and will not verify. The raw buffer has to be
 *    captured before any body parser touches it, which is why `main.ts` boots
 *    Nest with `rawBody: true`.
 *
 * 2. The comparison must be timing-safe. A plain `===` on a hex string leaks,
 *    byte by byte, how much of a guess was correct; that is enough to forge a
 *    signature given enough attempts, and the attempts are free.
 *
 * 3. A missing or malformed header is a FAILURE, never a skip. The whole point
 *    of the signature is that an unsigned request is indistinguishable from an
 *    attacker's, and value moves on the strength of this check.
 *
 * This file is deliberately pure — no Nest, no config, no I/O — so it can be
 * tested exhaustively without a server, and so there is exactly one place where
 * the rule lives.
 */

export const PAYSTACK_SIGNATURE_HEADER = 'x-paystack-signature';

/** SHA-512 hex is always 128 characters. Anything else cannot be a signature. */
const SIGNATURE_LENGTH = 128;

export function signPaystackPayload(rawBody: Buffer | string, secretKey: string): string {
  return createHmac('sha512', secretKey).update(rawBody).digest('hex');
}

/**
 * Whether `signature` is Paystack's signature for exactly these bytes.
 *
 * Returns false rather than throwing for every rejection — a bad signature is an
 * expected event on a public endpoint, not an exceptional one, and the caller
 * answers all of them the same way.
 */
export function verifyPaystackSignature(
  rawBody: Buffer | string | undefined,
  signature: string | undefined,
  secretKey: string,
): boolean {
  if (rawBody === undefined || signature === undefined) return false;
  if (secretKey.length === 0) return false;

  /* Length is checked before the compare because `timingSafeEqual` throws on a
     length mismatch, and a thrown error here would be an unsigned request
     taking down the endpoint. The length itself is not a secret. */
  if (signature.length !== SIGNATURE_LENGTH) return false;

  const expected = Buffer.from(signPaystackPayload(rawBody, secretKey), 'hex');
  const received = Buffer.from(signature, 'hex');

  // A non-hex character decodes to a shorter buffer, so this also rejects junk.
  if (received.length !== expected.length) return false;

  return timingSafeEqual(expected, received);
}
