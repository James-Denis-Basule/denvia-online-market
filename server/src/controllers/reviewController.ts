import type { Request, Response, NextFunction } from "express";

import { AppError } from "../utils/AppError.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { reviewSchema, updateReviewSchema } from "../types/review.js";
import {
  createProductReview,
  deleteProductReview,
  getProductReviews,
  updateProductReview,
} from "../services/reviewService.js";

export async function getProductReviewsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await getProductReviews(String(req.params.productId));

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function createProductReviewController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const validation = reviewSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid review payload",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const review = await createProductReview(req.user.userId, String(req.params.productId), validation.data);

    res.status(201).json({
      success: true,
      message: "Product review added successfully",
      data: review,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProductReviewController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const validation = updateReviewSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid review update payload",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const review = await updateProductReview(
      req.user.userId,
      String(req.params.productId),
      String(req.params.reviewId),
      validation.data,
    );

    res.status(200).json({
      success: true,
      message: "Product review updated successfully",
      data: review,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProductReviewController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const result = await deleteProductReview(
      req.user.userId,
      String(req.params.productId),
      String(req.params.reviewId),
    );

    res.status(200).json({
      success: true,
      message: "Product review deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
