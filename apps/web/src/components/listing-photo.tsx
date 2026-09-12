import { listingImageSrcSet, listingImageUrl } from '@/lib/images';
import type { ListingPhoto as ListingPhotoRecord } from '@mims/contracts';
import { PartArt, type PartArtKind } from './part-art';
import { cx, Kicker } from './ui';

/**
 * THE LISTING PHOTO FRAME, AND ITS HONEST EMPTY STATE.
 *
 * Two things can be true of a listing: we hold a photograph of the actual item,
 * or we do not. The frame is the same size either way, because a grid that
 * reflows depending on which rows have pictures reads as broken, and because
 * "no photograph" is a fact about our catalogue rather than a fault in the
 * page.
 *
 * What must never happen is the two states being confusable. A photograph is a
 * claim — the buyer reads the lamp in the picture as the lamp in the box, down
 * to the connector — so the empty state does not reach for a stand-in that
 * could be mistaken for one. It draws the category schematic instead. A
 * schematic can say "this is the kind of thing" truthfully; only a photograph
 * of THIS listing may say "this is what you will receive", and a stock image of
 * somebody else's product would be the visual form of an invented part number.
 *
 * WHERE THE "IT IS A DRAWING" CAVEAT GOES is a judgement that was made on
 * screen rather than in advance. Stamped on every search row it was noise —
 * six identical labels, each one wide enough to sit over the artwork and, in
 * the narrow frame, over the part name beside it. A flat line drawing is also
 * self-evidently not a photograph at a glance. So the caveat is stated once, in
 * words, on the product screen where somebody is actually deciding to spend
 * money, and the rows just draw. `stamp` is opt-in for that reason.
 *
 * Bytes live in Cloudflare R2 and are transformed at the edge on the way out —
 * see `lib/images.ts`. Until that base URL is configured every listing takes
 * the empty state, which is correct: we hold no listing photography yet.
 */

/**
 * THE TWO STATES HAVE DIFFERENT PROPORTIONS, on purpose.
 *
 * A photograph of a part wants a photographic plate — 4:3, the shape a phone
 * and a warehouse camera both produce. A schematic wants the shape a diagram
 * has in a manual: wide and shallow, cropped to the drawing. Given the same
 * 4:3 plate the artwork floats in a field of white roughly twice its own
 * height, which looked less like restraint than like a photograph that had
 * failed to load — the exact reading this frame exists to avoid.
 *
 * Making them different is also the point rather than a concession: the two
 * states must never be confusable, and a shape that changes when a real
 * photograph lands is a truthful signal that something changed.
 */
const PHOTO_ASPECT = '4 / 3';
const DRAWING_ASPECT = '16 / 7';

/**
 * `w-full` is load bearing, not tidiness. A block with `aspect-ratio` and a
 * definite height resolves its `auto` width FROM the ratio rather than from its
 * container — so in a search row, where the frame is stretched to the row
 * height, it computed itself 119px wide inside a 92px column and laid the
 * drawing over the part name beside it. Pinning the width makes the ratio a
 * fallback for the case it is actually for: the product screen, where the frame
 * is full width and the height is the thing being derived.
 */
const FRAME = 'relative w-full';

export function ListingPhotoFrame({
  photo,
  art,
  /**
   * The widest this frame is ever drawn, in CSS pixels, so the srcset ladder
   * can stop there instead of offering the browser sizes it will never take.
   */
  maxWidth,
  /** Passed straight to the img. Tell the browser the truth about the layout. */
  sizes,
  className,
  /**
   * What sits behind the drawing. `white` is the catalogue plate the artwork
   * was designed to be read on; `hatch` is the system's "nothing here yet"
   * fill, and belongs only where the whole row is a gap rather than an offer.
   */
  emptyFill = 'white',
  /** Names the drawing as a drawing. On the product screen, not in a list. */
  stamp = false,
}: {
  photo: ListingPhotoRecord | null;
  art: PartArtKind;
  maxWidth: number;
  sizes: string;
  className?: string;
  emptyFill?: 'white' | 'hatch';
  stamp?: boolean;
}) {
  const src = listingImageUrl(photo?.storageKey, { width: maxWidth, fit: 'contain' });
  const srcSet = listingImageSrcSet(photo?.storageKey, maxWidth, { fit: 'contain' });

  if (src === null) {
    return (
      <div
        className={cx(
          FRAME,
          'flex items-center justify-center',
          emptyFill === 'hatch' ? 'hatch' : 'bg-white',
          className,
        )}
        style={{ aspectRatio: DRAWING_ASPECT }}
      >
        <div className="absolute inset-[7%]">
          <PartArt kind={art} />
        </div>
        {stamp ? (
          <Kicker
            as="span"
            className="border-edge text-muted-2 absolute bottom-[7px] left-[7px] max-w-[calc(100%-14px)] truncate border-[1.5px] bg-white px-[6px] py-[4px] tracking-[0.1em]"
          >
            Schematic drawing
          </Kicker>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cx(FRAME, 'overflow-hidden bg-white', className)}
      style={{ aspectRatio: PHOTO_ASPECT }}
    >
      {/*
       * A plain img, not `next/image`. Cloudflare has already done the resizing
       * at the edge nearest the customer; running it again through the Next
       * optimiser on our Railway container would pay twice for one result and
       * put the slower of the two caches in front.
       *
       * Alt text is written by a human in the admin tool and stored on the row.
       * Where it is missing the image is marked decorative rather than given a
       * description we made up — a screen reader hearing an invented
       * description of a part is being lied to in the same way a sighted user
       * would be by a stock photograph.
       */}
      <img
        src={src}
        srcSet={srcSet ?? undefined}
        sizes={sizes}
        alt={photo?.altText ?? ''}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-contain"
      />
    </div>
  );
}
