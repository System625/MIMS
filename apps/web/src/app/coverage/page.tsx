import type { Metadata } from 'next';
import { AppHeader, PageHeading, Shell, SiteFooter } from '@/components/chrome';
import { CoverageCheck } from '@/components/coverage-check';

export const metadata: Metadata = {
  title: 'Is your car covered?',
  description:
    'Which makes and models MIMS prices properly today, and which are still gaps. Updated weekly.',
};

export default function CoveragePage() {
  return (
    <>
      <AppHeader label="Coverage · updated weekly" />
      <main>
        <Shell width="app" className="pt-[22px]">
          <PageHeading
            kicker="Before you start"
            title="Is your car covered?"
            lede="We price 41 models properly and are adding more each month. Check first so you don't spend four taps to reach a dead end."
            size="md"
          />
          <CoverageCheck />
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
