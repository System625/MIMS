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
export const moneySchema = z.object({
  min: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Expected a decimal amount'),
  max: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Expected a decimal amount'),
  currency: z.literal('NGN'),
});
export type Money = z.infer<typeof moneySchema>;

export const healthSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  uptimeSeconds: z.number(),
  version: z.string(),
  checks: z.object({
    database: z.enum(['up', 'down']),
  }),
});
export type Health = z.infer<typeof healthSchema>;
