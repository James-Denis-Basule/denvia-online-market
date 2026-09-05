import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import Card from '../components/ui/Card';
import Container from '../components/layout/Container';
import { getOrders, type Order } from '../services/commerceService';

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-indigo-100 text-indigo-800',
  packed: 'bg-purple-100 text-purple-800',
  shipped: 'bg-cyan-100 text-cyan-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const loadOrders = async () => {
      const response = await getOrders();
      setOrders(response ?? []);
    };

    void loadOrders();
  }, []);

  return (
    <main className="py-12">
      <Container>
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Orders
          </p>
          <h1 className="text-3xl font-bold text-gray-900">Order history</h1>
        </div>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <Card>
              <p className="text-gray-600">You have no orders yet.</p>
            </Card>
          ) : (
            orders.map((order) => (
              <Card key={order._id} className="space-y-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row">
                  <div>
                    <p className="text-sm text-gray-500">
                      Order {order.orderReference ?? `#${order._id}`}
                    </p>
                    <h2 className="text-xl font-semibold text-gray-900">
                      UGX {order.total.toLocaleString()}
                    </h2>
                  </div>

                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyles[order.status] ?? 'bg-gray-100 text-gray-800'}`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="grid gap-3 text-sm text-gray-600 md:grid-cols-3">
                  <div>
                    <p className="font-medium text-gray-900">Payment</p>
                    <p>{order.paymentMethod?.replace('_', ' ') ?? 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Shipping</p>
                    <p>{order.shippingMethod ?? 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Delivery</p>
                    <p>{order.deliveryAddress ?? 'Pickup'}</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link
                    to={`/orders/${order._id}`}
                    className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    View details
                  </Link>
                </div>
              </Card>
            ))
          )}
        </div>      </Container>
    </main>
  );
}

export default OrdersPage;
