'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useEstimateFlow } from '@/lib/estimate-flow';
import { useGarage } from '@/lib/garage';
import { formatNaira } from '@/lib/money';
import {
  fleetCarMatches,
  fleetCarYearList,
  fleetCarYears,
  vehicleFromFleetCar,
  type FleetCar,
} from '@/mock/fleet';
import { zoneStock, type ZoneStock } from '@/mock/listings';
import { ZONES } from '@/mock/zones';
import { CarPlan, PlanLabel, planCellClass, type PlanSlot } from './car-plan';
import { Button, cx, Kicker, Note, Panel, PanelBar } from './ui';

/**
 * THE CAR, DISSECTED — build plan item 12.
 *
 * The founder's phrase for it is the right one: we put whole cars on the site
 * and then dissect them. Everything on this screen is one car's own page — the
 * year it is, whether you keep it, and what we hold for each panel of it.
 *
 * THE PLAN IS THE SAME DRAWING AS THE ESTIMATOR'S, pointed at the catalogue
 * instead of at a damage report. That is the whole reason item 12 was cheap:
 * the interaction already existed, and what was genuinely missing was the link
 * from a panel to the parts on it — now a `zoneCode` on every catalogue row,
 * transcribed from `mock/parts.ts` rather than inferred from category and
 * position.
 *
 * EMPTY PANELS ARE DRAWN EMPTY. Five of the nine zones hold a part we can name
 * and no priced offer, and the plan says so on the panel rather than smoothing
 * it over — the same call as the empty shelves on `/soon/accessories`. A car
 * page that showed nine identical panels would be promising a complete
 * catalogue and teaching the customer, one tap at a time, that we do not have
 * one.
 *
 * THE YEAR ROW is the one piece of friction kept deliberately. A tile is a
 * generation, and a generation is the unit that owns a set of part numbers, so
 * the year does not change what fits — but it does change what the customer
 * believes we understood about their car, and a band that says 2019 to somebody
 * driving a 2015 is a small wrongness sitting over every price on the site.
 */

export function CarDetail({ car }: { car: FleetCar }) {
  const { vehicle, setVehicle, hydrated } = useEstimateFlow();
  const { has, save, remove, hydrated: garageHydrated } = useGarage();

  const isCurrent = hydrated && fleetCarMatches(car, vehicle);
  const saved = garageHydrated && has(car.id);
  const year = isCurrent && vehicle?.year !== null ? (vehicle?.year ?? car.yearEnd) : car.yearEnd;

  /*
   * Arriving without the context set — a shared link, a new tab, a reload after
   * clearing — sets it to this car. The page is unambiguously ABOUT this car, so
   * leaving the band above it saying "no car set" would be the site failing to
   * read its own screen. It only ever fills a blank: a customer whose Camry is
   * in context and who is browsing a Corolla out of interest keeps their Camry,
   * and the panel below says which is which.
   */
  useEffect(() => {
    if (hydrated && vehicle === null) setVehicle(vehicleFromFleetCar(car), 'manual');
  }, [hydrated, vehicle, car, setVehicle]);

  /* Counts are for the car the customer is actually shopping for. If that is
     not this car, the zone numbers still describe this car's panels — what we
     stock does not change — but nothing on the screen grades against a vehicle
     we were not asked about. */
  const gradeAgainst = isCurrent ? vehicle : null;
  /* A function rather than a prebuilt record: every lookup is by a zone code
     the plan already holds, and a map keyed by string would have to be defended
     against a key that cannot occur. */
  const stockFor = (code: string): ZoneStock => zoneStock(code, gradeAgainst);

  const totals = ZONES.reduce(
    (sum, zone) => {
      const entry = stockFor(zone.code);
      return { offers: sum.offers + entry.offers, gaps: sum.gaps + entry.gaps };
    },
    { offers: 0, gaps: 0 },
  );

  return (
    <div className="mt-[20px] flex flex-wrap items-start gap-[20px]">
      {/* ------------------------------------------------------ the plan -- */}
      <div className="min-w-0 flex-[1_1_380px]">
        <Panel weight="heavy">
          <PanelBar weight="heavy" right={`${totals.offers} priced · ${totals.gaps} not stocked`}>
            Tap the part of the car
          </PanelBar>
          <div className="p-[14px]">
            <CarZonePlan stockFor={stockFor} />
            <p className="text-muted mt-[12px] text-[12.5px] leading-[1.5]">
              Each panel opens the catalogue filtered to the parts that belong to it. Hatched panels
              are ones we can name but hold no priced offer for yet — they open too, and show you
              the part number.
            </p>
          </div>
        </Panel>
      </div>

      {/* ----------------------------------------------- year and garage -- */}
      <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-[16px]">
        <Panel>
          <PanelBar right={fleetCarYears(car)}>Which year is yours?</PanelBar>
          <div className="p-[13px]">
            <YearRow
              car={car}
              year={isCurrent ? year : null}
              onPick={(picked) => setVehicle(vehicleFromFleetCar(car, picked), 'manual')}
            />
            <p className="text-muted mt-[11px] text-[12px] leading-[1.45]">
              Every year in this range takes the same body parts — that is what a generation means.
              We ask so the rest of the site describes your car rather than an average one.
            </p>
          </div>
        </Panel>

        <Panel>
          <PanelBar right={saved ? 'Saved' : 'Not saved'}>Your garage</PanelBar>
          <div className="p-[13px]">
            <p className="text-ink-soft m-0 text-[13px] leading-[1.5]">
              {saved
                ? 'This car is in your garage on this device. Open it from the garage to switch to it in one tap.'
                : 'Keep this car on this device and switch to it in one tap. Useful if you work on more than one.'}
            </p>
            <div className="mt-[12px] flex flex-wrap gap-[8px]">
              {saved ? (
                <Button size="sm" variant="outline" onClick={() => remove(car.id)}>
                  Remove from garage
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="dark"
                  onClick={() =>
                    save(car.id, vehicleFromFleetCar(car, isCurrent ? year : undefined))
                  }
                >
                  Save to my garage
                </Button>
              )}
              <Button size="sm" variant="quiet" href="/garage">
                All cars
              </Button>
            </div>
            {!garageHydrated ? null : (
              <p className="text-faint mt-[10px] text-[11.5px] leading-[1.4]">
                Saved on this phone only — no account, nothing sent to us.
              </p>
            )}
          </div>
        </Panel>

        {!isCurrent && hydrated && vehicle !== null ? (
          <Note tone="rule">
            <strong className="font-bold">You are shopping for a different car.</strong> The band
            above is still set to your{' '}
            {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')}, so fitment
            grades are about that one. Pick a year here to switch to this {car.make} {car.model}.
          </Note>
        ) : null}

        <div className="flex flex-wrap gap-[8px]">
          <Button variant="primary" size="md" href="/parts">
            Search all parts
          </Button>
          <Button variant="outline" size="md" href="/estimate/new">
            I only know the damage
          </Button>
        </div>
      </div>

      {/* ------------------------------------------------- the zone list -- */}
      <div className="min-w-0 flex-[1_1_100%]">
        <ZoneStockTable stockFor={stockFor} graded={gradeAgainst !== null} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- the plan -- */

function zoneHref(code: string): string {
  return `/parts?zone=${encodeURIComponent(code)}`;
}

function CarZonePlan({ stockFor }: { stockFor: (code: string) => ZoneStock }) {
  return (
    <CarPlan
      ariaLabel="Parts by panel, plan view"
      cell={(slot: PlanSlot) => {
        const entry = stockFor(slot.zone.code);
        const empty = entry.offers === 0;

        return (
          <Link
            href={zoneHref(slot.zone.code)}
            aria-label={`${slot.zone.name} — ${planCellCount(entry)}`}
            /* An empty panel is hatched rather than white. The hatch is this
               system's "nothing here yet" fill and it is already what the
               customer meets on a shut shelf, so it reads the same way here. */
            className={planCellClass(slot, {
              stacked: true,
              extra: cx('hover:bg-panel-4 no-underline', empty && 'hatch'),
            })}
          >
            <PlanLabel size={slot.labelSize}>{slot.zone.diagramLabel}</PlanLabel>
            <span
              className={cx(
                'relative font-mono text-[10.5px] font-bold uppercase leading-none tracking-[0.06em]',
                empty ? 'text-muted-2' : 'text-flag-deep',
              )}
            >
              {planCellCount(entry)}
            </span>
          </Link>
        );
      }}
    />
  );
}

/** What a panel says about itself in four words or fewer. */
function planCellCount(entry: ZoneStock): string {
  if (entry.offers > 0) return `${entry.offers} to buy`;
  if (entry.gaps > 0) return 'Not stocked';
  return 'None on file';
}

/* -------------------------------------------------------- the zone list -- */

/**
 * The plan's counterpart in words, and not a toggle: the estimator offers the
 * diagram OR the checklist because it is capturing one selection, while this
 * screen is a catalogue and the table carries what a 62px panel cannot — the
 * cheapest price in the zone, and how many of its parts we can vouch for on
 * this exact car. It is also the accessible route through the same information,
 * which is reason enough for it to be present rather than one tap away.
 */
function ZoneStockTable({
  stockFor,
  graded,
}: {
  stockFor: (code: string) => ZoneStock;
  graded: boolean;
}) {
  return (
    <Panel>
      <PanelBar right={graded ? 'Graded against your car' : 'Set your year to grade these'}>
        Every panel we carry
      </PanelBar>

      <ul>
        {/* Ordinal order, not the order the plan draws them in. The plan is a
            picture of a car and runs front to back; a list is read down the
            stamps, and 03 before 01 in a table is just wrong. */}
        {ZONES.map((zone) => {
          const entry = stockFor(zone.code);
          const buyable = entry.offers > 0;

          return (
            <li key={zone.code}>
              <Link
                href={zoneHref(zone.code)}
                className="border-rule hover:bg-panel-4 flex min-h-[56px] flex-wrap items-center gap-x-[14px] gap-y-[6px] border-b px-[13px] py-[10px] no-underline"
              >
                <span className="text-muted w-[24px] flex-none font-mono text-[11px] font-bold leading-none">
                  {zone.ordinal}
                </span>

                <span className="min-w-0 flex-[1_1_200px]">
                  <span className="block text-[13.5px] font-bold uppercase leading-[1.25]">
                    {zone.name}
                  </span>
                  <span className="text-muted block text-[11.5px] leading-[1.4]">
                    {zone.description}
                  </span>
                </span>

                {/* The two numeric columns travel together. Let them wrap
                    independently and the counts land under the zone name on a
                    narrow screen, reading as part of its description. */}
                <span className="ml-auto flex flex-none items-center gap-[14px]">
                  {/* The price, where there is one. A zone with no offer says the
                    honest thing instead of showing a dash that could be read as
                    free, cheap, or an error. */}
                  <span className="text-right">
                    {buyable && entry.fromPrice ? (
                      <>
                        <Kicker as="span" className="text-muted block tracking-[0.1em]">
                          From
                        </Kicker>
                        <span className="block font-mono text-[14px] font-bold leading-[1.2]">
                          {formatNaira(entry.fromPrice.amount)}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-2 font-mono text-[11.5px] font-bold uppercase leading-none tracking-[0.08em]">
                        {entry.gaps > 0 ? 'Number only' : 'Nothing on file'}
                      </span>
                    )}
                  </span>

                  <span className="w-[112px] flex-none text-right">
                    {buyable ? (
                      <span className="text-ink-soft font-mono text-[11.5px] font-bold leading-[1.3]">
                        {entry.offers} to buy
                        {graded && entry.confirmedForVehicle !== null ? (
                          <span
                            className={cx(
                              'block',
                              entry.confirmedForVehicle > 0 ? 'text-flag-deep' : 'text-muted-2',
                            )}
                          >
                            {entry.confirmedForVehicle} confirmed
                          </span>
                        ) : null}
                      </span>
                    ) : (
                      <span className="text-muted-2 font-mono text-[11.5px] font-bold leading-[1.3]">
                        {entry.gaps > 0 ? `${entry.gaps} we can name` : '—'}
                      </span>
                    )}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/* ------------------------------------------------------------- the year -- */

function YearRow({
  car,
  year,
  onPick,
}: {
  car: FleetCar;
  year: number | null;
  onPick: (year: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-[7px]">
      {fleetCarYearList(car).map((option) => {
        const on = year === option;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={on}
            onClick={() => onPick(option)}
            className={cx(
              'min-h-[40px] border-[1.5px] px-[11px] font-mono text-[13px] font-bold leading-none',
              on ? 'border-flag bg-flag text-ink' : 'border-ink hover:bg-panel-4 bg-white',
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
