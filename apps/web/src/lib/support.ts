/**
 * WHERE A CUSTOMER REACHES A PERSON — and today, nowhere.
 *
 * MIMS has no published support number, WhatsApp line or address. This was a
 * private constant inside `components/order-tracking.tsx` until the returns
 * policy needed the same answer: a policy that says "tell us within seven days"
 * and then gives no way to tell us is worse than no policy at all. One seam,
 * every screen that escalates.
 *
 * It is a founder's call rather than a build task — so it is a null with a seam
 * around it, not an invented number. Set it and every escalation block on the
 * site comes alive; leave it and they say plainly that there is no line yet,
 * which is at least true. An invented number here is the worst thing on this
 * site to invent: it would be printed on the screen belonging to somebody who
 * has prepaid a stranger and wants to know where their money went.
 */
export interface SupportChannel {
  label: string;
  href: string;
}

export const SUPPORT_CHANNEL: SupportChannel | null = null;
