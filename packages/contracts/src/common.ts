import { z } from 'zod';

/**
 * Every API response uses one of two shapes and nothing else:
 *
 *   success  { data: T, meta?: { ... } }
 *   failure  { error: { code, message, details? } }
 *
 * Clients branch on the presence of `error`, never on the HTTP status alone.
 */

export const errorCode = z.enum([
  'BAD_REQUEST',
  'VALIDATION_FAILED',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'UPSTREAM_UNAVAILABLE',
  'INTERNAL_ERROR',
]);
export type ErrorCode = z.infer<typeof errorCode>;

export const apiErrorSchema = z.object({
  error: z.object({
    code: errorCode,
    message: z.string(),
    /** Field-level detail for VALIDATION_FAILED; absent otherwise. */
    details: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  }),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

export const paginationMetaSchema = z.object({
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(25),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function apiResponse<T extends z.ZodType>(data: T) {
  return z.object({ data });
}

export function paginatedResponse<T extends z.ZodType>(item: T) {
  return z.object({ data: z.array(item), meta: paginationMetaSchema });
}

export type ApiResponse<T> = { data: T };
export type PaginatedResponse<T> = { data: T[]; meta: PaginationMeta };

export const uuidSchema = z.uuid();

/**
 * Money crosses the wire as a decimal STRING, matching Postgres numeric. Parsing
 * to a float is the caller's explicit decision, never an accident of transport.
 */
export const decimalAmountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, 'Expected a decimal amount');

export const moneySchema = z.object({
  min: decimalAmountSchema,
  max: decimalAmountSchema,
  currency: z.literal('NGN'),
});
export type Money = z.infer<typeof moneySchema>;

/**
 * A single figure, not a range — the marketplace's shape. An estimate answers
 * "about what will this cost?" and must show a range; a listing answers "what
 * will you charge me?" and a range there would be a haggle, not a price.
 *
 * It is duty-inclusive. Delivery is added once, visibly, before payment.
 */
export const priceSchema = z.object({
  amount: decimalAmountSchema,
  currency: z.literal('NGN'),
});
export type Price = z.infer<typeof priceSchema>;

/**
 * Lead time is ALWAYS a range and never a date. Sea freight from China is 3-6
 * weeks and customs clearance stalls unpredictably on top of that, so a promised
 * delivery date is a promise we cannot keep. Both bounds are days from payment.
 */
export const leadTimeSchema = z.object({
  minDays: z.number().int().min(0),
  maxDays: z.number().int().min(0),
});
export type LeadTime = z.infer<typeof leadTimeSchema>;

/**
 * Nigerian mobile number, AS TYPED: `0803…`, `+234803…` or `234803…`, with or
 * without the spaces and dashes people actually put in them. Phone is the
 * identity at checkout, so this is validated rather than trusted, and
 * normalised to a single form in the service layer.
 *
 * The separators are not a nicety. Nobody writes their own number as eleven
 * unbroken digits — every Nigerian number is spoken and written in groups —
 * and this schema's own error message offers `0803 123 4567` as the example to
 * follow. A rule that rejects the format it recommends fails the one customer
 * who did exactly as asked, at the field that IS the account.
 */
export const nigerianPhoneSchema = z
  .string()
  .trim()
  .regex(
    /^(?:\+?234[\s-]?|0)[789](?:[\s-]?\d){9}$/,
    'Enter a Nigerian mobile number, e.g. 0803 123 4567',
  );

export const healthSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  uptimeSeconds: z.number(),
  version: z.string(),
  checks: z.object({
    database: z.enum(['up', 'down']),
  }),
});
export type Health = z.infer<typeof healthSchema>;
