import type { Metadata } from 'next';
import { AppHeader, PageHeading, Shell, SiteFooter } from '@/components/chrome';
import { SavedEstimates } from '@/components/saved-estimates';
import { Button, Kicker } from '@/components/ui';
import { SAVED_ESTIMATES } from '@/mock/estimates';

export const metadata: Metadata = {
  title: 'My estimates',
  description: 'Your saved parts estimates, kept so you can reopen one at the workshop.',
};

export default function MyEstimatesPage() {
  return (
    <>
      <AppHeader label="My estimates" />
      <main>
        <Shell width="app" className="pt-[22px]">
          <PageHeading
            title="My estimates"
            aside={
              <Button variant="primary" size="md" href="/" className="min-h-[50px] flex-none">
                New estimate
              </Button>
            }
          />
          <Kicker as="div" className="text-muted mt-[8px] tracking-[0.12em]">
            {SAVED_ESTIMATES.length} saved · 2 vehicles
          </Kicker>
          <SavedEstimates />
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
