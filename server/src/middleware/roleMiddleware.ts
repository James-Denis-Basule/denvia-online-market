import type { Response, NextFunction } from "express";

import {
  authenticate,
  type AuthenticatedRequest,
} from "./authMiddleware.js";

import { AppError } from "../utils/AppError.js";

import type { UserRole } from "../models/User.js";

/**
 * Requires the authenticated user's role to be one of `roles`.
 * Runs `authenticate` first, so it can be used standalone on a route
 * without also listing `authenticate` separately.
 *
 * Usage:
 *   router.post("/staff", requireRole("business_owner", "admin"), ...);
 */
export function requireRole(...roles: UserRole[]) {
  return function (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    authenticate(req, res, () => {
      if (!req.user) {
        next(new AppError("Authentication required", 401));
        return;
      }

      if (!roles.includes(req.user.role as UserRole)) {
        next(
          new AppError(
            "You do not have permission to perform this action",
            403,
          ),
        );
        return;
      }

      next();
    });
  };
}
