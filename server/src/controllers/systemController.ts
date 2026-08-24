import type { Request, Response } from 'express';
import mongoose from 'mongoose';

import { getProviderHealthSummary } from '../services/providerIntegrationService.js';

export function getSystemStatus(_req: Request, res: Response) {
  const databaseStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  } as const;

  const databaseStatus =
    databaseStates[mongoose.connection.readyState as 0 | 1 | 2 | 3];

  res.status(200).json({
    success: true,
    application: 'Denvia Online Market',
    status: 'running',
    database: databaseStatus,
    providers: getProviderHealthSummary(),
    timestamp: new Date().toISOString(),
  });
}