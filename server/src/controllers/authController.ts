import type { Request, Response, NextFunction } from "express";
import User from "../models/User.js";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../types/auth.js";
import Business from "../models/Business.js";
import {
  loginUser,
  logoutUser,
  refreshUserAccessToken,
  registerUser,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
} from "../services/authService.js";
import { AppError } from "../utils/AppError.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import authConfig from "../config/auth.js";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const validation = registerSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid registration data",
        errors: validation.error.flatten().fieldErrors,
      });

      return;
    }

    const user = await registerUser(validation.data);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyEmailAddress(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token =
      typeof req.body?.token === "string" ? req.body.token.trim() : "";

    if (!token) {
      throw new AppError("Email verification token is required", 400);
    }

    const result = await verifyEmail(token);

    res.status(200).json({
      success: true,
      message: result.alreadyVerified
        ? "Email address is already verified"
        : "Email address verified successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const validation = forgotPasswordSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid request",
        errors: validation.error.flatten().fieldErrors,
      });

      return;
    }

    await requestPasswordReset(validation.data.email);

    // Same response whether or not the email exists — this endpoint
    // never confirms or denies an account's existence.
    res.status(200).json({
      success: true,
      message:
        "If an account exists for that email address, a password reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPasswordController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const validation = resetPasswordSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid request",
        errors: validation.error.flatten().fieldErrors,
      });

      return;
    }

    await resetPassword(validation.data.token, validation.data.password);

    res.status(200).json({
      success: true,
      message:
        "Your password has been reset successfully. You can now sign in with your new password.",
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid login data",
        errors: validation.error.flatten().fieldErrors,
      });

      return;
    }

    const result = await loginUser(
      validation.data.email,
      validation.data.password,
    );

    res.cookie(authConfig.refreshCookieName, result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth",
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateNotificationPreferences(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { sms, whatsapp, email, inApp } = req.body ?? {};

    const user = await User.findById(req.user.userId);

    if (!user) {
      throw new AppError("User account not found", 404);
    }

    // In-app notifications carry critical transactional info
    // (order status, etc.) and cannot be disabled — matches spec:
    // critical transactional notifications aren't user-optional.
    if (typeof sms === "boolean") user.notificationPreferences.sms = sms;
    if (typeof whatsapp === "boolean")
      user.notificationPreferences.whatsapp = whatsapp;
    if (typeof email === "boolean") user.notificationPreferences.email = email;
    void inApp;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Notification preferences updated",
      data: { notificationPreferences: user.notificationPreferences },
    });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      throw new AppError("User account not found", 404);
    }

    let activeBusiness = null;

    if (user.activeBusinessId) {
      activeBusiness = await Business.findOne({
        _id: user.activeBusinessId,
        ownerId: user._id,
        status: { $ne: "suspended" },
      });
    }

    if (user.activeBusinessId && !activeBusiness) {
      user.activeBusinessId = undefined;
      await user.save();
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          accountTypes: user.accountTypes,
          role: user.role,
          isActive: user.isActive,
          isEmailVerified: user.isEmailVerified,
          notificationPreferences: user.notificationPreferences,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
      activeBusiness: activeBusiness
        ? {
            id: activeBusiness._id.toString(),
            name: activeBusiness.name,
            slug: activeBusiness.slug,
            logo: activeBusiness.logo,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
}

export async function refreshAccessToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const refreshToken = req.cookies?.[authConfig.refreshCookieName];

    if (!refreshToken) {
      throw new AppError("Refresh token required", 401);
    }

    const result = await refreshUserAccessToken(refreshToken);

    res.cookie(authConfig.refreshCookieName, result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth",
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies?.[authConfig.refreshCookieName];

    if (refreshToken) {
      await logoutUser(refreshToken);
    }

    res.clearCookie(authConfig.refreshCookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
}
