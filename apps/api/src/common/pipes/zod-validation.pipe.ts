import { type PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';
import { AppError } from '../errors/app-error';

/**
 * Every route input — body, query and params alike — passes through a Zod schema
 * from `@mims/contracts`. There is no second place where request shapes are
 * described, and no hand-written DTO class anywhere in this codebase.
 */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;

    throw new AppError(
      'VALIDATION_FAILED',
      'The request did not match the expected shape.',
      result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    );
  }
}

/** Shorthand so controllers read as `@Body(zodBody(createEstimateRequestSchema))`. */
export const zodPipe = <T>(schema: ZodType<T>): ZodValidationPipe<T> =>
  new ZodValidationPipe(schema);
