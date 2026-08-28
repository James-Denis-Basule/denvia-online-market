import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Container from '../components/layout/Container';
import { getCart, type CartItem } from '../services/commerceService';

function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);

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

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const updateQuantity = (productId: string, delta: number) => {
    setItems((currentItems) =>
      currentItems
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  return (
    <main className="py-12">
      <Container>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Cart
            </p>
            <h1 className="text-3xl font-bold text-gray-900">Your shopping cart</h1>
          </div>

          <Link to="/products" className="text-sm font-medium text-blue-600">
            Continue shopping
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.7fr_0.9fr]">
          <Card className="space-y-4">
            {items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-600">
                Your cart is empty.
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-4"
                >
                  <div>
                    <h2 className="font-semibold text-gray-900">{item.name}</h2>
                    <p className="text-sm text-gray-500">UGX {item.price.toLocaleString()}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-lg border border-gray-200">
                      <button
                        type="button"
                        className="px-3 py-2 text-gray-600"
                        onClick={() => updateQuantity(item.productId, -1)}
                      >
                        −
                      </button>
                      <span className="min-w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="px-3 py-2 text-gray-600"
                        onClick={() => updateQuantity(item.productId, 1)}
                      >
                        +
                      </button>
                    </div>

                    <p className="w-24 text-right font-semibold text-gray-900">
                      UGX {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-gray-900">Summary</h2>

            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Items</span>
                <span>{totalItems}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>UGX {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-semibold text-gray-900">
                <span>Total</span>
                <span>UGX {subtotal.toLocaleString()}</span>
              </div>
            </div>

            <Link to="/checkout" className="mt-6 block">
              <Button className="w-full">Proceed to checkout</Button>
            </Link>
          </Card>
        </div>
      </Container>
    </main>
  );
}

export default CartPage;
