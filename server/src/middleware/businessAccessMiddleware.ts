import type { Response, NextFunction } from "express";
import { authenticate, type AuthenticatedRequest } from "./authMiddleware.js";
import { AppError } from "../utils/AppError.js";
import { getBusinessAccessLevel } from "../services/businessService.js";

export interface BusinessScopedRequest extends AuthenticatedRequest {
  businessAccess?: "admin" | "owner" | "manager" | "staff";
}

async function resolveBusinessAccess(
  req: BusinessScopedRequest,
): Promise<"admin" | "owner" | "manager" | "staff"> {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  if (req.user.role === "admin") {
    return "admin";
  }

  const businessId = req.params.businessId ?? req.params.id;

  if (!businessId || typeof businessId !== "string") {
    throw new AppError("Business ID is required", 400);
  }

  const accessLevel = await getBusinessAccessLevel(
    businessId,
    req.user.userId,
  );

  if (!accessLevel) {
    throw new AppError(
      "You do not have permission to access this business",
      403,
    );
  }

  return accessLevel;
}

export function requireBusinessAccess(paramName: string = "id") {
  return function (
    req: BusinessScopedRequest,
    res: Response,
    next: NextFunction,
  ) {
    req.params.businessId = req.params[paramName];

    authenticate(req, res, async () => {
      try {
        req.businessAccess = await resolveBusinessAccess(req);
        next();
      } catch (error) {
        next(error);
      }
    });
  };
}

export function requireBusinessManageAccess(paramName: string = "id") {
  return function (
    req: BusinessScopedRequest,
    res: Response,
    next: NextFunction,
  ) {
    req.params.businessId = req.params[paramName];

    authenticate(req, res, async () => {
      try {
        const accessLevel = await resolveBusinessAccess(req);

        if (accessLevel === "staff") {
          throw new AppError(
            "Only the business owner or a manager can perform this action",
            403,
          );
        }

        req.businessAccess = accessLevel;
        next();
      } catch (error) {
        next(error);
      }
    });
  };
}
