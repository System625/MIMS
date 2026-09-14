'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { OrderStatus } from '@mims/contracts';
import { useKnownOrders } from '@/lib/orders';
import { formatNaira, formatStampDate } from '@/lib/money';
import { formatLeadTime } from '@/mock/cart';
import { CONDITION_LABEL, STOCK_LABEL } from '@/mock/listings';
import {
  daysBetween,
  maskPhone,
  normaliseReference,
  orderByReference,
  QUIET_DAYS,
  stagesFor,
  STATUS_LABEL,
  type OrderItemView,
  type OrderView,
} from '@/mock/orders';
import { vehicleTitle } from '@/mock/vehicles';
import { FitmentChip } from './fitment';
import { ListingPhotoFrame } from './listing-photo';
import { OrderLookup } from './order-lookup';
import { Button, cx, FactRows, Kicker, Note, Panel, PanelBar, Title } from './ui';

/**
 * ORDER TRACKING — build plan item 7, and the screen this business is most
 * exposed on.
 *
 * The whole model is prepaid. A Nigerian buyer has handed money to a stranger
 * for a part that is three to six weeks away, having chosen us over the cash-on-
 * delivery they would rather have had. Then the order enters customs, where
 * clearance stalls for weeks with no warning and no way to hurry it.
 *
 * To somebody in that position, a tracking page that stops emitting events is
 * indistinguishable from having been robbed. So the rules here are:
 *
 *  • THE PAGE NEVER GOES QUIET, even when the order does. Silence is narrated —
 *    how long it has been, whether that is normal at this stage, and what
 *    happens next — because "no news" rendered as an absence reads as
 *    abandonment and rendered as a sentence reads as a process.
 *  • A STALL LOOKS LIKE A STALL, NOT A FAULT. `customs` is a named status with
 *    its own explanation, not an error state and not a spinner.
 *  • NO PROMISED DATE, ANYWHERE. Lead time is a window from payment and nothing
 *    on this screen converts it into a day, because we cannot keep that promise
 *    and the customer would plan around it.
 *  • STAGES THAT CANNOT HAPPEN ARE NOT DRAWN. A radiator off the Lagos shelf
 *    gets no greyed-out CUSTOMS step to worry about.
 *  • CONFIRMATION IS A STATE OF THIS PAGE, NOT A SEPARATE ONE. The screen you
 *    land on after paying is the screen you come back to for five weeks — a
 *    thank-you page that cannot also answer "where is it" is a page nobody
 *    bookmarks and everybody phones about.
 */

/**
 * WHERE A CUSTOMER REACHES A PERSON — and today, nowhere.
 *
 * MIMS has no published support number, WhatsApp line or address. On a page
 * whose entire job is reassuring somebody who has prepaid a stranger, that is
 * the single most important thing missing, and it is a founder's call rather
 * than a build task — so it is a null here with a seam around it, not an
 * invented number. Set it and every escalation block on this screen comes
 * alive; leave it and they say plainly that there is no line yet, which is at
 * least true.
 */
const SUPPORT_CHANNEL: { label: string; href: string } | null = null;

export function OrderTrackingScreen({ reference }: { reference: string }) {
  const { knows, hydrated, remember, forget } = useKnownOrders();

  /* Fixed at mount, so every elapsed-time figure on the page is measured from
     one instant and two blocks cannot disagree about what day it is. */
  const [now] = useState(() => new Date());
  const canonical = normaliseReference(reference);
  const order = useMemo(() => orderByReference(canonical, now), [canonical, now]);

  if (!hydrated) {
    return (
      <Panel className="mt-[18px]">
        <div className="px-[15px] py-[26px]">
          <p className="text-muted m-0 font-mono text-[12.5px] leading-none">Opening the order…</p>
        </div>
      </Panel>
    );
  }

  /*
   * THE GATE, AND WHY IT IS CHECKED BEFORE THE ORDER EXISTS.
   *
   * A device that has not proved the phone for this reference gets the lookup
   * form whether or not the reference is real. Branching the other way — "no
   * such order" for a bad reference, "enter your phone" for a good one — turns
   * this page into a device for discovering which references exist, which is
   * the one thing a guest order system cannot afford to leak.
   */
  if (!knows(canonical)) {
    return (
      <div className="mt-[18px] grid gap-[14px]">
        <Note tone="rule">
          <strong className="font-bold">This order is not open on this device yet.</strong> There is
          no account to sign into — give us the phone number the order was placed with and it opens,
          and stays open on this phone.
        </Note>
        <OrderLookup fixedReference={canonical} heading={`Open order ${canonical}`} />
      </div>
    );
  }

  /* On the keyring but no longer resolvable. Only reachable once the API is
     wired and an order is genuinely removed; saying so beats a blank screen. */
  if (order === null)
    return <Unresolvable reference={canonical} onForget={() => forget(canonical)} />;

  const latest = order.events[0] ?? null;
  const stages = stagesFor(order);

  return (
    <div className="mt-[18px] grid gap-[14px]">
      <PlaceholderBanner />

      <Identity order={order} />

      {order.status === 'awaiting_payment' ? <JustPlaced order={order} /> : null}

      <Panel weight="heavy">
        <PanelBar tone="dark" weight="heavy" right={STATUS_LABEL[order.status]}>
          Where it is
        </PanelBar>
        <div className="px-[15px] py-[15px]">
          <StageRail stages={stages} />
          <WhatHappensNext order={order} now={now} />
        </div>
      </Panel>

      <Timeline order={order} now={now} />

      <WhatYouOrdered order={order} />

      <IfSomethingIsWrong order={order} latestAt={latest?.occurredAt ?? order.placedAt} now={now} />

      <ThisDevice
        reference={order.reference}
        onForget={() => forget(order.reference)}
        onKeep={() => remember(order.reference, maskPhone(order.customerPhone))}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- identity -- */

/**
 * The block a customer photographs — reference, status, total, and where it is
 * going. `PanelBar tone="dark"` is reserved in this system for exactly that.
 */
function Identity({ order }: { order: OrderView }) {
  const stale = order.status === 'delivered' || order.status === 'cancelled';

  return (
    <Panel weight="heavy">
      <PanelBar tone="dark" weight="heavy" right={`Placed ${formatStampDate(order.placedAt)}`}>
        Order {order.reference}
      </PanelBar>

      <div className="px-[15px] py-[16px]">
        <Kicker className="text-flag-deep tracking-[0.13em]">{STATUS_LABEL[order.status]}</Kicker>
        <h1 className="mt-[9px] text-[25px] font-black uppercase leading-[1.05] tracking-[-0.015em]">
          {order.items.length === 1
            ? order.items[0]!.partName
            : `${order.items.length} parts for your ${order.vehicle ? vehicleTitle(order.vehicle) : 'car'}`}
        </h1>

        {order.vehicle && order.items.length === 1 ? (
          <p className="text-ink-soft mt-[7px] text-[13px] leading-[1.5]">
            For your {vehicleTitle(order.vehicle)}
            {order.vehicle.chassisCode ? (
              <>
                {' · '}
                <span className="font-mono font-bold">{order.vehicle.chassisCode}</span>
              </>
            ) : null}
          </p>
        ) : null}

        <FactRows
          bordered
          className="mt-[13px]"
          items={[
            {
              /* Not "total paid" until it has been. This block sits directly
                 above a panel saying nothing has been charged, and an order
                 that claims to have taken money it has not taken is the exact
                 shape of the thing this customer is afraid of. */
              label: order.status === 'awaiting_payment' ? 'Total to pay' : 'Total paid',
              value: formatNaira(order.total.amount),
            },
            {
              label: order.fulfilmentMethod === 'pickup' ? 'Collect from' : 'Delivering to',
              value:
                order.pickupPoint?.name ??
                [order.deliveryAddress?.area, order.deliveryAddress?.city]
                  .filter(Boolean)
                  .join(', ') ??
                '—',
            },
            /* Four digits, because this is a view somebody may hold up to a
               counter or forward to a mechanic. The contract says the same. */
            { label: 'Placed with', value: `•••• ${maskPhone(order.customerPhone)}` },
            ...(order.leadTime && !stale
              ? [
                  {
                    label: 'Window from payment',
                    value: formatLeadTime(order.leadTime),
                  },
                ]
              : []),
          ]}
        />

        {order.pickupPoint ? (
          <Note tone="dashed" className="mt-[12px]">
            <strong className="font-bold">{order.pickupPoint.name}</strong> —{' '}
            {order.pickupPoint.line1}, {order.pickupPoint.city}
            {order.pickupPoint.openingHours ? ` · ${order.pickupPoint.openingHours}` : ''}. Bring
            this reference and the phone number above; nothing else is needed.
          </Note>
        ) : null}
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------ confirmation -- */

/**
 * The confirmation state. It says what has and has not happened in the first
 * two sentences, because somebody who has just pressed a pay button and been
 * bounced back to a page wants to know whether their money left before they
 * want anything else at all.
 */
function JustPlaced({ order }: { order: OrderView }) {
  return (
    <Panel tone="soft" weight="heavy">
      <PanelBar tone="flag" weight="heavy" right="Nothing charged">
        Your order is in
      </PanelBar>
      <div className="px-[15px] py-[15px]">
        <Title className="text-[17px]">Write the reference down: {order.reference}</Title>
        <p className="text-ink-soft mt-[9px] max-w-[62ch] text-[13px] leading-[1.55]">
          Nothing has been charged yet, and nothing is taken off the shelf until the payment clears.
          This page is the order — bookmark it, or come back to it with the reference and the phone
          number you used. There is no account to lose the password to.
        </p>
      </div>
    </Panel>
  );
}

/* -------------------------------------------------------------- stage rail -- */

function StageRail({ stages }: { stages: ReturnType<typeof stagesFor> }) {
  return (
    <ol className="bg-rule-2 border-rule-2 flex flex-wrap gap-px border">
      {stages.map((stage, index) => (
        <li
          key={stage.status}
          aria-current={stage.state === 'current' ? 'step' : undefined}
          className={cx(
            'min-w-0 flex-1 basis-[104px] p-[10px]',
            stage.state === 'current' && 'bg-flag text-flag-ink',
            stage.state === 'done' && 'bg-white',
            stage.state === 'future' && 'bg-panel-3',
          )}
        >
          <Kicker
            className={cx(
              'tracking-[0.1em]',
              stage.state === 'current' ? 'text-flag-ink' : 'text-muted-2',
            )}
          >
            {String(index + 1).padStart(2, '0')}
          </Kicker>
          <div
            className={cx(
              'mt-[5px] text-[12.5px] font-bold uppercase leading-[1.25]',
              stage.state === 'future' && 'text-muted-2',
            )}
          >
            {stage.label}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* -------------------------------------------------------- what happens next -- */

const GUIDANCE: Record<OrderStatus, { title: string; body: string }> = {
  awaiting_payment: {
    title: 'We are waiting for the payment',
    body: 'A card goes through in seconds; a bank transfer can take a few minutes to reach us. Until it does, nothing is charged and nothing is reserved.',
  },
  paid: {
    title: 'Paid — we place it with the supplier next',
    body: 'That happens on the next working day. Held stock is picked in Lagos; anything sourced abroad is ordered and then shipped, which is where the weeks in your window go.',
  },
  sourcing: {
    title: 'The supplier is putting it together',
    body: 'This is the shortest of the waiting stages and the one with the least to report. If a part turns out to be unavailable at this point you hear it from us, not from a silence.',
  },
  in_transit: {
    title: 'It is on a ship',
    body: 'Sea freight reports at the ports and nowhere in between, so expect two to three weeks with nothing new on this page. That gap is the crossing itself. We have not stopped watching it and we have not forgotten you.',
  },
  customs: {
    title: 'Clearing customs in Lagos',
    body: 'This is the step with no predictable length. Clearance can take three days or three weeks, the queue is not ours to jump, and nobody can tell you in advance which it will be. We have an agent on it and we chase it every working day. The moment it moves it appears here, the same day.',
  },
  ready_for_pickup: {
    title: 'It is on the counter with your name on it',
    body: 'Bring the order reference and the phone number it was placed with. We hold it for you — there is no collection deadline and nothing goes back to stock behind your back.',
  },
  out_for_delivery: {
    title: 'With a rider today',
    body: 'Keep both numbers switched on. Riders call rather than hunt, and a number that is off is the most common reason a delivery comes back to us.',
  },
  delivered: {
    title: 'Finished',
    body: 'This page stays exactly where it is. If you need the part number six weeks from now — for a warranty claim, a second one, or an argument with a workshop — it is listed below, as it was sold.',
  },
  cancelled: {
    title: 'This order was cancelled',
    body: 'Nothing further will happen against it. If money was taken it is refunded rather than held as credit.',
  },
  refunded: {
    title: 'This order was refunded',
    body: 'The money has gone back the way it came. Card refunds can take a few working days to show on a statement, which is the bank rather than us.',
  },
};

/**
 * THE BLOCK THAT MAKES SILENCE READABLE.
 *
 * Two things, always: what the current stage is and what ends it, and how long
 * it has been since anything happened. The second is the one that matters. A
 * customer who can see "nine days, and at this stage that is normal" is waiting.
 * A customer looking at a page that simply has not changed is being robbed. The
 * text is the entire difference and it costs nothing to write.
 */
function WhatHappensNext({ order, now }: { order: OrderView; now: Date }) {
  const guidance = GUIDANCE[order.status];
  const latest = order.events[0];
  const allowance = QUIET_DAYS[order.status];
  const quietDays = latest ? daysBetween(latest.occurredAt, now) : daysBetween(order.placedAt, now);
  const overdue = allowance !== null && quietDays > allowance;

  return (
    <div className="mt-[15px]">
      <Title className="text-[17px]">{guidance.title}</Title>
      <p className="text-ink-soft mt-[8px] max-w-[64ch] text-[13px] leading-[1.55]">
        {guidance.body}
      </p>

      {allowance === null ? null : (
        <div
          className={cx(
            'mt-[13px] flex gap-[11px] border-[1.5px] p-[13px]',
            overdue ? 'border-flag bg-flag-soft' : 'border-ink bg-white',
          )}
        >
          <span className={cx('w-[5px] flex-none', overdue ? 'bg-flag' : 'bg-ink')} aria-hidden />
          <div className="min-w-0">
            <div className="text-[13px] font-bold leading-[1.45]">
              {quietDays === 0
                ? 'Last update today.'
                : quietDays === 1
                  ? 'Last update yesterday.'
                  : `${quietDays} days since the last update.`}{' '}
              {overdue
                ? 'That is longer than we would expect, even here.'
                : 'That is normal at this stage.'}
            </div>
            <p className="text-ink-soft m-0 mt-[6px] text-[12.5px] leading-[1.5]">
              {overdue
                ? 'It does not mean anything has gone wrong, and it does mean somebody should be chasing it rather than waiting. Use the order reference above.'
                : 'Nothing is stuck and nothing needs doing from your side. This page has not stopped updating — when something happens it appears here the same day it happens.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- timeline -- */

function Timeline({ order, now }: { order: OrderView; now: Date }) {
  return (
    <Panel weight="heavy">
      <PanelBar weight="heavy" right={`${order.events.length} updates`}>
        Everything that has happened
      </PanelBar>

      <ol className="grid">
        {order.events.map((event, index) => {
          const days = daysBetween(event.occurredAt, now);
          const newest = index === 0;
          const stall = event.type === 'customs_delayed' || event.type === 'payment_failed';

          return (
            <li
              key={event.id}
              className={cx(
                'border-rule flex gap-[12px] px-[13px] py-[12px]',
                index > 0 && 'border-t-[1.5px]',
                newest ? 'bg-white' : 'bg-panel',
              )}
            >
              {/* The rail: a filled square for the newest event, hollow behind
                  it. Squares because this system has no radii anywhere. */}
              <div className="flex w-[11px] flex-none flex-col items-center pt-[4px]">
                <span
                  className={cx(
                    'h-[11px] w-[11px] flex-none border-[1.5px]',
                    stall
                      ? 'border-flag bg-flag'
                      : newest
                        ? 'border-ink bg-ink'
                        : 'border-muted-2 bg-white',
                  )}
                  aria-hidden
                />
                {index < order.events.length - 1 ? (
                  <span className="bg-rule-2 mt-[4px] w-[1.5px] flex-1" aria-hidden />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-[12px] gap-y-[4px]">
                  <span className="min-w-0 text-[13.5px] font-bold leading-[1.4]">
                    {event.summary}
                  </span>
                  <span className="text-muted flex-none font-mono text-[11px] font-bold uppercase leading-none tracking-[0.08em]">
                    {formatStampDate(event.occurredAt)}
                    {' · '}
                    {days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`}
                  </span>
                </div>
                {event.detail ? (
                  <p className="text-ink-soft m-0 mt-[6px] max-w-[62ch] text-[12.5px] leading-[1.5]">
                    {event.detail}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

/* ------------------------------------------------------------ what you got -- */

/**
 * The order as a snapshot of what we claimed — name, number, grade, price and
 * the fitment we vouched for at the time. `bella.md` §10: somebody may read a
 * part number off this weeks later and it must still say what they were shown,
 * even if the catalogue has been re-priced since. It is also where the returns
 * conversation starts, which is why the fitment grade is printed rather than
 * quietly dropped once the money is taken.
 */
function WhatYouOrdered({ order }: { order: OrderView }) {
  return (
    <Panel weight="heavy">
      <PanelBar weight="heavy" right="As it was sold to you">
        What you ordered
      </PanelBar>

      <div className="grid">
        {order.items.map((item, index) => (
          <OrderLine key={item.id} item={item} divided={index > 0} />
        ))}
      </div>

      <div className="bg-panel-2 border-ink flex flex-wrap items-center justify-between gap-x-[14px] gap-y-2 border-t-[1.5px] p-[13px]">
        <Kicker as="span" className="text-muted tracking-[0.09em]">
          {order.fulfilmentMethod === 'pickup'
            ? 'Parts, duty included · collection free'
            : 'Parts, duty included · plus delivery'}
        </Kicker>
        <span className="font-mono text-[19px] font-bold leading-[1.1]">
          {formatNaira(order.total.amount)}
        </span>
      </div>
    </Panel>
  );
}

function OrderLine({ item, divided }: { item: OrderItemView; divided: boolean }) {
  return (
    <div className={cx('flex flex-wrap gap-[14px] p-[13px]', divided && 'border-rule border-t')}>
      {item.art !== null ? (
        /* Sized as the cart sizes it, and for the same reason: below ~130px the
           "Illustrative" marker truncates and a disclosure that reads as a
           rendering glitch is not a disclosure. */
        <div className="border-rule-2 w-[110px] flex-none self-start border-[1.5px] sm:w-[140px]">
          <ListingPhotoFrame
            photo={item.photo}
            art={item.art}
            maxWidth={140}
            sizes="(max-width: 640px) 110px, 140px"
          />
        </div>
      ) : null}

      <div className="min-w-0 flex-[1_1_200px]">
        <div className="flex flex-wrap items-start justify-between gap-x-[12px] gap-y-[6px]">
          <Title className="min-w-0 text-[16px]">
            <Link href={`/parts/${item.slug}`} className="hover:underline">
              {item.partName}
            </Link>
          </Title>
          <span className="flex-none font-mono text-[15px] font-bold leading-none">
            {formatNaira(item.lineTotal.amount)}
          </span>
        </div>

        <p className="text-muted mt-[6px] font-mono text-[11.5px] font-bold uppercase leading-[1.4] tracking-[0.08em]">
          {item.quantity > 1 ? `${item.quantity} × · ` : ''}
          {CONDITION_LABEL[item.condition]} · {STOCK_LABEL[item.stockModel]}
          {item.mpn ? ` · ${item.mpn}` : ''}
        </p>

        <div className="mt-[9px] flex flex-wrap items-center gap-[9px]">
          <FitmentChip confidence={item.fitmentConfidence} />
          <span className="text-muted text-[12px] leading-[1.4]">
            what we told you when you ordered it
          </span>
        </div>

        {item.fitmentNote ? (
          <p className="text-ink-soft m-0 mt-[8px] max-w-[58ch] text-[12.5px] leading-[1.5]">
            {item.fitmentNote}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- escalation -- */

function IfSomethingIsWrong({
  order,
  latestAt,
  now,
}: {
  order: OrderView;
  latestAt: string;
  now: Date;
}) {
  const allowance = QUIET_DAYS[order.status];
  const overdue = allowance !== null && daysBetween(latestAt, now) > allowance;

  return (
    <Panel tone={overdue ? 'soft' : 'panel'}>
      <PanelBar tone={overdue ? 'flag' : 'light'}>If something is wrong</PanelBar>
      <div className="px-[15px] py-[15px]">
        <p className="text-ink-soft m-0 max-w-[64ch] text-[13px] leading-[1.55]">
          If a part arrives damaged, counterfeit, or not as we described it, that is our error and
          our cost — you are entitled to a replacement or a refund under the Federal Competition and
          Consumer Protection Act whatever any policy says, and we do not argue about it. A part
          that simply does not fit is the harder case, and what we claimed about fitment is printed
          above, unedited, for exactly that conversation.
        </p>

        {SUPPORT_CHANNEL ? (
          <Button variant="dark" size="lg" href={SUPPORT_CHANNEL.href} className="mt-[13px]">
            {SUPPORT_CHANNEL.label}
          </Button>
        ) : (
          /* See the note on SUPPORT_CHANNEL at the top of this file. An invented
             number here would be the worst possible thing to invent. */
          <Note tone="dashed" className="mt-[13px]">
            <strong className="font-bold">There is no support line published yet.</strong> On a page
            like this one that is the most important thing missing, and we would rather say so than
            print a number that rings nowhere.
          </Note>
        )}
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------- this device -- */

function ThisDevice({
  reference,
  onForget,
  onKeep,
}: {
  reference: string;
  onForget: () => void;
  onKeep: () => void;
}) {
  const [forgotten, setForgotten] = useState(false);

  if (forgotten) {
    return (
      <Note tone="dashed">
        <strong className="font-bold">{reference} is off this device.</strong> The order itself is
        untouched — open it again with the reference and the phone number.{' '}
        <button
          type="button"
          onClick={() => {
            onKeep();
            setForgotten(false);
          }}
          className="font-bold underline"
        >
          Put it back
        </button>
      </Note>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-[14px] gap-y-[9px]">
      <p className="text-muted m-0 min-w-0 flex-[1_1_240px] text-[12px] leading-[1.45]">
        This phone remembers {reference} so you do not have to type it again. Only the reference and
        the last four digits of your number are kept, here on the device.
      </p>
      <Button
        variant="quiet"
        size="sm"
        onClick={() => {
          onForget();
          setForgotten(true);
        }}
      >
        Forget it on this device
      </Button>
    </div>
  );
}

/* ---------------------------------------------------------------- fallback -- */

function Unresolvable({ reference, onForget }: { reference: string; onForget: () => void }) {
  return (
    <Panel weight="heavy" className="mt-[18px]">
      <PanelBar weight="heavy">We cannot open {reference}</PanelBar>
      <div className="px-[15px] py-[18px]">
        <p className="text-ink-soft m-0 text-[13px] leading-[1.55]">
          This phone has {reference} on its list, but we cannot find the order behind it any more.
          That should not happen. Nothing about the order has changed because of it.
        </p>
        <div className="mt-[16px] flex flex-wrap gap-[10px]">
          <Button variant="primary" size="lg" href="/orders">
            Back to your orders
          </Button>
          <Button variant="outline" size="lg" onClick={onForget}>
            Take it off this device
          </Button>
        </div>
      </div>
    </Panel>
  );
}

/**
 * These orders are placeholders, and the page says so in the same breath as it
 * shows them — the reasoning `mock/pickup.ts` applies to its invented counters.
 * A tracking page is a thing people believe; one built on stand-in data has to
 * be unmistakable about being one.
 */
function PlaceholderBanner() {
  return (
    <Note tone="dashed">
      <strong className="font-bold">This is a placeholder order.</strong> Orders do not reach our
      database yet — the screen is real, the journey below is a stand-in, and the parts and prices
      on it are read from the same placeholder catalogue the rest of the store runs on.
    </Note>
  );
}
