'use client';

import type { Money } from '@mims/contracts';
import {
  LoadingPanel,
  NotInCataloguePanel,
  PartialCoveragePanel,
  SlowConnectionPanel,
  VinNotFoundPanel,
} from './states';

/** The exact figures the design uses, so the built states can be compared to it. */
function ngn(min: string, max: string): Money {
  return { min, max, currency: 'NGN' };
}

const PRICED = [
  { name: 'Front bumper cover', range: ngn('148000.00', '186000.00') },
  { name: 'Hood panel', range: ngn('210000.00', '265000.00') },
  { name: 'Headlight, left', range: ngn('95000.00', '124000.00') },
  { name: 'Radiator', range: ngn('72000.00', '89000.00') },
];

const UNPRICED = [{ name: 'Fender, left' }, { name: 'Rear bumper cover' }, { name: 'Boot lid' }];

export function StatesGallery() {
  return (
    <div className="mt-[22px] grid items-start gap-[18px] [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
      <VinNotFoundPanel
        vin="JTDBR32E03012345"
        onChooseManually={() => undefined}
        onRetry={() => undefined}
      />

      <NotInCataloguePanel vehicleLabel="2011 Peugeot 508 Allure" makeName="Peugeot" />

      <PartialCoveragePanel
        priced={PRICED}
        unpriced={UNPRICED}
        subtotal={ngn('525000.00', '664000.00')}
        onShare={() => undefined}
      />

      <div className="grid content-start gap-[18px]">
        <LoadingPanel zoneCount={5} fetched={3} total={5} />
        <SlowConnectionPanel seconds={38} readyCount={3} />
      </div>
    </div>
  );
}
