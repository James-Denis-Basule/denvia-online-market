import { z } from "zod";

export const reviewSchema = z.object({
  rating: z.number().int("Rating must be a whole number").min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  title: z.string().trim().max(120, "Review title is too long").optional(),
  comment: z.string().trim().max(2000, "Review comment is too long").optional(),
  verifiedPurchase: z.boolean().default(false).optional(),
});

export const updateReviewSchema = reviewSchema.partial();

export type ReviewInput = z.infer<typeof reviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
