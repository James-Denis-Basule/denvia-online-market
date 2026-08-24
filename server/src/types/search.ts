import { z } from "zod";

export const searchQuerySchema = z
  .object({
    q: z
      .string()
      .trim()
      .min(1, "Search query is required")
      .max(150, "Search query is too long"),

    category: z
      .string()
      .trim()
      .optional(),

    location: z
      .string()
      .trim()
      .optional(),

    minPrice: z.coerce
      .number()
      .min(0, "Minimum price cannot be negative")
      .optional(),

    maxPrice: z.coerce
      .number()
      .min(0, "Maximum price cannot be negative")
      .optional(),

    sort: z
      .enum(["price", "name", "createdAt"])
      .default("createdAt"),

    order: z
      .enum(["asc", "desc"])
      .default("desc"),

    page: z.coerce
      .number()
      .int()
      .min(1)
      .default(1),

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(50)
      .default(20),
  })
  .refine(
    (data) =>
      data.minPrice === undefined ||
      data.maxPrice === undefined ||
      data.minPrice <= data.maxPrice,
    {
      message:
        "Minimum price cannot be greater than maximum price",
      path: ["minPrice"],
    },
  );

export type SearchQueryInput = z.infer<
  typeof searchQuerySchema
>;