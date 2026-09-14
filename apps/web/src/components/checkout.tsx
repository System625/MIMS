'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  addressInputSchema,
  checkoutRequestSchema,
  NIGERIAN_STATES,
  nigerianPhoneSchema,
  type FulfilmentMethod,
} from '@mims/contracts';
import { useCart } from '@/lib/cart';
import { useEstimateFlow } from '@/lib/estimate-flow';
import { formatNaira } from '@/lib/money';
import { formatLeadTime, formatLeadTimeCeiling, resolveCart, type CartView } from '@/mock/cart';
import { CONDITION_LABEL } from '@/mock/listings';
import { PICKUP_POINTS } from '@/mock/pickup';
import {
  Button,
  Field,
  Kicker,
  Note,
  Panel,
  PanelBar,
  Segmented,
  TextArea,
  TextInput,
  Title,
  cx,
} from './ui';

/**
 * CHECKOUT — build plan item 6.
 *
 * The whole business is prepaid. Nigerian buyers prefer cash on delivery,
 * specifically out of fear of being cheated, and COD cannot survive a four-week
 * import lead time — so the customer is being asked to hand money to a stranger
 * and wait. Every decision on this screen follows from that:
 *
 *  • NO ACCOUNT. Phone is the identity. A password wall in front of a purchase
 *    is a trust cost we cannot afford to add to the one we already have.
 *  • PICKUP IS LISTED FIRST and is a peer of delivery, not the budget option.
 *    Collecting from a counter, from a person, is the closest thing to a safety
 *    net this business can offer someone who is afraid of being robbed.
 *  • NOTHING APPEARS FOR THE FIRST TIME ON THE LAST STEP. Every figure here was
 *    already on the cart, and the one figure we cannot give — delivery — is
 *    named as missing rather than shown as a plausible guess.
 *  • UNCONFIRMED FITMENT IS ACKNOWLEDGED IN WRITING, not buried. Half of all
 *    auto-parts returns are fitment errors and a return costs more than the
 *    part, so a line we cannot vouch for gets a checkbox, not a shrug.
 */
export function CheckoutScreen() {
  const { lines, hydrated: cartHydrated } = useCart();
  const { vehicle, hydrated: vehicleHydrated } = useEstimateFlow();

  const hydrated = cartHydrated && vehicleHydrated;
  const cart = resolveCart(hydrated ? lines : [], hydrated ? vehicle : null);

  const [method, setMethod] = useState<FulfilmentMethod>('pickup');
  const [pickupPointId, setPickupPointId] = useState(PICKUP_POINTS[0]?.id ?? '');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [acceptsFitmentRisk, setAcceptsFitmentRisk] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (name: string) => (value: string) =>
    setFields((prev) => ({ ...prev, [name]: value }));

  /* Validated with the real contract schemas, not a second set of rules written
     for the browser. The API will apply exactly these when item 10 wires it. */
  const errors = useMemo(
    () => (submitted ? validate(fields, method, cart, acceptsFitmentRisk) : {}),
    [submitted, fields, method, cart, acceptsFitmentRisk],
  );

  if (!hydrated) {
    return (
      <Panel className="mt-[18px]">
        <div className="px-[15px] py-[26px]">
          <p className="text-muted m-0 font-mono text-[12.5px] leading-none">
            Checking your basket…
          </p>
        </div>
      </Panel>
    );
  }

  if (!cart.hasBuyableLines) return <NothingToPayFor hasLines={cart.items.length > 0} />;

  const unconfirmed = cart.items.filter(
    (item) =>
      item.availability === 'available' &&
      (item.fitmentNow === null || item.fitmentNow.confidence !== 'confirmed'),
  );

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
      className="mt-[18px] grid gap-[18px] lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start"
    >
      <div className="grid gap-[14px]">
        <WhoPanel fields={fields} set={set} errors={errors} />

        <Panel weight="heavy">
          <PanelBar weight="heavy" right="Neither is the default">
            How you get it
          </PanelBar>
          <div className="px-[15px] py-[15px]">
            <Segmented
              label="Delivery or pickup"
              value={method}
              onChange={setMethod}
              options={[
                { value: 'pickup', label: 'Collect it' },
                { value: 'delivery', label: 'Deliver it' },
              ]}
            />

            {method === 'pickup' ? (
              <PickupChoice value={pickupPointId} onChange={setPickupPointId} />
            ) : (
              <DeliveryAddress fields={fields} set={set} errors={errors} />
            )}
          </div>
        </Panel>

        {unconfirmed.length > 0 ? (
          <FitmentRisk
            count={unconfirmed.length}
            names={unconfirmed.map((item) => item.partName)}
            hasVehicle={vehicle !== null}
            accepted={acceptsFitmentRisk}
            onChange={setAcceptsFitmentRisk}
            error={errors.acceptsFitmentRisk}
          />
        ) : null}

        <Panel>
          <PanelBar>Anything we should know</PanelBar>
          <div className="p-[13px]">
            <Field hint="Optional. A gate code, a better time to call, the colour you are matching — it reaches the person who packs the order.">
              <TextArea
                value={fields.customerNote ?? ''}
                onChange={(event) => set('customerNote')(event.target.value)}
                maxLength={500}
                placeholder="Leave it with the security man if I am not in…"
              />
            </Field>
          </div>
        </Panel>
      </div>

      <OrderSummary
        cart={cart}
        method={method}
        submitted={submitted}
        errorCount={Object.keys(errors).length}
      />
    </form>
  );
}

/* --------------------------------------------------------------- who --- */

function WhoPanel({
  fields,
  set,
  errors,
}: {
  fields: Record<string, string>;
  set: (name: string) => (value: string) => void;
  errors: Record<string, string>;
}) {
  return (
    <Panel weight="heavy">
      <PanelBar weight="heavy" right="No account needed">
        Who it is for
      </PanelBar>
      <div className="grid gap-[13px] px-[15px] py-[15px]">
        <Note tone="rule">
          There is no sign-up here and no password. Your phone number is how we find your order
          again — it is the one thing you will be asked for if you call us, so give the number you
          actually answer.
        </Note>

        <div className="grid gap-[13px] sm:grid-cols-2">
          <Field label="Your name">
            <TextInput
              value={fields.customerName ?? ''}
              onChange={(event) => set('customerName')(event.target.value)}
              autoComplete="name"
              aria-invalid={Boolean(errors.customerName)}
            />
            <FieldError message={errors.customerName} />
          </Field>

          <Field label="Phone number">
            <TextInput
              mono
              inputMode="tel"
              value={fields.customerPhone ?? ''}
              onChange={(event) => set('customerPhone')(event.target.value)}
              autoComplete="tel"
              placeholder="0803 123 4567"
              aria-invalid={Boolean(errors.customerPhone)}
            />
            <FieldError message={errors.customerPhone} />
          </Field>
        </div>

        <Field
          label="Email (optional)"
          hint="Only for the receipt. Leave it blank and everything comes by phone instead — we will not email you anything else either way."
        >
          <TextInput
            type="email"
            value={fields.customerEmail ?? ''}
            onChange={(event) => set('customerEmail')(event.target.value)}
            autoComplete="email"
            aria-invalid={Boolean(errors.customerEmail)}
          />
          <FieldError message={errors.customerEmail} />
        </Field>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------ pickup --- */

function PickupChoice({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="mt-[15px] grid gap-[10px]">
      {PICKUP_POINTS.map((point) => {
        const selected = point.id === value;
        return (
          <label
            key={point.id}
            className={cx(
              'flex cursor-pointer gap-[11px] border-[1.5px] p-[13px]',
              selected ? 'border-ink bg-flag-soft' : 'border-rule-2 bg-white',
            )}
          >
            <input
              type="radio"
              name="pickupPoint"
              value={point.id}
              checked={selected}
              onChange={() => onChange(point.id)}
              className="accent-flag mt-[3px] h-[18px] w-[18px] flex-none"
            />
            <span className="min-w-0">
              <span className="block text-[14px] font-bold leading-[1.3]">{point.name}</span>
              <span className="text-ink-soft mt-[4px] block text-[12.5px] leading-[1.45]">
                {point.line1}, {point.city}
              </span>
              {point.openingHours ? (
                <span className="text-muted mt-[4px] block font-mono text-[11.5px] leading-none">
                  {point.openingHours}
                </span>
              ) : null}
            </span>
          </label>
        );
      })}

      {/*
       * The seed's own note, carried onto the screen rather than left in the
       * database: these addresses are placeholders on purpose. An invented
       * street that resolves to a real place is worse than an obvious
       * placeholder, because somebody would drive there.
       */}
      <Note tone="dashed">
        <strong className="font-bold">These counters are placeholders.</strong> The real collection
        addresses are not published yet, and we would rather show you an obvious stand-in than an
        invented street you could drive to.
      </Note>
    </div>
  );
}

/* ----------------------------------------------------------- delivery --- */

function DeliveryAddress({
  fields,
  set,
  errors,
}: {
  fields: Record<string, string>;
  set: (name: string) => (value: string) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="mt-[15px] grid gap-[13px]">
      <div className="grid gap-[13px] sm:grid-cols-2">
        <Field label="Who receives it">
          <TextInput
            value={fields.recipientName ?? ''}
            onChange={(event) => set('recipientName')(event.target.value)}
            autoComplete="name"
            aria-invalid={Boolean(errors.recipientName)}
          />
          <FieldError message={errors.recipientName} />
        </Field>
        <Field
          label="Second number (optional)"
          hint="Riders call. The first number is often off or out of credit."
        >
          <TextInput
            mono
            inputMode="tel"
            value={fields.altPhone ?? ''}
            onChange={(event) => set('altPhone')(event.target.value)}
            aria-invalid={Boolean(errors.altPhone)}
          />
          <FieldError message={errors.altPhone} />
        </Field>
      </div>

      <Field label="Street and number">
        <TextInput
          value={fields.line1 ?? ''}
          onChange={(event) => set('line1')(event.target.value)}
          autoComplete="address-line1"
          aria-invalid={Boolean(errors.line1)}
        />
        <FieldError message={errors.line1} />
      </Field>

      {/*
       * THE FIELD THAT ACTUALLY FINDS THE HOUSE, and the reason there is no
       * postcode box anywhere on this form. The national postcode system exists
       * and effectively nobody uses it; asking for a number the customer does
       * not know, to print on a label no rider reads, costs a sale and buys
       * nothing. A landmark is what gets said on the phone.
       */}
      <Field
        label="Landmark"
        hint="How a rider finds you. “Opposite the second gate, after the mosque” beats any address line."
      >
        <TextInput
          value={fields.landmark ?? ''}
          onChange={(event) => set('landmark')(event.target.value)}
        />
      </Field>

      <div className="grid gap-[13px] sm:grid-cols-3">
        <Field label="Area (optional)">
          <TextInput
            value={fields.area ?? ''}
            onChange={(event) => set('area')(event.target.value)}
          />
        </Field>
        <Field label="City or town">
          <TextInput
            value={fields.city ?? ''}
            onChange={(event) => set('city')(event.target.value)}
            autoComplete="address-level2"
            aria-invalid={Boolean(errors.city)}
          />
          <FieldError message={errors.city} />
        </Field>
        <Field label="State">
          <select
            value={fields.state ?? ''}
            onChange={(event) => set('state')(event.target.value)}
            aria-invalid={Boolean(errors.state)}
            className="border-ink text-ink h-[48px] w-full min-w-0 border-2 bg-white px-[10px] text-[14px]"
          >
            <option value="">Choose a state</option>
            {NIGERIAN_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          <FieldError message={errors.state} />
        </Field>
      </div>
    </div>
  );
}

/* ------------------------------------------------------- fitment risk --- */

function FitmentRisk({
  count,
  names,
  hasVehicle,
  accepted,
  onChange,
  error,
}: {
  count: number;
  names: readonly string[];
  hasVehicle: boolean;
  accepted: boolean;
  onChange: (next: boolean) => void;
  error?: string;
}) {
  return (
    <Panel tone="soft" weight="heavy">
      <PanelBar tone="flag" weight="heavy" right={`${count} ${count === 1 ? 'line' : 'lines'}`}>
        Before you pay
      </PanelBar>
      <div className="px-[15px] py-[15px]">
        {/*
         * "No car set" and "no record for your car" are different answers and
         * get different sentences. Telling somebody we could not confirm a part
         * "for your car" when they never told us what they drive would blame
         * the catalogue for a question we never asked.
         */}
        <Title className="text-[17px]">
          {hasVehicle
            ? 'We cannot vouch for everything in this basket'
            : 'We do not know what you drive'}
        </Title>
        <p className="text-ink-soft mt-[8px] text-[13px] leading-[1.55]">
          {hasVehicle ? (
            'These are the parts we have no confirmed fitment record for on your car:'
          ) : (
            <>
              You have not set your car, so we have not checked any of these against it. Set it in
              the band at the top of this page and most of this probably goes away:
            </>
          )}
        </p>
        <ul className="mt-[9px] grid gap-[5px]">
          {names.map((name) => (
            <li key={name} className="flex gap-[9px]">
              <span className="bg-flag mt-[6px] h-[9px] w-[9px] flex-none" aria-hidden />
              <span className="min-w-0 text-[13px] font-bold leading-[1.45]">{name}</span>
            </li>
          ))}
        </ul>
        <p className="text-ink-soft mt-[11px] text-[13px] leading-[1.55]">
          They may well be right. We just have not checked them against your chassis, and if one
          does not fit, the wait starts again — a part sourced from abroad takes three to six weeks
          each way. If we described a part wrongly that is our error and our cost, always. This is
          about the parts where we told you plainly that we did not know.
        </p>

        <label className="border-ink mt-[13px] flex cursor-pointer gap-[11px] border-[1.5px] bg-white p-[13px]">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => onChange(event.target.checked)}
            aria-invalid={Boolean(error)}
            className="accent-flag mt-[2px] h-[20px] w-[20px] flex-none"
          />
          <span className="min-w-0 text-[13px] leading-[1.5]">
            {hasVehicle
              ? 'I have read the fitment notes on these lines and I am choosing to order them anyway.'
              : 'I understand these have not been checked against my car, and I am ordering them anyway.'}
          </span>
        </label>
        <FieldError message={error} />
      </div>
    </Panel>
  );
}

/* --------------------------------------------------------- the total --- */

function OrderSummary({
  cart,
  method,
  submitted,
  errorCount,
}: {
  cart: CartView;
  method: FulfilmentMethod;
  submitted: boolean;
  errorCount: number;
}) {
  const buyable = cart.items.filter((item) => item.availability === 'available');

  return (
    <div className="grid gap-[14px] lg:sticky lg:top-[14px]">
      <Panel weight="heavy">
        <PanelBar tone="dark" weight="heavy" right="NGN">
          What you are paying
        </PanelBar>

        <div className="border-rule-2 bg-rule-2 grid gap-px border-b-[1.5px]">
          {buyable.map((item) => (
            <div
              key={item.id}
              className="flex justify-between gap-[10px] bg-white px-[13px] py-[9px]"
            >
              <span className="text-ink-soft min-w-0 text-[12.5px] leading-[1.4]">
                {item.quantity > 1 ? `${item.quantity} × ` : ''}
                {item.partName}
                <span className="text-muted"> · {CONDITION_LABEL[item.condition]}</span>
              </span>
              <span className="flex-none font-mono text-[12.5px] font-bold leading-none">
                {formatNaira(item.lineTotal.amount)}
              </span>
            </div>
          ))}
        </div>

        <div className="px-[15px] py-[14px]">
          <dl className="grid gap-[8px]">
            <SummaryRow term="Parts, duty included" value={formatNaira(cart.itemsSubtotal)} />
            <SummaryRow
              term={method === 'pickup' ? 'Collection' : 'Delivery'}
              value={method === 'pickup' ? 'Free' : 'Quoted'}
            />
          </dl>

          {method === 'pickup' ? (
            <div className="border-ink mt-[12px] border-t-2 pt-[12px]">
              <Kicker as="div" className="text-muted tracking-[0.1em]">
                Total
              </Kicker>
              <div className="mt-[6px] font-mono text-[27px] font-black leading-none">
                {formatNaira(cart.itemsSubtotal)}
              </div>
            </div>
          ) : (
            /*
             * bella.md §3 records the logistics partner as NOT CHOSEN. A
             * delivery fee is therefore not derivable from anything we hold, and
             * inventing a plausible ₦3,500 would be the first thing we were
             * caught being wrong about. So the delivery total is named as
             * incomplete instead of guessed — and the promise that nothing
             * appears for the first time on the last step is kept by saying so
             * here, before any money moves.
             */
            <Note tone="rule" className="mt-[12px]">
              <strong className="font-bold">We cannot total a delivery order yet.</strong> We have
              not signed a courier, so there is no rate to quote you from. Place the order and we
              call you with the delivery figure before anything is charged — or choose collection
              above, which costs nothing and totals exactly.
            </Note>
          )}

          {cart.leadTime ? (
            <p className="text-ink-soft mt-[12px] text-[12.5px] leading-[1.5]">
              {cart.hasMixedLeadTimes
                ? 'Your basket mixes shelf stock with parts we source, so it ships when the slower one lands — up to '
                : 'Arrives in '}
              <strong className="font-bold">
                {cart.hasMixedLeadTimes
                  ? formatLeadTimeCeiling(cart.leadTime)
                  : formatLeadTime(cart.leadTime)}
              </strong>{' '}
              from payment. Customs stalls without warning; we will tell you when it does rather
              than go quiet.
            </p>
          ) : null}
        </div>
      </Panel>

      <PayPanel submitted={submitted} errorCount={errorCount} method={method} />

      <Note tone="dashed">
        Your card details never touch this site. Paystack takes the payment — card, bank transfer,
        USSD or a bank account — and tells us only that it worked.
      </Note>

      <p className="text-muted m-0 text-center text-[12px] leading-[1.45]">
        <Link href="/cart" className="underline">
          Back to the basket
        </Link>
      </p>
    </div>
  );
}

function SummaryRow({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-[13px] leading-[1.4]">
      <dt className="text-muted min-w-0">{term}</dt>
      <dd className="m-0 flex-none font-mono text-[13px] font-bold leading-none">{value}</dd>
    </div>
  );
}

/**
 * THE PAY BUTTON, and the one thing on this screen that is not finished.
 *
 * The payment side is real and running: `apps/api/src/modules/payments` speaks to
 * Paystack, verifies server-side, and takes signed webhooks. What it has nothing
 * to attach a payment TO is an order, because orders reach Postgres in build plan
 * item 10.
 *
 * So the button validates everything, and then says exactly that. It does not
 * spin, it does not pretend, and it does not take a card number into a form that
 * goes nowhere — which on a store whose entire argument is "we tell you the
 * truth about what we know" would be the worst possible place to start lying.
 */
function PayPanel({
  submitted,
  errorCount,
  method,
}: {
  submitted: boolean;
  errorCount: number;
  method: FulfilmentMethod;
}) {
  const ready = submitted && errorCount === 0;

  return (
    <Panel weight="heavy" tone={ready ? 'soft' : 'panel'}>
      <div className="px-[15px] py-[15px]">
        <Button variant="primary" size="lg" full type="submit">
          {method === 'pickup' ? 'Pay and reserve for collection' : 'Place order'}
        </Button>

        <p aria-live="polite" className="text-ink-soft m-0 mt-[11px] text-[12.5px] leading-[1.5]">
          {!submitted ? (
            <>
              Nothing is charged when you press this. You will see the Paystack page, and you can
              still walk away from it.
            </>
          ) : errorCount > 0 ? (
            <strong className="text-danger-ink font-bold">
              {errorCount === 1
                ? 'One thing above still needs filling in.'
                : `${errorCount} things above still need filling in.`}
            </strong>
          ) : (
            <>
              <strong className="font-bold">Your details are good.</strong> Payment itself is not
              open yet — the Paystack connection is built and tested, but orders do not reach our
              database until the next piece of this store lands. Nothing has been charged and
              nothing has been sent.
            </>
          )}
        </p>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------- empties --- */

function NothingToPayFor({ hasLines }: { hasLines: boolean }) {
  return (
    <Panel weight="heavy" className="mt-[18px]">
      <PanelBar weight="heavy" right="Nothing charged">
        There is nothing to pay for
      </PanelBar>
      <div className="px-[15px] py-[18px]">
        <p className="text-ink-soft m-0 text-[13px] leading-[1.55]">
          {hasLines
            ? 'Everything in your basket is either withdrawn or out of stock, so there is no order to place. The lines are still in your cart — nothing was deleted.'
            : 'Your basket is empty. Nothing was lost; it is saved on this device and there is simply nothing in it.'}
        </p>
        <div className="mt-[16px] flex flex-wrap gap-[10px]">
          <Button variant="primary" size="lg" href="/parts">
            Browse the catalogue
          </Button>
          <Button variant="outline" size="lg" href="/cart">
            Back to the basket
          </Button>
        </div>
      </div>
    </Panel>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-danger-ink m-0 mt-[6px] text-[12px] font-bold leading-[1.4]">{message}</p>
  );
}

/* ------------------------------------------------------------ validate --- */

/**
 * One validation pass, built out of the contract schemas rather than a second
 * set of rules written for the browser. When item 10 posts this to
 * `POST /api/v1/orders`, the server applies the same `checkoutRequestSchema` —
 * so a form that passes here cannot be rejected there for a different reason.
 */
function validate(
  fields: Record<string, string>,
  method: FulfilmentMethod,
  cart: CartView,
  acceptsFitmentRisk: boolean,
): Record<string, string> {
  const errors: Record<string, string> = {};

  const name = (fields.customerName ?? '').trim();
  if (name.length < 2) errors.customerName = 'Tell us your name.';

  const phone = nigerianPhoneSchema.safeParse(fields.customerPhone ?? '');
  if (!phone.success) {
    errors.customerPhone = phone.error.issues[0]?.message ?? 'Enter a Nigerian mobile number.';
  }

  const email = (fields.customerEmail ?? '').trim();
  if (
    email.length > 0 &&
    !checkoutRequestSchema.options[0].shape.customerEmail.safeParse(email).success
  ) {
    errors.customerEmail = 'That does not look like an email address.';
  }

  if (method === 'delivery') {
    const address = addressInputSchema.safeParse({
      recipientName: fields.recipientName ?? '',
      phone: fields.customerPhone ?? '',
      altPhone: (fields.altPhone ?? '').trim() || undefined,
      line1: fields.line1 ?? '',
      landmark: (fields.landmark ?? '').trim() || undefined,
      area: (fields.area ?? '').trim() || undefined,
      city: fields.city ?? '',
      state: fields.state ?? '',
    });

    if (!address.success) {
      for (const issue of address.error.issues) {
        const key = String(issue.path[0] ?? '');
        /* The address carries its own phone, but the form only asks once — so a
           complaint about `phone` belongs on the field the customer can see. */
        if (key === 'phone') continue;
        if (key === 'state' && !fields.state) {
          errors.state = 'Choose a state.';
          continue;
        }
        errors[key] ??= issue.message;
      }
    }
  }

  const unconfirmed = cart.items.some(
    (item) =>
      item.availability === 'available' &&
      (item.fitmentNow === null || item.fitmentNow.confidence !== 'confirmed'),
  );
  if (unconfirmed && !acceptsFitmentRisk) {
    errors.acceptsFitmentRisk = 'Tick the box above to order the lines we cannot confirm.';
  }

  return errors;
}
