import type { Metadata } from 'next';
import { CartScreen } from '@/components/cart-view';
import { CartLink } from '@/components/cart-link';
import { AppHeader, PageHeading, Shell, SiteFooter } from '@/components/chrome';
import { VehicleContext } from '@/components/vehicle-context';

export const metadata: Metadata = {
  title: 'Your cart',
  description: 'The MIMS basket — line-by-line fitment, mixed lead times, one all-in total.',
};

/**
 * Build plan item 5. This route was a holding page from item 4 until now,
 * standing in so the product screen's buy button was never dead.
 *
 * The page shell is a server component and the basket inside it is not, because
 * the basket lives on the device until the API is wired (item 10). The heading
 * therefore states the cart's promise unconditionally — it is true of an empty
 * basket and a full one — rather than describing contents the server cannot see.
 */
export default function CartPage() {
  return (
    <>
      <AppHeader label="Parts store · Cart" meta="NGN · Duty included" action={<CartLink />} />
      <VehicleContext />

      <main>
        <Shell width="app">
          <PageHeading
            kicker="Basket"
            title="Your cart"
            lede="Every line is re-checked against your car each time you open this page. Change your car and the basket is re-graded, never emptied."
            size="md"
          />
          <CartScreen />
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
