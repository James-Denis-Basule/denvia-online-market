import mongoose from "mongoose";
import Notification, { type NotificationType } from "../models/Notification.js";
import Business from "../models/Business.js";
import BusinessStaff from "../models/BusinessStaff.js";
import { AppError } from "../utils/AppError.js";

export type NotificationPayload = {
  type: NotificationType;
  title: string;
  message: string;
  businessId?: string;
  orderId?: string;
  feedbackId?: string;
  metadata?: Record<string, unknown>;
};

export async function createNotification(userId: string, payload: NotificationPayload) {
  if (!mongoose.isValidObjectId(userId)) {
    throw new AppError("Valid userId is required", 400);
  }

  const notification = await Notification.create({
    userId,
    businessId: payload.businessId,
    orderId: payload.orderId,
    feedbackId: payload.feedbackId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    metadata: payload.metadata ?? {},
  });

  return notification.toObject();
}

export async function getNotificationsForUser(userId: string, limit = 20, unreadOnly = false) {
  if (!mongoose.isValidObjectId(userId)) {
    throw new AppError("Valid userId is required", 400);
  }

  const query: Record<string, unknown> = { userId };

  if (unreadOnly) {
    query.isRead = false;
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return notifications;
}

export async function markNotificationAsRead(userId: string, notificationId: string) {
  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(notificationId)) {
    throw new AppError("Valid userId and notificationId are required", 400);
  }

  const notification = await Notification.findOne({ _id: notificationId, userId });

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  notification.isRead = true;
  await notification.save();

  return notification.toObject();
}

export async function notifyOrderStatusChange(userId: string, orderId: string, status: string) {
  return createNotification(userId, {
    type: "order_status",
    title: `Order ${status}`,
    message: `Your order #${orderId} is now ${status}.`,
    metadata: {
      orderId,
      status,
    },
  });
}

export async function notifyDeliveryStatusChange(userId: string, orderId: string, status: string) {
  return createNotification(userId, {
    type: "delivery_status",
    title: `Delivery ${status}`,
    message: `Delivery for order #${orderId} is now ${status}.`,
    metadata: {
      orderId,
      status,
    },
  });
}

type OrderLike = {
  _id: unknown;
  orderReference: string;
  total: number;
  currency: string;
  customer: { firstName: string; lastName: string };
  items: { businessId: unknown; name: string; quantity: number }[];
};

/**
 * Notifies the owner and active staff of every business represented
 * in an order's items. A single order can span multiple businesses;
 * each business only learns about the items/total relevant to it,
 * never the full multi-business order (spec §31/§34: business
 * isolation must hold even for a shared order).
 */
export async function notifyNewOrderForBusiness(order: OrderLike) {
  const businessIds = [
    ...new Set(order.items.map((item) => String(item.businessId))),
  ];

  for (const businessId of businessIds) {
    const business = await Business.findById(businessId).select(
      "name ownerId",
    );

    if (!business) continue;

    const businessItems = order.items.filter(
      (item) => String(item.businessId) === businessId,
    );

    const itemSummary = businessItems
      .map((item) => `${item.quantity} × ${item.name}`)
      .join(", ");

    const title = `New order — ${order.orderReference}`;
    const message = `${order.customer.firstName} ${order.customer.lastName} ordered ${itemSummary}.`;

    const recipients = new Set<string>([String(business.ownerId)]);

    const activeStaff = await BusinessStaff.find({
      businessId,
      status: "active",
      canReceiveOrderNotifications: true,
    }).select("userId");

    for (const staff of activeStaff) {
      recipients.add(String(staff.userId));
    }

    for (const recipientId of recipients) {
      await createNotification(recipientId, {
        type: "new_order",
        title,
        message,
        businessId,
        orderId: String(order._id),
        metadata: {
          orderReference: order.orderReference,
          total: order.total,
          currency: order.currency,
          items: businessItems,
        },
      });
    }
  }
}

type FeedbackLike = {
  _id: unknown;
  businessId: unknown;
  rating?: number;
  comment?: string;
};

/**
 * Notifies the owner and active staff of a business when a customer
 * submits feedback. Mirrors notifyNewOrderForBusiness's recipient
 * logic so feedback and order notifications stay consistent.
 */
export async function notifyNewFeedbackForBusiness(feedback: FeedbackLike) {
  const businessId = String(feedback.businessId);

  const business = await Business.findById(businessId).select(
    "name ownerId",
  );

  if (!business) return;

  const title = "New customer feedback";
  const message = feedback.rating
    ? `New ${feedback.rating}/5 review for ${business.name}.`
    : `New feedback received for ${business.name}.`;

  const recipients = new Set<string>([String(business.ownerId)]);

  const activeStaff = await BusinessStaff.find({
    businessId,
    status: "active",
    canReceiveOrderNotifications: true,
  }).select("userId");

  for (const staff of activeStaff) {
    recipients.add(String(staff.userId));
  }

  for (const recipientId of recipients) {
    await createNotification(recipientId, {
      type: "new_feedback",
      title,
      message,
      businessId,
      feedbackId: String(feedback._id),
      metadata: {
        rating: feedback.rating,
      },
    });
  }
}
