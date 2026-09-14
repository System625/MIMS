'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { VehicleDetail } from '@/mock/vehicles';

/**
 * THE GARAGE — the cars this device has kept.
 *
 * Build plan item 11. The store already knows ONE car: `mims.estimate.v1` holds
 * the vehicle the whole site grades against, and the estimator shares it. This
 * is a different fact and so it is a different key. The current car is what you
 * are shopping for right now; the garage is the two or three cars you look
 * after — a mechanic's Corolla, Camry and Hilux, switched between all day.
 *
 * WHY NOT ONE KEY. `mims.estimate.v1` is read by the estimator mid-flow, and
 * bumping or reshaping it would quietly empty the car out from under somebody
 * who set it an hour ago. A second key can be added, corrupted or cleared
 * without touching the one thing every price on the site depends on.
 *
 * WHAT IS STORED. The resolved vehicle itself, not a reference to a fleet tile.
 * A garage entry has to survive the fleet being re-curated — if the tile for a
 * generation is renamed or dropped, the customer's saved car must still open,
 * still grade parts, and still say what it is. So the tile is where the car came
 * from, never where it lives.
 *
 * Switching to a saved car is a write to the ESTIMATE store, not this one. This
 * file hands the vehicle back; `useEstimateFlow().setVehicle` makes it current.
 * Keeping that one-directional means there is still exactly one answer to "what
 * car is this site talking about", which is the whole basis of every fitment
 * grade on every screen.
 */

const STORAGE_KEY = 'mims.garage.v1';

export interface GarageCar {
  /**
   * Stable identity for the entry. A fleet tile's id when the car came from
   * one, otherwise a slug built from the cascade, so the same car saved twice
   * from two routes is still one entry.
   */
  key: string;
  vehicle: VehicleDetail;
  /** When this device saved it. Ordering only — never shown as a fact about the car. */
  savedAt: string;
}

const EMPTY: readonly GarageCar[] = [];

/** The key a manually-picked car gets: everything that distinguishes it. */
export function garageKeyFor(vehicle: VehicleDetail): string {
  return [vehicle.make, vehicle.model, vehicle.year, vehicle.trim, vehicle.chassisCode]
    .filter(Boolean)
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/* ------------------------------------------------------------------ store -- */

const listeners = new Set<() => void>();
let snapshot: readonly GarageCar[] | null = null;

function isGarageCar(value: unknown): value is GarageCar {
  if (typeof value !== 'object' || value === null) return false;
  const row = value as Record<string, unknown>;
  const vehicle = row.vehicle as Record<string, unknown> | undefined;
  return (
    typeof row.key === 'string' &&
    row.key.length > 0 &&
    typeof row.savedAt === 'string' &&
    typeof vehicle === 'object' &&
    vehicle !== null &&
    typeof vehicle.make === 'string' &&
    typeof vehicle.model === 'string'
  );
}

function read(): readonly GarageCar[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter(isGarageCar);
  } catch {
    // Corrupt JSON, or storage disabled in a private window. An unreadable
    // garage is an empty one: the fleet is still on the page, and picking the
    // car again is two taps rather than an error message.
    return EMPTY;
  }
}

function getSnapshot(): readonly GarageCar[] {
  snapshot ??= read();
  return snapshot;
}

/** Always empty: the server cannot see this device's garage. */
function getServerSnapshot(): readonly GarageCar[] {
  return EMPTY;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    snapshot = read();
    listeners.forEach((notify) => notify());
  };
  window.addEventListener('storage', onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function write(next: readonly GarageCar[]): void {
  snapshot = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Full quota or private browsing. The car is still current for this session.
  }
  listeners.forEach((notify) => notify());
}

/* ------------------------------------------------------------------- hook -- */

const noopSubscribe = () => () => undefined;
const onClient = () => true;
const onServer = () => false;

export interface GarageStore {
  cars: readonly GarageCar[];
  hydrated: boolean;
  has: (key: string) => boolean;
  /** Idempotent. Saving a car already in the garage refreshes nothing and reorders nothing. */
  save: (key: string, vehicle: VehicleDetail) => void;
  remove: (key: string) => void;
}

export function useGarage(): GarageStore {
  const cars = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useSyncExternalStore(noopSubscribe, onClient, onServer);

  const has = useCallback((key: string) => cars.some((car) => car.key === key), [cars]);

  const save = useCallback<GarageStore['save']>((key, vehicle) => {
    const current = getSnapshot();
    if (current.some((car) => car.key === key)) return;
    write([...current, { key, vehicle, savedAt: new Date().toISOString() }]);
  }, []);

  const remove = useCallback<GarageStore['remove']>((key) => {
    write(getSnapshot().filter((car) => car.key !== key));
  }, []);

  return { cars, hydrated, has, save, remove };
}
