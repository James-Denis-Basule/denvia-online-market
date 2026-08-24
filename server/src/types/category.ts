import { z } from 'zod';

export const createCategorySchema = z.object({
  businessId: z
    .string()
    .min(1, 'Business ID is required'),

  name: z
    .string()
    .trim()
    .min(
      2,
      'Category name must have at least 2 characters',
    )
    .max(
      100,
      'Category name must not exceed 100 characters',
    ),

  description: z
    .string()
    .trim()
    .max(
      500,
      'Description is too long',
    )
    .optional(),

  isActive: z
    .boolean()
    .default(true),
});

export const updateCategorySchema =
  createCategorySchema
    .omit({
      businessId: true,
    })
    .partial();

export type CreateCategoryInput =
  z.infer<typeof createCategorySchema>;

export type UpdateCategoryInput =
  z.infer<typeof updateCategorySchema>;