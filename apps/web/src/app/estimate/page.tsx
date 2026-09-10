import type { Metadata } from 'next';
import { Shell, SiteFooter } from '@/components/chrome';
import { EstimateResults } from '@/components/estimate-results';
import { FlowHeader } from '@/components/flow-header';

export const metadata: Metadata = {
  title: "Parts you'll need",
  description:
    'The parts your damage needs, with manufacturer part numbers and estimated Naira price ranges. Parts only — labour and paint excluded.',
};

export default function EstimatePage() {
  return (
    <>
      <FlowHeader step="parts" />
      <main>
        <Shell>
          <EstimateResults />
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
