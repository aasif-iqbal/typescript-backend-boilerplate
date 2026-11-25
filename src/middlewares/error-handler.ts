import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../core/errors/app-errors.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

interface FormattedError {
  statusCode: number;
  message: string;
  field?: string;
}

const handlePrismaError = (err: Prisma.PrismaClientKnownRequestError): FormattedError => {
  switch (err.code) {
    case 'P2002': {
      // Meta target contains the violating field(s), e.g., ['email']
      const target = Array.isArray(err.meta?.target)
        ? (err.meta?.target as string[]).join(', ')
        : (err.meta?.target as string) || 'field';
      return {
        statusCode: 409,
        message: `A record with this ${target} already exists.`,
        field: target,
      };
    }

    case 'P2025':
      return {
        statusCode: 404,
        message: (err.meta?.cause as string) || 'The requested record was not found.',
      };

    case 'P2003': {
      const field = (err.meta?.field_name as string) || 'referenced relation';
      return {
        statusCode: 400,
        message: `Invalid reference: ${field} does not exist.`,
      };
    }

    case 'P1000':
    case 'P1001':
    case 'P1002':
    case 'P1008':
    case 'P1017':
      return {
        statusCode: 503,
        message: 'Database service is temporarily unavailable. Please try again shortly.',
      };

    default:
      return {
        statusCode: 500,
        message: 'A database error occurred.',
      };
  }
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // 1. Explicit domain application errors (thrown manually by services)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'fail',
      message: err.message,
    });
    return;
  }

  // 2. Prisma Known Request Errors (unique constraints, not found, DB timeouts)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const { statusCode, message, field } = handlePrismaError(err);
    
    logger.warn({ code: err.code, meta: err.meta, message: err.message }, 'Prisma known error handled');

    res.status(statusCode).json({
      status: statusCode >= 500 ? 'error' : 'fail',
      message,
      ...(field ? { field } : {}),
    });
    return;
  }

  // 3. Prisma Validation Errors (bad queries that slipped past TS/Zod)
  if (err instanceof Prisma.PrismaClientValidationError) {
    logger.warn({ err: (err as Error).message }, 'Prisma validation error');
    res.status(400).json({
      status: 'fail',
      message: 'Invalid query parameters provided to database.',
    });
    return;
  }

  // 4. Prisma Connection/Driver Panics
  if (
    err instanceof Prisma.PrismaClientInitializationError ||
    err instanceof Prisma.PrismaClientRustPanicError
  ) {
    logger.error({ err }, 'Prisma critical infrastructure failure');
    res.status(503).json({
      status: 'error',
      message: 'Database connection failed. Please try again later.',
    });
    return;
  }

  // 5. Catch-all for unhandled system exceptions
  logger.error({ err }, 'Unhandled server exception');

  const isProduction = env.NODE_ENV === 'production';
  const errorMessage = err instanceof Error ? err.message : 'Internal server error';

  res.status(500).json({
    status: 'error',
    message: isProduction ? 'An unexpected error occurred. Please try again later.' : errorMessage,
  });
};