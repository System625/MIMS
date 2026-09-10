import { cx } from './ui';

/**
 * The MIMS mark — candidate 2B, "shut line", from `MIMS Logos.dc.html`.
 *
 * Two body panels and the jogged gap where they meet. The gap is the logo: a
 * shut line is the first thing anyone looks at to judge whether a car has been
 * hit, which is the same judgement this product exists to price. The panels
 * never touch — the dark ground showing between them *is* the mark, so the
 * component paints two shapes and no stroke.
 *
 * Geometry and colours are transcribed from the canvas, not redrawn. Both
 * fills come from the existing palette (`paper`/`flag` on dark ground,
 * `ink`/`flag-deep` on light), so the mark adds no colour to the design.
 */

/*
 * The canvas draws the mark twice. At display sizes the gap is 6 units wide;
 * at favicon size it is widened and the lower panel raised, because a 6-unit
 * gap on a 64-unit grid disappears entirely once rasterised to 16px. That is an
 * optical correction, not a second logo — `Mark` picks between them on size so
 * no caller has to remember.
 */
const GEOMETRY = {
  display: {
    upper: 'M4 4h56v12H36L24 40H4z',
    lower: 'M4 46h20l12-24h24v38H4z',
  },
  small: {
    upper: 'M4 4h56v14H36L24 40H4z',
    lower: 'M4 48h18l12-24h26v36H4z',
  },
} as const;

/** Below this the display gap closes up when rasterised. Canvas uses 16px. */
const SMALL_AT = 20;

const TONE = {
  /** On the ink header band and any dark ground. */
  dark: { upper: 'fill-paper', lower: 'fill-flag' },
  /** On paper — the PDF letterhead, print, light panels. */
  light: { upper: 'fill-ink', lower: 'fill-flag-deep' },
} as const;

export function Mark({
  size = 30,
  tone = 'light',
  className,
}: {
  /** Rendered edge length in px. Drives the optical variant, not just scale. */
  size?: number;
  tone?: keyof typeof TONE;
  className?: string;
}) {
  const shape = size <= SMALL_AT ? GEOMETRY.small : GEOMETRY.display;
  const fill = TONE[tone];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      /* The wordmark beside it carries the name; this would only repeat it. */
      aria-hidden="true"
      focusable="false"
      className={cx('block shrink-0', className)}
    >
      <path d={shape.upper} className={fill.upper} />
      <path d={shape.lower} className={fill.lower} />
    </svg>
  );
}
