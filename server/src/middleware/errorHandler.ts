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

function isDatabaseError(err: unknown): boolean {
  if (err instanceof mongoose.Error) {
    return true;
  }

  if (err instanceof Error) {
    const name = err.name.toLowerCase();
    const message = err.message.toLowerCase();

    return (
      name.includes('mongo') ||
      name.includes('mongoose') ||
      name.includes('network') ||
      message.includes('mongodb') ||
      message.includes('mongoose') ||
      message.includes('mongo') ||
      message.includes('ssl') ||
      message.includes('tls') ||
      message.includes('server selection') ||
      message.includes('connection')
    );
  }

  return false;
}

export const errorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next,
) => {
  console.error(err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  if (isDatabaseError(err)) {
    res.status(503).json({
      success: false,
      message:
        'The service is temporarily unavailable. Please try again shortly.',
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};
