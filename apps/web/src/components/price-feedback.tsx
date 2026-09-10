'use client';

import { useState } from 'react';
import { formatRangeCompact } from '@/lib/money';
import type { EstimateView } from '@/mock/parts';
import { Button, cx, Kicker, Panel, Segmented, StatCells, TextArea, TextInput, Title } from './ui';

/**
 * "Was the price right?" — asked once, ten days after an estimate.
 *
 * This is what makes the catalogue accurate rather than merely large. A real
 * receipt beats any number of trader quotes, so the form is four taps if nothing
 * was bought, and only asks for an amount and a source when the answer was
 * "paid less" or "paid more" — the two answers that actually carry information.
 */

type Answer = 'about' | 'less' | 'more' | 'no';
type Source = 'dealer' | 'market';

const OPTIONS: ReadonlyArray<{ value: Answer; label: string }> = [
  { value: 'about', label: 'About right' },
  { value: 'less', label: 'Paid less' },
  { value: 'more', label: 'Paid more' },
  { value: 'no', label: "Didn't buy it" },
];

export function PriceFeedback({ estimate }: { estimate: EstimateView }) {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [sources, setSources] = useState<Record<string, Source>>({});
  const [sent, setSent] = useState(false);

  // Only priced rows can be corrected — there is nothing to be wrong about on a
  // part we never put a figure against.
  const parts = estimate.items.filter((item) => item.isPriced);
  const corrections = Object.values(answers).filter((value) => value !== 'no').length;

  if (sent) {
    return (
      <Panel weight="heavy" className="mt-[18px] px-[18px] py-[22px]">
        <span className="bg-flag border-ink text-flag-ink inline-flex border-[1.5px] px-[10px] py-[5px] font-mono text-[11px] font-bold uppercase leading-[1.3] tracking-[0.11em]">
          Received
        </span>
        <Title className="mt-[12px] text-[22px]">That&rsquo;s genuinely useful</Title>
        <p className="text-ink-soft mt-[10px] max-w-[58ch] text-[13.5px] leading-[1.6]">
          Your figures go into the next weekly refresh. If they shift a range by more than 15%, we
          re-check with our own sources before it changes what other people see.
        </p>

        <StatCells
          className="mt-[16px]"
          items={[
            { label: 'You reported', value: `${corrections} PRICES`, basis: '150px' },
            { label: 'Lifetime', value: `${corrections + 2} PRICES`, basis: '150px' },
            { label: 'Next refresh', value: 'MON 14 SEP', basis: '150px' },
          ]}
        />

        <Button variant="outline" size="md" className="mt-[16px]" onClick={() => setSent(false)}>
          Back to the form
        </Button>
      </Panel>
    );
  }

  return (
    <div className="mt-[18px] grid gap-[14px]">
      {parts.map((part) => {
        const answer = answers[part.id];
        const needsAmount = answer === 'less' || answer === 'more';
        const source = sources[part.id];

        return (
          <Panel key={part.id} className="p-[14px]">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
              <div className="min-w-0 flex-[1_1_220px]">
                <div className="text-[15px] font-bold uppercase leading-[1.2]">{part.partName}</div>
                <Kicker as="div" className="text-muted mt-[5px] leading-[1.4] tracking-[0.05em]">
                  {part.mpn ?? 'No part number on file'}
                </Kicker>
              </div>
              <div className="flex-none">
                <Kicker className="text-muted tracking-[0.1em]">We estimated</Kicker>
                <div className="mt-[5px] font-mono text-[15px] font-bold leading-[1.2]">
                  {part.price ? formatRangeCompact(part.price) : '—'}
                </div>
              </div>
            </div>

            <div
              role="group"
              aria-label={`What you paid for ${part.partName}`}
              className="mt-[13px] flex flex-wrap gap-2"
            >
              {OPTIONS.map((option) => {
                const active = answer === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setAnswers((current) => ({ ...current, [part.id]: option.value }))
                    }
                    className={cx(
                      'border-ink flex min-h-[48px] flex-[1_1_150px] items-center justify-center border-[1.5px] px-[10px]',
                      'text-center text-[12px] font-bold uppercase leading-[1.2] tracking-[0.03em]',
                      active ? 'bg-flag text-flag-ink' : 'text-ink bg-white',
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            {needsAmount ? (
              <div className="mt-[12px] flex flex-wrap items-end gap-[9px]">
                <div className="min-w-0 flex-[1_1_180px]">
                  <Kicker className="text-muted tracking-[0.1em]">What you paid</Kicker>
                  <TextInput
                    mono
                    weight="light"
                    className="mt-[7px]"
                    inputMode="numeric"
                    placeholder="₦"
                    aria-label={`Amount paid for ${part.partName}`}
                  />
                </div>
                <div className="min-w-0 flex-[1_1_180px]">
                  <Kicker className="text-muted tracking-[0.1em]">Bought from</Kicker>
                  <Segmented
                    className="mt-[7px]"
                    label={`Where you bought the ${part.partName}`}
                    value={source ?? 'dealer'}
                    onChange={(value) =>
                      setSources((current) => ({ ...current, [part.id]: value }))
                    }
                    options={[
                      { value: 'dealer', label: 'Dealer' },
                      { value: 'market', label: 'Market' },
                    ]}
                  />
                </div>
              </div>
            ) : null}
          </Panel>
        );
      })}

      <Panel className="p-[14px]">
        <Kicker className="text-muted tracking-[0.11em]">Anything else · optional</Kicker>
        <p className="text-ink-soft mt-[9px] text-[13px] leading-[1.55]">
          Did the workshop quote a part we didn&rsquo;t list? Was a part number wrong on the shelf?
        </p>
        <TextArea
          className="mt-[10px]"
          aria-label="Anything else"
          placeholder="They also charged for a bonnet slam panel, 53201-02220…"
        />
      </Panel>

      <div className="flex flex-wrap gap-[10px]">
        <Button
          variant="primary"
          size="lg"
          className="flex-[1_1_240px]"
          disabled={corrections === 0}
          onClick={() => setSent(true)}
        >
          {corrections === 0
            ? 'Pick an answer above'
            : `Send ${corrections} correction${corrections === 1 ? '' : 's'}`}
        </Button>
        <Button
          variant="outline"
          size="md"
          href="/account/estimates"
          className="min-h-[54px] flex-[1_1_180px]"
        >
          I haven&rsquo;t bought anything
        </Button>
      </div>

      <p className="text-muted text-[12px] leading-[1.55]">
        Reported prices are used only to correct our figures. We never publish who paid what, and we
        don&rsquo;t pass anything to traders or workshops.
      </p>
    </div>
  );
}
