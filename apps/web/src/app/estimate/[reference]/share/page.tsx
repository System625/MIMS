import type { Metadata } from 'next';
import { AppHeader, PageHeading, Shell } from '@/components/chrome';
import { HandoffArtefacts } from '@/components/handoff-artefacts';
import { SHARED_ESTIMATE } from '@/mock/estimates';

export const metadata: Metadata = {
  title: 'What leaves the app',
  description:
    'The WhatsApp message and the one-page PDF for this estimate — both readable without opening a link.',
};

export default async function SharePage({ params }: { params: Promise<{ reference: string }> }) {
  await params;

  return (
    <>
      <div className="no-print">
        <AppHeader label="Share artefacts" meta={SHARED_ESTIMATE.reference} />
      </div>
      <main>
        <Shell width="app" className="pt-[22px]">
          <div className="no-print">
            <PageHeading
              kicker="Share artefacts"
              title="What leaves the app"
              lede="The WhatsApp message has to be readable with the link never opened — part numbers first, ranges beside them, the caveat at the bottom. The PDF is what gets printed and put on a workshop counter."
              size="md"
              ledeBelow
            />
          </div>
          <HandoffArtefacts estimate={SHARED_ESTIMATE} />
        </Shell>
      </main>
    </>
  );
}
