import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ApiError, ErrorCode } from '@mims/contracts';
import { AppError } from '../errors/app-error';

/**
 * Single exit point for every failure. Guarantees the `{ error: { code, message } }`
 * shape and makes sure an unexpected exception never leaks a stack trace or a
 * database message to a client.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof AppError) {
      const body: ApiError = {
        error: { code: exception.code, message: exception.message, details: exception.details },
      };
      response.status(exception.getStatus()).json(body);
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body: ApiError = {
        error: { code: mapStatusToCode(status), message: exception.message },
      };
      response.status(status).json(body);
      return;
    }

    this.logger.error(
      `Unhandled exception on ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    const body: ApiError = {
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong on our side.' },
    };
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
  }
}

function mapStatusToCode(status: number): ErrorCode {
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'VALIDATION_FAILED';
    case 429:
      return 'RATE_LIMITED';
    case 503:
      return 'UPSTREAM_UNAVAILABLE';
    default:
      return 'INTERNAL_ERROR';
  }
}
