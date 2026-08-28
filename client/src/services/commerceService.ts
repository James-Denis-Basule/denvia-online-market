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

const demoCart: { items: CartItem[]; totals: CartTotals } = {
  items: [
    {
      productId: '67d8d1f5d39b5b8f5f41de7b',
      businessId: '67d8d1f5d39b5b8f5f41de7c',
      name: 'Laptop',
      price: 200000,
      quantity: 1,
      currency: 'UGX',
    },
    {
      productId: '67d8d1f5d39b5b8f5f41de7d',
      businessId: '67d8d1f5d39b5b8f5f41de7c',
      name: 'Smartphone',
      price: 850000,
      quantity: 1,
      currency: 'UGX',
    },
  ],
  totals: {
    subtotal: 1050000,
    total: 1050000,
    itemCount: 2,
  },
};

const demoOrders: Order[] = [
  {
    _id: '1',
    status: 'pending',
    items: demoCart.items,
    subtotal: 1050000,
    deliveryFee: 5000,
    paymentFee: 0,
    total: 1055000,
    currency: 'UGX',
    shippingMethod: 'standard',
    paymentMethod: 'cash_on_delivery',
    deliveryAddress: 'Kampala, Uganda',
  },
  {
    _id: '2',
    status: 'shipped',
    items: [demoCart.items[0]],
    subtotal: 200000,
    deliveryFee: 15000,
    paymentFee: 1200,
    total: 216200,
    currency: 'UGX',
    shippingMethod: 'express',
    paymentMethod: 'card',
    deliveryAddress: 'Entebbe, Uganda',
  },
];

export async function getCart() {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return demoCart;
  }

  try {
    const response = await api.get('/marketplace/cart');
    return response.data.data;
  } catch {
    return demoCart;
  }
}

export async function addToCart(item: CartItem) {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    demoCart.items = [...demoCart.items, item];
    demoCart.totals = {
      subtotal: demoCart.items.reduce((sum, current) => sum + current.price * current.quantity, 0),
      total: demoCart.items.reduce((sum, current) => sum + current.price * current.quantity, 0),
      itemCount: demoCart.items.reduce((sum, current) => sum + current.quantity, 0),
    };

    return { item, totals: demoCart.totals };
  }

  try {
    const response = await api.post('/marketplace/cart/items', {
      productId: item.productId,
      businessId: item.businessId,
      quantity: item.quantity,
    });

    return response.data.data;
  } catch {
    demoCart.items = [...demoCart.items, item];
    demoCart.totals = {
      subtotal: demoCart.items.reduce((sum, current) => sum + current.price * current.quantity, 0),
      total: demoCart.items.reduce((sum, current) => sum + current.price * current.quantity, 0),
      itemCount: demoCart.items.reduce((sum, current) => sum + current.quantity, 0),
    };

    return { item, totals: demoCart.totals };
  }
}

export async function updateCartItem(
  productId: string,
  quantity: number,
) {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    const item = demoCart.items.find(
      (current) => current.productId === productId,
    );

    if (!item) {
      throw new Error('Cart item not found');
    }

    item.quantity = Math.max(1, quantity);

    demoCart.totals = {
      subtotal: demoCart.items.reduce(
        (sum, current) => sum + current.price * current.quantity,
        0,
      ),
      total: demoCart.items.reduce(
        (sum, current) => sum + current.price * current.quantity,
        0,
      ),
      itemCount: demoCart.items.reduce(
        (sum, current) => sum + current.quantity,
        0,
      ),
    };

    return {
      cart: demoCart,
      totals: demoCart.totals,
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
    demoCart.items = demoCart.items.filter(
      (item) => item.productId !== productId,
    );

    demoCart.totals = {
      subtotal: demoCart.items.reduce(
        (sum, current) => sum + current.price * current.quantity,
        0,
      ),
      total: demoCart.items.reduce(
        (sum, current) => sum + current.price * current.quantity,
        0,
      ),
      itemCount: demoCart.items.reduce(
        (sum, current) => sum + current.quantity,
        0,
      ),
    };

    return {
      cart: demoCart,
      totals: demoCart.totals,
    };
  }

  const response = await api.delete(
    `/marketplace/cart/items/${productId}`,
  );

  return response.data.data;
}

export async function createOrder(payload: {
  items: CartItem[];
  paymentMethod: string;
  shippingMethod: string;
  deliveryAddress?: string;
}) {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    const order: Order = {
      _id: `order-${Date.now()}`,
      status: 'pending',
      items: payload.items,
      subtotal: payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      deliveryFee: payload.shippingMethod === 'express' ? 15000 : payload.shippingMethod === 'pickup' ? 0 : 5000,
      paymentFee: payload.paymentMethod === 'mobile_money' ? 500 : payload.paymentMethod === 'card' ? 1200 : 0,
      total:
        payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0) +
        (payload.shippingMethod === 'express' ? 15000 : payload.shippingMethod === 'pickup' ? 0 : 5000) +
        (payload.paymentMethod === 'mobile_money' ? 500 : payload.paymentMethod === 'card' ? 1200 : 0),
      currency: payload.items[0]?.currency ?? 'UGX',
      paymentMethod: payload.paymentMethod,
      shippingMethod: payload.shippingMethod,
      deliveryAddress: payload.deliveryAddress,
    };

    demoOrders.unshift(order);
    demoCart.items = [];
    demoCart.totals = { subtotal: 0, total: 0, itemCount: 0 };

    return order;
  }

  try {
    const response = await api.post('/marketplace/orders', {
      ...payload,
      items: payload.items.map((item) => ({
        productId: item.productId,
        businessId: item.businessId,
        quantity: item.quantity,
      })),
    });

    return response.data.data;
  } catch {
    const order: Order = {
      _id: `order-${Date.now()}`,
      status: 'pending',
      items: payload.items,
      subtotal: payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      deliveryFee: payload.shippingMethod === 'express' ? 15000 : payload.shippingMethod === 'pickup' ? 0 : 5000,
      paymentFee: payload.paymentMethod === 'mobile_money' ? 500 : payload.paymentMethod === 'card' ? 1200 : 0,
      total:
        payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0) +
        (payload.shippingMethod === 'express' ? 15000 : payload.shippingMethod === 'pickup' ? 0 : 5000) +
        (payload.paymentMethod === 'mobile_money' ? 500 : payload.paymentMethod === 'card' ? 1200 : 0),
      currency: payload.items[0]?.currency ?? 'UGX',
      paymentMethod: payload.paymentMethod,
      shippingMethod: payload.shippingMethod,
      deliveryAddress: payload.deliveryAddress,
    };

    demoOrders.unshift(order);

    return order;
  }
}

export async function getOrders() {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return demoOrders;
  }

  try {
    const response = await api.get('/marketplace/orders');
    return response.data.data;
  } catch {
    return demoOrders;
  }
}

export async function getOrder(orderId: string) {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return demoOrders.find((order) => order._id === orderId) ?? null;
  }

  try {
    const response = await api.get(`/marketplace/orders/${orderId}`);
    return response.data.data;
  } catch {
    return demoOrders.find((order) => order._id === orderId) ?? null;
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    const order = demoOrders.find((item) => item._id === orderId);

    if (!order) return null;

    order.status = status;

    return order;
  }

  try {
    const response = await api.patch(
      `/marketplace/orders/${orderId}/status`,
      { status },
    );

    return response.data.data;
  } catch {
    const order = demoOrders.find((item) => item._id === orderId);

    if (!order) return null;

    order.status = status;

    return order;
  }
}