import { z } from "zod";

export const createServiceSchema = z.object({
  businessId: z.string().min(1, "Business ID is required"),

  name: z
    .string()
    .trim()
    .min(2, "Service name must have at least 2 characters")
    .max(150, "Service name must not exceed 150 characters"),

  description: z
    .string()
    .trim()
    .max(2000, "Description is too long")
    .optional(),

  category: z
    .string()
    .trim()
    .max(100, "Category is too long")
    .optional(),

  price: z
    .number()
    .min(0, "Price cannot be negative")
    .optional(),

  currency: z
    .string()
    .trim()
    .length(3, "Currency must be a 3-letter code")
    .default("UGX"),

  pricingType: z
    .enum([
      "fixed",
      "starting_from",
      "negotiable",
      "free",
    ])
    .default("fixed"),

  duration: z
    .number()
    .min(0, "Duration cannot be negative")
    .optional(),

  status: z
    .enum([
      "active",
      "archived",
      "draft",
    ])
    .default("active"),

  isVisible: z
    .boolean()
    .default(true),
});

export type CreateServiceInput = z.infer<
  typeof createServiceSchema
>;

export const updateServiceSchema =
  createServiceSchema
    .omit({
      businessId: true,
    })
    .partial();

export type UpdateServiceInput = z.infer<
  typeof updateServiceSchema
>;