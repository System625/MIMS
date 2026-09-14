'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * ORDER HISTORY WITHOUT ACCOUNTS.
 *
 * There is no sign-in on this store and there is not going to be one in front of
 * a purchase — `/checkout` takes a phone number and nothing else, because a
 * password wall is a trust cost we cannot add to the one we already have. That
 * leaves a real question: where does "my orders" live?
 *
 * Here. The device remembers which orders it has been shown, the same way
 * `lib/cart.tsx` remembers the basket. Two facts make an order openable — the
 * reference and the phone it was placed with — and once a device has produced
 * both, it does not have to produce them again.
 *
 * WHAT IS STORED, AND WHY IT IS SO LITTLE. A reference, four digits of a phone
 * number, and when this device first saw it. Not the name, not the parts, not
 * the total, not the whole number. This store is a KEYRING, not a copy of the
 * order: everything else is re-read from the order itself on every open, so a
 * phone that has been lent out, sold or looked over reveals nothing beyond
 * which references exist — and the four digits are there only so the list can
 * label a row, never to authorise anything.
 *
 * The writers, in order of appearance: a successful lookup on `/orders` writes
 * here today, so a customer types the reference once and their own phone
 * remembers it. Placing an order writes here too, when orders reach Postgres at
 * build plan item 10 — and this file does not change when it does.
 */

const STORAGE_KEY = 'mims.orders.v1';

export interface KnownOrder {
  /** Normalised, upper case, with the `MO-` prefix. */
  reference: string;
  /** Four digits. Enough to label a row; never enough to be a key. */
  phoneLast4: string;
  /** When this device was first shown the order — not when the order was placed. */
  knownSince: string;
}

const EMPTY: readonly KnownOrder[] = [];

/* ------------------------------------------------------------------ store -- */

const listeners = new Set<() => void>();
let snapshot: readonly KnownOrder[] | null = null;

function isKnownOrder(value: unknown): value is KnownOrder {
  if (typeof value !== 'object' || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.reference === 'string' &&
    row.reference.length > 0 &&
    typeof row.phoneLast4 === 'string' &&
    typeof row.knownSince === 'string'
  );
}

function read(): readonly KnownOrder[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter(isKnownOrder);
  } catch {
    // Corrupt JSON, or storage disabled in a private window. An unreadable
    // keyring is an empty one — the lookup form still works, which is the point
    // of a lookup form that asks for two facts the customer already has.
    return EMPTY;
  }
}

function getSnapshot(): readonly KnownOrder[] {
  snapshot ??= read();
  return snapshot;
}

/** Always empty: the server cannot see which orders this device has opened. */
function getServerSnapshot(): readonly KnownOrder[] {
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

function write(next: readonly KnownOrder[]): void {
  snapshot = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Full quota or private browsing. The order is still open for this session.
  }
  listeners.forEach((notify) => notify());
}

/* ------------------------------------------------------------------- hook -- */

const noopSubscribe = () => () => undefined;
const onClient = () => true;
const onServer = () => false;

export function useKnownOrdersHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, onClient, onServer);
}

export interface KnownOrdersStore {
  orders: readonly KnownOrder[];
  hydrated: boolean;
  /** True once this device has proved the phone for that reference. */
  knows: (reference: string) => boolean;
  remember: (reference: string, phoneLast4: string) => void;
  forget: (reference: string) => void;
  forgetAll: () => void;
}

export function useKnownOrders(): KnownOrdersStore {
  const orders = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useKnownOrdersHydrated();

  const knows = useCallback(
    (reference: string) => orders.some((order) => order.reference === reference),
    [orders],
  );

  const remember = useCallback<KnownOrdersStore['remember']>((reference, phoneLast4) => {
    const current = getSnapshot();
    /* Opening an order you already have on the keyring is not a new fact, and
       must not shuffle it to the top: the list is ordered by when this device
       first saw each one, which is the order a customer remembers them in. */
    if (current.some((order) => order.reference === reference)) return;
    write([{ reference, phoneLast4, knownSince: new Date().toISOString() }, ...current]);
  }, []);

  const forget = useCallback<KnownOrdersStore['forget']>((reference) => {
    write(getSnapshot().filter((order) => order.reference !== reference));
  }, []);

  const forgetAll = useCallback(() => write([]), []);

  return { orders, hydrated, knows, remember, forget, forgetAll };
}
