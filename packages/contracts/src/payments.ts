import { z } from 'zod';
import { priceSchema, uuidSchema } from './common.js';
import { paymentChannelSchema, paymentStatusSchema } from './enums.js';

/**
 * PAYMENTS — Paystack, and the rules that keep it honest.
 *
 * Amounts here are Naira decimal strings, as everywhere else in this system. The
 * conversion to kobo happens in one place only: the Paystack adapter at the edge.
 *
 * Nothing is fulfilled on a redirect. A customer can arrive at the callback URL
 * with a reference they invented, so the callback is a navigation event and not
 * evidence. Value moves when a server-side verify, or a signature-checked
 * webhook, reports `data.status === 'success'` for the right amount and currency.
 */

export const initializePaymentRequestSchema = z.object({
  orderReference: z.string().trim().min(4),
  /** Where Paystack returns the customer. Server-verified on arrival regardless. */
  callbackUrl: z.url().optional(),
});
export type InitializePaymentRequest = z.infer<typeof initializePaymentRequestSchema>;

export const initializePaymentResultSchema = z.object({
  /** Our reference, which is what we verify against later. */
  reference: z.string(),
  /** Short-lived. Not a permalink, and not safe to store as one. */
  authorizationUrl: z.url(),
  accessCode: z.string(),
  amount: priceSchema,
});
export type InitializePaymentResult = z.infer<typeof initializePaymentResultSchema>;

/**
 * The result of a server-side verify. `status` is OUR payment status, derived
 * from Paystack's `data.status` — never from the envelope's `status`, which only
 * reports that the API call itself worked.
 */
export const verifyPaymentResultSchema = z.object({
  reference: z.string(),
  status: paymentStatusSchema,
  channel: paymentChannelSchema.nullable(),
  /** "Visa ending 4242", "GTBank transfer" — for the receipt, in plain words. */
  channelDetail: z.string().nullable(),
  amount: priceSchema,
  paidAt: z.iso.datetime().nullable(),
  /** The order this moved, so the confirmation screen can be reached in one hop. */
  orderReference: z.string(),
  orderId: uuidSchema,
  /** Present on failure, in the gateway's own words where they are usable. */
  failureReason: z.string().nullable(),
});
export type VerifyPaymentResult = z.infer<typeof verifyPaymentResultSchema>;
