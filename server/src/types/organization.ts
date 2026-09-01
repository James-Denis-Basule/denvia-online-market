import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Organization name must have at least 2 characters")
    .max(100, "Organization name must not exceed 100 characters"),

  description: z
    .string()
    .trim()
    .max(1000, "Description is too long")
    .optional(),
});

export const updateOrganizationSchema =
  createOrganizationSchema.partial();

export type CreateOrganizationInput =
  z.infer<typeof createOrganizationSchema>;

export type UpdateOrganizationInput =
  z.infer<typeof updateOrganizationSchema>;
