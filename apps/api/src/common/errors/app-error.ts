import { HttpException } from '@nestjs/common';
import type { ErrorCode } from '@mims/contracts';

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  VALIDATION_FAILED: 422,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  UPSTREAM_UNAVAILABLE: 503,
  INTERNAL_ERROR: 500,
};

export interface AppErrorDetail {
  path: string;
  message: string;
}

/**
 * The only error type the app throws deliberately. Carries a contract error code
 * so the HTTP status and the response body never drift apart.
 */
export class AppError extends HttpException {
  readonly code: ErrorCode;
  readonly details?: AppErrorDetail[];

  constructor(code: ErrorCode, message: string, details?: AppErrorDetail[]) {
    super({ code, message, details }, STATUS_BY_CODE[code]);
    this.code = code;
    this.details = details;
  }

  static notFound(what: string): AppError {
    return new AppError('NOT_FOUND', `${what} was not found.`);
  }
}
