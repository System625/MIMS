/**
 * LISTING PHOTOGRAPHY — Cloudflare R2 for the bytes, Cloudflare Images
 * transformations for delivery.
 *
 * Decided 2026-09-12, and it closes the object-storage question that had been
 * blocking the product screen. R2 holds the original upload; `listing_photos`
 * stores only the object key, exactly as the schema already assumed. Nothing in
 * the database or the contracts changed to accommodate this — a storage key is
 * a storage key, and swapping providers later would touch this file and no
 * other.
 *
 * Delivery goes through Cloudflare's URL-based transformations rather than
 * Next's image optimiser, and that is a deliberate trade rather than a
 * shortcut. `next/image` would resize on the Railway container: our own CPU,
 * our own cold starts, and a cache we pay for and have to warm. The bucket is
 * already behind a Cloudflare custom domain, so `/cdn-cgi/image/...` in front
 * of the same path resizes at the edge nearest the customer, caches there, and
 * costs a request rather than a container second. On a Lagos phone over mobile
 * data that difference is the whole page.
 *
 * `format=auto` matters more here than anywhere else in the app: it serves AVIF
 * to a device that will take it and falls back to WebP or JPEG for the cheap
 * Android this product assumes. A bumper photograph is by far the heaviest
 * thing we will ever send, and we send it to people paying for the megabyte.
 *
 * WHEN THE BASE URL IS UNSET, EVERY LOOKUP RETURNS NULL — and null is the same
 * code path as "this listing has no photograph", which is not an error and
 * which will be the common case for a long while. See `listing-photo.tsx`: one
 * honest empty state, not two, and no half-configured deployment can put a
 * broken image in front of a customer.
 */

/**
 * The R2 bucket's public custom domain, on a Cloudflare zone with
 * transformations enabled — e.g. `https://img.mims.ng`. Transformations only
 * work for images on the zone serving them unless origins are explicitly
 * allowlisted, which is the reason the bucket has a domain of its own rather
 * than being fetched from somewhere else.
 */
const IMAGE_BASE = (process.env.NEXT_PUBLIC_IMAGE_BASE_URL ?? '').replace(/\/+$/, '');

/** How the image is fitted into the box asked for. Cloudflare's own vocabulary. */
export type ImageFit = 'cover' | 'contain' | 'scale-down' | 'crop' | 'pad';

export interface ImageTransform {
  width: number;
  height?: number;
  /**
   * `contain` is the default on purpose. A part photographed against a plain
   * background is a picture OF THE PART, and cropping it to fill a tile can cut
   * off the bracket or the connector — the exact detail a buyer is checking.
   */
  fit?: ImageFit;
  /** 1–100. 82 is the point where a moulded plastic surface stops banding. */
  quality?: number;
}

/**
 * The widths we actually ask Cloudflare for. Kept to a short fixed ladder
 * because every distinct width is a separate transformation, separately billed
 * and separately cached — a continuous range would multiply both for a
 * difference nobody can see.
 */
const WIDTH_LADDER = [320, 480, 640, 960, 1280] as const;

/**
 * A key is a path inside the bucket and nothing else. Anything that could climb
 * out of it, or that is already a URL, is refused rather than corrected: this
 * value reaches us from the database, and building a URL out of an unexpected
 * one would be how an open redirect or an off-origin fetch gets in.
 */
function isSafeKey(key: string): boolean {
  return key.length > 0 && !key.startsWith('/') && !key.includes('..') && !key.includes('://');
}

function encodeKey(key: string): string {
  return key.split('/').map(encodeURIComponent).join('/');
}

function serialiseOptions(transform: ImageTransform): string {
  const options = [
    `width=${Math.round(transform.width)}`,
    transform.height ? `height=${Math.round(transform.height)}` : null,
    `fit=${transform.fit ?? 'contain'}`,
    `quality=${transform.quality ?? 82}`,
    // Content-negotiated: AVIF where it is accepted, WebP or JPEG where it is not.
    'format=auto',
    // Strip EXIF. Our own shots would otherwise carry the GPS position of the
    // warehouse, and a supplier's would carry theirs.
    'metadata=none',
  ];
  return options.filter(Boolean).join(',');
}

/**
 * One transformed URL, or null when we cannot honestly produce one — either
 * because no storage base is configured or because the key is not a key.
 */
export function listingImageUrl(
  storageKey: string | null | undefined,
  transform: ImageTransform,
): string | null {
  if (!IMAGE_BASE || !storageKey || !isSafeKey(storageKey)) return null;
  return `${IMAGE_BASE}/cdn-cgi/image/${serialiseOptions(transform)}/${encodeKey(storageKey)}`;
}

/**
 * The `srcset` for a frame, so the browser picks a width for the device rather
 * than us guessing at it. Capped at the largest size the frame is ever drawn
 * at: sending a 1280px bumper to fill a 320px tile is the mobile-data cost this
 * whole module exists to avoid.
 */
export function listingImageSrcSet(
  storageKey: string | null | undefined,
  maxWidth: number,
  transform: Omit<ImageTransform, 'width'> = {},
): string | null {
  if (!IMAGE_BASE || !storageKey || !isSafeKey(storageKey)) return null;

  const widths = WIDTH_LADDER.filter((width) => width <= maxWidth * 2);
  const ladder = widths.length > 0 ? widths : [WIDTH_LADDER[0]];

  return ladder
    .map((width) => `${listingImageUrl(storageKey, { ...transform, width })} ${width}w`)
    .join(', ');
}

/** Whether photography is wired up at all. Drives copy, never a broken frame. */
export function imageDeliveryConfigured(): boolean {
  return IMAGE_BASE.length > 0;
}
