import { z } from "zod";

export const postTypeSchema = z.enum([
  "product_promotion",
  "announcement",
  "event",
  "product_launch",
  "special_offer",
  "business_news",
]);

export const postStatusSchema = z.enum([
  "draft",
  "published",
  "archived",
]);

export const createPostSchema = z.object({
  businessId: z
    .string()
    .min(1, "Business ID is required"),

  title: z
    .string()
    .trim()
    .min(2, "Post title must have at least 2 characters")
    .max(200, "Post title must not exceed 200 characters"),

  content: z
    .string()
    .trim()
    .min(1, "Post content is required")
    .max(5000, "Post content must not exceed 5000 characters"),

  type: postTypeSchema.default("announcement"),

  status: postStatusSchema.default("draft"),

  isVisible: z
    .boolean()
    .default(true),

  hashtags: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Hashtag cannot be empty")
        .max(100, "Hashtag is too long"),
    )
    .max(30, "A post cannot have more than 30 hashtags")
    .default([]),

  productId: z
    .string()
    .min(1, "Product ID cannot be empty")
    .optional(),

  eventDate: z
    .coerce
    .date()
    .optional(),
});

export type CreatePostInput = z.infer<
  typeof createPostSchema
>;

export const updatePostSchema = createPostSchema
  .omit({
    businessId: true,
  })
  .partial();

export type UpdatePostInput = z.infer<
  typeof updatePostSchema
>;

export const addPostMediaSchema = z.object({
  alt: z
    .string()
    .trim()
    .max(250, "Alt text is too long")
    .optional(),
});

export type AddPostMediaInput = z.infer<
  typeof addPostMediaSchema
>;

export const reorderPostMediaSchema = z.object({
  mediaIds: z
    .array(
      z.string().min(1, "Media ID is required"),
    )
    .min(1, "At least one media ID is required"),
});

export type ReorderPostMediaInput = z.infer<
  typeof reorderPostMediaSchema
>;