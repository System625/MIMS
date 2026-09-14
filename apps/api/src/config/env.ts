import { z } from 'zod';

/**
 * Environment is validated once, at boot, and fails loudly. Nothing in the app
 * reads process.env directly — everything goes through ConfigService with the
 * types inferred here.
 */
/**
 * dotenv turns an unset `KEY=` into an empty string, not undefined, so a blank
 * line in .env would fail an `.optional()` check that has any constraint on it.
 * Treat blank as genuinely absent.
 */
const blankAsAbsent = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(3333),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_MAX_CONNECTIONS: z.coerce.number().int().min(1).default(10),
  DATABASE_LOG_QUERIES: z
    .string()
    .optional()
    .transform((v) => v === 'true'),

  /** Comma-separated list of allowed browser origins (web + admin). */
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000,http://localhost:5173')
    .transform((v) =>
      v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),

  // Optional until auth flows are wired up; required before the admin login ships.
  BETTER_AUTH_SECRET: blankAsAbsent(z.string().min(16)),
  BETTER_AUTH_URL: blankAsAbsent(z.url()),

  /** NHTSA vPIC. Free and keyless; overridable so tests can point at a stub. */
  VPIC_BASE_URL: z.url().default('https://vpic.nhtsa.dot.gov/api'),
  VPIC_TIMEOUT_MS: z.coerce.number().int().default(6000),

  /**
   * PAYSTACK. Optional so the API boots without it — but every payment route
   * then refuses, rather than half-working. The secret key is also the webhook
   * signing key, which is why there is no separate webhook secret here.
   */
  PAYSTACK_SECRET_KEY: blankAsAbsent(z.string().startsWith('sk_')),
  /** Safe to ship to the browser. Only needed if we ever move to inline checkout. */
  PAYSTACK_PUBLIC_KEY: blankAsAbsent(z.string().startsWith('pk_')),
  PAYSTACK_BASE_URL: z.url().default('https://api.paystack.co'),
  PAYSTACK_TIMEOUT_MS: z.coerce.number().int().default(12_000),
  /**
   * Where a receipt goes for a guest who gave no email. Paystack requires an
   * address on initialize; this makes the fallback a deliberate, routable choice
   * rather than an invented address that bounces.
   */
  PAYSTACK_FALLBACK_EMAIL_DOMAIN: z.string().min(3).default('receipts.mims.ng'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment:\n${issues}`);
  }
  return parsed.data;
}
