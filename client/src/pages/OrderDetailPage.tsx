import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Container from '../components/layout/Container';
import api from '../services/api';
import axios from 'axios';
import {
  cancelOrder,
  getOrder,
  type Order,
} from '../services/commerceService';
import { getDelivery, updateDeliveryStatus, type DeliveryRecord } from '../services/deliveryService';

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-indigo-100 text-indigo-800',
  packed: 'bg-purple-100 text-purple-800',
  shipped: 'bg-cyan-100 text-cyan-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

function OrderDetailPage() {
  const { orderId } = useParams();
  const { user } = useAuth();

  const canManageDelivery =
    user?.role === 'business_owner' ||
    user?.role === 'business_staff' ||
    user?.role === 'admin';
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [courier, setCourier] = useState<string>('local_dispatch');
  const [trackingCode, setTrackingCode] = useState<string>('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);

  const [delivery, setDelivery] = useState<DeliveryRecord | null>(null);
  const [deliveryActionLoading, setDeliveryActionLoading] = useState(false);
  const [deliveryActionError, setDeliveryActionError] = useState<string | null>(null);
  const [deliveryActionSuccess, setDeliveryActionSuccess] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      return;
    }

    const loadOrder = async () => {
      const response = await getOrder(orderId);
      setOrder(response);

      // attempt to load delivery info (if any)
      try {
        const d = await getDelivery(orderId);
        setDelivery(d);
      } catch {
        // Delivery information is optional.
      }

      setLoading(false);
    };

    void loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <main className="py-12">
        <Container>
          <p className="text-sm text-gray-500">Loading order...</p>
        </Container>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="py-12">
        <Container>
          <Card>
            <p className="text-gray-600">Order not found.</p>
            <div className="mt-4">
              <Link to="/orders">
                <Button variant="outline">Back to orders</Button>
              </Link>
            </div>
          </Card>
        </Container>
      </main>
    );
  }

  const itemTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <main className="py-12">
      <Container>
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Order</p>
            <h1 className="text-3xl font-bold text-gray-900">#{order._id}</h1>
          </div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyles[order.status] ?? 'bg-gray-100 text-gray-800'}`}
          >
            {order.status}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <h2 className="text-xl font-semibold text-gray-900">Items</h2>
            <div className="mt-4 space-y-3">
              {order.items.map((item) => (
                <div key={`${item.productId}-${item.businessId}`} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {new Intl.NumberFormat('en-UG', { style: 'currency', currency: item.currency ?? order.currency, maximumFractionDigits: 0 }).format(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold text-gray-900">Summary</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{new Intl.NumberFormat('en-UG', { style: 'currency', currency: order.currency, maximumFractionDigits: 0 }).format(itemTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery fee</span>
                <span>{new Intl.NumberFormat('en-UG', { style: 'currency', currency: order.currency, maximumFractionDigits: 0 }).format(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment fee</span>
                <span>{new Intl.NumberFormat('en-UG', { style: 'currency', currency: order.currency, maximumFractionDigits: 0 }).format(order.paymentFee)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-semibold text-gray-900">
                <span>Total</span>
                <span>{new Intl.NumberFormat('en-UG', { style: 'currency', currency: order.currency, maximumFractionDigits: 0 }).format(order.total)}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-900">Payment method</p>
                <p>{order.paymentMethod?.replace('_', ' ') ?? 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Shipping method</p>
                <p>{order.shippingMethod ?? 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Delivery address</p>
                <p>{order.deliveryAddress ?? 'Pickup'}</p>
              </div>
            </div>

            {order.status === 'pending' && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  disabled={cancelLoading}
                  onClick={async () => {
                    if (!order._id) return;

                    const confirmed = window.confirm(
                      'Are you sure you want to cancel this order? This action cannot be undone.',
                    );

                    if (!confirmed) return;

                    setCancelError(null);
                    setCancelLoading(true);

                    try {
                      const cancelledOrder = await cancelOrder(order._id);

                      setOrder(
                        cancelledOrder ?? {
                          ...order,
                          status: 'cancelled',
                        },
                      );
                    } catch (error: unknown) {
                      console.error(error);

                      const message = axios.isAxiosError(error)
                        ? error.response?.data?.message
                        : undefined;

                      setCancelError(
                        message ?? 'Unable to cancel this order. Please try again.',
                      );
                    } finally {
                      setCancelLoading(false);
                    }
                  }}
                >
                  {cancelLoading ? 'Cancelling order...' : 'Cancel order'}
                </Button>

                {cancelError && (
                  <p className="mt-2 text-sm text-red-600">
                    {cancelError}
                  </p>
                )}
              </div>
            )}

            <div className="mt-6">
              <Link to="/orders">
                <Button variant="outline" className="w-full">Back to orders</Button>
              </Link>
            </div>

            {canManageDelivery && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900">Assign delivery</h3>
              <p className="text-sm text-gray-500">Assign a courier and optional tracking code for this order.</p>

              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Courier</label>
                  <select
                    value={courier}
                    onChange={(e) => setCourier(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="local_dispatch">Local dispatch</option>
                    <option value="courier_x">Courier X</option>
                    <option value="courier_y">Courier Y</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Tracking code (optional)</label>
                  <input
                    type="text"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    placeholder="e.g. TRK-123456"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                {assignError && <p className="text-sm text-red-600">{assignError}</p>}
                {assignSuccess && <p className="text-sm text-green-600">{assignSuccess}</p>}

                <div>
                  <Button
                    onClick={async () => {
                      if (!order?._id) return;
                      setAssignError(null);
                      setAssignSuccess(null);
                      setAssignLoading(true);

                      const token = localStorage.getItem('accessToken');

                      try {
                        if (!token) {
                          // demo flow: update local order status and show success
                          setTimeout(() => {
                            setOrder({ ...order, status: 'packed' });
                            setAssignSuccess('Delivery assigned (demo)');
                            setAssignLoading(false);
                          }, 400);
                        } else {
                          await api.post(
                            `/marketplace/orders/${order._id}/assign-delivery`,
                            { courier, trackingCode: trackingCode || undefined },
                            { headers: { Authorization: `Bearer ${token}` } },
                          );

                          // refresh order
                          const refreshed = await getOrder(order._id);
                          setOrder(refreshed);
                          setAssignSuccess('Delivery assigned');
                          setAssignLoading(false);
                        }
                      } catch (err: unknown) {
                        console.error(err);
                        const message = axios.isAxiosError(err)
                          ? err.response?.data?.message
                          : undefined;
                        setAssignError(message ?? 'Failed to assign delivery');
                        setAssignLoading(false);
                      }
                    }}
                    disabled={assignLoading}
                    className="w-full"
                  >
                    {assignLoading ? 'Assigning...' : 'Assign delivery'}
                  </Button>
                </div>
              </div>

              <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900">Delivery status</h3>
                <p className="text-sm text-gray-500">Current delivery status and actions</p>

                <div className="mt-3 space-y-3">
                  {delivery ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Status</p>
                          <p className="text-sm text-gray-900">{delivery.status}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Tracking</p>
                          <p className="text-sm text-gray-900">{delivery.trackingCode ?? '—'}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-700">History</p>
                        <div className="mt-2 space-y-2">
                          {(delivery.events ?? []).length === 0 ? (
                            <p className="text-sm text-gray-600">No events recorded</p>
                          ) : (
                            (delivery.events ?? []).map((ev, idx) => (
                              <div key={idx} className="rounded-md border p-2">
                                <p className="text-sm font-medium">{ev.status}</p>
                                <p className="text-xs text-gray-500">{ev.courier ?? '—'} • {ev.trackingCode ?? '—'}</p>
                                <p className="text-xs text-gray-400">{ev.createdAt ? new Date(ev.createdAt).toLocaleString() : ''}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {delivery.status === 'assigned' && (
                          <Button
                            onClick={async () => {
                              if (!order?._id) return;
                              setDeliveryActionError(null);
                              setDeliveryActionSuccess(null);
                              setDeliveryActionLoading(true);

                              try {
                                const token = localStorage.getItem('accessToken');
                                if (!token) {
                                  // demo flow
                                  setTimeout(async () => {
                                    const updated = await updateDeliveryStatus(order._id!, 'in_transit');
                                    setDelivery(updated as DeliveryRecord);
                                    setOrder({ ...order, status: 'shipped' });
                                    setDeliveryActionSuccess('Marked in transit (demo)');
                                    setDeliveryActionLoading(false);
                                  }, 300);
                                } else {
                                  const updated = await updateDeliveryStatus(order._id!, 'in_transit');
                                  setDelivery(updated as DeliveryRecord);
                                  // refresh order
                                  const refreshed = await getOrder(order._id!);
                                  setOrder(refreshed);
                                  setDeliveryActionSuccess('Marked in transit');
                                  setDeliveryActionLoading(false);
                                }
                              } catch (err: unknown) {
                                console.error(err);
                                const message = axios.isAxiosError(err)
                                  ? err.response?.data?.message
                                  : undefined;
                                setDeliveryActionError(message ?? 'Failed to update delivery');
                                setDeliveryActionLoading(false);
                              }
                            }}
                            disabled={deliveryActionLoading}
                          >
                            {deliveryActionLoading ? 'Updating...' : 'Mark in transit'}
                          </Button>
                        )}

                        {delivery.status === 'in_transit' && (
                          <Button
                            onClick={async () => {
                              if (!order?._id) return;

                              // confirmation for irreversible action
                              if (!window.confirm('Mark this delivery as delivered? This will complete the order.')) {
                                return;
                              }

                              setDeliveryActionError(null);
                              setDeliveryActionSuccess(null);
                              setDeliveryActionLoading(true);

                              try {
                                const token = localStorage.getItem('accessToken');
                                if (!token) {
                                  // demo flow
                                  setTimeout(async () => {
                                    const updated = await updateDeliveryStatus(order._id!, 'delivered');
                                    setDelivery(updated as DeliveryRecord);
                                    setOrder({ ...order, status: 'completed' });
                                    setDeliveryActionSuccess('Marked delivered (demo)');
                                    setDeliveryActionLoading(false);
                                  }, 300);
                                } else {
                                  const updated = await updateDeliveryStatus(order._id!, 'delivered');
                                  setDelivery(updated as DeliveryRecord);
                                  const refreshed = await getOrder(order._id!);
                                  setOrder(refreshed);
                                  setDeliveryActionSuccess('Marked delivered');
                                  setDeliveryActionLoading(false);
                                }
                              } catch (err: unknown) {
                                console.error(err);
                                const message = axios.isAxiosError(err)
                                  ? err.response?.data?.message
                                  : undefined;
                                setDeliveryActionError(message ?? 'Failed to update delivery');
                                setDeliveryActionLoading(false);
                              }
                            }}
                            disabled={deliveryActionLoading}
                          >
                            {deliveryActionLoading ? 'Updating...' : 'Mark delivered'}
                          </Button>
                        )}

                        {deliveryActionError && <p className="text-sm text-red-600">{deliveryActionError}</p>}
                        {deliveryActionSuccess && <p className="text-sm text-green-600">{deliveryActionSuccess}</p>}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No delivery assigned for this order.</p>
                  )}
                </div>
              </div>
              </div>
            )}
          </Card>
        </div>
      </Container>
    </main>
  );
}

export default OrderDetailPage;
