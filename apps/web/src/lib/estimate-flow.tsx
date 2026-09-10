'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { IdentificationMethod } from '@mims/contracts';
import type { VehicleDetail } from '@/mock/vehicles';

/**
 * The estimator's working state, held across screens 1 → 2 → 3.
 *
 * localStorage is the store, not a cache of one, because the design makes a
 * promise on the slow-connection screen: "Your car and damage list are saved, so
 * you can leave this page and come back." Somebody standing on a roadside with
 * one bar will take that literally, so it has to be true before the API exists.
 *
 * It is modelled with `useSyncExternalStore` rather than `useState` + an effect
 * because that is what it actually is — an external store that React subscribes
 * to. That also gets cross-tab sync for free via the `storage` event, and keeps
 * server rendering honest: the server snapshot is always empty, so nothing is
 * ever rendered from a device store the server cannot see.
 *
 * When the API is wired the vehicle and zones still live here, and
 * `POST /api/v1/estimates` replaces the local `buildEstimate` call on screen 3.
 */

const STORAGE_KEY = 'mims.estimate.v1';

interface FlowState {
  vehicle: VehicleDetail | null;
  identificationMethod: IdentificationMethod;
  vin: string;
  zoneCodes: string[];
  photoCount: number;
}

const EMPTY: FlowState = {
  vehicle: null,
  identificationMethod: 'manual',
  vin: '',
  zoneCodes: [],
  photoCount: 0,
};

/* ------------------------------------------------------------------ store -- */

const listeners = new Set<() => void>();
let snapshot: FlowState | null = null;

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function read(): FlowState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<FlowState>;
    return {
      vehicle: parsed.vehicle ?? null,
      identificationMethod: parsed.identificationMethod === 'vin' ? 'vin' : 'manual',
      vin: isString(parsed.vin) ? parsed.vin : '',
      zoneCodes: Array.isArray(parsed.zoneCodes) ? parsed.zoneCodes.filter(isString) : [],
      photoCount: typeof parsed.photoCount === 'number' ? parsed.photoCount : 0,
    };
  } catch {
    // Corrupt JSON, or storage disabled in a private window. A broken store is
    // never worth a broken screen — start the flow over instead.
    return EMPTY;
  }
}

function getSnapshot(): FlowState {
  snapshot ??= read();
  return snapshot;
}

/** Always empty: the server has no access to this device's store. */
function getServerSnapshot(): FlowState {
  return EMPTY;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Another tab changing the flow should not leave this one showing a stale car.
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

function update(patch: (prev: FlowState) => Partial<FlowState>): void {
  const previous = getSnapshot();
  const next: FlowState = { ...previous, ...patch(previous) };
  snapshot = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Full quota or private browsing. The flow still works for this session.
  }
  listeners.forEach((notify) => notify());
}

/* --------------------------------------------------------- hydration flag -- */

const noopSubscribe = () => () => undefined;
const onClient = () => true;
const onServer = () => false;

/**
 * False during SSR and the hydration pass, true afterwards. Screens use it to
 * hold off on "you haven't picked a car" until the store has actually been read
 * — otherwise every refresh would flash that message at someone who has.
 */
function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, onClient, onServer);
}

/* ------------------------------------------------------------------- hook -- */

export interface EstimateFlow extends FlowState {
  hydrated: boolean;
  setVehicle: (vehicle: VehicleDetail, method: IdentificationMethod, vin?: string) => void;
  clearVehicle: () => void;
  toggleZone: (code: string) => void;
  setZones: (codes: string[]) => void;
  clearZones: () => void;
  setPhotoCount: (count: number) => void;
  reset: () => void;
}

export function useEstimateFlow(): EstimateFlow {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useHydrated();

  const setVehicle = useCallback(
    (vehicle: VehicleDetail, method: IdentificationMethod, vin = '') =>
      update(() => ({ vehicle, identificationMethod: method, vin })),
    [],
  );

  const clearVehicle = useCallback(() => update(() => ({ vehicle: null, vin: '' })), []);

  const toggleZone = useCallback(
    (code: string) =>
      update((prev) => ({
        zoneCodes: prev.zoneCodes.includes(code)
          ? prev.zoneCodes.filter((existing) => existing !== code)
          : [...prev.zoneCodes, code],
      })),
    [],
  );

  const setZones = useCallback((codes: string[]) => update(() => ({ zoneCodes: codes })), []);
  const clearZones = useCallback(() => update(() => ({ zoneCodes: [] })), []);
  const setPhotoCount = useCallback((count: number) => update(() => ({ photoCount: count })), []);
  const reset = useCallback(() => update(() => EMPTY), []);

  return useMemo(
    () => ({
      ...state,
      hydrated,
      setVehicle,
      clearVehicle,
      toggleZone,
      setZones,
      clearZones,
      setPhotoCount,
      reset,
    }),
    [
      state,
      hydrated,
      setVehicle,
      clearVehicle,
      toggleZone,
      setZones,
      clearZones,
      setPhotoCount,
      reset,
    ],
  );
}
