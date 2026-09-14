import type { Metadata } from 'next';
import { CartLink } from '@/components/cart-link';
import { AppHeader, PageHeading, Shell, SiteFooter } from '@/components/chrome';
import { EstimateToCartScreen } from '@/components/estimate-to-cart';
import { VehicleContext } from '@/components/vehicle-context';

export const metadata: Metadata = {
  title: 'Buy these parts',
  description:
    'Turn a MIMS estimate into a basket — with the parts we cannot supply named rather than quietly dropped.',
};

/**
 * ESTIMATOR → CART — build plan item 8.
 *
 * A static sibling of `/estimate/[reference]`, like `/estimate/new`. The
 * vehicle band stays: this is the last screen before the basket, the grade
 * choices below it are priced against one car, and a customer who realises
 * here that they picked the wrong trim should be able to fix it without going
 * back to the beginning.
 */
export default function EstimateBuyPage() {
  return (
    <>
      <AppHeader
        label="Estimate · Buy the parts"
        meta="NGN · Duty included"
        action={<CartLink />}
      />
      <VehicleContext />

      <main>
        <Shell width="app">
          <PageHeading
            kicker="From your estimate"
            title="Buy these parts"
            lede="Every part on your estimate is here — the ones we can sell you, and the ones we can only name. Nothing goes in the basket until you say so."
            size="md"
          />
          <EstimateToCartScreen />
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
