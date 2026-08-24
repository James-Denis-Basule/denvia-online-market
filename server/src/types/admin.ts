import { z } from "zod";

export const adminUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export type AdminUserStatusInput = z.infer<
  typeof adminUserStatusSchema
>;

export const adminBusinessStatusSchema = z.object({
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export type AdminBusinessStatusInput = z.infer<
  typeof adminBusinessStatusSchema
>;

export const adminProductStatusSchema = z.object({
  action: z.enum(["remove", "restore"]),
});

export type AdminProductStatusInput = z.infer<
  typeof adminProductStatusSchema
>;

export const createAdminCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(100),

  description: z
    .string()
    .trim()
    .max(500)
    .optional(),
});

export type CreateAdminCategoryInput = z.infer<
  typeof createAdminCategorySchema
>;

export const updateAdminCategorySchema =
  createAdminCategorySchema.partial();

export type UpdateAdminCategoryInput = z.infer<
  typeof updateAdminCategorySchema
>;