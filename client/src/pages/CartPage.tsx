import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import LoadingState from '../components/ui/LoadingState';
import Container from '../components/layout/Container';
import {
  getCart,
  updateCartItem,
  removeCartItem,
  type CartItem,
} from '../services/commerceService';

function formatCurrency(amount: number, currency = 'UGX') {
  return `${currency} ${amount.toLocaleString()}`;
}

function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCart = async () => {
      try {
        const cart = await getCart();
        setItems(cart.items ?? []);
      } finally {
        setLoading(false);
      }
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

  const updateQuantity = async (productId: string, delta: number) => {
    const currentItem = items.find((item) => item.productId === productId);

    if (!currentItem) {
      return;
    }

    const nextQuantity = Math.max(1, currentItem.quantity + delta);

    try {
      const result = await updateCartItem(productId, nextQuantity);
      setItems(result.cart?.items ?? result.items ?? []);
    } catch {
      // Keep the current UI state if the server rejects the change.
    }
  };

  const removeItem = async (productId: string) => {
    try {
      const result = await removeCartItem(productId);
      setItems(result.cart?.items ?? result.items ?? []);
    } catch {
      // Keep the current UI state if removal fails.
    }
  };

  if (loading) {
    return (
      <main className="min-h-[70vh] bg-gray-50 py-8 sm:py-10">
        <Container>
          <LoadingState />
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-[70vh] bg-gray-50 py-8 sm:py-10">
      <Container>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
              Shopping cart
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Your cart
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {totalItems} {totalItems === 1 ? 'item' : 'items'} ready for checkout
            </p>
          </div>

          <Link
            to="/products"
            className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
          >
            Continue shopping →
          </Link>
        </div>

        {items.length === 0 ? (
          <Card className="rounded-2xl border-gray-200 shadow-sm">
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 py-12 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl">
                🛒
              </div>

              <h2 className="text-xl font-semibold text-gray-900">
                Your cart is empty
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                Browse products from businesses on Denvia and add something
                you would like to purchase.
              </p>

              <Link to="/products" className="mt-6">
                <Button>Start shopping</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <Card className="overflow-hidden rounded-2xl border-gray-200 p-0 shadow-sm">
              <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
                <h2 className="font-semibold text-gray-900">
                  Cart items
                </h2>
              </div>

              <div className="divide-y divide-gray-100">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex gap-4 px-5 py-5 sm:px-6"
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 sm:h-24 sm:w-24">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl text-gray-400">
                          🛍️
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-gray-900">
                            {item.name}
                          </h3>

                          <p className="mt-1 text-sm text-gray-500">
                            {formatCurrency(item.price, item.currency)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          className="shrink-0 text-xs font-medium text-gray-400 transition hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-4">
                        <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white">
                          <button
                            type="button"
                            aria-label={`Decrease quantity of ${item.name}`}
                            className="flex h-9 w-9 items-center justify-center text-lg text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
                            onClick={() => updateQuantity(item.productId, -1)}
                          >
                            −
                          </button>

                          <span className="flex h-9 min-w-9 items-center justify-center border-x border-gray-200 px-2 text-sm font-semibold text-gray-900">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            aria-label={`Increase quantity of ${item.name}`}
                            className="flex h-9 w-9 items-center justify-center text-lg text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
                            onClick={() => updateQuantity(item.productId, 1)}
                          >
                            +
                          </button>
                        </div>

                        <p className="text-right text-sm font-bold text-gray-900 sm:text-base">
                          {formatCurrency(
                            item.price * item.quantity,
                            item.currency,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="sticky top-5 rounded-2xl border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                Order summary
              </h2>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Items</span>
                  <span>{totalItems}</span>
                </div>

                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between text-gray-500">
                  <span>Delivery</span>
                  <span className="text-gray-400">Calculated at checkout</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-5">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              <Link to="/checkout" className="mt-5 block">
                <Button className="w-full">
                  Proceed to checkout
                </Button>
              </Link>

              <p className="mt-3 text-center text-xs leading-5 text-gray-400">
                Delivery and payment fees will be confirmed during checkout.
              </p>
            </Card>
          </div>
        )}
      </Container>
    </main>
  );
}

export default CartPage;
