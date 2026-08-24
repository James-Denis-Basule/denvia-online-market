import type { Request, Response, NextFunction } from 'express';
import { aggregateOrdersTimeSeries, getOrdersSummaryForRange } from '../services/analyticsService.js';

export async function ordersTimeSeriesController(req: Request, res: Response, next: NextFunction) {
  try {
    const { range, groupBy } = req.query as Record<string, string>;
    const businessIds = typeof req.query.businessIds === 'string' ? req.query.businessIds.split(',').map((s) => s.trim()) : Array.isArray(req.query.businessIds) ? (req.query.businessIds as string[]) : [];

    const data = await aggregateOrdersTimeSeries({ range, groupBy: (groupBy as any) ?? 'day', businessIds });

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function ordersSummaryController(req: Request, res: Response, next: NextFunction) {
  try {
    const { range } = req.query as Record<string, string>;
    const businessIds = typeof req.query.businessIds === 'string' ? req.query.businessIds.split(',').map((s) => s.trim()) : Array.isArray(req.query.businessIds) ? (req.query.businessIds as string[]) : [];

    const data = await getOrdersSummaryForRange(range, businessIds);

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
