import { z } from 'zod';

export const productMediaSchema = z.object({
  url: z
    .string()
    .trim()
    .url('Image URL must be a valid URL'),

  publicId: z
    .string()
    .trim()
    .min(1, 'Image public ID is required'),

  alt: z
    .string()
    .trim()
    .max(250, 'Alt text is too long')
    .optional(),

  isPrimary: z
    .boolean()
    .default(false),

  sortOrder: z
    .number()
    .int('Sort order must be a whole number')
    .nonnegative('Sort order cannot be negative')
    .default(0),
});

export type ProductMedia = z.infer<
  typeof productMediaSchema
>;