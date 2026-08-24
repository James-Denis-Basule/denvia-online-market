import api from './api';

export type NotificationRecord = {
  _id: string;
  userId?: string;
  type: 'order_status' | 'delivery_status' | 'payment_status' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

const demoNotifications: NotificationRecord[] = [
  {
    _id: 'demo-notification-1',
    type: 'order_status',
    title: 'Order packed',
    message: 'Your order is being prepared for dispatch and should leave the warehouse soon.',
    isRead: false,
    createdAt: new Date().toISOString(),
    metadata: { orderId: 'demo-order-1', status: 'packed' },
  },
  {
    _id: 'demo-notification-2',
    type: 'delivery_status',
    title: 'Courier assigned',
    message: 'A delivery agent was assigned and tracking is now available for your order.',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    metadata: { orderId: 'demo-order-2', status: 'assigned' },
  },
];

export async function getNotifications(limit = 5, unreadOnly = false) {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return demoNotifications.filter((notification) => !unreadOnly || !notification.isRead).slice(0, limit);
  }

  try {
    const response = await api.get(`/notifications?limit=${limit}${unreadOnly ? '&unread=true' : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const notifications = Array.isArray(response.data?.data) ? response.data.data : [];
    return notifications;
  } catch {
    return demoNotifications.filter((notification) => !unreadOnly || !notification.isRead).slice(0, limit);
  }
}

export async function markNotificationAsRead(notificationId: string) {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return demoNotifications.map((notification) =>
      notification._id === notificationId ? { ...notification, isRead: true } : notification,
    );
  }

  try {
    const response = await api.patch(
      `/notifications/${notificationId}/read`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );

    return response.data?.data ?? null;
  } catch {
    return demoNotifications.find((notification) => notification._id === notificationId) ?? null;
  }
}
