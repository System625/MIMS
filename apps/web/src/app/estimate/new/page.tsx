import type { Metadata } from 'next';
import { AppHeader, PageHeading, Shell, SiteFooter } from '@/components/chrome';
import { VehicleIdentification } from '@/components/vehicle-identification';

export const metadata: Metadata = {
  title: 'Which car is it?',
  description:
    'Identify your vehicle by VIN or by choosing make, model, year and trim. Both routes give the same parts list.',
};

/**
 * Screen 1 of the estimator, and the app's entry point.
 *
 * The landing page from the original brief has not been designed yet — the
 * design canvas ends with "Remaining from the original brief: landing page and
 * admin dashboard" — so rather than invent one, `/` opens the estimator. Nothing
 * here needs to move when the landing page arrives; it becomes `/` and this
 * becomes `/estimate/new`.
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
