import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

/**
 * `drizzle-kit generate` only reads the schema, so it must work without a live
 * database — a placeholder keeps migration authoring possible offline. The
 * commands that actually connect (migrate, push, studio) fail loudly instead.
 */
const url = process.env.DATABASE_URL ?? 'postgresql://localhost:5432/mims_unset';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url },
  casing: 'snake_case',
  verbose: true,
  strict: true,
});
