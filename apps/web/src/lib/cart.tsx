'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { FitmentConfidence, PartCondition, StockModel } from '@mims/contracts';

/**
 * THE BASKET, AS THE DEVICE HOLDS IT.
 *
 * Modelled on `estimate-flow.tsx` — the same `useSyncExternalStore` over
 * localStorage, for the same reasons. What it stores follows one rule, and the
 * rule is the whole design:
 *
 *   SNAPSHOT THE IDENTITY, DERIVE THE VOLATILE.
 *
 * The identity — name, number, grade, SKU — is copied onto the line and never
 * refreshed, because it is what the customer read and what they will read back
 * off an order weeks later, and because a line whose listing has been withdrawn
 * still has to be able to say which part it was. That is why `cartItemSchema`
 * keeps `partName` non-null while `listingId` is nullable.
 *
 * The volatile — today's price, today's fitment verdict, the lead time, whether
 * the thing can still be bought at all — is looked up fresh on every read by
 * `mock/cart.ts` and never remembered. A cart that remembers a price and shows
 * it back is a cart that cannot notice the price has moved, and noticing is the
 * entire job: this store takes payment upfront for parts that arrive in three to
 * six weeks, so anything that changed between adding and paying has to surface
 * before the money does, not after.
 *
 * Two figures sit across that line deliberately: `priceAtAdd` and
 * `fitmentAtAdd`. They are snapshots kept for comparison — what we said, held
 * next to what is true now — so the screen can show both and let the customer
 * decide, rather than quietly re-pricing their basket under them.
 *
 * When the API is wired (build plan item 10) this file survives as the guest
 * cart: these lines become the body of `POST /api/v1/cart`, and the server's
 * `Cart` replaces the derivation in `mock/cart.ts`.
 */

const STORAGE_KEY = 'mims.cart.v1';

export interface StoredLine {
  /** The listing's URL slug — stable, human-readable, and re-resolvable. */
  slug: string;
  quantity: number;

  /* The identity snapshot. Frozen at add, and all that is left to say when a
     listing is withdrawn out from under the line. */
  partName: string;
  mpn: string | null;
  sku: string;
  condition: PartCondition;
  stockModel: StockModel;

  /** Decimal string, in Naira, exactly as it was drawn on the product page. */
  priceAtAdd: string;
  /** Null when no car was set at the time, which is a different thing to `unknown`. */
  fitmentAtAdd: FitmentConfidence | null;
  addedAt: string;
}

const EMPTY: readonly StoredLine[] = [];

/* ------------------------------------------------------------------ store -- */

const listeners = new Set<() => void>();
let snapshot: readonly StoredLine[] | null = null;

function isLine(value: unknown): value is StoredLine {
  if (typeof value !== 'object' || value === null) return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line.slug === 'string' &&
    typeof line.quantity === 'number' &&
    line.quantity > 0 &&
    typeof line.partName === 'string' &&
    typeof line.sku === 'string' &&
    typeof line.condition === 'string' &&
    typeof line.stockModel === 'string' &&
    typeof line.priceAtAdd === 'string' &&
    typeof line.addedAt === 'string'
  );
}

function read(): readonly StoredLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter(isLine);
  } catch {
    // Corrupt JSON, or storage disabled in a private window. An unreadable
    // basket is an empty one; a broken screen helps nobody.
    return EMPTY;
  }
}

function getSnapshot(): readonly StoredLine[] {
  snapshot ??= read();
  return snapshot;
}

/** Always empty: the server cannot see this device's basket. */
function getServerSnapshot(): readonly StoredLine[] {
  return EMPTY;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Two tabs, one basket. Adding a part in one must not leave the other showing
  // a count that is quietly wrong.
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

function write(next: readonly StoredLine[]): void {
  snapshot = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Full quota or private browsing. The basket still works for this session.
  }
  listeners.forEach((notify) => notify());
}

/* ------------------------------------------------------------------- hook -- */

const noopSubscribe = () => () => undefined;
const onClient = () => true;
const onServer = () => false;

/**
 * False during SSR and the hydration pass, true afterwards. The header holds its
 * count back until this flips — rendering "0" at somebody with three parts in
 * their basket, even for one frame, is how a store loses a sale it already had.
 */
export function useCartHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, onClient, onServer);
}

export interface CartStore {
  lines: readonly StoredLine[];
  hydrated: boolean;
  /** Adds, or tops up a line that is already there. Returns the resulting quantity. */
  add: (line: Omit<StoredLine, 'addedAt' | 'quantity'> & { quantity?: number }) => number;
  /** Quantity 0 removes the line, so callers need one path and no special case. */
  setQuantity: (slug: string, quantity: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
}

export function useCart(): CartStore {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useCartHydrated();

  const add = useCallback<CartStore['add']>((line) => {
    const current = getSnapshot();
    const existing = current.find((item) => item.slug === line.slug);
    const quantity = (existing?.quantity ?? 0) + (line.quantity ?? 1);

    if (existing) {
      /* Adding a part already in the basket tops it up and leaves the original
         snapshots alone. The price we owe the customer an explanation for is the
         one they first agreed to, not the one attached to their second click. */
      write(current.map((item) => (item.slug === line.slug ? { ...item, quantity } : item)));
      return quantity;
    }

    write([...current, { ...line, quantity, addedAt: new Date().toISOString() }]);
    return quantity;
  }, []);

  const setQuantity = useCallback<CartStore['setQuantity']>((slug, quantity) => {
    const current = getSnapshot();
    if (quantity <= 0) {
      write(current.filter((item) => item.slug !== slug));
      return;
    }
    write(current.map((item) => (item.slug === slug ? { ...item, quantity } : item)));
  }, []);

  const remove = useCallback<CartStore['remove']>((slug) => {
    write(getSnapshot().filter((item) => item.slug !== slug));
  }, []);

  const clear = useCallback(() => write([]), []);

  return { lines, hydrated, add, setQuantity, remove, clear };
}
