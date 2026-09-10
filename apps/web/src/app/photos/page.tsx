import type { Metadata } from 'next';
import Link from 'next/link';
import { AppHeader, PageHeading, Shell, SiteFooter } from '@/components/chrome';
import { PhotoUpload } from '@/components/photo-upload';
import { Kicker } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Add photos',
  description:
    'Optional photos of the damage. They help us check the parts list — your estimate works without them.',
};

export default function PhotosPage() {
  return (
    <>
      <AppHeader
        label="Step 02 — Photos · optional"
        action={
          <Link href="/estimate">
            <Kicker as="span" className="text-flag tracking-[0.09em] underline">
              Skip this
            </Kicker>
          </Link>
        }
      />
      <main>
        <Shell width="app">
          <PageHeading
            title="Add photos"
            lede="Photos let us check the parts list against the actual damage, and they help us price parts we haven't seen before. They are not needed to get your estimate."
          />
          <Kicker as="div" className="text-flag-deep mt-[10px] tracking-[0.12em]">
            Optional — your estimate works without them
          </Kicker>
          <PhotoUpload />
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
