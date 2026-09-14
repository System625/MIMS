import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CartLink } from '@/components/cart-link';
import { AppHeader, PageHeading, Shell, SiteFooter } from '@/components/chrome';
import { CarDetail } from '@/components/car-detail';
import { CarPhoto } from '@/components/car-photo';
import { VehicleContext } from '@/components/vehicle-context';
import { Kicker } from '@/components/ui';
import { fleetCarById, fleetCarIds, fleetCarYears } from '@/mock/fleet';

/**
 * ONE CAR — build plan item 12, and the other half of the front door.
 *
 * Prerendered, one page per generation, because these are the store's landing
 * pages: "Toyota Corolla E170 parts" is what somebody types, and a page that
 * only exists once a script has run is a page a search engine never sees. The
 * parts of it that depend on the device — which year the customer picked,
 * whether the car is in their garage, how many parts in a panel are confirmed
 * for them — live in the client component below it, exactly as `/parts` does.
 */

export function generateStaticParams() {
  return fleetCarIds().map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const car = fleetCarById(id);
  if (!car) return { title: 'Car not found' };

  const name = `${car.make} ${car.model}`;
  return {
    title: `${name} ${car.generation} parts`,
    description: `Body parts for the ${car.yearStart}–${car.yearEnd} ${name} (${car.chassisCode ?? car.generation}), priced in Naira with duty included. Tap the panel you need.`,
  };
}

export default async function CarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const car = fleetCarById(id);
  if (!car) notFound();

  return (
    <>
      <AppHeader
        label="Parts store · Your car"
        meta={`${car.chassisCode ?? car.generation} · ${fleetCarYears(car)}`}
        action={<CartLink />}
      />
      <VehicleContext />

      <main>
        <Shell>
          <PageHeading
            kicker={
              <Link href="/garage" className="text-flag-deep no-underline">
                ← All cars
              </Link>
            }
            title={`${car.make} ${car.model}`}
            lede={`${car.bodyStyle}, ${fleetCarYears(car)}. This is the ${car.generation} generation — the run of years that shares one set of part numbers. Tap a panel to see what we hold for it.`}
            ledeBelow
            aside={
              /* Capped rather than free-growing: at full width the plate is
                 taller than the title and lede beside it, and the heading row
                 bottom-aligns, so the extra height becomes a hole above the
                 car's name. */
              <div className="min-w-0 flex-[1_1_300px] lg:max-w-[380px]">
                <div className="border-ink border-[1.5px]">
                  <CarPhoto
                    car={car}
                    maxWidth={480}
                    sizes="(max-width: 720px) 100vw, 420px"
                    credit
                  />
                </div>
                {car.photo?.note ? (
                  /* Anything the photograph would otherwise imply wrongly is
                     said under it, not left for the customer to notice. */
                  <p className="text-muted mt-[7px] text-[11.5px] leading-[1.45]">
                    {car.photo.note}
                  </p>
                ) : null}
              </div>
            }
          />

          <CarDetail car={car} />

          <p className="text-muted mt-[24px] text-[12px] leading-[1.5]">
            Photograph:{' '}
            {car.photo ? (
              <>
                <a href={car.photo.page} className="text-flag-deep underline">
                  {car.photo.file}
                </a>{' '}
                by {car.photo.author}, {car.photo.licence}. A car of this generation, not this
                listing&rsquo;s car and not ours.{' '}
              </>
            ) : null}
            <Link href="/photo-credits" className="text-flag-deep underline">
              All photo credits
            </Link>
          </p>

          <div className="mt-[10px]">
            <Kicker as="span" className="text-muted-2 tracking-[0.1em]">
              Prices in Naira · duty and clearing included
            </Kicker>
          </div>
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
