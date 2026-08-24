import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { getPlanCatalog, getUsageSummary, consumeAiCredits } from "../services/marketingService.js";

export async function getMarketingPlansController(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const plans = await getPlanCatalog();

    res.status(200).json({
      success: true,
      data: { plans },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMarketingUsageController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const summary = await getUsageSummary({
      userId: req.user.userId,
    });

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
}

export async function consumeMarketingCreditsController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const { action, creditsRequired, metadata } = req.body ?? {};

    if (typeof action !== "string" || typeof creditsRequired !== "number") {
      res.status(400).json({
        success: false,
        message: "action and creditsRequired are required",
      });
      return;
    }

    const result = await consumeAiCredits({
      userId: req.user.userId,
      action,
      creditsRequired,
      metadata,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
