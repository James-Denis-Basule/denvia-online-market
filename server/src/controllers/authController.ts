import type { Request, Response, NextFunction } from "express";
import User from "../models/User.js";
import { loginSchema, registerSchema } from "../types/auth.js";
import {
  loginUser,
  logoutUser,
  refreshUserAccessToken,
  registerUser,
  verifyEmail,
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
      typeof req.body?.token === "string"
        ? req.body.token.trim()
        : "";

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

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
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
