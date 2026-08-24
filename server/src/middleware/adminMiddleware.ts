import type { Response, NextFunction } from "express";

import {
  authenticate,
  type AuthenticatedRequest,
} from "./authMiddleware.js";

import { AppError } from "../utils/AppError.js";

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  authenticate(req, res, () => {
    if (!req.user) {
      next(new AppError("Authentication required", 401));
      return;
    }

    if (req.user.role !== "admin") {
      next(new AppError("Administrator access required", 403));
      return;
    }

    next();
  });
}