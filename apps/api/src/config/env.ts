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
