import mongoose from 'mongoose';
import Order from '../models/Order.js';
import { AppError } from '../utils/AppError.js';

function parseRange(range?: string) {
  // supports forms like '30d', '7d', '90d'
  if (!range) return 30;
  const match = String(range).trim().toLowerCase().match(/^(\d+)d$/);
  if (!match) return 30;
  const days = Number(match[1]);
  return Math.max(1, Math.min(days, 365));
}

function buildDateBoundaries(days: number) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

export async function aggregateOrdersTimeSeries(options?: { range?: string; groupBy?: 'day' | 'week' | 'month'; businessIds?: string[] }) {
  const days = parseRange(options?.range);
  const { start, end } = buildDateBoundaries(days);

  const match: Record<string, unknown> = { createdAt: { $gte: start, $lte: end } };

  if (options?.businessIds && options.businessIds.length) {
    const validIds = options.businessIds.filter((id) => mongoose.isValidObjectId(id)).map((id) => new mongoose.Types.ObjectId(id));
    if (validIds.length) {
      match['items.businessId'] = { $in: validIds };
    }
  }

  const groupFormat = options?.groupBy === 'month' ? { $dateToString: { format: '%Y-%m', date: '$createdAt' } } : { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };

  const pipeline: any[] = [
    { $match: match },
    {
      $group: {
        _id: groupFormat,
        orders: { $sum: 1 },
        revenue: { $sum: '$total' },
      },
    },
    { $sort: { _id: 1 } },
  ];

  const result = await Order.aggregate(pipeline).exec();

  // normalize into daily buckets for the range
  const buckets: Record<string, { orders: number; revenue: number }> = {};
  for (const row of result) {
    buckets[row._id] = { orders: row.orders ?? 0, revenue: row.revenue ?? 0 };
  }

  const points: Array<{ label: string; orders: number; revenue: number }> = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const label = options?.groupBy === 'month' ? `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}` : `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    const v = buckets[label] ?? { orders: 0, revenue: 0 };
    points.push({ label, orders: v.orders, revenue: v.revenue });
    cursor.setDate(cursor.getDate() + 1);
  }

  return { start: start.toISOString(), end: end.toISOString(), points };
}

export async function getOrdersSummaryForRange(range?: string, businessIds?: string[]) {
  const days = parseRange(range);
  const { start, end } = buildDateBoundaries(days);

  const match: Record<string, unknown> = { createdAt: { $gte: start, $lte: end } };

  if (businessIds && businessIds.length) {
    const validIds = businessIds.filter((id) => mongoose.isValidObjectId(id)).map((id) => new mongoose.Types.ObjectId(id));
    if (validIds.length) {
      match['items.businessId'] = { $in: validIds };
    }
  }

  const [totalOrders, totalRevenue, byStatus] = await Promise.all([
    Order.countDocuments(match),
    Order.aggregate([{ $match: match }, { $group: { _id: null, revenue: { $sum: '$total' } } }]).then((r) => (r[0] ? r[0].revenue : 0)),
    Order.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const row of byStatus) {
    statusCounts[row._id ?? 'unknown'] = row.count ?? 0;
  }

  return { start: start.toISOString(), end: end.toISOString(), totalOrders, totalRevenue, statusCounts };
}
