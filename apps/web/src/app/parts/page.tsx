import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AppHeader, PageHeading, Shell, SiteFooter } from '@/components/chrome';
import { BrowseParts } from '@/components/browse';
import { VehicleContext } from '@/components/vehicle-context';

export const metadata: Metadata = {
  title: 'Browse parts',
  description:
    'Search the MIMS catalogue by part name or part number, filter by category and condition, and see every result graded against your own car.',
};

/**
 * SEARCH AND BROWSE — build plan item 3. Replaces the holding page that stood
 * here while item 2 shipped.
 *
 * The screen itself is a client component because its whole job is to react to
 * two things the server cannot see: the query in the URL and the car in the
 * device store. `useSearchParams` needs a Suspense boundary for that reason,
 * and the fallback below is the page's own furniture rather than a spinner —
 * the header, the vehicle band and the heading are all knowable before any of
 * this resolves, so they are rendered rather than withheld.
 */
export default function BrowsePartsPage() {
  return (
    <>
      <AppHeader label="Parts store · Browse" meta="NGN · Duty included" />
      <VehicleContext />

      <main>
        <Shell width="app">
          <PageHeading
            kicker="Catalogue"
            title="Browse parts"
            lede="Search by part name or by the number stamped on the old part. With your car set, every result says how sure we are that it fits — and the ones we cannot vouch for stay on the page, marked."
          />

          <Suspense fallback={<div className="min-h-[420px]" />}>
            <BrowseParts />
          </Suspense>
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
