'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { lookupOrderRequestSchema } from '@mims/contracts';
import { useKnownOrders } from '@/lib/orders';
import { lookupOrder, phoneLast4 } from '@/mock/orders';
import { Button, Field, Note, Panel, PanelBar, TextInput } from './ui';

/**
 * GUEST ORDER LOOKUP — the reference plus the phone it was placed with.
 *
 * There is no account, so this pair is what stands in for a password: two facts
 * the customer has written down and a stranger does not. It is used twice —
 * on `/orders`, where somebody is looking for an order, and in front of
 * `/orders/[reference]`, where somebody has a link but this device has never
 * proved the phone.
 *
 * ONE FAILURE MESSAGE, ALWAYS. The form never says which half was wrong.
 * Telling somebody holding a reference that the reference is real, and only the
 * number is off, hands them the one fact they were missing — and telling them a
 * reference does not exist lets them find the ones that do. A customer reading
 * their own confirmation has both halves in front of them and loses nothing.
 */
export function OrderLookup({
  /** Set in front of a specific order: the reference is known, the phone is not. */
  fixedReference,
  heading = 'Find an order',
}: {
  fixedReference?: string;
  heading?: string;
}) {
  const router = useRouter();
  const { remember } = useKnownOrders();

  const [reference, setReference] = useState(fixedReference ?? '');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  function submit() {
    setError(null);

    /* The same schema the API will apply, so a form that passes here cannot be
       refused there for a different reason. */
    const parsed = lookupOrderRequestSchema.safeParse({ reference, phone });
    if (!parsed.success) {
      setError(
        parsed.error.issues.find((issue) => issue.path[0] === 'phone')
          ? 'Enter the phone number the order was placed with — the same one, in any format.'
          : 'Enter the order reference, the one that starts MO.',
      );
      return;
    }

    setChecking(true);
    const order = lookupOrder(parsed.data.reference, parsed.data.phone, new Date());
    setChecking(false);

    if (order === null) {
      setError(
        'We cannot find an order with that reference and that phone number. Check both — the number has to be the one the order was placed with, not the one you are holding.',
      );
      return;
    }

    /* This device has now proved the phone, so it does not have to again. Only
       four digits are kept; see `lib/orders.tsx`. */
    remember(order.reference, phoneLast4(parsed.data.phone));
    router.push(`/orders/${order.reference}`);
  }

  return (
    <Panel weight="heavy">
      <PanelBar weight="heavy" right="No account needed">
        {heading}
      </PanelBar>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="grid gap-[13px] px-[15px] py-[15px]"
      >
        <Note tone="rule">
          Your phone number is the order. Give us the reference and the number it was placed with,
          and this device will remember it — you will not have to type it again.
        </Note>

        <div className="grid gap-[13px] sm:grid-cols-2">
          <Field label="Order reference" hint="On your confirmation. It starts MO.">
            <TextInput
              mono
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              readOnly={fixedReference !== undefined}
              placeholder="MO-0000"
              aria-invalid={Boolean(error)}
              className={fixedReference !== undefined ? 'bg-panel-2' : undefined}
            />
          </Field>

          <Field label="Phone number" hint="The one the order was placed with.">
            <TextInput
              mono
              inputMode="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              autoComplete="tel"
              placeholder="0803 123 4567"
              aria-invalid={Boolean(error)}
            />
          </Field>
        </div>

        <p aria-live="polite" className="m-0">
          {error ? (
            <span className="text-danger-ink text-[12.5px] font-bold leading-[1.45]">{error}</span>
          ) : null}
        </p>

        <Button variant="primary" size="lg" type="submit" disabled={checking}>
          {checking ? 'Checking…' : 'Open the order'}
        </Button>
      </form>
    </Panel>
  );
}
