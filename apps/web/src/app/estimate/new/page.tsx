import type { Metadata } from 'next';
import { AppHeader, PageHeading, Shell, SiteFooter } from '@/components/chrome';
import { VehicleIdentification } from '@/components/vehicle-identification';

export const metadata: Metadata = {
  title: 'Which car is it?',
  description:
    'Identify your vehicle by VIN or by choosing make, model, year and trim. Both routes give the same parts list.',
};

/**
 * Screen 1 of the estimator.
 *
 * This lived at `/` while the estimator was the whole product. The marketplace
 * home is the front door now, so the estimator starts here — the move the
 * original handover note anticipated, and nothing in the flow changed with it.
 * A user arrives from the store's "I'm not sure what I need" route, or straight
 * from a search, and leaves at screen 3 with either a parts list or a cart.
 */
export default function VehiclePage() {
  return (
    <>
      <AppHeader step="vehicle" meta="Parts catalogue · Nigeria · Rev 2026.09" />
      <main>
        <Shell>
          <PageHeading
            kicker="Step 01 — Identify the vehicle"
            title="Which car is it?"
            lede="Both routes give the same parts list. The VIN is exact; picking it yourself takes about twenty seconds and is what most people use."
          />
          <VehicleIdentification />
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
