import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

export type Database = ReturnType<typeof createDatabase>;

export interface DatabaseOptions {
  /** Postgres connection string. Railway provides this as DATABASE_URL. */
  url: string;
  /** Serverless/edge callers should keep this at 1; the API can pool. */
  maxConnections?: number;
  logQueries?: boolean;
}

export function createDatabase({ url, maxConnections = 10, logQueries = false }: DatabaseOptions) {
  const client = postgres(url, {
    max: maxConnections,
    // Railway's internal network terminates idle sockets; keep the pool honest.
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return drizzle(client, { schema, logger: logQueries, casing: 'snake_case' });
}

export { schema };
