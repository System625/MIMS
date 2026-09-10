import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { Database } from '@mims/db';
import { tables } from '@mims/db';

/**
 * Better Auth configuration only. No routes are mounted and no guards exist yet —
 * flows get wired up once the admin dashboard needs a login.
 *
 * When that happens: mount `toNodeHandler(auth)` on `/api/auth/*` in main.ts and
 * add a guard that reads the session. Consumer estimates stay anonymous; the
 * `role` column on the user table is what gates the admin dashboard.
 */
export function createAuth(options: { db: Database; secret: string; baseUrl: string }) {
  return betterAuth({
    database: drizzleAdapter(options.db, {
      provider: 'pg',
      schema: {
        user: tables.user,
        session: tables.session,
        account: tables.account,
        verification: tables.verification,
      },
    }),
    secret: options.secret,
    baseURL: options.baseUrl,
    emailAndPassword: { enabled: true },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
