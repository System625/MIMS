'use client';

import { useState } from 'react';
import {
  Button,
  cx,
  FactRows,
  Kicker,
  Note,
  Panel,
  PanelBar,
  Segmented,
  TextInput,
  Title,
  Toggle,
} from './ui';

/**
 * Settings — four things and no more.
 *
 * The garage is the one that saves real time: a saved car skips vehicle
 * identification entirely next time, which on a roadside is the difference
 * between twenty seconds and two minutes. Deletion asks once, in plain terms,
 * and says exactly what disappears — including that share links already sent
 * will stop working, which is the consequence people forget.
 */

interface Car {
  id: number;
  name: string;
  meta: string;
}

const CARS: readonly Car[] = [
  { id: 0, name: '2018 Toyota Corolla LE', meta: 'ZRE172 · 1.8L · VIN ····3456' },
  { id: 1, name: '2012 Honda Accord EX', meta: 'CU2 · 2.4L · ADDED MANUALLY' },
];

const ALERTS = [
  {
    id: 'coverage',
    name: 'When a missing part gets a price',
    note: "For parts in your estimates we couldn't price.",
  },
  {
    id: 'car',
    name: "When my car's coverage improves",
    note: 'New part numbers or fresher prices for your garage.',
  },
  {
    id: 'moves',
    name: 'When prices move more than 15%',
    note: 'Useful if you are waiting to buy.',
  },
] as const;

type AlertId = (typeof ALERTS)[number]['id'];

export function AccountSettings() {
  const [cars, setCars] = useState<number[]>([0, 1]);
  const [defaultCar, setDefaultCar] = useState(0);
  const [alerts, setAlerts] = useState<Record<AlertId, boolean>>({
    coverage: true,
    car: true,
    moves: false,
  });
  const [region, setRegion] = useState<'Lagos' | 'Abuja'>('Lagos');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className="mt-[20px] flex flex-wrap items-start gap-[20px]">
      <div className="grid min-w-0 flex-[2_1_480px] gap-[16px]">
        {/* ------------------------------------------------------ garage -- */}
        <Panel weight="heavy">
          <PanelBar tone="dark" right={<span className="text-flag">{cars.length} VEHICLES</span>}>
            My garage
          </PanelBar>
          <div className="grid gap-[10px] p-[14px]">
            {cars.map((id) => {
              const car = CARS[id];
              if (!car) return null;
              const isDefault = defaultCar === id;
              return (
                <div
                  key={id}
                  className={cx(
                    'border-ink flex flex-wrap items-center gap-x-[14px] gap-y-[10px] border-[1.5px] p-[12px]',
                    isDefault ? 'bg-flag-soft' : 'bg-white',
                  )}
                >
                  <div className="min-w-0 flex-[1_1_220px]">
                    <div className="text-[15px] font-bold uppercase leading-[1.2]">{car.name}</div>
                    <Kicker
                      as="div"
                      className="text-muted mt-[5px] leading-[1.4] tracking-[0.07em]"
                    >
                      {car.meta}
                    </Kicker>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDefaultCar(id)}
                    aria-pressed={isDefault}
                    className={cx(
                      'border-ink flex min-h-[40px] flex-none items-center border-[1.5px] px-[12px]',
                      'font-mono text-[11px] font-bold uppercase leading-none tracking-[0.08em]',
                      isDefault ? 'bg-flag text-flag-ink' : 'bg-panel text-ink',
                    )}
                  >
                    {isDefault ? 'Default' : 'Set default'}
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${car.name}`}
                    onClick={() => setCars((current) => current.filter((x) => x !== id))}
                    className="border-ink bg-panel flex h-[40px] w-[40px] flex-none items-center justify-center border-[1.5px] font-mono text-[14px] font-bold leading-none"
                  >
                    ×
                  </button>
                </div>
              );
            })}

            {cars.length === 0 ? (
              <div className="border-muted text-muted border-[1.5px] border-dashed p-[14px] text-[13px] leading-[1.55]">
                No cars saved. The next estimate you run can be saved here in one tap.
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setCars([0, 1])}
              className="border-ink bg-panel-4 flex min-h-[48px] items-center justify-center gap-2 border-[1.5px] border-dashed text-[12.5px] font-bold uppercase leading-none tracking-[0.04em]"
            >
              + Add a vehicle
            </button>
          </div>
        </Panel>

        {/* ------------------------------------------------------ alerts -- */}
        <Panel>
          <PanelBar>Alerts</PanelBar>
          <div className="px-[14px] pb-[14px] pt-[6px]">
            {ALERTS.map((alert) => (
              <div
                key={alert.id}
                className="border-rule flex flex-wrap items-center gap-x-[14px] gap-y-[10px] border-b py-[13px]"
              >
                <div className="min-w-0 flex-[1_1_240px]">
                  <div className="text-[13.5px] font-bold uppercase leading-[1.25]">
                    {alert.name}
                  </div>
                  <div className="text-muted mt-[4px] text-[12.5px] leading-[1.45]">
                    {alert.note}
                  </div>
                </div>
                <Toggle
                  label={alert.name}
                  checked={alerts[alert.id]}
                  onChange={(next) => setAlerts((current) => ({ ...current, [alert.id]: next }))}
                />
              </div>
            ))}
            <p className="text-muted mt-[12px] text-[12px] leading-[1.5]">
              Alerts go to <strong className="font-bold">0803 000 0000</strong> by SMS. We never
              send marketing — only the thing you asked about.
            </p>
          </div>
        </Panel>

        {/* ----------------------------------------------------- details -- */}
        <Panel>
          <PanelBar>Your details</PanelBar>
          <div className="flex flex-wrap gap-[12px] p-[14px]">
            <div className="min-w-0 flex-[1_1_200px]">
              <Kicker className="text-muted tracking-[0.11em]">Name · optional</Kicker>
              <TextInput
                weight="light"
                className="mt-[7px]"
                defaultValue="Adaeze O."
                aria-label="Name"
              />
            </div>

            <div className="min-w-0 flex-[1_1_200px]">
              <Kicker className="text-muted tracking-[0.11em]">Phone · sign-in</Kicker>
              <div className="bg-panel-3 border-faint mt-[7px] flex h-[48px] items-center justify-between gap-[10px] border-[1.5px] px-[12px]">
                <span className="font-mono text-[14px] font-bold leading-none">0803 000 0000</span>
                <button
                  type="button"
                  className="text-muted font-mono text-[11px] font-bold uppercase leading-none tracking-[0.07em] underline"
                >
                  Change
                </button>
              </div>
            </div>

            <div className="min-w-0 flex-[1_1_200px]">
              <Kicker className="text-muted tracking-[0.11em]">Email · for PDFs</Kicker>
              <TextInput
                weight="light"
                type="email"
                className="mt-[7px]"
                defaultValue="adaeze@example.com"
                aria-label="Email address"
              />
            </div>

            <div className="min-w-0 flex-[1_1_200px]">
              <Kicker className="text-muted tracking-[0.11em]">Price region</Kicker>
              <Segmented
                className="mt-[7px]"
                label="Price region"
                value={region}
                onChange={setRegion}
                options={[
                  { value: 'Lagos', label: 'Lagos' },
                  { value: 'Abuja', label: 'Abuja' },
                ]}
              />
            </div>

            <p className="text-muted flex-[1_1_100%] text-[12px] leading-[1.5]">
              Region changes which market&rsquo;s prices we quote. Abuja coverage is thinner —
              you&rsquo;ll see wider ranges.
            </p>
          </div>
        </Panel>

        {/* -------------------------------------------------------- data -- */}
        <Panel>
          <PanelBar>Your data</PanelBar>
          <div className="grid gap-[11px] p-[14px]">
            <div className="flex flex-wrap gap-[10px]">
              <Button variant="outline" size="md" className="min-h-[46px] flex-[1_1_190px]">
                Download my estimates
              </Button>
              <Button variant="outline" size="md" className="min-h-[46px] flex-[1_1_190px]">
                Sign out
              </Button>
            </div>

            <Button
              variant="danger"
              size="md"
              full
              className="min-h-[46px]"
              onClick={() => setConfirmingDelete(true)}
            >
              Delete my account and data
            </Button>

            {/* Asked once, in plain terms, with the real consequences named. */}
            {confirmingDelete ? (
              <div className="border-flag-deep border-2 bg-white p-[13px]">
                <Title className="text-[13.5px] leading-[1.25]">This removes everything</Title>
                <p className="text-ink-soft mt-[6px] text-[12.5px] leading-[1.55]">
                  4 saved estimates, 2 vehicles and your phone number, deleted within 24 hours.
                  Share links you have already sent will stop working. This cannot be undone.
                </p>
                <div className="mt-[12px] flex flex-wrap gap-[9px]">
                  <button
                    type="button"
                    className="bg-flag-deep border-ink flex min-h-[46px] flex-[1_1_160px] items-center justify-center border-[1.5px] text-[12px] font-bold uppercase leading-none tracking-[0.04em] text-white"
                  >
                    Yes, delete it
                  </button>
                  <Button
                    variant="outline"
                    size="md"
                    className="min-h-[46px] flex-[1_1_120px]"
                    onClick={() => setConfirmingDelete(false)}
                  >
                    Keep it
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </Panel>
      </div>

      {/* ----------------------------------------------------- side rail -- */}
      <div className="grid min-w-0 max-w-[340px] flex-[1_1_250px] content-start gap-[14px]">
        <Panel className="p-[14px]">
          <Kicker className="text-muted tracking-[0.12em]">Account</Kicker>
          <FactRows
            className="mt-[11px]"
            items={[
              { label: 'Estimates saved', value: '4' },
              { label: 'Member since', value: 'JUL 2026' },
              { label: 'Prices you reported', value: '2' },
            ]}
          />
        </Panel>

        <Note tone="dashed" className="border-muted">
          Reported prices are the most useful thing you can send us — they correct the catalogue for
          the next person with your car.
        </Note>
      </div>
    </div>
  );
}
