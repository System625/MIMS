import type { Metadata } from 'next';
import { AppHeader, PageHeading, Shell, SiteFooter } from '@/components/chrome';
import { PriceFeedback } from '@/components/price-feedback';
import { SHARED_ESTIMATE } from '@/mock/estimates';
import { vehicleTitle } from '@/mock/vehicles';

export const metadata: Metadata = {
  title: 'Was the price right?',
  description:
    'Tell us what you actually paid. Real receipts are how the catalogue becomes accurate rather than merely large.',
};

export default async function FeedbackPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const car = vehicleTitle(SHARED_ESTIMATE.vehicle);

  return (
    <>
      <AppHeader label={`Estimate ${reference.toUpperCase()} · follow-up`} />
      <main>
        <Shell width="read" className="px-[20px] pt-[22px]">
          <PageHeading
            kicker="One question, asked once"
            title="Was the price right?"
            lede={`You ran this estimate ten days ago for a ${car}. If you have since bought the part, what you actually paid is the most valuable thing you can tell us — it corrects the catalogue for the next person.`}
            size="md"
            ledeBelow
          />
          <PriceFeedback estimate={SHARED_ESTIMATE} />
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
