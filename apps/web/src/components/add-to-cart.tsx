'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart';
import type { ListingDetailView } from '@/mock/listings';
import { Button } from './ui';

/**
 * THE BUY BUTTON.
 *
 * Two decisions in here are worth stating, because both are the opposite of
 * what a conversion-optimised store does.
 *
 * It does not navigate. Being thrown into a basket after every add is how a
 * shopper buying a bumper, a grille and two clips ends up making four round
 * trips through a catalogue they were in the middle of reading. The button
 * confirms in place and offers the cart as a link, so leaving is a choice.
 *
 * It does not celebrate. No modal, no toast sliding over the price, no
 * "Great choice!" — just a line saying what is now in the basket and how to get
 * there. The customer came here suspecting the trade of selling too hard.
 *
 * What it DOES do is record the fitment grade alongside the price, because a
 * part added while the car said "probable" must still say "probable" at
 * checkout, and must be able to notice if that answer later changed.
 */
export function AddToCart({ listing, quantity }: { listing: ListingDetailView; quantity: number }) {
  const { add, hydrated } = useCart();
  const [added, setAdded] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const soldOut = listing.stockModel === 'held_stock' && listing.quantityAvailable <= 0;

  return (
    <div className="mt-[13px] grid gap-[9px]">
      <Button
        variant="primary"
        size="lg"
        full
        /* Disabled until the device store has been read, so the first click
           cannot land on a basket we have not seen yet and silently replace it. */
        disabled={!hydrated || soldOut}
        onClick={() => {
          const total = add({
            slug: listing.slug,
            quantity,
            partName: listing.partName,
            mpn: listing.mpn,
            sku: listing.sku,
            condition: listing.condition,
            stockModel: listing.stockModel,
            priceAtAdd: listing.price.amount,
            fitmentAtAdd: listing.fitment?.confidence ?? null,
          });
          setAdded(total);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => setAdded(null), 8000);
        }}
      >
        {soldOut ? 'Not on the shelf' : 'Add to cart'}
      </Button>

      {/*
       * Announced politely rather than assertively: it is a confirmation, not an
       * interruption, and a screen reader user mid-sentence should finish the
       * sentence. The region is always mounted so the update is actually read.
       */}
      <p aria-live="polite" className="text-ink-soft m-0 min-h-[18px] text-[12.5px] leading-[1.45]">
        {added !== null ? (
          <>
            <strong className="font-bold">
              {added} × {listing.partName}
            </strong>{' '}
            in your cart.{' '}
            <Link href="/cart" className="text-flag-deep font-bold underline">
              Go to cart
            </Link>
          </>
        ) : null}
      </p>

      <Button variant="outline" size="md" full href="/parts">
        Keep looking
      </Button>
    </div>
  );
}
