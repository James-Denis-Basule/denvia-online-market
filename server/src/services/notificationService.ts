import mongoose from "mongoose";
import Notification, { type NotificationType } from "../models/Notification.js";
import { AppError } from "../utils/AppError.js";

export type NotificationPayload = {
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
};

export async function createNotification(userId: string, payload: NotificationPayload) {
  if (!mongoose.isValidObjectId(userId)) {
    throw new AppError("Valid userId is required", 400);
  }

  const notification = await Notification.create({
    userId,
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
