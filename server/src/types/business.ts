import { z } from "zod";

const operatingHoursDaySchema = z.object({
  isOpen: z.boolean().default(true),
  open: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):[0-5]\d$/,
      "Opening time must use HH:mm format",
    )
    .optional(),
  close: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):[0-5]\d$/,
      "Closing time must use HH:mm format",
    )
    .optional(),
});

const operatingHoursSchema = z
  .object({
    monday: operatingHoursDaySchema.optional(),
    tuesday: operatingHoursDaySchema.optional(),
    wednesday: operatingHoursDaySchema.optional(),
    thursday: operatingHoursDaySchema.optional(),
    friday: operatingHoursDaySchema.optional(),
    saturday: operatingHoursDaySchema.optional(),
    sunday: operatingHoursDaySchema.optional(),
  })
  .optional();

const socialLinksSchema = z
  .object({
    facebook: z.string().trim().url().optional(),
    instagram: z.string().trim().url().optional(),
    linkedin: z.string().trim().url().optional(),
    tiktok: z.string().trim().url().optional(),
    x: z.string().trim().url().optional(),
  })
  .optional();

export const createBusinessSchema = z.object({
  organizationId: z
    .string()
    .trim()
    .optional(),
  name: z
    .string()
    .trim()
    .min(2, "Business name must have at least 2 characters")
    .max(100, "Business name must not exceed 100 characters"),

  description: z
    .string()
    .trim()
    .max(1000, "Description is too long")
    .optional(),

  email: z
    .string()
    .trim()
    .email("Please enter a valid business email")
    .toLowerCase(),

  phone: z
    .string()
    .trim()
    .optional(),

  whatsappNumber: z
    .string()
    .trim()
    .optional(),

  category: z
    .string()
    .trim()
    .optional(),

  location: z
    .object({
      country: z
        .string()
        .trim()
        .default("Uganda"),

      district: z
        .string()
        .trim()
        .optional(),

      city: z
        .string()
        .trim()
        .optional(),

      address: z
        .string()
        .trim()
        .optional(),
    })
    .optional(),

  operatingHours: operatingHoursSchema,

  socialLinks: socialLinksSchema,

  logo: z
    .string()
    .trim()
    .url("Logo must be a valid URL")
    .optional(),

  coverImage: z
    .string()
    .trim()
    .url("Cover image must be a valid URL")
    .optional(),

  website: z
    .string()
    .trim()
    .url("Website must be a valid URL")
    .optional(),
});

export type CreateBusinessInput =
  z.infer<typeof createBusinessSchema>;

export const updateBusinessSchema =
  createBusinessSchema.partial();

export type UpdateBusinessInput =
  z.infer<typeof updateBusinessSchema>;

export const publicBusinessQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20),

  search: z
    .string()
    .trim()
    .optional(),

  category: z
    .string()
    .trim()
    .optional(),

  sort: z
    .enum([
      "newest",
      "oldest",
      "name_asc",
      "name_desc",
    ])
    .default("newest"),
});

export type PublicBusinessQueryInput =
  z.infer<typeof publicBusinessQuerySchema>;