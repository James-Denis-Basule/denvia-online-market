import mongoose from "mongoose";

import Product from "../models/Product.js";
import ProductReview from "../models/ProductReview.js";
import { AppError } from "../utils/AppError.js";
import { notifyNewFeedbackForBusiness } from "./notificationService.js";
import type { ReviewInput, UpdateReviewInput } from "../types/review.js";

async function refreshProductRating(productId: string) {
  const summary = await ProductReview.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: "$productId",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const stats = summary[0] ?? { averageRating: 0, reviewCount: 0 };
  const roundedAverage = Number(stats.averageRating ?? 0);

  await Product.findByIdAndUpdate(productId, {
    averageRating: Number(roundedAverage.toFixed(1)),
    reviewCount: Number(stats.reviewCount ?? 0),
  });

  return {
    averageRating: Number(roundedAverage.toFixed(1)),
    reviewCount: Number(stats.reviewCount ?? 0),
  };
}

export async function getProductReviews(productId: string) {
  if (!mongoose.isValidObjectId(productId)) {
    throw new AppError("Invalid product ID", 400);
  }

  const product = await Product.findById(productId).lean();
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const reviews = await ProductReview.find({ productId })
    .sort({ createdAt: -1 })
    .populate({ path: "userId", select: "firstName lastName email" })
    .lean();

  return {
    productId,
    averageRating: Number(product.averageRating ?? 0),
    reviewCount: Number(product.reviewCount ?? 0),
    reviews,
  };
}

export async function createProductReview(
  userId: string,
  productId: string,
  input: ReviewInput,
) {
  if (
    !mongoose.isValidObjectId(userId) ||
    !mongoose.isValidObjectId(productId)
  ) {
    throw new AppError("Invalid user or product ID", 400);
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const existingReview = await ProductReview.findOne({ productId, userId });
  if (existingReview) {
    throw new AppError("You have already reviewed this product", 409);
  }

  const review = await ProductReview.create({
    productId,
    userId,
    businessId: product.businessId,
    rating: input.rating,
    title: input.title,
    comment: input.comment,
    verifiedPurchase: input.verifiedPurchase ?? false,
  });

  const ratingSummary = await refreshProductRating(productId);

  try {
    // await notifyNewFeedbackForBusiness(review.toObject());
    await notifyNewFeedbackForBusiness({
      _id: review._id,
      businessId: review.businessId,
      rating: review.rating,
      comment: review.comment,
    });
  } catch (notificationError) {
    console.error(
      "Failed to notify business of new feedback:",
      notificationError,
    );
  }

  return {
    ...review.toObject(),
    ...ratingSummary,
  };
}

export async function updateProductReview(
  userId: string,
  productId: string,
  reviewId: string,
  input: UpdateReviewInput,
) {
  if (
    !mongoose.isValidObjectId(reviewId) ||
    !mongoose.isValidObjectId(productId)
  ) {
    throw new AppError("Invalid review or product ID", 400);
  }

  const review = await ProductReview.findOne({
    _id: reviewId,
    productId,
    userId,
  });
  if (!review) {
    throw new AppError(
      "Review not found or you do not have permission to update it",
      404,
    );
  }

  if (input.rating !== undefined) {
    review.rating = input.rating;
  }
  if (input.title !== undefined) {
    review.title = input.title;
  }
  if (input.comment !== undefined) {
    review.comment = input.comment;
  }
  if (input.verifiedPurchase !== undefined) {
    review.verifiedPurchase = input.verifiedPurchase;
  }

  await review.save();
  const ratingSummary = await refreshProductRating(productId);

  return {
    ...review.toObject(),
    ...ratingSummary,
  };
}

export async function deleteProductReview(
  userId: string,
  productId: string,
  reviewId: string,
) {
  if (
    !mongoose.isValidObjectId(reviewId) ||
    !mongoose.isValidObjectId(productId)
  ) {
    throw new AppError("Invalid review or product ID", 400);
  }

  const review = await ProductReview.findOne({
    _id: reviewId,
    productId,
    userId,
  });
  if (!review) {
    throw new AppError(
      "Review not found or you do not have permission to delete it",
      404,
    );
  }

  await review.deleteOne();
  const ratingSummary = await refreshProductRating(productId);

  return {
    reviewId,
    productId,
    ...ratingSummary,
  };
}
