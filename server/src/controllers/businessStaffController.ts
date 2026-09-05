import type { Response, NextFunction } from "express";
import { z } from "zod";

import { AppError } from "../utils/AppError.js";

import {
  inviteStaffMember,
  listBusinessStaff,
  removeStaffMember,
  acceptStaffInvite,
  updateStaffNotificationPermission,
} from "../services/businessStaffService.js";

import type { BusinessScopedRequest } from "../middleware/businessAccessMiddleware.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

const inviteStaffSchema = z.object({
  email: z.string().email(),
  role: z.enum(["manager", "staff"]).optional(),
});

export async function inviteStaffController(
  req: BusinessScopedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const validation = inviteStaffSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid staff invite",
        errors: validation.error.flatten().fieldErrors,
      });

      return;
    }

    const membership = await inviteStaffMember(
      String(req.params.businessId),
      req.user.userId,
      validation.data,
    );

    res.status(201).json({
      success: true,
      message: "Staff invite created",
      data: {
        membership,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function listStaffController(
  req: BusinessScopedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const staff = await listBusinessStaff(String(req.params.businessId));

    res.status(200).json({
      success: true,
      data: {
        staff,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateStaffNotificationPermissionController(
  req: BusinessScopedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { canReceiveOrderNotifications } = req.body ?? {};

    if (typeof canReceiveOrderNotifications !== "boolean") {
      res.status(400).json({
        success: false,
        message: "canReceiveOrderNotifications must be a boolean",
      });
      return;
    }

    const membership = await updateStaffNotificationPermission(
      String(req.params.businessId),
      String(req.params.membershipId),
      canReceiveOrderNotifications,
    );

    res.status(200).json({
      success: true,
      message: "Notification permission updated",
      data: { membership },
    });
  } catch (error) {
    next(error);
  }
}

export async function removeStaffController(
  req: BusinessScopedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    await removeStaffMember(
      String(req.params.businessId),
      String(req.params.membershipId),
    );

    res.status(200).json({
      success: true,
      message: "Staff member removed",
    });
  } catch (error) {
    next(error);
  }
}

export async function acceptStaffInviteController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const membership = await acceptStaffInvite(
      String(req.params.businessId),
      req.user.userId,
    );

    res.status(200).json({
      success: true,
      message: "Invite accepted",
      data: {
        membership,
      },
    });
  } catch (error) {
    next(error);
  }
}
