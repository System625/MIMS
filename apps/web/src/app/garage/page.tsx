import type { Metadata } from 'next';
import Link from 'next/link';
import { CartLink } from '@/components/cart-link';
import { AppHeader, PageHeading, Shell, SiteFooter } from '@/components/chrome';
import { FleetGrid } from '@/components/fleet-grid';
import { SavedCars } from '@/components/saved-cars';
import { VehicleContext } from '@/components/vehicle-context';
import { Kicker, Note, Title } from '@/components/ui';
import { fleetByMake, FLEET_COUNT } from '@/mock/fleet';

export const metadata: Metadata = {
  title: 'Find your car',
  description:
    'Pick your car and see the parts that fit it. Toyota, Honda, Nissan, Mercedes-Benz, Hyundai, Kia and Lexus — by generation, so the parts are the right ones.',
};

/**
 * THE GARAGE — build plan item 11.
 *
 * Every car we cover, grouped by make, plus the ones this device has kept. The
 * home page shows a shortlist of these; this is the full set, and it is the
 * page a mechanic would bookmark.
 *
 * The grouping is by MAKE and the tiles inside it are GENERATIONS, which is the
 * only honest way to lay this out: a customer thinks "Toyota Corolla", and the
 * parts counter thinks "E140 or E170", and the generation tile is where those
 * two meet. Putting one Corolla tile up and asking for the year afterwards
 * would be hiding the distinction that the entire catalogue turns on.
 */
export default function GaragePage() {
  const groups = fleetByMake();

  return (
    <>
      <AppHeader
        label="Parts store · Cars"
        meta={`${FLEET_COUNT} cars covered`}
        action={<CartLink />}
      />
      <VehicleContext />

      <main>
        <Shell>
          <PageHeading
            kicker="Find your car"
            title="Start with the car, not the part"
            lede="Tap your car and the whole site is about it: every price, every fitment grade, and a plan of the car you can tap to reach the parts on each panel."
          />

          <div className="mt-[20px]">
            <SavedCars />
          </div>

          {groups.map((group) => (
            <section key={group.make} aria-labelledby={`make-${group.make}`} className="mt-[30px]">
              <div className="border-ink flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b-2 pb-[10px]">
                <Title as="h2" id={`make-${group.make}`} className="text-[19px]">
                  {group.make}
                </Title>
                <Kicker as="span" className="text-muted tracking-[0.11em]">
                  {group.cars.length} {group.cars.length === 1 ? 'generation' : 'generations'}
                </Kicker>
              </div>

              <div className="mt-[14px]">
                <FleetGrid cars={group.cars} />
              </div>
            </section>
          ))}

          {/*
           * The cars that are NOT tiles, said plainly and in the same place
           * every time. A grid of seven makes silently implies the other makes
           * do not exist; this says what is actually true — we know the car,
           * we have not priced its parts — and hands them the route that tells
           * them so properly.
           */}
          <section aria-labelledby="not-here" className="mt-[30px]">
            <div className="border-ink border-b-2 pb-[10px]">
              <Title as="h2" id="not-here" className="text-[19px]">
                Your car is not here
              </Title>
            </div>
            <div className="mt-[14px] flex flex-wrap gap-[20px]">
              <div className="min-w-0 flex-[1_1_380px]">
                <p className="text-ink-soft m-0 text-[13.5px] leading-[1.6]">
                  These are the cars we hold priced parts for, one tile per generation. Set any
                  other car — a Peugeot, an Innoson, a model we have not pictured — through{' '}
                  <strong className="font-bold">Your car</strong> at the top of the page. We will
                  tell you straight away whether we can price it, which is better than a tile that
                  promises we can and a dead end one tap later.
                </p>
                <p className="mt-[12px]">
                  <Link href="/coverage" className="text-flag-deep underline">
                    Check coverage for a specific car
                  </Link>
                </p>
              </div>
              <div className="min-w-0 flex-[1_1_300px]">
                <Note tone="rule">
                  <strong className="font-bold">Why generations, not years.</strong> A 2013 and a
                  2014 Corolla look the same to most owners and take different bumpers, lamps and
                  fenders. The generation is the unit the part numbers belong to, so it is the unit
                  we put on a tile — and picking your exact year inside it changes nothing about
                  what fits.
                </Note>
              </div>
            </div>
          </section>

          <p className="text-muted mt-[26px] text-[12px] leading-[1.5]">
            Car photographs are of other people&rsquo;s cars of the same generation, used to help
            you recognise yours.{' '}
            <Link href="/photo-credits" className="text-flag-deep underline">
              Photographers and licences
            </Link>
            .
          </p>
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
