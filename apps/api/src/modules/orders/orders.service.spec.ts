import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { CheckoutRequest } from '@mims/contracts';
import { AppError } from '../../common/errors/app-error';
import {
  DuplicateOrderReferenceError,
  OrdersRepository,
  type CheckoutCart,
  type CheckoutLine,
  type OrderDraft,
  type PickupPointSnapshot,
  type StoredOrder,
} from './orders.repository';
import { OrdersService } from './orders.service';

/**
 * ORDER PLACEMENT, EXERCISED WITHOUT A DATABASE.
 *
 * Every test here is a way a store loses money or a customer's trust: a basket
 * priced from a stale snapshot, a bumper sold at last month's Naira, a part
 * bought against the wrong car with nobody having said so, an order written
 * twice because a form was double-submitted, a stranger walking the reference
 * space to find out which orders exist.
 *
 * The repository is faked and the rules are real. That split is deliberate —
 * these are the rules that would still be worth writing down if we changed
 * database tomorrow, and they are the half that can be proven on a laptop with
 * no Postgres on it.
 */

const CART_ID = '00000000-0000-4000-8000-0000000000c1';
const PICKUP_ID = '00000000-0000-4000-8000-0000000000b1';

function aPickupPoint(overrides: Partial<PickupPointSnapshot> = {}): PickupPointSnapshot {
  return {
    id: PICKUP_ID,
    code: 'LAG-IKJ',
    name: 'Ikeja counter',
    address: '14 Awolowo Way, Ikeja, Lagos',
    isActive: true,
    ...overrides,
  };
}

function aLine(overrides: Partial<CheckoutLine> = {}): CheckoutLine {
  const listing: NonNullable<CheckoutLine['listing']> = {
    id: '00000000-0000-4000-8000-0000000000a1',
    partId: '00000000-0000-4000-8000-0000000000d1',
    supplierId: '00000000-0000-4000-8000-0000000000e1',
    supplierName: 'Placeholder supplier',
    sku: 'MIMS-BUM-0001',
    partName: 'Front bumper cover',
    mpn: '52119-02997',
    oemNumber: null,
    position: 'front',
    condition: 'new_aftermarket',
    stockModel: 'held_stock',
    status: 'active',
    retailPrice: '148500.00',
    currency: 'NGN',
    priceValidUntil: null,
    quantityAvailable: 4,
    leadTimeMinDays: 2,
    leadTimeMaxDays: 5,
    fitmentNote: null,
  };

  return {
    cartItemId: '00000000-0000-4000-8000-0000000000f1',
    quantity: 1,
    snapshot: {
      partName: 'Front bumper cover',
      mpn: '52119-02997',
      condition: 'new_aftermarket',
      stockModel: 'held_stock',
      /* Deliberately NOT the listing price. Several tests turn on which of the
         two ends up on the order. */
      unitPrice: '139000.00',
    },
    listing,
    fitment: { confidence: 'confirmed', qualifier: null },
    ...overrides,
  };
}

function aCart(overrides: Partial<CheckoutCart> = {}): CheckoutCart {
  return {
    id: CART_ID,
    status: 'active',
    currency: 'NGN',
    estimateId: null,
    vehicle: {
      variantId: '00000000-0000-4000-8000-000000000011',
      year: 2018,
      makeText: 'Toyota',
      modelText: 'Corolla',
      chassisCode: 'ZRE172',
    },
    lines: [aLine()],
    ...overrides,
  };
}

function aCheckout(overrides: Partial<CheckoutRequest> = {}): CheckoutRequest {
  return {
    cartId: CART_ID,
    customerName: 'Placeholder customer',
    customerPhone: '08031234567',
    acceptsFitmentRisk: false,
    fulfilmentMethod: 'pickup',
    pickupPointId: PICKUP_ID,
    ...overrides,
  } as CheckoutRequest;
}

/** Records what was actually written, which is what most of these assert on. */
class FakeRepository extends OrdersRepository {
  cart: CheckoutCart | null = aCart();
  pickupPoint: PickupPointSnapshot | null = aPickupPoint();
  drafts: OrderDraft[] = [];
  lookupResult: StoredOrder | null = null;
  lookupCalls: Array<{ reference: string; phone: string }> = [];

  async findCheckoutCart(): Promise<CheckoutCart | null> {
    return this.cart;
  }

  async findPickupPoint(): Promise<PickupPointSnapshot | null> {
    return this.pickupPoint;
  }

  async create(draft: OrderDraft): Promise<StoredOrder> {
    this.drafts.push(draft);
    return storedFrom(draft);
  }

  async findByReferenceAndPhone(reference: string, phone: string): Promise<StoredOrder | null> {
    this.lookupCalls.push({ reference, phone });
    return this.lookupResult;
  }
}

function storedFrom(draft: OrderDraft): StoredOrder {
  return {
    id: '00000000-0000-4000-8000-000000000099',
    reference: draft.reference,
    status: 'awaiting_payment',
    customerName: draft.customerName,
    customerPhone: draft.customerPhone,
    customerEmail: draft.customerEmail,
    fulfilmentMethod: draft.fulfilmentMethod,
    pickupPointCode: draft.pickupPoint?.code ?? null,
    pickupPointName: draft.pickupPoint?.name ?? null,
    pickupPointAddress: draft.pickupPoint?.address ?? null,
    deliveryLine1: null,
    deliveryLine2: null,
    deliveryLandmark: null,
    deliveryArea: null,
    deliveryCity: null,
    deliveryState: null,
    deliveryRecipientName: null,
    deliveryPhone: null,
    vehicleYear: draft.vehicle.year,
    vehicleMakeText: draft.vehicle.makeText,
    vehicleModelText: draft.vehicle.modelText,
    vehicleChassisCode: draft.vehicle.chassisCode,
    itemsSubtotal: draft.itemsSubtotal,
    deliveryFee: draft.deliveryFee,
    total: draft.total,
    currency: draft.currency,
    leadTimeMinDays: draft.leadTimeMinDays,
    leadTimeMaxDays: draft.leadTimeMaxDays,
    customerNote: draft.customerNote,
    cancellationReason: null,
    placedAt: new Date('2026-09-14T10:00:00.000Z'),
    paidAt: null,
    deliveredAt: null,
    items: draft.items.map((item, index) => ({
      id: `00000000-0000-4000-8000-0000000${String(index).padStart(5, '0')}`,
      sku: item.sku,
      partName: item.partName,
      mpn: item.mpn,
      oemNumber: item.oemNumber,
      position: item.position,
      condition: item.condition,
      stockModel: item.stockModel,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      currency: item.currency,
      leadTimeMinDays: item.leadTimeMinDays,
      leadTimeMaxDays: item.leadTimeMaxDays,
      fitmentConfidence: item.fitmentConfidence,
      fitmentNote: item.fitmentNote,
    })),
    events: [
      {
        id: '00000000-0000-4000-8000-000000000001',
        type: 'placed',
        summary: draft.placedSummary,
        detail: null,
        occurredAt: new Date('2026-09-14T10:00:00.000Z'),
      },
    ],
  };
}

async function expectAppError(run: () => Promise<unknown>): Promise<AppError> {
  try {
    await run();
  } catch (error) {
    assert.ok(error instanceof AppError, `expected an AppError, got ${String(error)}`);
    return error;
  }
  assert.fail('expected the call to be refused');
}

describe('placing an order', () => {
  let repository: FakeRepository;
  let service: OrdersService;

  beforeEach(() => {
    repository = new FakeRepository();
    service = new OrdersService(repository);
  });

  it('prices from the live listing, never from the basket snapshot', async () => {
    const order = await service.place(aCheckout());

    /* The snapshot said ₦139,000 and the catalogue says ₦148,500. The customer
       is charged what the part costs today — the snapshot exists so the basket
       screen can SAY it moved, not so the order can be written at the old
       figure. */
    assert.equal(order.items[0]?.unitPrice.amount, '148500.00');
    assert.equal(order.total.amount, '148500.00');
  });

  it('computes line totals and the subtotal exactly', async () => {
    repository.cart = aCart({
      lines: [
        aLine({ quantity: 3 }),
        aLine({
          cartItemId: 'x',
          quantity: 2,
          listing: { ...aLine().listing!, id: 'b', retailPrice: '10333.33' },
        }),
      ],
    });

    const order = await service.place(aCheckout({ acceptsFitmentRisk: true }));

    assert.equal(order.items[0]?.lineTotal.amount, '445500.00');
    assert.equal(order.items[1]?.lineTotal.amount, '20666.66');
    assert.equal(order.itemsSubtotal.amount, '466166.66');
    /* Pickup, so nothing is added and nothing appears for the first time here. */
    assert.equal(order.deliveryFee.amount, '0.00');
    assert.equal(order.total.amount, '466166.66');
  });

  it('refuses a price that has aged out of its validity window', async () => {
    repository.cart = aCart({
      lines: [
        aLine({
          listing: { ...aLine().listing!, priceValidUntil: new Date('2026-09-01T00:00:00.000Z') },
        }),
      ],
    });

    const error = await expectAppError(() => service.place(aCheckout()));
    assert.equal(error.code, 'CONFLICT');
    assert.match(error.details?.[0]?.message ?? '', /aged out/);
    assert.equal(repository.drafts.length, 0);
  });

  it('refuses a line whose listing has been withdrawn', async () => {
    repository.cart = aCart({ lines: [aLine({ listing: null })] });

    const error = await expectAppError(() => service.place(aCheckout()));
    assert.equal(error.code, 'CONFLICT');
    assert.match(error.details?.[0]?.message ?? '', /no longer for sale/);
  });

  it('refuses held stock it does not have, and says how many are left', async () => {
    repository.cart = aCart({
      lines: [aLine({ quantity: 5, listing: { ...aLine().listing!, quantityAvailable: 2 } })],
    });

    const error = await expectAppError(() => service.place(aCheckout()));
    assert.match(error.details?.[0]?.message ?? '', /only have 2/);
  });

  it('sells a pre-order with nothing on the shelf, because that is what pre-order means', async () => {
    repository.cart = aCart({
      lines: [
        aLine({
          listing: {
            ...aLine().listing!,
            stockModel: 'pre_order',
            quantityAvailable: 0,
            leadTimeMinDays: 21,
            leadTimeMaxDays: 42,
          },
        }),
      ],
    });

    const order = await service.place(aCheckout());
    assert.equal(order.items[0]?.stockModel, 'pre_order');
    assert.deepEqual(order.leadTime, { minDays: 21, maxDays: 42 });
  });

  it('reports every unsellable line at once rather than one per attempt', async () => {
    repository.cart = aCart({
      lines: [
        aLine({ listing: null }),
        aLine({ cartItemId: 'b', listing: { ...aLine().listing!, status: 'archived' } }),
        aLine({
          cartItemId: 'c',
          quantity: 9,
          listing: { ...aLine().listing!, quantityAvailable: 1 },
        }),
      ],
    });

    const error = await expectAppError(() => service.place(aCheckout()));
    assert.equal(error.details?.length, 3);
  });

  /* ------------------------------------------------------------ fitment -- */

  it('refuses an unconfirmed fit that nobody has acknowledged', async () => {
    repository.cart = aCart({
      lines: [aLine({ fitment: { confidence: 'probable', qualifier: 'halogen cars only' } })],
    });

    const error = await expectAppError(() =>
      service.place(aCheckout({ acceptsFitmentRisk: false })),
    );
    assert.equal(error.code, 'VALIDATION_FAILED');
    assert.match(error.details?.[0]?.message ?? '', /probable fit/);
    assert.equal(repository.drafts.length, 0);
  });

  it('accepts it once the customer has said they saw the caveat', async () => {
    repository.cart = aCart({
      lines: [aLine({ fitment: { confidence: 'probable', qualifier: 'halogen cars only' } })],
    });

    const order = await service.place(aCheckout({ acceptsFitmentRisk: true }));
    assert.equal(order.items[0]?.fitmentConfidence, 'probable');
    /* And what we claimed is frozen onto the line, because that sentence is
       what a returns conversation is argued from. */
    assert.equal(order.items[0]?.fitmentNote, 'halogen cars only');
  });

  it('records the fitment derived at checkout, not whatever the basket remembered', async () => {
    repository.cart = aCart({
      lines: [aLine({ fitment: { confidence: 'unknown', qualifier: null } })],
    });

    const order = await service.place(aCheckout({ acceptsFitmentRisk: true }));
    assert.equal(order.items[0]?.fitmentConfidence, 'unknown');
  });

  /* -------------------------------------------------------- fulfilment -- */

  it('refuses a delivery order, because no courier has been signed', async () => {
    const error = await expectAppError(() =>
      service.place(aCheckout({ fulfilmentMethod: 'delivery', address: undefined } as never)),
    );
    assert.equal(error.code, 'CONFLICT');
    assert.match(error.message, /have not signed a courier/);
    assert.equal(repository.drafts.length, 0);
  });

  it('refuses a collection point that is closed or unknown', async () => {
    repository.pickupPoint = aPickupPoint({ isActive: false });
    const closed = await expectAppError(() => service.place(aCheckout()));
    assert.equal(closed.code, 'NOT_FOUND');

    repository.pickupPoint = null;
    const missing = await expectAppError(() => service.place(aCheckout()));
    assert.equal(missing.code, 'NOT_FOUND');
  });

  it('snapshots the collection counter onto the order', async () => {
    const order = await service.place(aCheckout());
    assert.equal(order.pickupPoint?.code, 'LAG-IKJ');
    assert.equal(order.pickupPoint?.line1, '14 Awolowo Way, Ikeja, Lagos');
  });

  /* ------------------------------------------------------------- basket -- */

  it('refuses a basket that has already been ordered, and says so plainly', async () => {
    repository.cart = aCart({ status: 'ordered' });

    const error = await expectAppError(() => service.place(aCheckout()));
    assert.equal(error.code, 'CONFLICT');
    /* Somebody who has just pressed pay twice needs to know whether they have
       been charged twice, so the message is not "conflict". */
    assert.match(error.message, /already been ordered/);
  });

  it('refuses an empty basket and an unknown one', async () => {
    repository.cart = aCart({ lines: [] });
    assert.equal((await expectAppError(() => service.place(aCheckout()))).code, 'CONFLICT');

    repository.cart = null;
    assert.equal((await expectAppError(() => service.place(aCheckout()))).code, 'NOT_FOUND');
  });

  /* ---------------------------------------------------------- reference -- */

  it('writes a reference in the spoken format', async () => {
    const order = await service.place(aCheckout());
    assert.match(order.reference, /^MO-\d{7}$/);
  });

  it('retries when a generated reference has already been taken', async () => {
    /* Force the first attempt to collide whatever it generates. */
    const original = repository.create.bind(repository);
    let calls = 0;
    repository.create = async (draft) => {
      calls += 1;
      if (calls === 1) throw new DuplicateOrderReferenceError(draft.reference);
      return original(draft);
    };

    const order = await service.place(aCheckout());
    assert.equal(calls, 2);
    assert.match(order.reference, /^MO-\d{7}$/);
  });

  it('normalises the phone it stores, so a lookup can find it later', async () => {
    await service.place(aCheckout({ customerPhone: '+234 803 123 4567' }));
    assert.equal(repository.drafts[0]?.customerPhone, '08031234567');
  });

  it('takes the widest lead-time window across a mixed basket', async () => {
    repository.cart = aCart({
      lines: [
        aLine({ listing: { ...aLine().listing!, leadTimeMinDays: 2, leadTimeMaxDays: 5 } }),
        aLine({
          cartItemId: 'b',
          listing: { ...aLine().listing!, id: 'b', leadTimeMinDays: 21, leadTimeMaxDays: 42 },
        }),
      ],
    });

    const order = await service.place(aCheckout());
    /* Lowest low and highest high — the same figures `mock/cart.ts` computed on
       the basket screen this customer just read. */
    assert.deepEqual(order.leadTime, { minDays: 2, maxDays: 42 });
  });
});

describe('looking up an order as a guest', () => {
  let repository: FakeRepository;
  let service: OrdersService;

  beforeEach(() => {
    repository = new FakeRepository();
    service = new OrdersService(repository);
  });

  it('gives one failure for a wrong reference and for a wrong phone', async () => {
    repository.lookupResult = null;

    const unknownReference = await expectAppError(() =>
      service.lookup({ reference: 'MO-0000000', phone: '08031234567' }),
    );
    const wrongPhone = await expectAppError(() =>
      service.lookup({ reference: 'MO-1234567', phone: '08000000000' }),
    );

    /* Identical, deliberately. "That reference exists, the number is wrong" is
       the one fact somebody walking the reference space is missing. */
    assert.equal(unknownReference.code, wrongPhone.code);
    assert.equal(unknownReference.message, wrongPhone.message);
  });

  it('accepts the reference the way people actually say and type it', async () => {
    repository.lookupResult = null;

    await expectAppError(() =>
      service.lookup({ reference: ' mo 12 34567 ', phone: '08031234567' }),
    );
    assert.equal(repository.lookupCalls[0]?.reference, 'MO-1234567');
  });

  it('accepts the phone in every form a Nigerian number is written', async () => {
    repository.lookupResult = null;

    await expectAppError(() =>
      service.lookup({ reference: 'MO-1234567', phone: '+2348031234567' }),
    );
    await expectAppError(() => service.lookup({ reference: 'MO-1234567', phone: '0803 123 4567' }));

    assert.equal(repository.lookupCalls[0]?.phone, '08031234567');
    assert.equal(repository.lookupCalls[1]?.phone, '08031234567');
  });
});
