import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { PaginationMeta } from '@mims/contracts';

/** Return this from a controller to attach pagination meta to the envelope. */
export class PaginatedResult<T> {
  constructor(
    readonly items: T[],
    readonly meta: PaginationMeta,
  ) {}
}

/**
 * Wraps every successful response as `{ data }`, or `{ data, meta }` for a
 * PaginatedResult. Controllers return plain values; the envelope is applied in
 * exactly one place so no route can invent its own shape.
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((value: unknown) => {
        if (value instanceof PaginatedResult) {
          return { data: value.items, meta: value.meta };
        }
        return { data: value };
      }),
    );
  }
}
