import mongoose from "mongoose";
import Delivery from "../models/Delivery.js";
import Order from "../models/Order.js";
import { AppError } from "../utils/AppError.js";
import { notifyDeliveryStatusChange } from "./notificationService.js";

export const DELIVERY_PROVIDERS = {
  local_dispatch: { label: "Local dispatch" },
  courier: { label: "Courier" },
  pickup: { label: "Pickup" },
} as const;

export type DeliveryMethod = "standard" | "express" | "delivery" | "pickup";
export type DeliveryStatus = "pending" | "assigned" | "in_transit" | "delivered" | "failed";

export function normalizeDeliveryMethod(method?: string): DeliveryMethod {
  const normalized = (method ?? "standard").trim().toLowerCase();
  const validMethods: DeliveryMethod[] = ["standard", "express", "delivery", "pickup"];

  if (!validMethods.includes(normalized as DeliveryMethod)) {
    throw new AppError(`Unsupported delivery method: ${method ?? "standard"}`, 400);
  }

  return normalized as DeliveryMethod;
}

export function calculateDeliveryFee(method?: string) {
  const normalized = normalizeDeliveryMethod(method);

  const feeMap: Record<DeliveryMethod, number> = {
    standard: 5000,
    express: 15000,
    delivery: 5000,
    pickup: 0,
  };

  return feeMap[normalized];
}

export function normalizeDeliveryStatus(status?: string): DeliveryStatus {
  const normalized = (status ?? "pending").trim().toLowerCase();
  const validStatuses: DeliveryStatus[] = ["pending", "assigned", "in_transit", "delivered", "failed"];

  if (!validStatuses.includes(normalized as DeliveryStatus)) {
    throw new AppError(`Unsupported delivery status: ${status ?? "pending"}`, 400);
  }

  return normalized as DeliveryStatus;
}

export function isDeliveryTransitionAllowed(currentStatus: DeliveryStatus, nextStatus: DeliveryStatus) {
  const allowedTransitions: Record<DeliveryStatus, DeliveryStatus[]> = {
    pending: ["assigned", "failed"],
    assigned: ["in_transit", "failed"],
    in_transit: ["delivered", "failed"],
    delivered: [],
    failed: [],
  };

  return allowedTransitions[currentStatus]?.includes(nextStatus) ?? false;
}

export function updateDeliveryStatus(currentStatus: DeliveryStatus, nextStatus: DeliveryStatus) {
  if (!isDeliveryTransitionAllowed(currentStatus, nextStatus)) {
    throw new AppError(
      `Delivery cannot move from ${currentStatus} to ${nextStatus}`,
      400,
    );
  }

  return nextStatus;
}

export function mapDeliveryStatusToOrderStatus(status: DeliveryStatus | string) {
  const normalized = normalizeDeliveryStatus(status as string);

  const mapping: Record<DeliveryStatus, string | null> = {
    pending: null,
    assigned: 'packed',
    in_transit: 'shipped',
    delivered: 'completed',
    failed: null,
  };

  return mapping[normalized] ?? null;
}

export async function updateDeliveryStatusForOrder(
  orderId: string,
  nextStatus: DeliveryStatus,
  metadata?: { courier?: string; trackingCode?: string },
) {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new AppError("Valid orderId is required", 400);
  }

  const delivery = await Delivery.findOne({ orderId }).sort({ createdAt: -1 });

  if (!delivery) {
    throw new AppError("Delivery record not found", 404);
  }

  const currentStatus = normalizeDeliveryStatus(delivery.status);
  const finalStatus = updateDeliveryStatus(currentStatus, nextStatus);

  // push audit event
  const event = {
    status: finalStatus,
    courier: metadata?.courier ?? delivery.provider,
    trackingCode: metadata?.trackingCode ?? delivery.trackingCode,
    createdAt: new Date(),
  };

  // ensure events array exists
  (delivery as any).events = Array.isArray((delivery as any).events) ? (delivery as any).events : [];
  (delivery as any).events.push(event);

  delivery.status = finalStatus;
  if (metadata?.courier) delivery.provider = metadata.courier;
  if (metadata?.trackingCode) delivery.trackingCode = metadata.trackingCode;
  await delivery.save();

  const orderForNotification = await Order.findById(orderId).lean();
  if (orderForNotification?.userId) {
    try {
      await notifyDeliveryStatusChange(String(orderForNotification.userId), String(orderId), finalStatus);
    } catch {
      // notification failure should not block delivery updates
    }
  }

  // update associated order status if mapping exists and is a forward progression
  try {
    const order = await Order.findById(orderId);
    if (order) {
      const mapped = mapDeliveryStatusToOrderStatus(finalStatus);
      if (mapped) {
        const orderRank: Record<string, number> = {
          pending: 0,
          paid: 1,
          confirmed: 2,
          packed: 3,
          shipped: 4,
          completed: 5,
          cancelled: 6,
        };

        const currentOrderRank = orderRank[String(order.status)] ?? 0;
        const nextOrderRank = orderRank[String(mapped)] ?? 0;

        if (nextOrderRank > currentOrderRank) {
          order.status = mapped as any;
          await order.save();
        }
      }
    }
  } catch (err) {
    // do not fail delivery update if order update failed; log in real app
    // console.warn('Failed to update order status from delivery change', err);
  }

  return delivery.toObject();
}

export async function assignDeliveryToOrder(
  orderId: string,
  courier?: string,
  trackingCode?: string,
) {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new AppError('Valid orderId is required', 400);
  }

  let delivery = await Delivery.findOne({ orderId }).sort({ createdAt: -1 });

  if (!delivery) {
    // create a delivery record if one does not exist
    // try to fetch order to populate userId and businessId
    let linkedOrder = null;
    try {
      linkedOrder = await Order.findById(orderId).lean();
    } catch (err) {
      // ignore
    }

    try {
      delivery = await Delivery.create({
        orderId,
        userId: linkedOrder?.userId ?? undefined,
        businessId: linkedOrder?.items?.[0]?.businessId ?? undefined,
        method: 'standard',
        provider: courier ?? 'local_dispatch',
        zone: 'local',
        status: 'assigned',
        trackingCode: trackingCode ?? createTrackingCode(),
        address: linkedOrder?.deliveryAddress ?? undefined,
        events: [
          {
            status: 'assigned',
            courier: courier ?? 'local_dispatch',
            trackingCode: trackingCode ?? createTrackingCode(),
            createdAt: new Date(),
          },
        ],
      } as any);
    } catch (err: any) {
      throw err;
    }

    // try update order status to 'packed' if appropriate
    try {
      const order = await Order.findById(orderId);
      if (order) {
        const mapped = mapDeliveryStatusToOrderStatus('assigned');
        const orderRank: Record<string, number> = {
          pending: 0,
          paid: 1,
          confirmed: 2,
          packed: 3,
          shipped: 4,
          completed: 5,
          cancelled: 6,
        };
        const currentOrderRank = orderRank[String(order.status)] ?? 0;
        const nextOrderRank = orderRank[String(mapped)] ?? 0;
        if (mapped && nextOrderRank > currentOrderRank) {
          order.status = mapped as any;
          await order.save();
        }
      }
    } catch (err) {
      // ignore order update failures
    }

    if (linkedOrder?.userId) {
      try {
        await notifyDeliveryStatusChange(String(linkedOrder.userId), String(orderId), 'assigned');
      } catch {
        // notification failure should not block delivery updates
      }
    }

    return delivery.toObject();
  }

  // cannot move from delivered/failed
  const currentStatus = normalizeDeliveryStatus(delivery.status);
  if (currentStatus === 'delivered' || currentStatus === 'failed') {
    throw new AppError('Cannot assign delivery for completed or failed deliveries', 400);
  }

  const event = {
    status: 'assigned',
    courier: courier ?? delivery.provider,
    trackingCode: trackingCode ?? delivery.trackingCode,
    createdAt: new Date(),
  };
  (delivery as any).events = Array.isArray((delivery as any).events) ? (delivery as any).events : [];
  (delivery as any).events.push(event);

  delivery.status = 'assigned';
  delivery.provider = courier ?? delivery.provider ?? 'local_dispatch';
  delivery.trackingCode = trackingCode ?? delivery.trackingCode ?? createTrackingCode();
  await delivery.save();

  const orderForNotification = await Order.findById(orderId).lean();
  if (orderForNotification?.userId) {
    try {
      await notifyDeliveryStatusChange(String(orderForNotification.userId), String(orderId), 'assigned');
    } catch {
      // notification failure should not block delivery updates
    }
  }

  // update associated order (same logic as above)
  try {
    const order = await Order.findById(orderId);
    if (order) {
      const mapped = mapDeliveryStatusToOrderStatus('assigned');
      const orderRank: Record<string, number> = {
        pending: 0,
        paid: 1,
        confirmed: 2,
        packed: 3,
        shipped: 4,
        completed: 5,
        cancelled: 6,
      };
      const currentOrderRank = orderRank[String(order.status)] ?? 0;
      const nextOrderRank = orderRank[String(mapped)] ?? 0;
      if (mapped && nextOrderRank > currentOrderRank) {
        order.status = mapped as any;
        await order.save();
      }
    }
  } catch (err) {
    // ignore
  }

  return delivery.toObject();
}

export function applyWebhookDeliveryState(
  currentStatus: DeliveryStatus,
  nextStatus: DeliveryStatus,
  metadata?: { courier?: string; trackingCode?: string },
) {
  const finalStatus = updateDeliveryStatus(currentStatus, nextStatus);

  return {
    status: finalStatus,
    courier: metadata?.courier ?? "local_dispatch",
    trackingCode: metadata?.trackingCode ?? "unknown",
  };
}

export function createTrackingCode() {
  return `DEL-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function getDeliveryForOrder(orderId: string) {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new AppError('Valid orderId is required', 400);
  }

  const delivery = await Delivery.findOne({ orderId }).sort({ createdAt: -1 }).lean();

  if (!delivery) {
    return null;
  }

  return delivery;
}
