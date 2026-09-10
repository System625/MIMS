import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createDatabase, type Database } from '@mims/db';
import type { Env } from '../config/env';

export const DATABASE = Symbol('DATABASE');

/**
 * Global so any service can inject the Drizzle instance without re-importing a
 * module. There is exactly one pool per process.
 */
@Global()
@Module({
  providers: [
    {
      provide: DATABASE,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): Database =>
        createDatabase({
          url: config.get('DATABASE_URL', { infer: true }),
          maxConnections: config.get('DATABASE_MAX_CONNECTIONS', { infer: true }),
          logQueries: config.get('DATABASE_LOG_QUERIES', { infer: true }),
        }),
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
