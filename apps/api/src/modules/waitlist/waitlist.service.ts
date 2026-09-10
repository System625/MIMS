import { Injectable } from '@nestjs/common';
import type { JoinWaitlistRequest, WaitlistEntry } from '@mims/contracts';

@Injectable()
export class WaitlistService {
  /**
   * Idempotent by (email, source): signing up twice from the same section is a
   * no-op that still reports success, so the UI never has to explain a duplicate.
   */
  join(request: JoinWaitlistRequest): Promise<WaitlistEntry> {
    // TODO: insert … on conflict (email, source) do nothing … returning.
    return Promise.resolve({
      id: '00000000-0000-4000-8000-000000000071',
      email: request.email,
      source: request.source,
      vehicleNote: request.vehicleNote ?? null,
      createdAt: new Date().toISOString(),
    });
  }
}
