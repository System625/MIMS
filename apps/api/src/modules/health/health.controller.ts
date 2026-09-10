import { Controller, Get, Inject } from '@nestjs/common';
import { sql } from '@mims/db';
import type { Database } from '@mims/db';
import type { Health } from '@mims/contracts';
import { DATABASE } from '../../database/database.module';

@Controller('health')
export class HealthController {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  @Get()
  async check(): Promise<Health> {
    let database: Health['checks']['database'] = 'down';
    try {
      await this.db.execute(sql`select 1`);
      database = 'up';
    } catch {
      database = 'down';
    }

    return {
      status: database === 'up' ? 'ok' : 'degraded',
      uptimeSeconds: Math.round(process.uptime()),
      version: process.env.npm_package_version ?? '0.0.0',
      checks: { database },
    };
  }
}
