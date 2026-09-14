import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { describe, it } from 'node:test';
import { signPaystackPayload, verifyPaystackSignature } from './paystack.signature';

const SECRET = 'sk_test_0123456789abcdef0123456789abcdef01234567';
const BODY = JSON.stringify({
  event: 'charge.success',
  data: { reference: 'MIMS-8F31', amount: 18_600_000 },
});

const sign = (body: string, secret = SECRET) =>
  createHmac('sha512', secret).update(body).digest('hex');

describe('verifyPaystackSignature', () => {
  it('accepts a signature Paystack would have produced', () => {
    assert.equal(verifyPaystackSignature(BODY, sign(BODY), SECRET), true);
  });

  it('produces the same digest as an independent HMAC', () => {
    assert.equal(signPaystackPayload(BODY, SECRET), sign(BODY));
  });

  it('accepts the raw bytes as a Buffer, which is how it actually arrives', () => {
    assert.equal(verifyPaystackSignature(Buffer.from(BODY, 'utf8'), sign(BODY), SECRET), true);
  });

  it('rejects a body that changed by one character', () => {
    const tampered = BODY.replace('18600000', '18600001');
    assert.equal(verifyPaystackSignature(tampered, sign(BODY), SECRET), false);
  });

  /*
   * The failure this whole module exists to prevent: a handler that parses the
   * JSON and signs the re-serialised object instead of the bytes on the wire.
   * The two are semantically identical and cryptographically different.
   */
  it('rejects a re-serialised body with different key order', () => {
    const reserialised = JSON.stringify({
      data: { amount: 18_600_000, reference: 'MIMS-8F31' },
      event: 'charge.success',
    });
    assert.notEqual(reserialised, BODY);
    assert.equal(verifyPaystackSignature(reserialised, sign(BODY), SECRET), false);
  });

  it('rejects a signature made with a different secret', () => {
    const other = sign(BODY, 'sk_test_ffffffffffffffffffffffffffffffffffffffff');
    assert.equal(verifyPaystackSignature(BODY, other, SECRET), false);
  });

  it('rejects a missing signature header rather than skipping the check', () => {
    assert.equal(verifyPaystackSignature(BODY, undefined, SECRET), false);
  });

  it('rejects a missing raw body — an unparsed request is not a trusted one', () => {
    assert.equal(verifyPaystackSignature(undefined, sign(BODY), SECRET), false);
  });

  it('rejects when no secret is configured, rather than accepting everything', () => {
    assert.equal(verifyPaystackSignature(BODY, sign(BODY), ''), false);
  });

  it('rejects malformed signatures without throwing', () => {
    for (const bad of [
      '',
      'not-hex',
      'ab',
      sign(BODY).slice(0, 127),
      `${sign(BODY)}00`,
      'z'.repeat(128),
    ]) {
      assert.equal(
        verifyPaystackSignature(BODY, bad, SECRET),
        false,
        `should reject ${bad.slice(0, 20)}`,
      );
    }
  });

  it('is case-insensitive about hex, because a digest is bytes', () => {
    assert.equal(verifyPaystackSignature(BODY, sign(BODY).toUpperCase(), SECRET), true);
  });
});
