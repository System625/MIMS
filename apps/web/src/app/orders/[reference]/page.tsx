import type { Metadata } from 'next';
import { CartLink } from '@/components/cart-link';
import { AppHeader, Shell, SiteFooter } from '@/components/chrome';
import { OrderTrackingScreen } from '@/components/order-tracking';
import { PLACEHOLDER_REFERENCES } from '@/mock/orders';

export const metadata: Metadata = {
  title: 'Your order',
  description: 'Where your MIMS order is, what has happened to it, and what happens next.',
  /* Never indexed. A reference in a search result is half of the pair that
     opens the order, and the half a stranger does not otherwise have. */
  robots: { index: false, follow: false },
};

/**
 * ORDER TRACKING — build plan item 7.
 *
 * The shell is prerendered and everything inside it is the client island,
 * because there is no session here: whether this device may see the order is a
 * fact about the device (`lib/orders.tsx`), and the server cannot know it. That
 * also means the route carries NO metadata about the order itself — no part
 * name in the title, no total in the description — since the shell is rendered
 * before anyone has proved they are allowed to see either.
 *
 * `generateStaticParams` covers the placeholder references so those routes are
 * built; anything else falls through to the same client screen, which asks for
 * the phone number before it says whether the order exists at all.
 */
export function generateStaticParams() {
  return PLACEHOLDER_REFERENCES.map((reference) => ({ reference }));
}

export default async function OrderPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;

  return (
    <>
      <AppHeader label="Parts store · Order" meta="NGN · Duty included" action={<CartLink />} />
      <main>
        <Shell width="app">
          <OrderTrackingScreen reference={reference} />
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
