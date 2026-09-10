import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

/**
 * The MIMS component inventory.
 *
 * Everything here is a direct transcription of the Claude Design canvas. The
 * system has three moves and no more: a 2px ink rule around anything load
 * bearing, a 1.5px rule around anything supporting, and one orange that means
 * "this is selected" or "this is the number that matters". There are no shadows,
 * no radii and no gradients — a workshop manual has none of those either.
 */

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/* ------------------------------------------------------------------ type -- */

/** The small monospaced all-caps label that titles almost every block. */
export function Kicker({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'span' | 'h2';
}) {
  return (
    <Tag
      className={cx(
        'font-mono text-[11px] font-bold uppercase leading-none tracking-[0.12em]',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Section title: 900-weight Chivo, tight, uppercase. */
export function Title({
  children,
  className,
  as: Tag = 'h2',
}: {
  children: ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'div';
}) {
  return (
    <Tag className={cx('text-[20px] font-bold uppercase leading-[1.15]', className)}>
      {children}
    </Tag>
  );
}

/* --------------------------------------------------------------- surface -- */

/**
 * A bordered block. `weight="heavy"` (2px) is for anything the user acts on;
 * `weight="light"` (1.5px) is for supporting information beside it.
 */
export function Panel({
  children,
  className,
  weight = 'light',
  tone = 'panel',
}: {
  children: ReactNode;
  className?: string;
  weight?: 'heavy' | 'light';
  tone?: 'panel' | 'white' | 'soft' | 'dim';
}) {
  return (
    <div
      className={cx(
        'border-ink',
        weight === 'heavy' ? 'border-2' : 'border-[1.5px]',
        tone === 'panel' && 'bg-panel',
        tone === 'white' && 'bg-white',
        tone === 'soft' && 'bg-flag-soft',
        tone === 'dim' && 'bg-panel-3',
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * The strip across the top of a panel. `tone="dark"` is reserved for blocks that
 * carry a total or an identity — the things a user photographs.
 */
export function PanelBar({
  children,
  right,
  tone = 'light',
  weight = 'light',
  className,
}: {
  children: ReactNode;
  right?: ReactNode;
  tone?: 'light' | 'dark' | 'flag';
  weight?: 'heavy' | 'light';
  className?: string;
}) {
  return (
    <div
      className={cx(
        'flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-[13px] py-[9px]',
        weight === 'heavy' ? 'border-b-2' : 'border-b-[1.5px]',
        tone === 'light' && 'bg-panel-2 border-ink text-muted',
        tone === 'dark' && 'bg-ink border-ink text-paper',
        tone === 'flag' && 'bg-flag border-ink text-flag-ink',
        className,
      )}
    >
      <Kicker as="span" className="tracking-[0.11em]">
        {children}
      </Kicker>
      {right ? (
        <Kicker as="span" className="tracking-[0.1em]">
          {right}
        </Kicker>
      ) : null}
    </div>
  );
}

/**
 * The 1px-gutter grid of white cells used for "sources per part", "price basis",
 * data-retention figures and so on. Reads as a specification table.
 */
export function StatCells({
  items,
  className,
}: {
  items: ReadonlyArray<{ label: string; value: ReactNode; basis?: string }>;
  className?: string;
}) {
  return (
    <div className={cx('bg-rule-2 border-rule-2 flex flex-wrap gap-px border', className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-0 flex-1 bg-white p-[11px]"
          style={{ flexBasis: item.basis ?? '130px' }}
        >
          <Kicker className="text-muted-2 tracking-[0.1em]">{item.label}</Kicker>
          <div className="mt-[5px] font-mono text-[14px] font-bold leading-[1.2]">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

/** Label/value rows, hairline separated. Used for coverage counts and account facts. */
export function FactRows({
  items,
  className,
  bordered = false,
}: {
  items: ReadonlyArray<{ label: string; value: ReactNode }>;
  className?: string;
  bordered?: boolean;
}) {
  if (bordered) {
    return (
      <div className={cx('bg-rule-2 border-rule-2 grid gap-px border', className)}>
        {items.map((item) => (
          <div
            key={item.label}
            className="flex justify-between gap-3 bg-white px-[10px] py-[9px] text-[12.5px] leading-[1.4]"
          >
            <span className="text-muted">{item.label}</span>
            <span className="font-mono text-[12px] font-bold leading-none">{item.value}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cx('grid gap-2', className)}>
      {items.map((item) => (
        <div key={item.label} className="flex justify-between gap-3 text-[13px] leading-[1.4]">
          <span className="text-muted">{item.label}</span>
          <span className="font-mono text-[14px] font-bold leading-none">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * The bordered aside. `tone="flag"` carries the things the user is meant to act
 * on later; `tone="dashed"` carries the things they may safely ignore.
 */
export function Note({
  children,
  tone = 'plain',
  className,
}: {
  children: ReactNode;
  tone?: 'plain' | 'flag' | 'dashed' | 'rule';
  className?: string;
}) {
  if (tone === 'rule') {
    // The orange spine — used where a caveat must not be skimmable.
    return (
      <div className={cx('bg-panel border-ink flex gap-[11px] border-[1.5px] p-[13px]', className)}>
        <div className="bg-flag w-[5px] flex-none" aria-hidden />
        <div className="text-ink-soft text-[12.5px] leading-[1.5]">{children}</div>
      </div>
    );
  }

  return (
    <div
      className={cx(
        'p-[13px] text-[12.5px] leading-[1.55]',
        tone === 'flag' && 'bg-flag-soft border-flag text-ink-soft border-[1.5px]',
        tone === 'dashed' && 'border-muted-2 text-ink-soft border-[1.5px] border-dashed',
        tone === 'plain' && 'bg-panel border-ink text-ink-soft border-[1.5px]',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A bulleted claim. The square is the design's only list marker. */
export function SquareList({
  items,
  tone = 'flag',
  className,
}: {
  items: ReadonlyArray<ReactNode>;
  tone?: 'flag' | 'ink';
  className?: string;
}) {
  return (
    <ul className={cx('grid gap-[9px]', className)}>
      {items.map((item, index) => (
        <li key={index} className="text-ink-soft flex gap-[10px] text-[13.5px] leading-[1.55]">
          <span
            className={cx(
              'mt-[6px] h-[9px] w-[9px] flex-none',
              tone === 'flag' ? 'bg-flag' : 'bg-ink',
            )}
            aria-hidden
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* ---------------------------------------------------------------- action -- */

type ButtonVariant = 'primary' | 'dark' | 'outline' | 'quiet' | 'danger';
type ButtonSize = 'lg' | 'md' | 'sm';

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-flag text-flag-ink border-2 border-ink font-black',
  dark: 'bg-ink text-paper border-2 border-ink font-bold',
  outline: 'bg-panel text-ink border-[1.5px] border-ink font-bold',
  quiet: 'bg-transparent text-ink border-[1.5px] border-dashed border-ink font-bold',
  danger: 'bg-flag-soft text-danger-ink border-[1.5px] border-flag-deep font-bold',
};

const SIZE: Record<ButtonSize, string> = {
  lg: 'min-h-[56px] px-[18px] text-[15px] tracking-[0.04em]',
  md: 'min-h-[48px] px-[16px] text-[12.5px] tracking-[0.04em]',
  sm: 'min-h-[40px] px-[12px] text-[11.5px] tracking-[0.05em]',
};

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 text-center leading-[1.2] uppercase' +
  ' transition-[filter] hover:brightness-95 active:brightness-90' +
  ' disabled:cursor-not-allowed disabled:brightness-100';

/**
 * One control, five weights. Minimum height never drops below 40px because the
 * target is a thumb on a cracked screen, often in a hurry.
 */
export function Button({
  children,
  variant = 'outline',
  size = 'md',
  className,
  href,
  full = false,
  disabled,
  ...rest
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  href?: string;
  full?: boolean;
} & Omit<ComponentProps<'button'>, 'className' | 'children'>) {
  const classes = cx(
    BUTTON_BASE,
    VARIANT[variant],
    SIZE[size],
    full && 'w-full',
    disabled && 'bg-rule-3 text-faint border-ink',
    className,
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}

/** The joined pair — Diagram/Checklist, Phone/Email, Lagos/Abuja. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cx('flex', className)}>
      {options.map((option, index) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cx(
              'border-ink flex min-h-[44px] flex-1 items-center justify-center border-[1.5px] px-[14px]',
              'text-[12px] font-bold uppercase leading-none tracking-[0.05em]',
              index > 0 && 'border-l-0',
              active ? 'bg-ink text-paper' : 'bg-panel text-ink',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Numbered stage tabs — "1 · Guidance", "2 · Review", "3 · Uploading". */
export function StageTabs<T extends string>({
  stages,
  value,
  onChange,
  label,
}: {
  stages: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-2">
      {stages.map((stage, index) => {
        const active = stage.value === value;
        return (
          <button
            key={stage.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(stage.value)}
            className={cx(
              'border-ink flex min-h-[40px] items-center border-[1.5px] px-[14px]',
              'text-[11.5px] font-bold uppercase leading-none tracking-[0.05em]',
              active ? 'bg-ink text-paper' : 'bg-panel text-ink',
            )}
          >
            {index + 1} · {stage.label}
          </button>
        );
      })}
    </div>
  );
}

/* ----------------------------------------------------------------- input -- */

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('min-w-0', className)}>
      {label ? <Kicker className="text-muted tracking-[0.11em]">{label}</Kicker> : null}
      <div className={label ? 'mt-[7px]' : undefined}>{children}</div>
      {hint ? <div className="text-muted mt-[7px] text-[12px] leading-[1.45]">{hint}</div> : null}
    </div>
  );
}

/**
 * `mono` is not styling. A field holds a mono face when its contents are a
 * string the user will compare character by character against something printed
 * — a VIN, a phone number, an amount.
 */
export function TextInput({
  mono = false,
  weight = 'heavy',
  className,
  ...rest
}: { mono?: boolean; weight?: 'heavy' | 'light' } & ComponentProps<'input'>) {
  return (
    <input
      className={cx(
        'border-ink text-ink h-[48px] w-full min-w-0 border bg-white px-[12px]',
        weight === 'heavy' ? 'border-2' : 'border-[1.5px]',
        mono
          ? 'font-mono text-[15px] font-bold tracking-[0.03em]'
          : 'text-[14px] font-normal leading-none',
        'placeholder:text-faint',
        className,
      )}
      {...rest}
    />
  );
}

export function TextArea({ className, ...rest }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cx(
        'border-ink text-ink placeholder:text-faint min-h-[88px] w-full',
        'resize-y border-[1.5px] bg-white px-[12px] py-[11px] text-[13.5px] leading-[1.5]',
        className,
      )}
      {...rest}
    />
  );
}

/** The settings switch. Square, like everything else. */
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx(
        'border-ink flex h-[30px] w-[54px] flex-none items-center border-[1.5px] p-[2px]',
        checked ? 'bg-flag justify-end' : 'bg-panel-3 justify-start',
      )}
    >
      <span className="bg-ink h-[22px] w-[24px]" aria-hidden />
    </button>
  );
}
