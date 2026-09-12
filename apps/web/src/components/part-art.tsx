import { cx } from './ui';

/**
 * SCHEMATIC PART DRAWINGS.
 *
 * A parts store that shows nothing looks like a parts store with nothing in it,
 * and this catalogue is overwhelmingly visual — a bumper cover is recognised
 * long before its part number is read. So the store draws.
 *
 * It draws rather than photographs, and that is a rule rather than a stand-in
 * for one. A photograph of a part is a claim about the part: a shopper reads the
 * lamp in the picture as the lamp in the box, down to the connector and the lens
 * tint. We hold no photographs — `listing_photos` stores a key and no storage
 * provider is chosen yet — so anything pictorial here would be a stock image of
 * somebody else's product, which is the visual form of the invented part number
 * that the AI boundary forbids. A schematic says "this is the kind of thing",
 * which is true, and never says "this is the item you will receive", which would
 * not be.
 *
 * When real listing photography exists it belongs on the product screen and the
 * search rows, where it is a photograph OF THAT LISTING. These drawings stay
 * where they are honest: category signposts, and the empty state behind a
 * listing that has no photograph yet.
 *
 * Drawing rules, taken from the rest of the system: flat, no gradients, no
 * shadows, no radii. Strokes are the design's own two weights — 2px around the
 * outline of a thing, 1.5px for detail inside it — pinned to those exact widths
 * at every render size by `vector-effect="non-scaling-stroke"`, so the artwork
 * is ruled like the panels around it instead of being scaled like a picture. One
 * orange per drawing, always on the part that does the work: the lens, the shut
 * line, the hose necks. Never used to decorate.
 */

/**
 * Stroke weights only — no colour. Fill and stroke classes are set per element
 * so a drawing can say `fill-white stroke-ink` or `fill-flag-soft
 * stroke-flag-deep` without the spread below quietly overwriting it.
 */
const HEAVY = {
  strokeWidth: 2,
  vectorEffect: 'non-scaling-stroke',
  strokeLinejoin: 'miter',
} as const;

const LIGHT = {
  strokeWidth: 1.5,
  vectorEffect: 'non-scaling-stroke',
  strokeLinejoin: 'miter',
} as const;

export type PartArtKind = 'bumper' | 'lighting' | 'body_panel' | 'grille' | 'cooling';

/** Evenly spaced coordinates — slats, fins, crease lines. */
function spread(from: number, to: number, count: number): number[] {
  const step = (to - from) / (count + 1);
  return Array.from({ length: count }, (_, i) => from + step * (i + 1));
}

/**
 * 45° hatch segments clipped to a rectangle, computed rather than filled with an
 * SVG `<pattern>`: a pattern needs a document-unique id, and a component that
 * renders twice on one page would then collide. The maths is four lines and the
 * result is the same "unfinished area on a workshop drawing" the `hatch` CSS
 * utility gives everything else.
 */
function hatchSegments(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  step = 9,
): Array<[number, number, number, number]> {
  const segments: Array<[number, number, number, number]> = [];
  const width = x1 - x0;
  const height = y1 - y0;

  // Lines entering along the top edge, running down-right.
  for (let a = x0; a < x1; a += step) {
    const run = Math.min(height, x1 - a);
    segments.push([a, y0, a + run, y0 + run]);
  }
  // Lines entering along the left edge below the corner.
  for (let b = y0 + step; b < y1; b += step) {
    const run = Math.min(width, y1 - b);
    segments.push([x0, b, x0 + run, b + run]);
  }
  return segments;
}

function Hatch({ box }: { box: [number, number, number, number] }) {
  return (
    <>
      {hatchSegments(...box).map(([ax, ay, bx, by]) => (
        <line
          key={`${ax}-${ay}`}
          x1={ax}
          y1={ay}
          x2={bx}
          y2={by}
          className="stroke-rule-2"
          {...LIGHT}
        />
      ))}
    </>
  );
}

function Bumper() {
  return (
    <>
      {/*
       * Plan view, front at the top — the same viewpoint as the damage selector,
       * and the one where a bumper is unmistakably a bumper: a wide shallow C
       * whose ends turn back along the wings. Drawn in elevation it is just a
       * rectangle, which is what it looked like before this was redrawn.
       *
       * Chamfers instead of curves. The system has no radii, and the creases in
       * a real cover fall in roughly these places anyway.
       */}
      <path
        d="M12 78 L12 46 L26 30 L52 21 L108 21 L134 30 L148 46 L148 78
           L134 78 L134 50 L124 40 L104 34 L56 34 L36 40 L26 50 L26 78 Z"
        className="stroke-ink fill-white"
        {...HEAVY}
      />
      {/* Centre aperture: the lower grille opening cut through the face. */}
      <path d="M66 21 L94 21 L94 34 L66 34 Z" className="fill-panel-2 stroke-ink" {...LIGHT} />
      {/* Fog-lamp cut-outs, per side. The trim difference that changes the number. */}
      <path d="M34 26 L48 23 L50 35 L37 38 Z" className="fill-panel-2 stroke-ink" {...LIGHT} />
      <path d="M112 23 L126 26 L123 38 L110 35 Z" className="fill-panel-2 stroke-ink" {...LIGHT} />
      {/* Mounting tabs at the tips — what makes it fit, so they carry the accent. */}
      <path
        d="M12 64 L26 64 L26 78 L12 78 Z"
        className="fill-flag-soft stroke-flag-deep"
        {...HEAVY}
      />
      <path
        d="M134 64 L148 64 L148 78 L134 78 Z"
        className="fill-flag-soft stroke-flag-deep"
        {...HEAVY}
      />
    </>
  );
}

function Lighting() {
  return (
    <>
      {/* Headlight assembly, outer face. Wedged, as every modern lamp is. */}
      <path
        d="M12 34 L120 18 L150 32 L150 64 L120 78 L12 66 Z"
        className="stroke-ink fill-white"
        {...HEAVY}
      />
      {/* Lens division: projector housing on one side, indicator on the other. */}
      <path d="M98 21 L102 76" className="stroke-ink fill-none" {...LIGHT} />
      {/* Projector bowl — the accent, because it is the part of a lamp that is the lamp. */}
      <circle cx={52} cy={49} r={18} className="fill-flag-soft stroke-flag-deep" {...HEAVY} />
      <circle cx={52} cy={49} r={7} className="stroke-ink fill-white" {...LIGHT} />
      {/* Indicator cluster. */}
      <path d="M112 33 L138 29 L138 63 L112 67 Z" className="fill-panel-2 stroke-ink" {...LIGHT} />
      {/* Connector tail: the reason a halogen car cannot simply take an LED lamp. */}
      <path d="M26 66 L26 84 L46 84 L46 70" className="fill-panel-2 stroke-ink" {...LIGHT} />
    </>
  );
}

function BodyPanel() {
  return (
    <>
      {/*
       * A front wing in elevation, with the wheel arch cut OUT of the outline
       * rather than drawn as a filled dome on top of it. That is the whole
       * silhouette: a panel is recognised by the hole in it, and a shape sitting
       * over the panel reads as a shadow, which this system does not have.
       */}
      <path
        d="M8 20 L150 12 L150 84 L128 84 L126 66 L116 54 L98 49 L80 53 L69 65 L67 84 L8 84 Z"
        className="stroke-ink fill-white"
        {...HEAVY}
      />
      {/* The shut line — the mark's own subject, and the first thing anybody
          looks at to judge whether a car has been hit. */}
      <path d="M8 36 L56 33 L66 45 L124 42" className="stroke-flag-deep fill-none" {...HEAVY} />
      {/* Swage line along the flank, and the arch lip that follows the cut. */}
      <path d="M12 66 L46 64" className="stroke-ink fill-none" {...LIGHT} />
      <path
        d="M124 84 L122 68 L113 58 L98 54 L84 58 L74 68 L72 84"
        className="stroke-ink fill-none"
        {...LIGHT}
      />
    </>
  );
}

function Grille() {
  return (
    <>
      <path d="M20 20 L140 20 L152 78 L8 78 Z" className="stroke-ink fill-white" {...HEAVY} />
      {/* Inner frame, and the slats it carries. */}
      <path d="M32 32 L128 32 L136 68 L24 68 Z" className="fill-panel-2 stroke-ink" {...LIGHT} />
      {spread(32, 68, 3).map((y, i) => (
        <line key={y} x1={30 - i} y1={y} x2={130 + i} y2={y} className="stroke-ink" {...LIGHT} />
      ))}
      {/* Badge boss: where the maker's emblem clips in, and where a copy shows. */}
      <path
        d="M70 40 L90 40 L92 58 L68 58 Z"
        className="fill-flag-soft stroke-flag-deep"
        {...HEAVY}
      />
    </>
  );
}

function Cooling() {
  return (
    <>
      {/* Radiator: two tanks with the core between them. */}
      <path d="M18 18 L142 18 L142 82 L18 82 Z" className="stroke-ink fill-white" {...HEAVY} />
      <path d="M18 18 L36 18 L36 82 L18 82 Z" className="fill-panel-2 stroke-ink" {...LIGHT} />
      <path d="M124 18 L142 18 L142 82 L124 82 Z" className="fill-panel-2 stroke-ink" {...LIGHT} />
      {/* Core fins, drawn dense, because that is what a core looks like. */}
      {spread(36, 124, 9).map((x) => (
        <line key={x} x1={x} y1={22} x2={x} y2={78} className="stroke-rule-2" {...LIGHT} />
      ))}
      {/* Hose necks carry the accent: hose size is the fitment question here. */}
      <path d="M18 28 L4 28 L4 42 L18 42" className="fill-flag-soft stroke-flag-deep" {...HEAVY} />
      <path
        d="M142 58 L156 58 L156 72 L142 72"
        className="fill-flag-soft stroke-flag-deep"
        {...HEAVY}
      />
    </>
  );
}

const ART: Record<PartArtKind, () => React.JSX.Element> = {
  bumper: Bumper,
  lighting: Lighting,
  body_panel: BodyPanel,
  grille: Grille,
  cooling: Cooling,
};

/**
 * One category's drawing. Presentational in the accessibility sense: the tile
 * around it already names the category in text, and a screen reader repeating
 * that word would be noise, not information.
 */
export function PartArt({ kind, className }: { kind: PartArtKind; className?: string }) {
  const Draw = ART[kind];
  return (
    <svg
      viewBox="0 0 160 96"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      className={cx('block h-full w-full', className)}
    >
      <Draw />
    </svg>
  );
}

/**
 * The plan-view car, arranged exactly as the damage selector arranges it: front
 * at the top, panels as panels, cabin struck out because we do not carry it, and
 * the radiator dashed because it has no exterior surface to point at. Two panels
 * are flagged, standing in for a marked-up estimate.
 *
 * Using the same plan the user meets on screen 2 says "this is what the
 * estimator does" in one glance, without resorting to a screenshot of itself.
 */
export function CarPlanArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 176"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      className={cx('block h-full w-auto', className)}
    >
      <path d="M14 8 L106 8 L106 168 L14 168 Z" className="fill-panel-2 stroke-ink" {...HEAVY} />

      {/* Front: headlights either side of the bumper. Two panels marked. */}
      <path d="M18 12 L40 12 L40 30 L18 30 Z" className="stroke-ink fill-white" {...LIGHT} />
      <path d="M44 12 L76 12 L76 30 L44 30 Z" className="fill-flag stroke-ink" {...LIGHT} />
      <path d="M80 12 L102 12 L102 30 L80 30 Z" className="fill-flag stroke-ink" {...LIGHT} />

      {/* Radiator: behind the grille, no exterior panel, so it is drawn dashed. */}
      <path
        d="M44 34 L76 34 L76 48 L44 48 Z"
        className="fill-panel-3 stroke-ink"
        strokeWidth={1.5}
        strokeDasharray="4 3"
        vectorEffect="non-scaling-stroke"
      />
      <path d="M18 34 L40 34 L40 66 L18 66 Z" className="stroke-ink fill-white" {...LIGHT} />
      <path d="M80 34 L102 34 L102 66 L80 66 Z" className="stroke-ink fill-white" {...LIGHT} />
      <path d="M44 52 L76 52 L76 66 L44 66 Z" className="stroke-ink fill-white" {...LIGHT} />

      {/* Cabin: hatched and struck. Not in the catalogue, and the drawing says so. */}
      <path d="M18 70 L102 70 L102 112 L18 112 Z" className="fill-panel-3 stroke-ink" {...LIGHT} />
      <Hatch box={[18, 70, 102, 112]} />
      <path d="M18 70 L102 70 L102 112 L18 112 Z" className="stroke-ink fill-none" {...LIGHT} />

      {/* Rear. */}
      <path d="M18 116 L58 116 L58 140 L18 140 Z" className="stroke-ink fill-white" {...LIGHT} />
      <path d="M62 116 L102 116 L102 140 L62 140 Z" className="stroke-ink fill-white" {...LIGHT} />
      <path d="M18 144 L102 144 L102 164 L18 164 Z" className="stroke-ink fill-white" {...LIGHT} />
    </svg>
  );
}

/**
 * A catalogue cluster: three parts with their ordinal stamps, arranged the way a
 * workshop parts diagram arranges them. The ordinals are the same ones the
 * results table prints down its first column, so the two halves of the product
 * read as one product.
 */
export function PartsClusterArt({ className }: { className?: string }) {
  const items: ReadonlyArray<{ kind: PartArtKind; ordinal: string }> = [
    { kind: 'bumper', ordinal: '01' },
    { kind: 'lighting', ordinal: '03' },
    { kind: 'cooling', ordinal: '05' },
  ];

  return (
    <div className={cx('flex items-stretch gap-[10px]', className)}>
      {items.map((item) => (
        <div key={item.kind} className="border-rule-2 min-w-0 flex-1 border-[1.5px] bg-white">
          <div className="border-rule-2 flex items-center justify-between border-b-[1.5px] px-[7px] py-[4px]">
            <span className="text-muted-2 font-mono text-[10px] font-bold leading-none tracking-[0.1em]">
              {item.ordinal}
            </span>
            <span className="bg-flag h-[6px] w-[6px]" aria-hidden />
          </div>
          <div className="h-[74px] px-[6px] py-[7px]">
            <PartArt kind={item.kind} />
          </div>
        </div>
      ))}
    </div>
  );
}
