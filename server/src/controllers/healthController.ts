import type { Request, Response } from 'express';

export function getHealth(_req: Request, res: Response) {
  res.status(200).json({
    success: true,
    message: 'Denvia Online Market API is running',
    timestamp: new Date().toISOString(),
  });
}