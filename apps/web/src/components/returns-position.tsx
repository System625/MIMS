import Link from 'next/link';
import { RETURNS_HREF, RETURNS_SUMMARY } from '@/lib/returns';
import { Note } from './ui';

/**
 * The returns position, stated on the screens where money is at stake rather
 * than only on a policy page nobody opens.
 *
 * It is one component and one string (`lib/returns.ts`) on purpose. A shop that
 * words its refund promise slightly differently on the product page and at the
 * checkout has told the customer that the wording is tactical, and a customer
 * who suspects that reads every other number on the site differently too.
 *
 * Always the orange spine: this is a caveat that must not be skimmable, and it
 * is the one block on a commerce screen that a customer may need to quote back
 * to us months later.
 */
export function ReturnsPosition({ className }: { className?: string }) {
  return (
    <Note tone="rule" className={className}>
      <strong className="font-bold">If it is our mistake, it is our cost.</strong> {RETURNS_SUMMARY}{' '}
      <Link href={RETURNS_HREF} className="text-flag-deep underline">
        The full returns position
      </Link>
      .
    </Note>
  );
}
