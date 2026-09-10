import type { Metadata } from 'next';
import { AppHeader, PageHeading, Shell, SiteFooter } from '@/components/chrome';
import { StatesGallery } from '@/components/states-gallery';

export const metadata: Metadata = {
  title: "When the answer isn't a price",
  description:
    'The five outcomes that are not an estimate: VIN not found, car not in catalogue, partial coverage, loading, and a slow connection.',
  robots: { index: false, follow: false },
};

/**
 * Screen 4 as a gallery.
 *
 * Each of these is wired into the live flow already — this page exists so the
 * five can be reviewed side by side against the design without having to
 * engineer a bad VIN or throttle a connection to reach them.
 */
export default function StatesPage() {
  return (
    <>
      <AppHeader label="Screen 04 — states" />
      <main>
        <Shell>
          <PageHeading
            title="When the answer isn't a price"
            lede="Early on these are the common outcomes, not the edge cases. Each keeps the user moving and says plainly what we do and don't know."
            size="md"
          />
          <StatesGallery />
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
