import { Router } from "express";

import { searchController } from "../controllers/searchController.js";

const router = Router();

/**
 * Search the Denvia Online Market
 *
 * Example:
 * GET /api/search?q=laptop
 * GET /api/search?q=laptop&minPrice=500&maxPrice=2000
 */
router.get("/", searchController);

export default router;