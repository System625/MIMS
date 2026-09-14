import type { Metadata } from 'next';
import { CartLink } from '@/components/cart-link';
import { AppHeader, PageHeading, Shell, SiteFooter } from '@/components/chrome';
import { OrdersIndexScreen } from '@/components/orders-index';

export const metadata: Metadata = {
  title: 'Your orders',
  description:
    'Track a MIMS order with the reference and the phone number it was placed with. No account, no password.',
  /* A page that opens somebody's order off two facts should not be indexed, and
     neither should the placeholder references listed on it. */
  robots: { index: false, follow: false },
};

/**
 * Build plan item 7. There is no vehicle band on this page, deliberately: the
 * car on an order is the car it was BOUGHT for, snapshotted at the time, and a
 * band inviting somebody to change "their" car above a list of past orders
 * implies it would change them. It would not, and the suggestion is worse than
 * the missing convenience.
 */
export default function OrdersPage() {
  return (
    <>
      <AppHeader label="Parts store · Orders" meta="NGN · Duty included" action={<CartLink />} />
      <main>
        <Shell width="app">
          <PageHeading
            kicker="Orders"
            title="Your orders"
            lede="No account and no password. An order is found with its reference and the phone number it was placed with, and this device remembers the ones you have opened."
            size="md"
          />
          <OrdersIndexScreen />
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
