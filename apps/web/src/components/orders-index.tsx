'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useKnownOrders } from '@/lib/orders';
import { formatNaira, formatStampDate } from '@/lib/money';
import {
  orderByReference,
  PLACEHOLDER_PHONE,
  PLACEHOLDER_REFERENCES,
  STATUS_LABEL,
} from '@/mock/orders';
import { OrderLookup } from './order-lookup';
import { Button, cx, Kicker, Note, Panel, PanelBar, Title } from './ui';

/**
 * "MY ORDERS" WITHOUT AN ACCOUNT — build plan item 7.
 *
 * The store has no sign-in in front of a purchase, so this page is built from
 * the two things a guest actually has: a reference they were given, and the
 * phone they gave us. The device keeps a keyring of the ones it has been shown
 * (`lib/orders.tsx`) and the lookup form opens any other, including on a phone
 * that has never been here.
 *
 * The empty state is therefore not an apology. A customer with no orders on
 * THIS device may well have orders — they bought on a laptop, or cleared their
 * browser, or this is their partner's phone — and the page's job is to say that
 * plainly and put the lookup in front of them, rather than to declare their
 * history empty and leave them wondering what we lost.
 */
export function OrdersIndexScreen() {
  const { orders, hydrated } = useKnownOrders();
  const [now] = useState(() => new Date());

  const rows = useMemo(
    () => orders.map((known) => ({ known, order: orderByReference(known.reference, now) })),
    [orders, now],
  );

  if (!hydrated) {
    return (
      <Panel className="mt-[18px]">
        <div className="px-[15px] py-[26px]">
          <p className="text-muted m-0 font-mono text-[12.5px] leading-none">
            Checking this device…
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <div className="mt-[18px] grid gap-[18px] lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <div className="grid gap-[14px]">
        {rows.length === 0 ? (
          <NothingOnThisDevice />
        ) : (
          <Panel weight="heavy">
            <PanelBar weight="heavy" right={`${rows.length} on this device`}>
              Your orders
            </PanelBar>
            <div className="grid">
              {rows.map(({ known, order }, index) => (
                <OrderRow
                  key={known.reference}
                  reference={known.reference}
                  phoneLast4={known.phoneLast4}
                  order={order}
                  divided={index > 0}
                />
              ))}
            </div>
          </Panel>
        )}

        <PlaceholderOrders />
      </div>

      <div className="grid gap-[14px] lg:sticky lg:top-[14px]">
        <OrderLookup heading="Find another order" />

        <Note tone="dashed">
          Orders are kept whether or not you ever sign in. Nothing on this page is an account — it
          is this phone remembering references you have already opened, and you can take any of them
          off from inside the order.
        </Note>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- row -- */

function OrderRow({
  reference,
  phoneLast4,
  order,
  divided,
}: {
  reference: string;
  phoneLast4: string;
  order: ReturnType<typeof orderByReference>;
  divided: boolean;
}) {
  const open = order !== null && order.status !== 'delivered' && order.status !== 'cancelled';

  return (
    <Link
      href={`/orders/${reference}`}
      className={cx(
        'block px-[13px] py-[13px] hover:brightness-[0.98]',
        divided && 'border-rule border-t-[1.5px]',
        open ? 'bg-white' : 'bg-panel',
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-[12px] gap-y-[5px]">
        <span className="font-mono text-[15px] font-bold leading-none tracking-[0.04em]">
          {reference}
        </span>
        <span
          className={cx(
            'flex-none font-mono text-[11px] font-bold uppercase leading-none tracking-[0.1em]',
            open ? 'text-flag-deep' : 'text-muted',
          )}
        >
          {order ? STATUS_LABEL[order.status] : 'Cannot be opened'}
        </span>
      </div>

      {order ? (
        <>
          <div className="mt-[8px] text-[13.5px] font-bold leading-[1.4]">
            {order.items.map((item) => item.partName).join(' · ')}
          </div>
          <div className="text-muted mt-[6px] font-mono text-[11px] font-bold uppercase leading-none tracking-[0.08em]">
            {formatStampDate(order.placedAt)} · {formatNaira(order.total.amount)} · ••••{' '}
            {phoneLast4}
          </div>
        </>
      ) : (
        <div className="text-muted mt-[8px] text-[12.5px] leading-[1.45]">
          On this device's list, but we cannot find the order behind it.
        </div>
      )}
    </Link>
  );
}

/* ------------------------------------------------------------------ empty -- */

function NothingOnThisDevice() {
  return (
    <Panel weight="heavy">
      <PanelBar weight="heavy">No orders open on this phone</PanelBar>
      <div className="px-[15px] py-[18px]">
        <p className="text-ink-soft m-0 max-w-[60ch] text-[13px] leading-[1.55]">
          That does not mean you have no orders. There is no account here, so this list is only what
          this particular device has been shown — an order placed on a laptop, or before the browser
          was cleared, is still perfectly findable. Use the reference and the phone number you
          ordered with.
        </p>
        <div className="mt-[16px] flex flex-wrap gap-[10px]">
          <Button variant="outline" size="lg" href="/parts">
            Browse the catalogue
          </Button>
          <Button variant="quiet" size="lg" href="/cart">
            Your basket
          </Button>
        </div>
      </div>
    </Panel>
  );
}

/* ----------------------------------------------------------- placeholders -- */

/**
 * The placeholder orders, listed openly with the number that opens them.
 *
 * This block is the frontend walkthrough in `bella.md` §9 rendered on the page
 * rather than only written down: item 7's whole subject is states — a stall, a
 * quiet crossing, a counter waiting — and none of them can be reviewed if there
 * is no way to reach them. It goes the day orders are real.
 */
function PlaceholderOrders() {
  return (
    <Panel tone="dim">
      <PanelBar right="Not real orders">Placeholder orders</PanelBar>
      <div className="px-[15px] py-[15px]">
        <Title className="text-[16px]">Five states, so each one can be looked at</Title>
        <p className="text-ink-soft mt-[8px] max-w-[62ch] text-[13px] leading-[1.55]">
          Orders do not reach our database yet. These five exist so the tracking screen can be
          reviewed in every state it has to survive — including the one that matters, an order
          stalled in customs for long enough that a page which simply stopped updating would look
          like a robbery. Open any of them with the phone number{' '}
          <strong className="font-mono font-bold">{PLACEHOLDER_PHONE}</strong>.
        </p>

        <div className="bg-rule-2 border-rule-2 mt-[13px] flex flex-wrap gap-px border">
          {PLACEHOLDER_REFERENCES.map((reference) => (
            <div key={reference} className="min-w-0 flex-1 basis-[132px] bg-white p-[11px]">
              <Kicker className="text-muted-2 tracking-[0.1em]">{reference}</Kicker>
              <Link
                href={`/orders/${reference}`}
                className="mt-[5px] block text-[12.5px] font-bold leading-[1.3] underline"
              >
                Open it
              </Link>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
