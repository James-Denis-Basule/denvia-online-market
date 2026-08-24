import { z } from "zod";

export const productMediaSchema = z.object({
  url: z.string().trim().url("Image URL must be a valid URL"),

  publicId: z.string().trim().min(1, "Image public ID is required"),

  alt: z.string().trim().max(250, "Alt text is too long").optional(),

  isPrimary: z.boolean().default(false),

  sortOrder: z
    .number()
    .int("Sort order must be a whole number")
    .nonnegative("Sort order cannot be negative")
    .default(0),
});

export const addProductMediaSchema = productMediaSchema;

export const createProductSchema = z.object({
  businessId: z.string().min(1, "Business ID is required"),

  name: z
    .string()
    .trim()
    .min(2, "Product name must have at least 2 characters")
    .max(150, "Product name must not exceed 150 characters"),

  description: z
    .string()
    .trim()
    .max(3000, "Description is too long")
    .optional(),

  price: z.number().nonnegative("Price cannot be negative"),

  compareAtPrice: z
    .number()
    .nonnegative("Compare-at price cannot be negative")
    .optional(),

  currency: z
    .string()
    .trim()
    .length(3, "Currency must use a 3-letter code")
    .toUpperCase()
    .default("UGX"),

  sku: z.string().trim().max(100, "SKU is too long").optional(),

  stockQuantity: z
    .number()
    .int("Stock quantity must be a whole number")
    .nonnegative("Stock cannot be negative")
    .default(0),

  categoryId: z.string().trim().min(1, "Category ID is required").optional(),

  status: z
    .enum(["draft", "active", "out_of_stock", "archived"])
    .default("draft"),

  isVisible: z.boolean().default(true),

  media: z
    .array(productMediaSchema)
    .max(10, "A product can have a maximum of 10 images")
    .default([]),
});

/**
 * Update schema.
 *
 * No defaults are used here because PATCH requests
 * should only modify fields explicitly supplied.
 */
export const updateProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Product name must have at least 2 characters")
    .max(150, "Product name must not exceed 150 characters")
    .optional(),

  description: z
    .string()
    .trim()
    .max(3000, "Description is too long")
    .optional(),

  price: z.number().nonnegative("Price cannot be negative").optional(),

  compareAtPrice: z
    .number()
    .nonnegative("Compare-at price cannot be negative")
    .optional(),

  currency: z
    .string()
    .trim()
    .length(3, "Currency must use a 3-letter code")
    .toUpperCase()
    .optional(),

  sku: z.string().trim().max(100, "SKU is too long").optional(),

  stockQuantity: z
    .number()
    .int("Stock quantity must be a whole number")
    .nonnegative("Stock cannot be negative")
    .optional(),

  categoryId: z.string().trim().min(1, "Category ID is required").optional(),

  status: z.enum(["draft", "active", "out_of_stock", "archived"]).optional(),

  isVisible: z.boolean().optional(),

  media: z
    .array(productMediaSchema)
    .max(10, "A product can have a maximum of 10 images")
    .optional(),
});

export const reorderProductMediaSchema = z.object({
  mediaIds: z
    .array(z.string().min(1, "Media ID is required"))
    .min(1, "At least one media ID is required")
    .max(10, "A product can have a maximum of 10 images"),
});

export type ProductMedia = z.infer<typeof productMediaSchema>;

export type CreateProductInput = z.infer<typeof createProductSchema>;

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const publicProductQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(50).default(20),

  search: z.string().trim().max(150).optional(),

  categoryId: z.string().trim().min(1).optional(),

  sort: z
    .enum([
      "newest",
      "oldest",
      "price_asc",
      "price_desc",
      "name_asc",
      "name_desc",
    ])
    .default("newest"),
});

export type PublicProductQueryInput = z.infer<typeof publicProductQuerySchema>;
