import { useEffect, useMemo, useState } from 'react';

import Card from '../components/ui/Card';
import Container from '../components/layout/Container';
import api from '../services/api';
import AnalyticsChart from '../components/AnalyticsChart';
import ChatWidget from '../components/ChatWidget';
import { getNotifications, markNotificationAsRead, type NotificationRecord } from '../services/notificationService';

type DashboardSummary = {
  overview: {
    totalOrders: number;
    pendingOrders: number;
    paidOrders: number;
    shippedOrders: number;
    completedOrders: number;
    totalRevenue: number;
    paidRevenue: number;
    completedRevenue: number;
    averageOrderValue: number;
  };
  recentOrders: Array<{
    _id: string;
    status: string;
    total: number;
    currency: string;
    itemCount: number;
    createdAt?: string;
  }>;
};

type SellerOrder = {
  _id: string;
  status: string;
  total: number;
  currency: string;
  items?: Array<{ name?: string; quantity?: number }>;
  createdAt?: string;
};

type MarketingUsageSummary = {
  totalCreditsUsed: number;
  recentUsage: Array<{
    _id?: string;
    action?: string;
    creditsUsed?: number;
    createdAt?: string;
  }>;
};

type ProviderStatusSummary = {
  payment: Array<{
    name: string;
    type: 'payment';
    mode: 'demo' | 'live';
    enabled: boolean;
    configured: boolean;
    status: 'demo' | 'ready' | 'missing-config';
  }>;
  delivery: Array<{
    name: string;
    type: 'delivery';
    mode: 'demo' | 'live';
    enabled: boolean;
    configured: boolean;
    status: 'demo' | 'ready' | 'missing-config';
  }>;
  mode: {
    payment: 'demo' | 'live';
    delivery: 'demo' | 'live';
  };
  warnings: string[];
};

const demoSummary: DashboardSummary = {
  overview: {
    totalOrders: 0,
    pendingOrders: 0,
    paidOrders: 0,
    shippedOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    paidRevenue: 0,
    completedRevenue: 0,
    averageOrderValue: 0,
  },
  recentOrders: [],
};

const statusOptions = ['pending', 'paid', 'confirmed', 'packed', 'shipped', 'completed', 'cancelled'];

function formatCurrency(amount: number, currency = 'UGX') {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatStatus(status: string) {
  return status
    .split('_')
    .map((value) => value.charAt(0).toUpperCase() + value.slice(1))
    .join(' ');
}

function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary>(demoSummary);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [analyticsPoints, setAnalyticsPoints] = useState<Array<{ label: string; orders: number; revenue: number }>>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [providerStatus, setProviderStatus] = useState<ProviderStatusSummary | null>(null);
  const [marketingUsage, setMarketingUsage] = useState<MarketingUsageSummary>({
    totalCreditsUsed: 24,
    recentUsage: [
      { _id: 'demo-usage-1', action: 'AI content draft', creditsUsed: 6, createdAt: new Date().toISOString() },
      { _id: 'demo-usage-2', action: 'Audience analysis', creditsUsed: 18, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString() },
    ],
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const loadDashboard = async () => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      setSummary(demoSummary);
      setOrders([]);
      setNotifications(await getNotifications(5));

      try {
        const systemResponse = await api.get('/system/status');
        setProviderStatus(systemResponse.data?.providers ?? null);
      } catch {
        setProviderStatus(null);
      }

      try {
        const usageResponse = await api.get('/marketing/usage', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMarketingUsage(usageResponse.data?.data ?? { totalCreditsUsed: 24, recentUsage: [] });
      } catch {
        setMarketingUsage({ totalCreditsUsed: 24, recentUsage: [] });
      }

      setLoading(false);
      return;
    }

    try {
      const [summaryResponse, ordersResponse, notificationResponse, systemResponse, usageResponse] = await Promise.all([
        api.get('/marketplace/orders/seller/summary', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get('/marketplace/orders/seller', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        getNotifications(5),
        api.get('/system/status'),
        api.get('/marketing/usage', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setSummary(summaryResponse.data?.data ?? demoSummary);
      setOrders(Array.isArray(ordersResponse.data?.data) ? ordersResponse.data.data : []);
      setNotifications(notificationResponse);
      setProviderStatus(systemResponse.data?.providers ?? null);
      setMarketingUsage(usageResponse.data?.data ?? { totalCreditsUsed: 24, recentUsage: [] });

      try {
        const tsResponse = await api.get('/marketplace/analytics/orders/timeseries?range=30d', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAnalyticsPoints(tsResponse.data?.data?.points ?? []);
      } catch {
        setAnalyticsPoints([]);
      }
    } catch {
      setSummary(demoSummary);
      setOrders([]);
      setNotifications(await getNotifications(5));
      setAnalyticsPoints([]);

      try {
        const systemResponse = await api.get('/system/status');
        setProviderStatus(systemResponse.data?.providers ?? null);
      } catch {
        setProviderStatus(null);
      }

      try {
        const usageResponse = await api.get('/marketing/usage', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMarketingUsage(usageResponse.data?.data ?? { totalCreditsUsed: 24, recentUsage: [] });
      } catch {
        setMarketingUsage({ totalCreditsUsed: 24, recentUsage: [] });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const aiCreditsRemaining = Math.max(0, 100 - marketingUsage.totalCreditsUsed);

  const handleStatusChange = async (orderId: string, nextStatus: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    setUpdatingOrderId(orderId);

    try {
      await api.patch(
        `/marketplace/orders/${orderId}/status`,
        { status: nextStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      await loadDashboard();
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleNotificationRead = async (notificationId: string) => {
    const token = localStorage.getItem('accessToken');

    setNotifications((current) =>
      current.map((notification) =>
        notification._id === notificationId ? { ...notification, isRead: true } : notification,
      ),
    );

    if (!token) return;

    try {
      await markNotificationAsRead(notificationId);
    } catch {
      setNotifications((current) =>
        current.map((notification) =>
          notification._id === notificationId ? { ...notification, isRead: true } : notification,
        ),
      );
    }
  };

  const stats = [
    {
      label: 'Total orders',
      value: String(summary.overview.totalOrders),
      tone: 'text-blue-600',
    },
    {
      label: 'Pending orders',
      value: String(summary.overview.pendingOrders),
      tone: 'text-yellow-600',
    },
    {
      label: 'Paid revenue',
      value: formatCurrency(summary.overview.paidRevenue),
      tone: 'text-indigo-600',
    },
    {
      label: 'Completed',
      value: String(summary.overview.completedOrders),
      tone: 'text-green-600',
    },
  ];

  return (
    <main className="py-12">
      <Container>
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Dashboard</p>
          <h1 className="text-3xl font-bold text-gray-900">Seller overview</h1>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading seller summary...</p>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              {stats.map((stat) => (
                <Card key={stat.label} className="text-center">
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <h2 className={`mt-3 text-2xl font-bold ${stat.tone}`}>{stat.value}</h2>
                </Card>
              ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-4">
              <Card>
                <h3 className="text-lg font-semibold text-gray-900">Revenue (last 30 days)</h3>
                <div className="mt-3">
                  <AnalyticsChart points={analyticsPoints} height={140} />
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                <div className="mt-3 space-y-3">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-gray-500">No notifications yet.</p>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification._id}
                        className={`rounded-lg border p-3 ${notification.isRead ? 'border-gray-200 bg-gray-50' : 'border-blue-200 bg-blue-50'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                            <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                          </div>
                          {!notification.isRead && (
                            <button
                              type="button"
                              onClick={() => void handleNotificationRead(notification._id)}
                              className="rounded-md border border-blue-200 bg-white px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">Provider status</h3>
                  {providerStatus && (
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                      {providerStatus.mode.payment.toUpperCase()} / {providerStatus.mode.delivery.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="mt-3 space-y-4">
                  {providerStatus ? (
                    <>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Payment</p>
                        <div className="mt-2 space-y-2">
                          {providerStatus.payment.map((provider) => (
                            <div key={provider.name} className="flex items-center justify-between gap-3 text-sm">
                              <span className="font-medium text-gray-700">{formatStatus(provider.name)}</span>
                              <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${provider.status === 'ready' ? 'bg-green-100 text-green-700' : provider.status === 'demo' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                {provider.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Delivery</p>
                        <div className="mt-2 space-y-2">
                          {providerStatus.delivery.map((provider) => (
                            <div key={provider.name} className="flex items-center justify-between gap-3 text-sm">
                              <span className="font-medium text-gray-700">{formatStatus(provider.name)}</span>
                              <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${provider.status === 'ready' ? 'bg-green-100 text-green-700' : provider.status === 'demo' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                {provider.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {providerStatus.warnings.length > 0 && (
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">Warnings</p>
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-600">
                            {providerStatus.warnings.map((warning) => (
                              <li key={warning}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Provider health is unavailable right now.</p>
                  )}
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">AI marketing</h3>
                  <span className="rounded-full bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-700">
                    {aiCreditsRemaining} left
                  </span>
                </div>
                <div className="mt-3">
                  <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
                    <span>Credits used</span>
                    <span>{marketingUsage.totalCreditsUsed}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-violet-500"
                      style={{ width: `${Math.min(100, (marketingUsage.totalCreditsUsed / 100) * 100)}%` }}
                    />
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-gray-600">
                    {marketingUsage.recentUsage.slice(0, 2).map((usage) => (
                      <div key={usage._id ?? usage.action ?? 'usage'} className="flex justify-between gap-3">
                        <span>{usage.action ?? 'AI action'}</span>
                        <span className="font-medium text-gray-800">{usage.creditsUsed ?? 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

            </div>

            <div className="mt-8">
              <ChatWidget />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <Card>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-gray-900">Recent orders</h2>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All statuses</option>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {formatStatus(status)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  {filteredOrders.length === 0 ? (
                    <p className="text-sm text-gray-500">No orders match the current filter.</p>
                  ) : (
                    filteredOrders.map((order) => (
                      <div key={order._id} className="rounded-lg border border-gray-200 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-medium text-gray-900">#{order._id.slice(-6).toUpperCase()}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(order.createdAt ?? Date.now()).toLocaleDateString()} • {order.items?.length ?? 0} item(s)
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(order.total, order.currency)}
                            </span>
                            <select
                              value={order.status}
                              onChange={(event) => void handleStatusChange(order._id, event.target.value)}
                              disabled={updatingOrderId === order._id}
                              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {formatStatus(status)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <Card>
                <h2 className="text-xl font-semibold text-gray-900">Performance snapshot</h2>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Total revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(summary.overview.totalRevenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Average order value</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(summary.overview.averageOrderValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Shipped</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.overview.shippedOrders}</p>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}
      </Container>
    </main>
  );
}

export default DashboardPage;
