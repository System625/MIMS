import type { FitmentConfidence, FitmentVerdict, ListingFitment } from '@mims/contracts';
import { formatLongDate } from '@/lib/money';
import { cx, Kicker, Title } from './ui';

/**
 * THE FITMENT LANGUAGE.
 *
 * Everything this store is trying to be rests on these few components saying
 * the same thing in the same way on every screen. Around half of all auto-parts
 * returns are fitment errors, and against three to six weeks of sea freight a
 * return costs more than the part — so certainty has to be established before
 * the sale, and where it does not exist it has to be VISIBLE rather than
 * rounded up.
 *
 * Four states, and they are four rather than three:
 *
 *   confirmed  We hold a record matching this car, on the chassis. A stamp.
 *   probable   We hold a record that should cover this car and have not
 *              confirmed it. This is a real answer, not a soft yes, and it is
 *              given the caution treatment so it cannot be skimmed past.
 *   unknown    We were told what you drive and hold no record for it. Not a
 *              "no" — a gap, and saying so is the product.
 *   absent     Nobody has told us what you drive. Different from `unknown`,
 *              and rendered differently, because collapsing the two turns "we
 *              don't know" into "you didn't ask", which is the flattering lie.
 *
 * The colour choices follow the system rather than convention. There is no
 * green tick, because this palette has no green and because a tick invites the
 * skim that fitment cannot survive. Confirmed is ink — a stamped fact.
 * `probable` takes the caution badge already used for "Not priced yet" in the
 * vehicle band. Unknown takes the dashed, hatched language the rest of the
 * system uses for "not filled in".
 */

const CHIP: Record<FitmentConfidence | 'absent', string> = {
  confirmed: 'bg-ink text-paper border-ink',
  probable: 'bg-flag-soft text-danger-ink border-flag',
  unknown: 'bg-panel-3 text-muted border-edge-2 border-dashed',
  absent: 'bg-panel-2 text-muted-2 border-edge border-dashed',
};

const CHIP_LABEL: Record<FitmentConfidence | 'absent', string> = {
  confirmed: 'Confirmed fit',
  probable: 'Probable fit',
  unknown: 'No record',
  absent: 'Car not set',
};

/** The one-line grade, as search rows and the fitment table carry it. */
export function FitmentChip({
  confidence,
  className,
}: {
  confidence: FitmentConfidence | 'absent';
  className?: string;
}) {
  return (
    <span
      className={cx(
        'inline-flex flex-none items-center border-[1.5px] px-[7px] py-[4px]',
        'font-mono text-[10.5px] font-bold uppercase leading-none tracking-[0.1em]',
        CHIP[confidence],
        className,
      )}
    >
      {CHIP_LABEL[confidence]}
    </span>
  );
}

export function chipState(verdict: FitmentVerdict | null): FitmentConfidence | 'absent' {
  return verdict === null ? 'absent' : verdict.confidence;
}

/**
 * THE VERDICT BLOCK on the product screen — the single most important object in
 * the marketplace, and the reason someone buys here instead of from a WhatsApp
 * trader.
 *
 * It is built as evidence rather than as a badge: the claim, the car it is
 * about, the chassis it was matched on, where the claim comes from, and what
 * narrowing still applies. A shopper who disagrees with it can see exactly what
 * we based it on, which is the only kind of certainty worth offering when the
 * cost of being wrong is five weeks and a return that exceeds the part.
 */
export function FitmentVerdictPanel({
  verdict,
  fitmentNote,
  onSetVehicle,
}: {
  verdict: FitmentVerdict | null;
  /** The listing's own caveat, shown beside the verdict rather than buried. */
  fitmentNote: string | null;
  /** Rendered as a prompt when no car is set. */
  onSetVehicle?: React.ReactNode;
}) {
  const state = chipState(verdict);

  const HEADLINE: Record<FitmentConfidence | 'absent', string> = {
    confirmed: 'This fits your car',
    probable: 'This should fit — we have not confirmed it',
    unknown: 'We hold no fitment record for your car',
    absent: 'Set your car to see whether this fits',
  };

  const BODY: Record<FitmentConfidence | 'absent', string> = {
    confirmed:
      'Matched on the chassis code rather than the model name, which is what makes the claim worth anything — two cars that look identical across a facelift take different parts.',
    probable:
      'We hold a record that should cover your car, and we have not physically confirmed it on your chassis. We are telling you that rather than rounding it up, because a panel that took five weeks to arrive cannot be fixed by a refund. If you can send us the number off the old part we will check it before you pay.',
    unknown:
      'That is a gap in what we hold, not a "no" — the part may well fit. We will not guess, because a guess that turns out wrong costs you weeks and costs us the only thing this shop has. Send us the number off the old part and we will check it.',
    absent:
      'Every price and fitment note on this site is about one specific car. Until you tell us which, this page can only tell you what the part is.',
  };

  return (
    <div
      className={cx(
        'border-2 p-[15px]',
        state === 'confirmed' && 'border-ink bg-panel',
        state === 'probable' && 'border-flag bg-flag-soft',
        state === 'unknown' && 'border-edge-2 bg-panel-3 border-dashed',
        state === 'absent' && 'border-ink bg-panel-2 border-dashed',
      )}
    >
      <div className="flex flex-wrap items-center gap-x-[12px] gap-y-[8px]">
        <FitmentChip confidence={state} />
        {verdict?.vehicle ? (
          <span className="min-w-0 font-mono text-[12px] font-bold uppercase leading-none tracking-[0.05em]">
            {verdict.vehicle}
          </span>
        ) : null}
      </div>

      <Title as="div" className="mt-[11px] text-[17px]">
        {HEADLINE[state]}
      </Title>
      <p className="text-ink-soft mt-[8px] max-w-[62ch] text-[13px] leading-[1.55]">
        {BODY[state]}
      </p>

      {state === 'absent' && onSetVehicle ? <div className="mt-[13px]">{onSetVehicle}</div> : null}

      {verdict && (verdict.chassisCode || verdict.evidence || verdict.qualifier) ? (
        <dl className="border-rule-2 bg-rule-2 mt-[13px] grid gap-px border-[1.5px]">
          {verdict.chassisCode ? (
            <EvidenceRow label="Matched on chassis" value={verdict.chassisCode} mono />
          ) : null}
          {verdict.qualifier ? (
            <EvidenceRow label="Only applies to" value={verdict.qualifier} stacked />
          ) : null}
          {verdict.evidence ? (
            <EvidenceRow label="Source of the claim" value={verdict.evidence} stacked />
          ) : null}
          {verdict.verifiedAt ? (
            <EvidenceRow label="Checked" value={formatLongDate(verdict.verifiedAt)} />
          ) : null}
        </dl>
      ) : null}

      {fitmentNote ? (
        <div className="border-ink mt-[13px] flex gap-[11px] border-[1.5px] bg-white p-[11px]">
          <span className="bg-flag w-[5px] flex-none" aria-hidden />
          <p className="text-ink-soft m-0 text-[12.5px] leading-[1.5]">{fitmentNote}</p>
        </div>
      ) : null}
    </div>
  );
}

/**
 * `stacked` is for the rows whose value is a sentence rather than a token. A
 * chassis code or a date sits neatly opposite its label; a source citation
 * right-aligned against one rags down the panel in two or three broken lines
 * and stops reading as a citation at all.
 */
function EvidenceRow({
  label,
  value,
  mono = false,
  stacked = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  stacked?: boolean;
}) {
  return (
    <div
      className={cx(
        'bg-white px-[11px] py-[9px]',
        stacked
          ? 'block'
          : 'flex flex-wrap items-baseline justify-between gap-x-[12px] gap-y-[3px]',
      )}
    >
      <dt>
        <Kicker as="span" className="text-muted-2 tracking-[0.1em]">
          {label}
        </Kicker>
      </dt>
      <dd
        className={cx(
          'm-0 min-w-0 text-[12.5px] leading-[1.4]',
          stacked ? 'mt-[5px]' : 'text-right',
          mono ? 'font-mono font-bold tracking-[0.04em]' : 'text-ink-soft',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * EVERY CAR WE HOLD A RECORD FOR — the evidence behind the verdict, printed in
 * full so the verdict is checkable rather than asserted. A short table is not
 * an embarrassment here: it is the truthful size of what we know, and a shopper
 * whose car is missing from it has learned something real.
 */
export function FitmentTable({ rows }: { rows: readonly ListingFitment[] }) {
  if (rows.length === 0) {
    return (
      <div className="border-edge-2 bg-panel-3 hatch border-[1.5px] border-dashed p-[13px]">
        <p className="text-muted m-0 text-[12.5px] leading-[1.5]">
          We hold no fitment records for this part yet. It is in the catalogue because we can name
          and number it, not because we have matched it to a car.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-rule-2 border-rule-2 grid gap-px border-[1.5px]">
      {rows.map((row) => (
        <div key={row.label} className="bg-white px-[12px] py-[11px]">
          <div className="flex flex-wrap items-start justify-between gap-x-[12px] gap-y-[7px]">
            <span className="min-w-0 flex-1 font-mono text-[12.5px] font-bold leading-[1.35] tracking-[0.02em]">
              {row.label}
            </span>
            <FitmentChip confidence={row.confidence} />
          </div>
          {row.qualifier ? (
            <p className="text-ink-soft m-0 mt-[6px] text-[12px] leading-[1.45]">
              <span className="text-muted-2 font-mono text-[10.5px] font-bold uppercase tracking-[0.1em]">
                Only{' '}
              </span>
              {row.qualifier}
            </p>
          ) : null}
          {row.evidence ? (
            <p className="text-muted m-0 mt-[5px] text-[11.5px] leading-[1.45]">{row.evidence}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
