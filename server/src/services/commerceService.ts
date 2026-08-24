import mongoose from "mongoose";
import Business from "../models/Business.js";
import Cart from "../models/Cart.js";
import Order, { type OrderStatus, type PaymentStatus } from "../models/Order.js";
import Payment from "../models/Payment.js";
import Delivery from "../models/Delivery.js";
import { PAYMENT_PROVIDERS, createPaymentIntent, validatePaymentStatus } from "./paymentService.js";
import { calculateDeliveryFee, createTrackingCode, normalizeDeliveryMethod } from "./deliveryService.js";
import { buildDeliveryProviderRequest, buildPaymentProviderRequest } from "./providerAdapterService.js";
import { AppError } from "../utils/AppError.js";
import { notifyOrderStatusChange } from "./notificationService.js";

export const SUPPORTED_SHIPPING_METHODS = {
  standard: { label: "Standard delivery", fee: 5000 },
  express: { label: "Express delivery", fee: 15000 },
  delivery: { label: "Home delivery", fee: 5000 },
  pickup: { label: "Pickup", fee: 0 },
} as const;

export const SUPPORTED_PAYMENT_METHODS = {
  cash_on_delivery: { label: "Cash on delivery", fee: 0 },
  mobile_money: { label: "Mobile money", fee: 500 },
  card: { label: "Card payment", fee: 1200 },
} as const;

export const SUPPORTED_PAYMENT_PROVIDER_LOGOS = PAYMENT_PROVIDERS;

export interface CartItemInput {
  productId: string;
  businessId: string;
  name: string;
  price: number;
  currency?: string;
  image?: string;
  quantity?: number;
}

export function normalizeCartItem(item: CartItemInput) {
  if (!item.productId || !item.businessId || !item.name) {
    throw new AppError("productId, businessId, and name are required", 400);
  }

  if (!mongoose.isValidObjectId(item.productId) || !mongoose.isValidObjectId(item.businessId)) {
    throw new AppError("Valid productId and businessId are required", 400);
  }

  const numericPrice = Number(item.price);

  if (!Number.isFinite(numericPrice) || numericPrice < 0) {
    throw new AppError("Price must be a valid non-negative number", 400);
  }

  const quantity = Math.max(1, Number(item.quantity ?? 1));

  return {
    productId: item.productId,
    businessId: item.businessId,
    name: item.name.trim(),
    price: numericPrice,
    currency: (item.currency ?? "UGX").toUpperCase(),
    image: item.image?.trim() || undefined,
    quantity,
  };
}

export async function getCart(userId: string) {
  const cart = await Cart.findOne({ userId }).lean();

  if (!cart) {
    return { userId, items: [] };
  }

  return {
    userId,
    items: cart.items.map((item) => ({
      ...item,
      productId: String(item.productId),
      businessId: String(item.businessId),
    })),
  };
}

export async function addToCart(userId: string, itemInput: CartItemInput) {
  const normalizedItem = normalizeCartItem(itemInput);

  const cart = await Cart.findOne({ userId });

  if (!cart) {
    const createdCart = await Cart.create({
      userId,
      items: [normalizedItem],
    });

    return createdCart.toObject();
  }

  const existingItem = cart.items.find(
    (item) => String(item.productId) === String(normalizedItem.productId),
  );

  if (existingItem) {
    existingItem.quantity += normalizedItem.quantity;
    existingItem.price = normalizedItem.price;
    existingItem.name = normalizedItem.name;
    existingItem.currency = normalizedItem.currency;
    existingItem.image = normalizedItem.image;
  } else {
    cart.items.push(normalizedItem as never);
  }

  await cart.save();

  return cart.toObject();
}

export function normalizeShippingMethod(method?: string) {
  const normalized = (method ?? "standard").trim().toLowerCase();

  if (!(normalized in SUPPORTED_SHIPPING_METHODS)) {
    throw new AppError(`Unsupported shipping method: ${method ?? "standard"}`, 400);
  }

  return normalized as keyof typeof SUPPORTED_SHIPPING_METHODS;
}

export function normalizePaymentMethod(method?: string) {
  const normalized = (method ?? "cash_on_delivery").trim().toLowerCase();

  if (!(normalized in SUPPORTED_PAYMENT_METHODS)) {
    throw new AppError(`Unsupported payment method: ${method ?? "cash_on_delivery"}`, 400);
  }

  return normalized as keyof typeof SUPPORTED_PAYMENT_METHODS;
}

export function calculateCartTotals(items: Array<{ price: number; quantity: number }>) {
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

  return {
    subtotal,
    total: subtotal,
    itemCount: items.reduce((count, item) => count + item.quantity, 0),
  };
}

export function calculateCheckoutTotals(subtotal: number, shippingMethod?: string, paymentMethod?: string) {
  const normalizedShipping = normalizeShippingMethod(shippingMethod);
  const normalizedPayment = normalizePaymentMethod(paymentMethod);

  const deliveryFee = calculateDeliveryFee(normalizedShipping);
  const paymentFee = SUPPORTED_PAYMENT_METHODS[normalizedPayment].fee;

  return {
    subtotal,
    deliveryFee,
    paymentFee,
    total: subtotal + deliveryFee + paymentFee,
    shippingProvider: SUPPORTED_SHIPPING_METHODS[normalizedShipping].label,
    paymentProvider: SUPPORTED_PAYMENT_METHODS[normalizedPayment].label,
  };
}

export function getCheckoutQuote(
  items: CartItemInput[],
  paymentMethod?: string,
  shippingMethod?: string,
  deliveryAddress?: string,
) {
  const orderData = buildOrderFromCart(items, paymentMethod, shippingMethod, deliveryAddress);

  return {
    ...orderData,
    providerSummary: {
      shippingProvider: SUPPORTED_SHIPPING_METHODS[normalizeShippingMethod(orderData.shippingMethod)].label,
      paymentProvider: SUPPORTED_PAYMENT_METHODS[normalizePaymentMethod(orderData.paymentMethod)].label,
    },
  };
}

export function buildOrderFromCart(
  items: CartItemInput[],
  paymentMethod?: string,
  shippingMethod?: string,
  deliveryAddress?: string,
) {
  if (!items.length) {
    throw new AppError("Cart is empty", 400);
  }

  const normalizedItems = items.map((item) => ({
    ...item,
    currency: item.currency ?? "UGX",
    quantity: Math.max(1, Number(item.quantity ?? 1)),
    price: Number(item.price) || 0,
  }));

  const totals = calculateCartTotals(
    normalizedItems.map((item) => ({
      price: item.price,
      quantity: item.quantity,
    })),
  );

  const normalizedShipping = normalizeShippingMethod(shippingMethod);
  const normalizedPayment = normalizePaymentMethod(paymentMethod);

  if (normalizedShipping === "delivery" && !deliveryAddress?.trim()) {
    throw new AppError("Delivery address is required for delivery orders", 400);
  }

  const checkoutTotals = calculateCheckoutTotals(
    totals.subtotal,
    normalizedShipping,
    normalizedPayment,
  );

  if (normalizedShipping === "pickup") {
    checkoutTotals.deliveryFee = 0;
  }

  return {
    items: normalizedItems,
    subtotal: checkoutTotals.subtotal,
    deliveryFee: checkoutTotals.deliveryFee,
    paymentFee: checkoutTotals.paymentFee,
    total: checkoutTotals.total,
    currency: normalizedItems[0]?.currency ?? "UGX",
    paymentMethod: normalizedPayment,
    shippingMethod: normalizedShipping,
    deliveryAddress: deliveryAddress?.trim() || undefined,
    status: "pending",
  };
}

export function validateOrderStatusTransition(currentStatus: OrderStatus, nextStatus: OrderStatus) {
  const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ["paid", "cancelled"],
    paid: ["confirmed", "cancelled"],
    confirmed: ["packed", "cancelled"],
    packed: ["shipped", "cancelled"],
    shipped: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };

  if (!allowedTransitions[currentStatus]?.includes(nextStatus)) {
    throw new AppError(
      `Order cannot move from ${currentStatus} to ${nextStatus}`,
      400,
    );
  }

  return true;
}

export async function updateOrderStatus(orderId: string, nextStatus: OrderStatus) {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new AppError("Valid orderId is required", 400);
  }

  if (mongoose.connection.readyState === 0) {
    throw new AppError("Database unavailable", 503);
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  validateOrderStatusTransition(order.status as OrderStatus, nextStatus);
  order.status = nextStatus;
  await order.save();

  try {
    await notifyOrderStatusChange(String(order.userId), String(order._id), nextStatus);
  } catch {
    // notification failure should not block order status updates
  }

  return order.toObject();
}

export async function getOrdersForUser(userId: string) {
  const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
  return orders;
}

export async function getOrderByIdForUser(userId: string, orderId: string) {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new AppError("Valid orderId is required", 400);
  }

  const order = await Order.findOne({ _id: orderId, userId }).lean();

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  return order;
}

export type SellerDashboardSummary = {
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
  countsByStatus: Record<OrderStatus, number>;
  recentOrders: Array<{
    _id: string;
    status: OrderStatus;
    total: number;
    currency: string;
    itemCount: number;
    createdAt?: string;
  }>;
};

export function buildSellerDashboardSummary(
  orders: Array<{
    _id?: string | { toString(): string };
    status?: OrderStatus | string;
    total?: number;
    currency?: string;
    createdAt?: Date | string;
    items?: Array<{ quantity?: number }>; 
  }>,
): SellerDashboardSummary {
  const statusList: OrderStatus[] = [
    "pending",
    "paid",
    "confirmed",
    "packed",
    "shipped",
    "completed",
    "cancelled",
  ];

  const countsByStatus = statusList.reduce((accumulator, status) => {
    accumulator[status] = 0;
    return accumulator;
  }, {} as Record<OrderStatus, number>);

  let totalRevenue = 0;
  let paidRevenue = 0;
  let completedRevenue = 0;

  for (const order of orders) {
    const status = (order.status as OrderStatus) ?? "pending";
    countsByStatus[status] = (countsByStatus[status] ?? 0) + 1;

    const total = Number(order.total ?? 0);
    totalRevenue += total;

    if (["paid", "confirmed", "packed", "shipped", "completed"].includes(status)) {
      paidRevenue += total;
    }

    if (status === "completed") {
      completedRevenue += total;
    }
  }

  const recentOrders = [...orders]
    .sort((left, right) => {
      const leftDate = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightDate = right.createdAt ? new Date(right.createdAt).getTime() : 0;
      return rightDate - leftDate;
    })
    .slice(0, 5)
    .map((order) => ({
      _id: String(order._id ?? "unknown"),
      status: (order.status as OrderStatus) ?? "pending",
      total: Number(order.total ?? 0),
      currency: order.currency ?? "UGX",
      itemCount: order.items?.reduce((count, item) => count + Number(item.quantity ?? 0), 0) ?? 0,
      createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : undefined,
    }));

  const totalOrders = orders.length;

  return {
    overview: {
      totalOrders,
      pendingOrders: countsByStatus.pending,
      paidOrders: countsByStatus.paid,
      shippedOrders: countsByStatus.shipped,
      completedOrders: countsByStatus.completed,
      totalRevenue,
      paidRevenue,
      completedRevenue,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    },
    countsByStatus,
    recentOrders,
  };
}

export async function getSellerDashboardSummary(userId: string, businessIds?: string[]) {
  const explicitBusinessIds = (businessIds ?? [])
    .map((businessId) => businessId.trim())
    .filter(Boolean)
    .filter((businessId) => mongoose.isValidObjectId(businessId));

  const ownerBusinessIds = explicitBusinessIds.length > 0
    ? explicitBusinessIds
    : (await Business.find({ ownerId: userId }).select("_id").lean()).map((business) => String(business._id));

  if (!ownerBusinessIds.length) {
    return buildSellerDashboardSummary([]);
  }

  const normalizedBusinessIds = ownerBusinessIds
    .filter((businessId) => mongoose.isValidObjectId(businessId))
    .map((businessId) => new mongoose.Types.ObjectId(businessId));

  const orders = await Order.find({
    items: { $elemMatch: { businessId: { $in: normalizedBusinessIds } } },
  })
    .sort({ createdAt: -1 })
    .limit(25)
    .lean();

  return buildSellerDashboardSummary(orders as Parameters<typeof buildSellerDashboardSummary>[0]);
}

// convenience wrapper over delivery service for controllers
import { assignDeliveryToOrder as deliveryAssign } from './deliveryService.js';

export async function assignDeliveryToOrder(orderId: string, courier?: string, trackingCode?: string) {
  return deliveryAssign(orderId, courier, trackingCode);
}

export async function getSellerOrdersForBusinessIds(businessIds: string[]) {
  const normalizedBusinessIds = businessIds
    .map((businessId) => businessId.trim())
    .filter(Boolean)
    .filter((businessId) => mongoose.isValidObjectId(businessId))
    .map((businessId) => new mongoose.Types.ObjectId(businessId));

  if (!normalizedBusinessIds.length) {
    return [];
  }

  const orders = await Order.find({
    items: { $elemMatch: { businessId: { $in: normalizedBusinessIds } } },
  })
    .sort({ createdAt: -1 })
    .lean();

  return orders;
}

export async function createOrderForUser(
  userId: string,
  payload?: {
    items?: CartItemInput[];
    paymentMethod?: string;
    shippingMethod?: string;
    deliveryAddress?: string;
  },
) {
  const cart = await Cart.findOne({ userId }).lean();
  const sourceItems = payload?.items?.length ? payload.items : cart?.items ?? [];

  if (!sourceItems.length) {
    throw new AppError("Cart is empty", 400);
  }

  const normalizedPaymentMethod = normalizePaymentMethod(payload?.paymentMethod);
  const paymentStatus = validatePaymentStatus("pending");

  const orderData = buildOrderFromCart(
    sourceItems.map((item) => ({
      productId: String(item.productId),
      businessId: String(item.businessId),
      name: item.name,
      price: Number(item.price),
      quantity: Number(item.quantity ?? 1),
      currency: item.currency,
      image: item.image,
    })),
    payload?.paymentMethod,
    payload?.shippingMethod,
    payload?.deliveryAddress,
  );

  const createdOrder = await Order.create({
    userId,
    items: orderData.items.map((item) => ({
      ...item,
      productId: new mongoose.Types.ObjectId(item.productId),
      businessId: new mongoose.Types.ObjectId(item.businessId),
    })),
    subtotal: orderData.subtotal,
    deliveryFee: orderData.deliveryFee,
    paymentFee: orderData.paymentFee,
    total: orderData.total,
    currency: orderData.currency,
    paymentMethod: normalizedPaymentMethod,
    paymentProvider: normalizedPaymentMethod,
    paymentStatus: paymentStatus,
    shippingMethod: orderData.shippingMethod,
    deliveryAddress: orderData.deliveryAddress,
    status: "pending" as const,
  });

  const normalizedShippingMethod = normalizeDeliveryMethod(orderData.shippingMethod);
  const trackingCode = createTrackingCode();
  const deliveryProvider = normalizedShippingMethod === "pickup" ? "pickup" : normalizedShippingMethod === "delivery" || normalizedShippingMethod === "express" ? "courier" : "local_dispatch";
  const deliveryRequest = buildDeliveryProviderRequest({
    provider: deliveryProvider,
    orderId: String(createdOrder._id),
    trackingCode,
  });

  await Delivery.create({
    orderId: createdOrder._id,
    userId,
    businessId: createdOrder.items[0]?.businessId,
    method: normalizedShippingMethod,
    provider: deliveryRequest.provider,
    zone: orderData.deliveryAddress ? "local" : "pickup",
    status: "pending",
    trackingCode: deliveryRequest.metadata.trackingCode as string,
    address: orderData.deliveryAddress,
    metadata: {
      gateway: deliveryRequest.gateway,
      mode: deliveryRequest.mode,
      provider: deliveryRequest.provider,
      reference: deliveryRequest.reference,
    },
  });

  const paymentIntent = createPaymentIntent({
    orderId: String(createdOrder._id),
    userId,
    amount: createdOrder.total,
    currency: createdOrder.currency,
    provider: normalizedPaymentMethod,
    method: normalizedPaymentMethod,
  });

  const paymentRequest = buildPaymentProviderRequest({
    provider: paymentIntent.provider,
    orderId: String(createdOrder._id),
    amount: createdOrder.total,
    currency: createdOrder.currency,
  });

  await Payment.create({
    orderId: createdOrder._id,
    userId,
    amount: createdOrder.total,
    currency: createdOrder.currency,
    provider: paymentIntent.provider,
    method: paymentIntent.method,
    reference: paymentIntent.reference,
    status: paymentIntent.status,
    metadata: {
      providerLabel: paymentIntent.providerLabel,
      gateway: paymentRequest.gateway,
      mode: paymentRequest.mode,
      providerRequest: paymentRequest,
    },
  });

  const order = createdOrder.toObject();

  if (cart) {
    await Cart.updateOne({ _id: cart._id }, { $set: { items: [] } });
  }

  return {
    ...order,
    paymentStatus: paymentStatus,
    paymentProvider: paymentIntent.provider,
    paymentGateway: paymentRequest.gateway,
    deliveryGateway: deliveryRequest.gateway,
    paymentIntent,
  };
}
