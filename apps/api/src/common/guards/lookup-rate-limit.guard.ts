import { CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AppError } from '../errors/app-error';

/**
 * A RATE LIMIT ON THE GUEST ORDER LOOKUP.
 *
 * Item 7 built the lookup to give ONE failure for both halves, so a stranger
 * cannot learn that a reference exists by watching which error comes back. That
 * defence only holds if they cannot simply try every reference: seven digits is
 * ten million, which is a lot for a person and nothing for a script, and the
 * phone number that gates it is often guessable for somebody who already knows
 * the customer. Without a limit the careful error handling upstairs is theatre.
 *
 * WHAT THIS IS NOT. It is an in-process counter, so it limits per container.
 * Railway runs one today, which is why this is worth having; the day the API
 * runs two, each gets its own allowance and the effective limit doubles. The
 * fix then is a shared store — Redis, or Postgres if the volume stays small —
 * and the shape of this guard does not change, only where the map lives. That
 * is written down here rather than discovered during an incident.
 *
 * It is also deliberately not a general-purpose throttler. One guard, one
 * route, one honest limitation.
 */
@Injectable()
export class LookupRateLimitGuard implements CanActivate {
  private readonly attempts = new Map<string, number[]>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = clientKey(request);
    const now = Date.now();

    const recent = (this.attempts.get(key) ?? []).filter((at) => now - at < WINDOW_MS);

    if (recent.length >= MAX_ATTEMPTS) {
      /*
       * Says how long, because the overwhelming majority of people who hit this
       * are customers who mistyped their own phone number three times, not
       * attackers — and "try again later" with no number is the kind of message
       * that turns a frustrated customer into a phone call we cannot take.
       */
      const retryInSeconds = Math.ceil((WINDOW_MS - (now - recent[0]!)) / 1000);
      throw new AppError(
        'RATE_LIMITED',
        `Too many lookups from this connection. Try again in ${retryInSeconds > 60 ? `${Math.ceil(retryInSeconds / 60)} minutes` : `${retryInSeconds} seconds`}.`,
      );
    }

    recent.push(now);
    this.attempts.set(key, recent);
    this.sweep(now);
    return true;
  }

  /**
   * Drops keys nobody has used inside the window. Without this the map is a
   * slow memory leak keyed by every IP that ever looked up an order.
   */
  private sweep(now: number): void {
    if (this.attempts.size < SWEEP_ABOVE) return;
    for (const [key, times] of this.attempts) {
      if (times.every((at) => now - at >= WINDOW_MS)) this.attempts.delete(key);
    }
  }
}

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const SWEEP_ABOVE = 1000;

/**
 * Railway terminates TLS in front of us, so the socket address is the proxy's
 * for every request. `x-forwarded-for` is the caller, and only its FIRST entry
 * is meaningful — the rest is whatever the client felt like sending.
 */
function clientKey(request: Request): string {
  const forwarded = request.headers['x-forwarded-for'];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0];
  return (first ?? request.ip ?? 'unknown').trim();
}
