import Link from 'next/link';
import type { ReactNode } from 'react';
import { Mark } from './mark';
import { cx, Kicker } from './ui';

/**
 * Page furniture: the dark header band, the measured content column, and the
 * ruled page heading. Every consumer screen in the design opens with these three
 * in the same order.
 */

export type FlowStep = 'vehicle' | 'damage' | 'parts' | null;

const STEPS: ReadonlyArray<{ id: Exclude<FlowStep, null>; label: string; href: string }> = [
  { id: 'vehicle', label: '01 VEHICLE', href: '/' },
  { id: 'damage', label: '02 DAMAGE', href: '/damage' },
  { id: 'parts', label: '03 PARTS', href: '/estimate' },
];

/**
 * The logo: mark 2B ("shut line") from `MIMS Logos.dc.html`, locked up with the
 * wordmark at the canvas ratio — the mark sits at the wordmark's cap height,
 * with a gap of roughly half its width between them.
 */
function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-[9px]" aria-label="MIMS — home">
      <Mark size={18} tone="dark" />
      <span className="text-paper text-[15px] font-black uppercase leading-none tracking-[0.06em]">
        MIMS
      </span>
    </Link>
  );
}

export function AppHeader({
  step = null,
  label,
  meta,
  action,
}: {
  /** Highlights one of the three flow chips. Omit outside the estimator. */
  step?: FlowStep;
  /** Replaces the chips on pages that sit outside the flow. */
  label?: string;
  /** Right-hand context: the identified vehicle, an estimate reference, a date. */
  meta?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="bg-ink flex flex-wrap items-center gap-x-5 gap-y-3 px-[22px] py-[12px]">
      <Wordmark />

      {step !== null ? (
        <nav
          aria-label="Estimator progress"
          className="flex min-w-0 flex-[1_1_220px] flex-wrap gap-[6px]"
        >
          {STEPS.map((item) => {
            const current = item.id === step;
            return (
              <span
                key={item.id}
                aria-current={current ? 'step' : undefined}
                className={cx(
                  'px-[8px] py-[5px] font-mono text-[11px] font-bold leading-none tracking-[0.12em]',
                  current ? 'bg-flag text-flag-ink' : 'border-night-rule text-night-muted border',
                )}
              >
                {item.label}
              </span>
            );
          })}
        </nav>
      ) : (
        <Kicker as="div" className="text-night-muted min-w-0 flex-[1_1_200px] tracking-[0.11em]">
          {label}
        </Kicker>
      )}

      {meta ? (
        <div className="text-night-muted font-mono text-[11px] uppercase leading-none tracking-[0.1em]">
          {meta}
        </div>
      ) : null}

      {action}
    </header>
  );
}

const WIDTH = {
  wide: 'max-w-[1280px]',
  app: 'max-w-[1180px]',
  read: 'max-w-[900px]',
  narrow: 'max-w-[860px]',
  sheet: 'max-w-[760px]',
} as const;

export function Shell({
  children,
  width = 'wide',
  className,
}: {
  children: ReactNode;
  width?: keyof typeof WIDTH;
  className?: string;
}) {
  return (
    <div className={cx('mx-auto px-[22px] pb-[34px] pt-[26px]', WIDTH[width], className)}>
      {children}
    </div>
  );
}

/**
 * Kicker, title, and the sentence that sets expectations — closed by the 2px
 * rule that separates "what this page is" from "the work".
 */
export function PageHeading({
  kicker,
  title,
  lede,
  aside,
  ledeBelow = false,
  size = 'lg',
}: {
  kicker?: ReactNode;
  title: string;
  lede?: ReactNode;
  /** Sits opposite the title on wide screens — a total, a status. */
  aside?: ReactNode;
  /** True stacks the lede under the title instead of beside it. */
  ledeBelow?: boolean;
  size?: 'lg' | 'md';
}) {
  return (
    <div className="border-ink flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b-2 pb-[14px]">
      <div className={ledeBelow ? 'min-w-0 flex-[1_1_380px]' : undefined}>
        {kicker ? (
          <Kicker as="div" className="text-flag-deep tracking-[0.16em]">
            {kicker}
          </Kicker>
        ) : null}
        <h1
          className={cx(
            'mt-[9px] font-black uppercase leading-[1.05] tracking-[-0.02em]',
            size === 'lg' ? 'text-[28px] sm:text-[34px]' : 'text-[26px] sm:text-[30px]',
            !kicker && 'mt-0',
          )}
        >
          {title}
        </h1>
        {ledeBelow && lede ? (
          <p className="text-ink-soft mt-[9px] max-w-[56ch] text-[14.5px] leading-[1.55]">{lede}</p>
        ) : null}
      </div>

      {!ledeBelow && lede ? (
        <p className="text-ink-soft m-0 min-w-0 max-w-[52ch] flex-[1_1_300px] text-[14.5px] leading-[1.55]">
          {lede}
        </p>
      ) : null}

      {aside}
    </div>
  );
}

/**
 * The persistent footer. Deliberately plain type, and it always carries the two
 * links that make the numbers arguable: how we price, and what we hold.
 */
export function SiteFooter() {
  return (
    <footer className="border-ink mt-2 border-t-2">
      <div className="mx-auto flex max-w-[1280px] flex-wrap gap-x-4 gap-y-2 px-[22px] py-[18px]">
        <Kicker as="span" className="text-muted tracking-[0.09em]">
          MIMS TECHNOLOGIES LTD · LAGOS
        </Kicker>
        <span className="text-muted-2 font-mono text-[11px] font-bold">·</span>
        <Link
          href="/how-we-price"
          className="text-muted font-mono text-[11px] font-bold uppercase leading-none tracking-[0.09em] underline"
        >
          How we price parts
        </Link>
        <span className="text-muted-2 font-mono text-[11px] font-bold">·</span>
        <Link
          href="/coverage"
          className="text-muted font-mono text-[11px] font-bold uppercase leading-none tracking-[0.09em] underline"
        >
          Coverage
        </Link>
        <span className="text-muted-2 font-mono text-[11px] font-bold">·</span>
        <Link
          href="/privacy"
          className="text-muted font-mono text-[11px] font-bold uppercase leading-none tracking-[0.09em] underline"
        >
          Privacy
        </Link>
      </div>
    </footer>
  );
}
