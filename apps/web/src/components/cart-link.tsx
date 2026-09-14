'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart';

/**
 * The basket count in the header band, on every store page.
 *
 * It renders as a link with no count until the device store has been read, and
 * never as a zero. A "0" that appears for one frame and then becomes "3" reads
 * as a basket being emptied and refilled in front of you; on the slow Android
 * connections this store is actually used on, that frame is not brief.
 *
 * Empty stays uncounted too — a badge saying nothing is in your basket is noise
 * the header does not need to carry.
 */
export function CartLink() {
  const { lines, hydrated } = useCart();
  const count = lines.reduce((total, line) => total + line.quantity, 0);
  const show = hydrated && count > 0;

  return (
    <Link
      href="/cart"
      className="border-night-rule text-paper hover:border-flag flex flex-none items-center gap-[8px] border px-[10px] py-[6px] font-mono text-[11px] font-bold uppercase leading-none tracking-[0.11em]"
    >
      Cart
      {show ? (
        <span
          className="bg-flag text-flag-ink flex h-[18px] min-w-[18px] items-center justify-center px-[4px] text-[11px] leading-none"
          aria-label={`${count} ${count === 1 ? 'item' : 'items'} in your cart`}
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}
