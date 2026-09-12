'use client';

import { useState } from 'react';
import { useEstimateFlow } from '@/lib/estimate-flow';
import {
  MAKES,
  MODELS,
  TRIMS,
  vehicleFromCascade,
  vehicleStamp,
  vehicleTitle,
  YEAR_RANGES,
  type VehicleDetail,
} from '@/mock/vehicles';
import { Button, cx, Kicker } from './ui';

/**
 * THE PERSISTENT VEHICLE CONTEXT.
 *
 * Every marketplace page sits under this band, because in this store the
 * question "does it fit?" is not a filter — it is the product. Around half of
 * all auto-parts returns are fitment errors, and against three to six weeks of
 * sea freight a return costs more than the part, so the car has to be settled
 * before anything is priced and it has to stay visible while the customer
 * shops. A context you can lose without noticing is worse than no context.
 *
 * It shares one store with the estimator — the same car, the same localStorage
 * key — so somebody who ran an estimate and then went shopping is not asked
 * twice, and somebody who sets their car here can walk into the estimator with
 * it already known.
 *
 * Changing the car never clears the basket. It re-grades it: each line is
 * rechecked and the ones we can no longer vouch for say so. Emptying a cart
 * because a customer corrected their trim would be the rudest possible response
 * to being told the truth.
 */
export function VehicleContext({ tone = 'band' }: { tone?: 'band' | 'panel' }) {
  const { vehicle, setVehicle, clearVehicle, hydrated } = useEstimateFlow();
  const [open, setOpen] = useState(false);

  const framing =
    tone === 'band'
      ? 'border-ink border-b-2 bg-panel-2'
      : 'border-ink border-[1.5px] bg-panel-2 mt-[18px]';

  return (
    <section aria-label="Your vehicle" className={framing}>
      <div
        className={cx(
          'mx-auto flex flex-wrap items-center gap-x-[16px] gap-y-[10px] px-[22px] py-[10px]',
          tone === 'band' && 'max-w-[1280px]',
        )}
      >
        <Kicker as="span" className="text-muted flex-none tracking-[0.13em]">
          Your car
        </Kicker>

        {/*
         * Until the store has been read from the device, this says nothing at
         * all. Flashing "no car set" at somebody who set one an hour ago reads
         * as us having lost it, which is the one thing this band must never do.
         */}
        {!hydrated ? (
          <span className="text-faint min-w-0 flex-1 font-mono text-[12px] leading-none">
            Checking…
          </span>
        ) : vehicle ? (
          <>
            <span className="min-w-0 flex-[1_1_220px] font-mono text-[13px] font-bold leading-[1.25] tracking-[0.01em]">
              {vehicleStamp(vehicle)}
            </span>
            {!vehicle.inCatalogue ? (
              <span className="border-flag bg-flag-soft text-danger-ink flex-none border-[1.5px] px-[7px] py-[4px] font-mono text-[10.5px] font-bold uppercase leading-none tracking-[0.1em]">
                Not priced yet
              </span>
            ) : null}
            <div className="flex flex-none gap-[7px]">
              <Button size="sm" variant="outline" onClick={() => setOpen((prev) => !prev)}>
                {open ? 'Close' : 'Change'}
              </Button>
              <Button
                size="sm"
                variant="quiet"
                onClick={() => {
                  clearVehicle();
                  setOpen(false);
                }}
              >
                Clear
              </Button>
            </div>
          </>
        ) : (
          <>
            <span className="text-ink-soft min-w-0 flex-[1_1_240px] text-[12.5px] leading-[1.4]">
              Not set. Set it once and every price and fitment note on the site is about{' '}
              <em>your</em> car.
            </span>
            <Button
              size="sm"
              variant="primary"
              className="flex-none"
              onClick={() => setOpen((prev) => !prev)}
            >
              {open ? 'Close' : 'Set your car'}
            </Button>
          </>
        )}
      </div>

      {open ? (
        <div
          className={cx(
            'border-rule-2 bg-panel mx-auto border-t px-[22px] py-[16px]',
            tone === 'band' && 'max-w-[1280px]',
          )}
        >
          <VehiclePicker
            onResolve={(resolved) => {
              setVehicle(resolved, 'manual');
              setOpen(false);
            }}
          />
        </div>
      ) : null}
    </section>
  );
}

type Column = 'make' | 'model' | 'year' | 'trim';

interface Cascade {
  make: string | null;
  model: string | null;
  year: string | null;
  trim: string | null;
}

const EMPTY: Cascade = { make: null, model: null, year: null, trim: null };

/**
 * The same four-column cascade as screen 1 of the estimator, laid out as a row
 * of dropdowns rather than a row of scrolling columns.
 *
 * A native `<select>` is the right control here and not a compromise: this band
 * appears on every page including the cart, the audience is overwhelmingly on
 * Android, and the platform picker is the one list that is always big enough to
 * hit, always scrollable with a thumb, and always keyboard accessible. The
 * estimator's tall columns earn their space because choosing the car IS that
 * screen's work; here it is a correction made in passing.
 */
function VehiclePicker({ onResolve }: { onResolve: (vehicle: VehicleDetail) => void }) {
  const [cascade, setCascade] = useState<Cascade>(EMPTY);

  function pick(column: Column, value: string) {
    // Each choice invalidates everything to its right — a Corolla trim means
    // nothing once the make becomes Honda.
    setCascade((prev) => {
      if (column === 'make') return { make: value || null, model: null, year: null, trim: null };
      if (column === 'model') return { ...prev, model: value || null, year: null, trim: null };
      if (column === 'year') return { ...prev, year: value || null, trim: null };
      return { ...prev, trim: value || null };
    });
  }

  /**
   * Resolved the moment all four are chosen, exactly as screen 1 does it — the
   * button then names the car rather than saying "continue", so the last thing
   * the customer sees before committing is the thing they are committing to.
   */
  const resolved: VehicleDetail | null =
    cascade.make && cascade.model && cascade.year && cascade.trim
      ? vehicleFromCascade(cascade.make, cascade.model, cascade.year, cascade.trim)
      : null;

  return (
    <div>
      <div className="flex flex-wrap gap-[10px]">
        <PickerSelect
          label="Make"
          basis="170px"
          value={cascade.make}
          options={MAKES}
          onPick={(value) => pick('make', value)}
        />
        <PickerSelect
          label="Model"
          basis="170px"
          value={cascade.model}
          options={cascade.make ? (MODELS[cascade.make] ?? []) : []}
          disabled={!cascade.make}
          onPick={(value) => pick('model', value)}
        />
        <PickerSelect
          label="Year"
          basis="150px"
          mono
          value={cascade.year}
          options={cascade.model ? YEAR_RANGES : []}
          disabled={!cascade.model}
          onPick={(value) => pick('year', value)}
        />
        <PickerSelect
          label="Trim"
          basis="140px"
          value={cascade.trim}
          options={cascade.year ? TRIMS : []}
          disabled={!cascade.year}
          onPick={(value) => pick('trim', value)}
        />
      </div>

      <div className="mt-[13px] flex flex-wrap items-center gap-x-[16px] gap-y-[10px]">
        <Button
          variant="dark"
          size="md"
          disabled={resolved === null}
          onClick={() => {
            if (resolved) onResolve(resolved);
          }}
        >
          {resolved ? `Use ${vehicleTitle(resolved)}` : 'Choose all four'}
        </Button>
        <p className="text-muted m-0 min-w-0 flex-[1_1_260px] text-[12px] leading-[1.45]">
          Not sure of the trim? Pick the closest — it only changes lamp and grille parts. Know your
          VIN?{' '}
          <a href="/estimate/new" className="text-flag-deep underline">
            Decode it instead
          </a>
          .
        </p>
      </div>
    </div>
  );
}

function PickerSelect({
  label,
  options,
  value,
  onPick,
  basis,
  disabled = false,
  mono = false,
}: {
  label: string;
  options: readonly string[];
  value: string | null;
  onPick: (value: string) => void;
  basis: string;
  disabled?: boolean;
  mono?: boolean;
}) {
  return (
    <label className="min-w-0" style={{ flex: `1 1 ${basis}` }}>
      <Kicker as="div" className="text-muted tracking-[0.11em]">
        {label}
      </Kicker>
      <select
        disabled={disabled}
        value={value ?? ''}
        onChange={(event) => onPick(event.target.value)}
        className={cx(
          'border-ink text-ink mt-[6px] h-[46px] w-full min-w-0 border-[1.5px] px-[10px]',
          mono ? 'font-mono text-[13.5px] font-bold' : 'text-[13.5px]',
          disabled ? 'bg-panel-3 text-faint' : 'bg-white',
        )}
      >
        <option value="">{disabled ? '—' : `Choose ${label.toLowerCase()}`}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
