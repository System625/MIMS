import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { addMoney, fromMinor, moneyEquals, multiplyMoney, sumMoney, toMinor } from './money';

/**
 * Every Naira figure in this system passes through here — order lines, order
 * totals, and the kobo the Paystack adapter sends and compares. It is a small
 * module and it is the one place a rounding error would be invisible and
 * expensive, so it gets its own tests rather than being covered incidentally.
 */
describe('money', () => {
  it('survives the arithmetic floats get wrong', () => {
    /* 0.1 + 0.2 in floats is 0.30000000000000004. Money is not floats. */
    assert.equal(addMoney('0.10', '0.20'), '0.30');
    assert.equal(sumMoney(['0.10', '0.20', '0.30']), '0.60');
    assert.equal(multiplyMoney('10333.33', 3), '30999.99');
  });

  it('does not lose kobo across a large basket', () => {
    const lines = Array.from({ length: 97 }, () => '148500.55');
    assert.equal(sumMoney(lines), '14404553.35');
  });

  it('accepts the shapes Postgres numeric hands back', () => {
    assert.equal(toMinor('1000'), 100000n);
    assert.equal(toMinor('1000.0'), 100000n);
    assert.equal(toMinor('1000.00'), 100000n);
    assert.ok(moneyEquals('1000', '1000.00'));
  });

  it('refuses anything that is not a money value rather than coercing it', () => {
    /* A silent NaN here becomes a zero-Naira order line. */
    for (const junk of ['', ' ', '1e5', '1,000.00', '₦1000', 'abc', '10.005', '--1']) {
      assert.throws(() => toMinor(junk), /Not a money value/, `accepted ${JSON.stringify(junk)}`);
    }
  });

  it('refuses a quantity that is not a whole number of parts', () => {
    assert.throws(() => multiplyMoney('100.00', 1.5), /Not a quantity/);
    assert.throws(() => multiplyMoney('100.00', -1), /Not a quantity/);
  });

  it('handles negatives, because a refund is money too', () => {
    assert.equal(fromMinor(-12345n), '-123.45');
    assert.equal(toMinor('-123.45'), -12345n);
    assert.equal(addMoney('100.00', '-40.50'), '59.50');
  });

  it('always writes two decimal places, never exponential notation', () => {
    assert.equal(fromMinor(0n), '0.00');
    assert.equal(fromMinor(5n), '0.05');
    assert.equal(fromMinor(100000000000n), '1000000000.00');
  });
});
