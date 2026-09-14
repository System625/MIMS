import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CartLink } from '@/components/cart-link';
import { AppHeader, Shell, SiteFooter } from '@/components/chrome';
import { ListingDetailScreen } from '@/components/listing-detail';
import { VehicleContext } from '@/components/vehicle-context';
import { allListingSlugs, CONDITION_LABEL, listingBySlug } from '@/mock/listings';

/**
 * PRODUCT DETAIL — build plan item 4.
 *
 * The listing is static data, so the route is prerendered per slug and the
 * screen inside it is the client island: only two things about this page depend
 * on the visitor, and both — the car in the device store and the fitment
 * verdict computed against it — are things the server genuinely cannot know.
 *
 * Resolving the listing here as well as in the client is deliberate. It gives a
 * real 404 for a slug that does not exist rather than a blank screen, and it
 * gives the page a title and description that describe the actual part when the
 * link is pasted into WhatsApp, which is how most of these links will travel.
 */

export function generateStaticParams() {
  return allListingSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = listingBySlug(slug, null);
  if (!listing) return { title: 'Part not found' };

  return {
    title: `${listing.title} — ${CONDITION_LABEL[listing.condition]}`,
    description: `${listing.detail} One all-in Naira price with duty included. See which cars we have confirmed it fits before you buy.`,
  };
}

export default async function ListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = listingBySlug(slug, null);
  if (!listing) notFound();

  return (
    <>
      <AppHeader label="Parts store · Part" meta="NGN · Duty included" action={<CartLink />} />
      <VehicleContext />

      <main>
        <Shell width="app">
          <ListingDetailScreen slug={slug} />
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
