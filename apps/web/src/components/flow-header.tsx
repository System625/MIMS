'use client';

import Link from 'next/link';
import { useEstimateFlow } from '@/lib/estimate-flow';
import { vehicleStamp } from '@/mock/vehicles';
import { AppHeader, type FlowStep } from './chrome';

/**
 * The estimator header, carrying the identified vehicle across screens 2 and 3.
 *
 * The vehicle stays visible with a CHANGE link beside it for the whole flow,
 * because the single worst outcome of this product is a confident parts list for
 * the wrong car — and the moment a user realises the year is wrong should never
 * be the moment they discover there is no way back.
 */
export function FlowHeader({ step }: { step: FlowStep }) {
  const { vehicle, hydrated } = useEstimateFlow();

  if (!hydrated || !vehicle) {
    return <AppHeader step={step} />;
  }

  return (
    <AppHeader
      step={step}
      meta={
        <>
          {vehicleStamp(vehicle)} ·{' '}
          <Link href="/" className="text-flag underline">
            Change
          </Link>
        </>
      }
    />
  );
}
