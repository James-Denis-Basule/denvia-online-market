import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Container from '../components/layout/Container';
import { createOrder, getCart, type CartItem } from '../services/commerceService';
import { useAuth } from '../hooks/useAuth';

const shippingFees = {
  standard: 5000,
  express: 15000,
  pickup: 0,
  delivery: 5000,
};

const paymentFees = {
  cash_on_delivery: 0,
  mobile_money: 500,
  card: 1200,
};

function CheckoutPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadCart = async () => {
      const cart = await getCart();
      setItems(cart.items ?? []);
    };

    void loadCart();
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const deliveryFee = shippingFees[shippingMethod as keyof typeof shippingFees] ?? 0;
  const paymentFee = paymentFees[paymentMethod as keyof typeof paymentFees] ?? 0;
  const total = subtotal + deliveryFee + paymentFee;

  const handlePlaceOrder = async () => {
    if (!items.length) return;

    if (!isAuthenticated) {
      navigate(`/login?returnTo=${encodeURIComponent("/checkout")}`);
      return;
    }

    setIsSubmitting(true);

    const order = await createOrder({
      items,
      paymentMethod,
      shippingMethod,
      deliveryAddress,
    });

    if (order?._id) {
      navigate(`/orders/${order._id}`);
    }

    setIsSubmitting(false);
  };

  return (
    <main className="py-12">
      <Container>
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Checkout
          </p>
          <h1 className="text-3xl font-bold text-gray-900">Complete your purchase</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-semibold text-gray-900">Shipping</h2>
              <div className="mt-4 space-y-3">
                {Object.entries(shippingFees).map(([method, fee]) => (
                  <label
                    key={method}
                    className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shippingMethod"
                        checked={shippingMethod === method}
                        onChange={() => setShippingMethod(method)}
                      />
                      <span className="font-medium capitalize text-gray-800">{method}</span>
                    </div>
                    <span className="text-sm text-gray-600">UGX {fee.toLocaleString()}</span>
                  </label>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-gray-900">Payment</h2>
              <div className="mt-4 space-y-3">
                {Object.entries(paymentFees).map(([method, fee]) => (
                  <label
                    key={method}
                    className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === method}
                        onChange={() => setPaymentMethod(method)}
                      />
                      <span className="font-medium capitalize text-gray-800">
                        {method.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">UGX {fee.toLocaleString()}</span>
                  </label>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-gray-900">Delivery address</h2>
              <textarea
                value={deliveryAddress}
                onChange={(event) => setDeliveryAddress(event.target.value)}
                className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Street, city, district, country"
              />
            </Card>
          </div>

          <Card>
            <h2 className="text-lg font-semibold text-gray-900">Order summary</h2>

            <div className="mt-4 space-y-3 text-sm text-gray-600">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between gap-3">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>UGX {(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}

              <div className="flex justify-between border-t border-gray-200 pt-3">
                <span>Subtotal</span>
                <span>UGX {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>UGX {deliveryFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment fee</span>
                <span>UGX {paymentFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-gray-900">
                <span>Total</span>
                <span>UGX {total.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Button type="button" onClick={handlePlaceOrder} disabled={isSubmitting || !items.length}>
                {isSubmitting
                  ? 'Placing order...'
                  : isAuthenticated
                    ? 'Place order'
                    : 'Sign in to place order'}
              </Button>
              <Link to="/cart">
                <Button variant="outline" className="w-full">
                  Back to cart
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </Container>
    </main>
  );
}

export default CheckoutPage;
