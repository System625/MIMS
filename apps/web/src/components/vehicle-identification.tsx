'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useEstimateFlow } from '@/lib/estimate-flow';
import {
  DEMO_VEHICLE,
  DEMO_VIN,
  MAKES,
  MODELS,
  TRIMS,
  vehicleFromCascade,
  vehicleTitle,
  YEAR_RANGES,
  type VehicleDetail,
} from '@/mock/vehicles';
import { NotInCataloguePanel, VinNotFoundPanel } from './states';
import { Button, cx, Kicker, Panel, PanelBar, TextInput, Title } from './ui';

/**
 * Screen 1 — vehicle identification.
 *
 * Two routes, deliberately built as siblings. The design is explicit that the
 * manual cascade is not a fallback error state: it is an equal first-class path
 * and probably the more used one, since plenty of owners have never been shown
 * where a VIN is stamped. So both sit in the same row, both carry a ROUTE label,
 * and neither is styled as secondary.
 */

type Column = 'make' | 'model' | 'year' | 'trim';

interface Cascade {
  make: string | null;
  model: string | null;
  year: string | null;
  trim: string | null;
}

const EMPTY_CASCADE: Cascade = { make: null, model: null, year: null, trim: null };

/**
 * Deliberately duplicates `vinSchema` from `@mims/contracts` rather than
 * importing it: pulling Zod in for one client-side regex costs ~92 kB on the
 * app's entry page, and this audience is on mobile data, sometimes on a
 * roadside. The contract remains the authority — the API validates every decode
 * with `vinSchema`, and this only decides when the Decode button lights up. If
 * the VIN rule ever changes, change it there first.
 *
 * (VINs exclude I, O and Q so they cannot be confused with 1 and 0.)
 */
const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

export function VehicleIdentification() {
  const router = useRouter();
  const { vehicle, setVehicle, clearVehicle } = useEstimateFlow();

  const [vin, setVin] = useState('');
  const [vinOutcome, setVinOutcome] = useState<'idle' | 'not_found'>('idle');
  const [helpOpen, setHelpOpen] = useState(false);
  const [cascade, setCascade] = useState<Cascade>(EMPTY_CASCADE);
  const vinInput = useRef<HTMLInputElement>(null);

  const vinLength = vin.replace(/\s/g, '').length;
  const vinComplete = VIN_PATTERN.test(vin);

  /**
   * A failed decode is a normal result, not an error — it routes to the manual
   * cascade rather than throwing. This mirrors `/vin/decode`, which always
   * returns 200 with an `outcome` for exactly this reason.
   */
  function decode() {
    if (!vinComplete) return;
    if (vin.toUpperCase() === DEMO_VIN) {
      setVinOutcome('idle');
      setVehicle(DEMO_VEHICLE, 'vin', vin.toUpperCase());
      return;
    }
    setVinOutcome('not_found');
  }

  function pick(column: Column, value: string) {
    setCascade((prev) => {
      // Each selection invalidates everything to its right — a Corolla trim
      // means nothing once the make changes to Honda.
      const next: Cascade = { ...prev, [column]: value };
      if (column === 'make') return { make: value, model: null, year: null, trim: null };
      if (column === 'model') return { ...next, year: null, trim: null };
      if (column === 'year') return { ...next, trim: null };
      return next;
    });
  }

  // The cascade resolves the moment all four are chosen; no submit button, because
  // there is nothing left to confirm at that point except the vehicle itself.
  const cascadeComplete = Boolean(cascade.make && cascade.model && cascade.year && cascade.trim);
  const resolved: VehicleDetail | null =
    vehicle ??
    (cascadeComplete && cascade.make && cascade.model && cascade.year && cascade.trim
      ? vehicleFromCascade(cascade.make, cascade.model, cascade.year, cascade.trim)
      : null);

  function reset() {
    setVin('');
    setVinOutcome('idle');
    setCascade(EMPTY_CASCADE);
    clearVehicle();
  }

  function confirmAndContinue() {
    if (!resolved) return;
    setVehicle(resolved, vehicle ? 'vin' : 'manual', vin);
    router.push('/damage');
  }

  const chosenCount = [cascade.make, cascade.model, cascade.year, cascade.trim].filter(
    Boolean,
  ).length;

  return (
    <>
      <div className="mt-[22px] flex flex-wrap items-stretch gap-[20px]">
        {/* ------------------------------------------------------ route A -- */}
        <div className="min-w-0 max-w-[380px] flex-[1_1_300px]">
          {vinOutcome === 'not_found' ? (
            <VinNotFoundPanel
              vin={vin}
              framed={false}
              onChooseManually={() => {
                setVinOutcome('idle');
                setVin('');
                document.getElementById('manual-cascade')?.scrollIntoView({ block: 'center' });
              }}
              onRetry={() => {
                setVinOutcome('idle');
                setVin('');
                vinInput.current?.focus();
              }}
            />
          ) : (
            <Panel weight="heavy" className="flex h-full flex-col">
              <PanelBar weight="heavy" right="EXACT">
                Route A
              </PanelBar>
              <div className="flex flex-1 flex-col gap-[12px] px-[15px] py-[16px]">
                <div>
                  <Title className="text-[19px]">Enter your VIN</Title>
                  <p className="text-muted mt-[7px] text-[13px] leading-[1.5]">
                    17 characters, stamped on the vehicle. No letters I, O or Q.
                  </p>
                </div>

                <form
                  className="flex flex-wrap gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    decode();
                  }}
                >
                  <TextInput
                    ref={vinInput}
                    mono
                    aria-label="Vehicle identification number"
                    placeholder={DEMO_VIN}
                    inputMode="text"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                    value={vin}
                    onChange={(event) =>
                      setVin(event.target.value.toUpperCase().replace(/\s/g, '').slice(0, 17))
                    }
                    className="h-[50px] flex-[1_1_190px]"
                  />
                  <Button
                    variant="dark"
                    size="md"
                    type="submit"
                    disabled={!vinComplete}
                    className="min-h-[50px] text-[13.5px]"
                  >
                    Decode
                  </Button>
                </form>

                <div className="flex items-center gap-2">
                  <div
                    className="bg-panel-2 border-edge h-[6px] flex-1 border"
                    role="progressbar"
                    aria-valuenow={vinLength}
                    aria-valuemin={0}
                    aria-valuemax={17}
                    aria-label="VIN characters entered"
                  >
                    <div
                      className="bg-flag h-full"
                      style={{ width: `${Math.round((vinLength / 17) * 100)}%` }}
                    />
                  </div>
                  <span className="text-muted font-mono text-[11px] font-bold leading-none tracking-[0.08em]">
                    {String(vinLength).padStart(2, '0')}/17
                  </span>
                </div>

                <div className="border-rule-2 mt-[2px] border-t pt-[12px]">
                  <button
                    type="button"
                    aria-expanded={helpOpen}
                    onClick={() => setHelpOpen((open) => !open)}
                    className="flex w-full justify-between gap-[10px]"
                  >
                    <span className="text-[12.5px] font-bold uppercase leading-[1.3] underline">
                      Where do I find it?
                    </span>
                    <span className="text-flag-deep font-mono text-[13px] font-bold leading-none">
                      {helpOpen ? '–' : '+'}
                    </span>
                  </button>

                  {helpOpen ? (
                    <ol className="bg-rule-2 border-rule-2 mt-[12px] grid gap-px border">
                      {VIN_LOCATIONS.map((location, index) => (
                        <li key={location.title} className="flex gap-[10px] bg-white p-[10px]">
                          <span className="bg-flag flex h-[20px] w-[20px] flex-none items-center justify-center font-mono text-[11px] font-bold leading-none">
                            {index + 1}
                          </span>
                          <div>
                            <div className="text-[12.5px] font-bold leading-[1.25]">
                              {location.title}
                            </div>
                            <div className="text-muted mt-[2px] text-[12px] leading-[1.4]">
                              {location.note}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </div>
              </div>
            </Panel>
          )}
        </div>

        {/* ------------------------------------------------------ route B -- */}
        <div id="manual-cascade" className="min-w-0 flex-[2_1_480px]">
          <Panel weight="heavy" className="flex h-full flex-col">
            <PanelBar weight="heavy" right="NO VIN NEEDED">
              Route B
            </PanelBar>
            <div className="flex-1 px-[15px] py-[16px]">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                <Title className="text-[19px]">Choose it yourself</Title>
                <div className="text-muted text-[12px] leading-[1.4]">
                  {chosenCount} of 4 chosen
                </div>
              </div>

              <div className="mt-[14px] flex flex-wrap gap-[10px]">
                <CascadeColumn
                  label="Make"
                  basis="150px"
                  options={MAKES}
                  selected={cascade.make}
                  enabled
                  onPick={(value) => pick('make', value)}
                />
                <CascadeColumn
                  label="Model"
                  basis="150px"
                  options={cascade.make ? (MODELS[cascade.make] ?? []) : []}
                  selected={cascade.model}
                  enabled={Boolean(cascade.make)}
                  emptyNote="Pick a make first."
                  onPick={(value) => pick('model', value)}
                />
                <CascadeColumn
                  label="Year"
                  basis="130px"
                  mono
                  options={cascade.model ? YEAR_RANGES : []}
                  selected={cascade.year}
                  enabled={Boolean(cascade.model)}
                  onPick={(value) => pick('year', value)}
                />
                <CascadeColumn
                  label="Trim"
                  basis="120px"
                  options={cascade.year ? TRIMS : []}
                  selected={cascade.trim}
                  enabled={Boolean(cascade.year)}
                  onPick={(value) => pick('trim', value)}
                />
              </div>

              <p className="text-muted mt-[11px] text-[12px] leading-[1.45]">
                Not sure of the trim? Pick the closest — it only changes lamp and grille parts.
              </p>
            </div>
          </Panel>
        </div>
      </div>

      {/* ------------------------------------------------- confirmation -- */}
      {resolved ? (
        resolved.inCatalogue ? (
          <ConfirmBand
            vehicle={resolved}
            fromVin={Boolean(vehicle)}
            onConfirm={confirmAndContinue}
            onReset={reset}
          />
        ) : (
          <div className="mt-[20px] max-w-[560px]">
            <NotInCataloguePanel
              framed={false}
              makeName={resolved.make}
              vehicleLabel={vehicleTitle(resolved).toUpperCase()}
            />
            <Button variant="outline" size="md" full className="mt-[12px]" onClick={reset}>
              Choose a different car
            </Button>
          </div>
        )
      ) : null}
    </>
  );
}

const VIN_LOCATIONS = [
  { title: 'Windscreen, driver corner', note: 'Read it from outside the car.' },
  { title: "Driver's door jamb sticker", note: 'Open the door, look at the frame.' },
  { title: 'Your papers', note: 'Insurance, customs papers, licence.' },
] as const;

/**
 * One column of the cascade. Disabled columns are drawn dim rather than hidden,
 * so the shape of the task — four choices, left to right — is visible from the
 * first tap.
 */
function CascadeColumn({
  label,
  options,
  selected,
  enabled,
  onPick,
  basis,
  mono = false,
  emptyNote = '—',
}: {
  label: string;
  options: readonly string[];
  selected: string | null;
  enabled: boolean;
  onPick: (value: string) => void;
  basis: string;
  mono?: boolean;
  emptyNote?: string;
}) {
  return (
    <div
      className={cx(
        'border-ink flex min-w-0 flex-col border-[1.5px]',
        enabled ? 'bg-white' : 'bg-panel-3',
      )}
      style={{ flex: `1 1 ${basis}` }}
    >
      <Kicker
        as="div"
        className={cx(
          'px-[9px] py-[7px] tracking-[0.12em]',
          enabled ? 'bg-ink text-paper' : 'bg-panel-2 text-muted',
        )}
      >
        {label}
      </Kicker>
      <ul className="max-h-[236px] overflow-auto" aria-label={`${label} options`}>
        {options.map((option) => {
          const active = option === selected;
          return (
            <li key={option}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onPick(option)}
                className={cx(
                  'border-rule flex min-h-[42px] w-full items-center border-b px-[10px] text-left leading-[1.3]',
                  mono ? 'font-mono text-[13px]' : 'text-[13.5px]',
                  active ? 'bg-flag text-flag-ink font-bold' : 'text-ink font-normal',
                )}
              >
                {option}
              </button>
            </li>
          );
        })}
        {options.length === 0 ? (
          <li className="text-faint px-[10px] py-[12px] text-[12px] leading-[1.45]">{emptyNote}</li>
        ) : null}
      </ul>
    </div>
  );
}

/**
 * The confirmation band. Its whole job is to let a user catch a wrong match
 * before it becomes a wrong parts list — so the facts that decide the part
 * numbers (year, trim, chassis) are the ones set in bold mono.
 */
function ConfirmBand({
  vehicle,
  fromVin,
  onConfirm,
  onReset,
}: {
  vehicle: VehicleDetail;
  fromVin: boolean;
  onConfirm: () => void;
  onReset: () => void;
}) {
  const facts = [
    { label: 'Engine', value: vehicle.engine ?? '—', mono: false },
    { label: 'Body', value: vehicle.bodyStyle ?? '—', mono: false },
    { label: 'Chassis', value: vehicle.chassisCode ?? '—', mono: true },
    {
      label: 'Parts on file',
      value: vehicle.partsOnFile !== null ? String(vehicle.partsOnFile) : '—',
      mono: true,
    },
  ];

  return (
    <Panel weight="heavy" className="mt-[20px]">
      <div className="bg-flag border-ink flex items-center gap-[9px] border-b-2 px-[14px] py-[9px]">
        <span className="bg-ink h-[12px] w-[12px]" aria-hidden />
        <Kicker as="span" className="text-flag-ink tracking-[0.14em]">
          {fromVin ? 'VIN decoded — confirm before continuing' : 'Confirm before continuing'}
        </Kicker>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-[20px] px-[15px] py-[18px]">
        <div className="min-w-0 flex-[1_1_320px]">
          <div className="text-[27px] font-black uppercase leading-[1.05] tracking-[-0.015em]">
            {vehicleTitle(vehicle)}
          </div>

          <dl className="mt-[12px] flex flex-wrap gap-x-[26px] gap-y-[10px]">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt>
                  <Kicker className="text-muted-2 tracking-[0.11em]">{fact.label}</Kicker>
                </dt>
                <dd
                  className={cx(
                    'mt-[4px] leading-[1.2]',
                    fact.mono ? 'font-mono text-[13.5px] font-bold' : 'text-[13.5px]',
                  )}
                >
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>

          <p className="text-muted mt-[13px] max-w-[56ch] text-[12.5px] leading-[1.5]">
            Check this before continuing. A wrong year or trim gives the wrong part numbers.
          </p>
        </div>

        <div className="grid min-w-0 max-w-[340px] flex-[1_1_250px] gap-[9px]">
          <Button variant="dark" size="lg" full onClick={onConfirm}>
            Yes — mark the damage
          </Button>
          <Button variant="outline" size="md" full className="min-h-[46px]" onClick={onReset}>
            Not my car — start again
          </Button>
        </div>
      </div>
    </Panel>
  );
}
