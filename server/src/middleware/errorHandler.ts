import type {
  ErrorRequestHandler,
  RequestHandler,
} from 'express';
import { AppError } from '../utils/AppError.js';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

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

  const message =
    err instanceof Error ? err.message : 'Internal server error';

  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : message,
  });
};