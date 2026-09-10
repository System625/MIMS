import type { Metadata } from 'next';
import { PageHeading, Shell, SiteFooter } from '@/components/chrome';
import { DamageSelection } from '@/components/damage-selection';
import { FlowHeader } from '@/components/flow-header';

export const metadata: Metadata = {
  title: 'What is damaged?',
  description:
    'Mark every panel that is dented, cracked or missing — on a plan-view diagram or as a checklist.',
};

export default function DamagePage() {
  return (
    <>
      <FlowHeader step="damage" />
      <main>
        <Shell>
          <PageHeading
            kicker="Step 02 — Mark the damage"
            title="What is damaged?"
            lede="Select every panel that is dented, cracked or missing. If you are unsure, include it — you can remove it once you see the prices."
          />
          <DamageSelection />
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
