import { formatRange, formatRangeCompact } from '@/lib/money';
import type { EstimateView } from '@/mock/parts';
import { vehicleTitle } from '@/mock/vehicles';

/**
 * What leaves the app.
 *
 * The WhatsApp message is the most-used exit by a distance, and the design's
 * constraint on it is unusual and correct: it has to be useful with the link
 * never opened. A mechanic will read this out of a chat thread on someone else's
 * phone. So part numbers lead, ranges sit beside them, the total is separated,
 * and the caveat is the last thing before the URL — plain text throughout, with
 * no formatting that breaks on an older client.
 */

const SHARE_ORIGIN = 'mims.ng';

function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${d.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })} ${d.getUTCFullYear()}`;
}

export function shareUrl(reference: string): string {
  return `${SHARE_ORIGIN}/e/${reference}`;
}

export function whatsappMessage(estimate: EstimateView): string {
  const car = vehicleTitle(estimate.vehicle);
  const chassis = estimate.items.length > 0 ? deriveChassis(estimate) : null;
  const priced = estimate.items.filter((item) => item.isPriced);

  const lines: string[] = [
    `MIMS estimate ${estimate.reference}`,
    chassis ? `${car} (${chassis})` : car,
    `Parts needed, Lagos prices, ${shortDate(estimate.createdAt)}:`,
    '',
  ];

  estimate.items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.partName}`);
    const number = item.mpn ?? 'part number not on file';
    const price = item.price ? formatRangeCompact(item.price).replace('₦', '₦') : 'not priced';
    // Three spaces, not a tab: tabs collapse in some WhatsApp builds and the
    // indent is what lets someone find a number without hunting.
    lines.push(`   ${number} — ${price}`);
  });

  lines.push('');
  if (estimate.subtotal) {
    lines.push(`Total for the ${priced.length} priced part${priced.length === 1 ? '' : 's'}:`);
    lines.push(formatRange(estimate.subtotal));
  } else {
    lines.push('No parts on this list have a verified Nigerian price yet.');
  }

  lines.push('');
  lines.push('Parts only — no labour or paint. Low end is good aftermarket, high end is genuine.');
  lines.push('');
  lines.push(`Full estimate: ${shareUrl(estimate.reference)}`);

  return lines.join('\n');
}

/** The chassis code is not on `ResolvedVehicle` yet; the detail line carries it. */
function deriveChassis(estimate: EstimateView): string | null {
  const match = estimate.items
    .map((item) => /chassis ([A-Z0-9]+)/.exec(item.detail)?.[1])
    .find(Boolean);
  return match ?? null;
}

export function whatsappHref(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
