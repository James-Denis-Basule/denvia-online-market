import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { getNotificationsForUser, markNotificationAsRead } from "../services/notificationService.js";

export async function getNotificationsController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const unreadOnly = req.query.unread === "true";
    const limit = Number(req.query.limit ?? 20);
    const notifications = await getNotificationsForUser(req.user.userId, Number.isFinite(limit) ? Math.max(1, limit) : 20, unreadOnly);

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
}

export async function markNotificationReadController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const notificationId = Array.isArray(req.params.notificationId) ? req.params.notificationId[0] : req.params.notificationId;
    const notification = await markNotificationAsRead(req.user.userId, notificationId);

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
}
