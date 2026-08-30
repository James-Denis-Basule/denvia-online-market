import type {
  ErrorRequestHandler,
  RequestHandler,
} from 'express';

import mongoose from 'mongoose';

import { AppError } from '../utils/AppError.js';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

function isDatabaseConnectionError(err: unknown): boolean {
  if (!(err instanceof Error)) {
    return false;
  }

  const name = err.name.toLowerCase();
  const message = err.message.toLowerCase();

  return (
    name.includes('mongo') ||
    name.includes('mongoose') ||
    name.includes('mongoerror') ||
    name.includes('mongoservererror') ||
    message.includes('mongodb') ||
    message.includes('server selection') ||
    message.includes('connection') ||
    message.includes('connection refused') ||
    message.includes('connection timed out') ||
    message.includes('topology') ||
    message.includes('ssl') ||
    message.includes('tls')
  );
}

export const errorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next,
) => {
  console.error(err);

  /*
   * Application errors intentionally thrown by the service layer.
   */
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });

    return;
  }

  /*
   * Mongoose validation errors should NOT become 503.
   */
  if (err instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      success: false,
      message: 'Invalid information provided.',
      errors: Object.fromEntries(
        Object.entries(err.errors).map(([field, value]) => [
          field,
          value.message,
        ]),
      ),
    });

    return;
  }

  /*
   * Invalid MongoDB ObjectId.
   */
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      message: 'Invalid resource identifier.',
    });

    return;
  }

  /*
   * Duplicate MongoDB key.
   */
  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: unknown }).code === 11000
  ) {
    res.status(409).json({
      success: false,
      message: 'A record with this information already exists.',
    });

    return;
  }

  /*
   * Actual database/network availability problems.
   */
  if (isDatabaseConnectionError(err)) {
    res.status(503).json({
      success: false,
      message:
        'The service is temporarily unavailable. Please try again shortly.',
    });

    return;
  }

  /*
   * Unknown server error.
   */
  res.status(500).json({
    success: false,
    message: 'Something went wrong on the server. Please try again.',
  });
};