import type { Metadata } from 'next';
import { CartLink } from '@/components/cart-link';
import { CheckoutScreen } from '@/components/checkout';
import { AppHeader, PageHeading, Shell, SiteFooter } from '@/components/chrome';
import { VehicleContext } from '@/components/vehicle-context';

export const metadata: Metadata = {
  title: 'Checkout',
  description:
    'Guest checkout — phone as identity, delivery or collection, and one all-in Naira figure with nothing added at the end.',
};

/**
 * Build plan item 6. The vehicle band stays on this page deliberately: fitment
 * is the last thing that can still be corrected for free, and the customer is
 * about to prepay for something that takes weeks to arrive.
 */
export default function CheckoutPage() {
  return (
    <>
      <AppHeader label="Parts store · Checkout" meta="NGN · Duty included" action={<CartLink />} />
      <VehicleContext />

      <main>
        <Shell width="app">
          <PageHeading
            kicker="Checkout"
            title="Where it goes, and who to call"
            lede="No account, no password. Your phone number is the order. Nothing is charged until you have seen the final figure."
            size="md"
          />
          <CheckoutScreen />
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
