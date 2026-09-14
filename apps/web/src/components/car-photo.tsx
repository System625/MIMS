import { vehicleImageSrcSet, vehicleImageUrl } from '@/lib/images';
import type { FleetCar } from '@/mock/fleet';
import { cx, Kicker } from './ui';

/**
 * THE CAR PLATE — one frame, one shape, twenty photographers.
 *
 * Every fleet photograph was taken by somebody else, somewhere else, in
 * different light. They only read as one product if they share a frame, so the
 * plate is fixed at 8:5 and the image fills it. That is the opposite rule from
 * `listing-photo.tsx`, where a part is contained rather than cropped, and the
 * difference is deliberate: cropping a part can cut off the bracket a buyer is
 * checking, while cropping a car only moves the number plate.
 *
 * WHAT THE PHOTOGRAPH IS AND IS NOT CLAIMING. It is a real car of that
 * generation, photographed by a stranger — not our stock, not the customer's
 * car, and not a rendering. It is doing the job of a road sign: helping someone
 * recognise their own car at a glance. Nothing about a part hangs off it, which
 * is why it can be a stock photograph at all where a listing photograph could
 * not. The attribution is a licence condition and is discharged on
 * `/photo-credits`, linked from every screen that draws these.
 *
 * THE EMPTY STATE IS BUILT AND CURRENTLY UNUSED — all twenty rows carry a
 * photograph. It stays because the fleet will grow past what can be curated by
 * hand, and the first uncovered generation must land on a drawn plate rather
 * than a broken frame. It draws the car in plan, the same figure the estimator
 * uses, so it cannot be mistaken for a photograph of anything.
 */

const PLATE_ASPECT = '8 / 5';

export function CarPhoto({
  car,
  /** The widest this frame is ever drawn, in CSS pixels. Caps the srcset ladder. */
  maxWidth,
  sizes,
  className,
  /** Names the source in the corner. On the car's own page, not in a grid. */
  credit = false,
}: {
  car: FleetCar;
  maxWidth: number;
  sizes: string;
  className?: string;
  credit?: boolean;
}) {
  const src = vehicleImageUrl(car.photo?.storageKey, { width: maxWidth });
  const srcSet = vehicleImageSrcSet(car.photo?.storageKey, maxWidth);

  if (src === null) {
    return (
      <div className={cx('hatch relative w-full', className)} style={{ aspectRatio: PLATE_ASPECT }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <Kicker
            as="span"
            className="border-edge text-muted-2 border-[1.5px] bg-white px-[8px] py-[5px] tracking-[0.1em]"
          >
            No photograph on file
          </Kicker>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cx('relative w-full overflow-hidden bg-white', className)}
      style={{ aspectRatio: PLATE_ASPECT }}
    >
      {/*
       * A plain img, and lazily loaded without exception. The grid is twenty
       * photographs at ~58 KB each; on the connection this store is built for,
       * fetching the ones below the fold before they are scrolled to is a real
       * cost charged to somebody who may only ever look at one car. Width and
       * height are declared so the reserved box never reflows when one lands.
       */}
      <img
        src={src}
        srcSet={srcSet ?? undefined}
        sizes={sizes}
        /* The alt text describes the car, which is exactly what the photograph
           is for. It is built from the row rather than written per file: every
           fact in it is already on the tile in type. */
        alt={`${car.make} ${car.model}, ${car.generation} generation, ${car.yearStart}–${car.yearEnd}`}
        width={640}
        height={400}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />

      {credit && car.photo ? (
        <Kicker
          as="span"
          className="border-ink bg-paper/95 text-ink-soft absolute bottom-0 left-0 max-w-full truncate border-r-[1.5px] border-t-[1.5px] px-[6px] py-[4px] tracking-[0.09em]"
        >
          Photo · {car.photo.author} · {car.photo.licence}
        </Kicker>
      ) : null}
    </div>
  );
}
