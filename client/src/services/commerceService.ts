import api from './api';

export type CartItem = {
  productId: string;
  businessId: string;
  name: string;
  price: number;
  quantity: number;
  currency?: string;
  image?: string;
};

export type CartTotals = {
  subtotal: number;
  total: number;
  itemCount: number;
};

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'completed'
  | 'cancelled';

export type Order = {
  _id?: string;
  orderReference?: string;
  guestTrackingToken?: string;
  userId?: string;
  items: CartItem[];
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  paymentFee: number;
  total: number;
  currency: string;
  paymentMethod?: string;
  shippingMethod?: string;
  deliveryAddress?: string;
  createdAt?: string;
};

const GUEST_CART_KEY = 'dom_guest_cart';

function calculateCartTotals(items: CartItem[]): CartTotals {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return {
    subtotal,
    total: subtotal,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

function createCart(items: CartItem[]): {
  items: CartItem[];
  totals: CartTotals;
} {
  return {
    items,
    totals: calculateCartTotals(items),
  };
}

function getGuestCart(): { items: CartItem[]; totals: CartTotals } {
  if (typeof window === 'undefined') {
    return createCart([]);
  }

  const stored = localStorage.getItem(GUEST_CART_KEY);

  if (!stored) {
    return createCart([]);
  }

  try {
    const parsed = JSON.parse(stored) as {
      items?: CartItem[];
    };

    return createCart(Array.isArray(parsed.items) ? parsed.items : []);
  } catch {
    localStorage.removeItem(GUEST_CART_KEY);
    return createCart([]);
  }
}

function saveGuestCart(items: CartItem[]) {
  if (typeof window === 'undefined') return;

  localStorage.setItem(
    GUEST_CART_KEY,
    JSON.stringify(createCart(items)),
  );
}

function clearGuestCart() {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(GUEST_CART_KEY);
}



export async function getCart() {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return getGuestCart();
  }

  const response = await api.get('/marketplace/cart');
  return response.data.data;
}

export async function addToCart(item: CartItem) {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    const cart = getGuestCart();
    const existing = cart.items.find(
      (current) => current.productId === item.productId,
    );

    const items = existing
      ? cart.items.map((current) =>
          current.productId === item.productId
            ? {
                ...current,
                quantity: current.quantity + item.quantity,
              }
            : current,
        )
      : [...cart.items, item];

    saveGuestCart(items);

    return {
      item,
      cart: createCart(items),
      totals: calculateCartTotals(items),
    };
  }

  const response = await api.post('/marketplace/cart/items', {
    productId: item.productId,
    businessId: item.businessId,
    quantity: item.quantity,
  });

  return response.data.data;
}

export async function updateCartItem(
  productId: string,
  quantity: number,
) {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    const cart = getGuestCart();
    const item = cart.items.find(
      (current) => current.productId === productId,
    );

    if (!item) {
      throw new Error('Cart item not found');
    }

    const items = cart.items.map((current) =>
      current.productId === productId
        ? {
            ...current,
            quantity: Math.max(1, quantity),
          }
        : current,
    );

    saveGuestCart(items);

    return {
      cart: createCart(items),
      totals: calculateCartTotals(items),
    };
  }

  const response = await api.patch(
    `/marketplace/cart/items/${productId}`,
    { quantity },
  );

  return response.data.data;
}

export async function removeCartItem(productId: string) {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    const cart = getGuestCart();

    const items = cart.items.filter(
      (item) => item.productId !== productId,
    );

    saveGuestCart(items);

    return {
      cart: createCart(items),
      totals: calculateCartTotals(items),
    };
  }

  const response = await api.delete(
    `/marketplace/cart/items/${productId}`,
  );

  return response.data.data;
}

export async function mergeGuestCart() {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return;
  }

  let guestCart = getGuestCart();

  if (!guestCart.items.length) {
    return;
  }

  const response = await api.get('/marketplace/cart');

  const serverCart = response.data.data as {
    items?: CartItem[];
  };

  let serverItems = serverCart.items ?? [];

  for (const guestItem of [...guestCart.items]) {
    const existing = serverItems.find(
      (item) => item.productId === guestItem.productId,
    );

    if (existing) {
      await api.patch(
        `/marketplace/cart/items/${guestItem.productId}`,
        {
          quantity: existing.quantity + guestItem.quantity,
        },
      );

      serverItems = serverItems.map((item) =>
        item.productId === guestItem.productId
          ? {
              ...item,
              quantity: existing.quantity + guestItem.quantity,
            }
          : item,
      );
    } else {
      await api.post('/marketplace/cart/items', {
        productId: guestItem.productId,
        businessId: guestItem.businessId,
        quantity: guestItem.quantity,
      });

      serverItems = [
        ...serverItems,
        {
          ...guestItem,
        },
      ];
    }

    // Remove only the item that has successfully merged.
    // If a later item fails, the remaining guest items stay
    // in localStorage and can safely be retried.
    guestCart = getGuestCart();

    const remainingItems = guestCart.items.filter(
      (item) => item.productId !== guestItem.productId,
    );

    saveGuestCart(remainingItems);
  }

  clearGuestCart();
}


export async function createOrder(payload: {
  items: CartItem[];
  paymentMethod: string;
  shippingMethod: string;
  deliveryAddress?: string;
}) {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    throw new Error('Authentication is required before checkout.');
  }

  const response = await api.post('/marketplace/orders', {
    ...payload,
    items: payload.items.map((item) => ({
      productId: item.productId,
      businessId: item.businessId,
      quantity: item.quantity,
    })),
  });

  return response.data.data;
}

export async function getOrders() {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return [];
  }

  const response = await api.get('/marketplace/orders');

  return response.data.data;
}

export async function cancelOrder(orderId: string) {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    throw new Error('Authentication is required to cancel an order.');
  }

  const response = await api.post(
    `/marketplace/orders/${orderId}/cancel`,
  );

  return response.data.data;
}

export async function getOrder(orderId: string) {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return null;
  }

  const response = await api.get(
    `/marketplace/orders/${orderId}`,
  );

  return response.data.data;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
) {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    throw new Error(
      'Authentication is required to update an order.',
    );
  }

  const response = await api.patch(
    `/marketplace/orders/${orderId}/status`,
    { status },
  );

  return response.data.data;
}

