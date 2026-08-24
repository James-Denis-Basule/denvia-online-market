import type {
  Request,
  Response,
  NextFunction,
} from "express";

import { searchQuerySchema } from "../types/search.js";
import { searchMarketplace } from "../services/searchService.js";

export async function searchController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const validation =
      searchQuerySchema.safeParse(req.query);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid search parameters",
        errors:
          validation.error.flatten().fieldErrors,
      });

      return;
    }

    const results = await searchMarketplace(
      validation.data,
    );

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
}