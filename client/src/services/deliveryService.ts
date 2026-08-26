import api from './api';

export type DeliveryEvent = {
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'failed';
  courier?: string;
  trackingCode?: string;
  createdAt?: string;
};

export type DeliveryRecord = {
  orderId: string;
  provider?: string;
  courier?: string;
  trackingCode?: string;
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'failed';
  events?: DeliveryEvent[];
  createdAt?: string;
};

export async function getDelivery(orderId: string) {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    // demo fallback: return fake events if order progressed in demo
    return null;
  }

  const response = await api.get(`/marketplace/orders/${orderId}/delivery`);

  return response.data.data as DeliveryRecord | null;
}

export async function updateDeliveryStatus(
  orderId: string,
  status: string,
  metadata?: { courier?: string; trackingCode?: string },
) {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return {
      orderId,
      provider: metadata?.courier ?? 'local_dispatch',
      courier: metadata?.courier ?? 'local_dispatch',
      trackingCode: metadata?.trackingCode ?? `TRK-DEMO-${Date.now()}`,
      status: status as DeliveryRecord['status'],
      events: [
        {
          status: status as DeliveryRecord['status'],
          courier: metadata?.courier,
          trackingCode: metadata?.trackingCode,
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
    } as DeliveryRecord;
  }

  const response = await api.patch(
    `/marketplace/orders/${orderId}/delivery/status`,
    { status, ...metadata },
  );

  return response.data.data as DeliveryRecord;
}