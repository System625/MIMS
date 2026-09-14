'use client';

import Link from 'next/link';
import { useEstimateFlow } from '@/lib/estimate-flow';
import { useGarage } from '@/lib/garage';
import { fleetCarMatches, fleetCarYears, vehicleFromFleetCar, type FleetCar } from '@/mock/fleet';
import { CarPhoto } from './car-photo';
import { cx, Kicker, Title } from './ui';

/**
 * THE FLEET GRID — build plan item 11, the store's front door.
 *
 * A tile does two things in one tap: it sets the car the whole site grades
 * against, and it opens that car's page. Both, because separating them would
 * mean either a tap that navigates and leaves the context unset — so the page
 * you land on is still about nobody's car — or a tap that silently changes the
 * context without going anywhere, which is a setting disguised as a picture.
 *
 * It is a real `<Link>` with a real href underneath, so the car pages are
 * prerendered, crawlable, middle-clickable and reachable with JavaScript off;
 * setting the vehicle rides on the click rather than replacing it. Somebody who
 * opens a car in a new tab gets the page without the context, and the band at
 * the top of that page says so and offers to set it.
 *
 * THE TILE SAYS WHAT IT KNOWS AND STOPS. The make and model, the generation
 * code, the years that generation ran, and the body style. No price, no count
 * of parts, no "most popular" — a badge like that on a car nobody has priced
 * would be the first invented fact on the page, and the counts that ARE
 * honest are per-zone and live one tap deeper, on the car itself.
 */

export function FleetGrid({
  cars,
  /** Tiles per row at the widest. The grid still wraps to one column on a phone. */
  min = '240px',
}: {
  cars: readonly FleetCar[];
  min?: string;
}) {
  const { vehicle, setVehicle, hydrated } = useEstimateFlow();
  const { cars: saved, hydrated: garageHydrated } = useGarage();

  return (
    <ul
      className="grid gap-[14px]"
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${min}, 1fr))` }}
    >
      {cars.map((car) => {
        /* Both flags matter and they are different questions: is this the car
           the site is currently talking about, and is it one this device keeps.
           Neither is rendered until its own store has been read, because a
           "current" marker that appears a beat late reads as the site changing
           its mind about your car. */
        const current = hydrated && fleetCarMatches(car, vehicle);
        const inGarage = garageHydrated && saved.some((entry) => entry.key === car.id);

        return (
          <li key={car.id} className="min-w-0">
            <Link
              href={`/garage/${car.id}`}
              onClick={() => setVehicle(vehicleFromFleetCar(car), 'manual')}
              className={cx(
                'group flex h-full flex-col border-[1.5px] no-underline',
                current ? 'border-flag bg-flag-soft' : 'border-ink bg-panel hover:bg-panel-4',
              )}
            >
              <div className="border-ink border-b-[1.5px]">
                <CarPhoto car={car} maxWidth={320} sizes="(max-width: 640px) 100vw, 320px" />
              </div>

              <div className="flex flex-1 flex-col p-[12px]">
                <Title as="div" className="text-[15px] leading-[1.2]">
                  {car.make} {car.model}
                </Title>

                <div className="mt-[7px] flex flex-wrap items-center gap-x-[8px] gap-y-[4px]">
                  <span className="border-edge text-ink-soft border-[1.5px] bg-white px-[5px] py-[2px] font-mono text-[11px] font-bold leading-none tracking-[0.06em]">
                    {car.chassisCode ?? car.generation}
                  </span>
                  <span className="text-muted font-mono text-[11.5px] font-bold leading-none">
                    {fleetCarYears(car)}
                  </span>
                </div>

                <p className="text-muted mt-[7px] text-[12px] leading-[1.4]">{car.bodyStyle}</p>

                <div className="mt-auto flex flex-wrap items-center gap-[7px] pt-[11px]">
                  {current ? (
                    <Kicker as="span" className="text-flag-deep tracking-[0.1em]">
                      Your car ·
                    </Kicker>
                  ) : null}
                  {inGarage && !current ? (
                    <Kicker as="span" className="text-muted-2 tracking-[0.1em]">
                      In your garage ·
                    </Kicker>
                  ) : null}
                  <Kicker as="span" className="text-flag-deep tracking-[0.1em]">
                    See its parts →
                  </Kicker>
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
