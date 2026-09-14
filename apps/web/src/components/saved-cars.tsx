'use client';

import Link from 'next/link';
import { useEstimateFlow } from '@/lib/estimate-flow';
import { useGarage } from '@/lib/garage';
import { fleetCarById } from '@/mock/fleet';
import { vehicleTitle } from '@/mock/vehicles';
import { CarPhoto } from './car-photo';
import { Button, cx, Kicker, Panel, PanelBar, Title } from './ui';

/**
 * THE CARS THIS DEVICE KEEPS.
 *
 * The founder's case for a garage is the mechanic: somebody who works on three
 * cars all week and should not re-pick one every time they open the site. So
 * switching is one tap and it is the primary action on every row.
 *
 * WHAT A ROW IS ALLOWED TO CLAIM. The saved entry carries the vehicle itself,
 * not a pointer into the fleet, so a car stays openable even if its tile is
 * re-curated away — but the PHOTOGRAPH comes from the fleet, because that is
 * where photographs live. A saved car with no matching tile therefore renders
 * as type, which is honest: we kept the car, we do not have a picture of it.
 *
 * Empty is the common state and is written as an invitation rather than a
 * failure: nobody has saved anything on their first visit, and a garage that
 * scolds them for it is a garage they will not come back to.
 */
export function SavedCars() {
  const { cars, hydrated, remove } = useGarage();
  const { vehicle, setVehicle, hydrated: flowHydrated } = useEstimateFlow();

  if (!hydrated) {
    /* Reserved, not filled. Rendering "your garage is empty" for a frame at
       somebody who has three cars in it is the one thing this panel must not
       do. */
    return <div className="min-h-[96px]" />;
  }

  if (cars.length === 0) {
    return (
      <Panel>
        <PanelBar right="Nothing saved yet">Your garage</PanelBar>
        <div className="p-[14px]">
          <p className="text-ink-soft m-0 text-[13.5px] leading-[1.55]">
            Open any car below and save it. It stays on this phone — no account, nothing sent to us
            — and switching between saved cars takes one tap, which is the point if you look after
            more than one.
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelBar right={`${cars.length} saved`}>Your garage</PanelBar>
      <ul>
        {cars.map((entry) => {
          const car = fleetCarById(entry.key);
          const current =
            flowHydrated &&
            vehicle !== null &&
            vehicle.make === entry.vehicle.make &&
            vehicle.model === entry.vehicle.model &&
            vehicle.year === entry.vehicle.year;

          return (
            <li
              key={entry.key}
              className={cx(
                'border-rule flex flex-wrap items-center gap-x-[14px] gap-y-[10px] border-b p-[12px]',
                current && 'bg-flag-soft',
              )}
            >
              {car ? (
                <div className="border-ink w-[96px] flex-none border-[1.5px]">
                  <CarPhoto car={car} maxWidth={96} sizes="96px" />
                </div>
              ) : null}

              <div className="min-w-0 flex-[1_1_180px]">
                <Title as="div" className="text-[15px] leading-[1.2]">
                  {vehicleTitle(entry.vehicle)}
                </Title>
                <div className="mt-[5px] flex flex-wrap items-center gap-x-[8px] gap-y-[3px]">
                  {entry.vehicle.chassisCode ? (
                    <span className="border-edge text-ink-soft border-[1.5px] bg-white px-[5px] py-[2px] font-mono text-[11px] font-bold leading-none tracking-[0.06em]">
                      {entry.vehicle.chassisCode}
                    </span>
                  ) : null}
                  {entry.vehicle.bodyStyle ? (
                    <span className="text-muted text-[12px] leading-none">
                      {entry.vehicle.bodyStyle}
                    </span>
                  ) : null}
                  {current ? (
                    <Kicker as="span" className="text-flag-deep tracking-[0.1em]">
                      Shopping for this
                    </Kicker>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-none flex-wrap gap-[7px]">
                {current ? (
                  car ? (
                    <Button size="sm" variant="outline" href={`/garage/${car.id}`}>
                      Open
                    </Button>
                  ) : null
                ) : (
                  <Button
                    size="sm"
                    variant="dark"
                    onClick={() => setVehicle(entry.vehicle, 'manual')}
                  >
                    Shop for this car
                  </Button>
                )}
                <Button size="sm" variant="quiet" onClick={() => remove(entry.key)}>
                  Remove
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="p-[12px]">
        <Link
          href="/parts"
          className="text-flag-deep font-mono text-[11.5px] font-bold uppercase tracking-[0.09em] underline"
        >
          Browse parts for the car you are on →
        </Link>
      </div>
    </Panel>
  );
}
