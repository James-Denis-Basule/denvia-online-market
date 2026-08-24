import { Router } from "express";

import {
  categories,
  discoveryHome,
  featuredBusinesses,
  newBusinesses,
  newProducts,
  newServices,
  promotions,
  trendingBusinesses,
  trendingProducts,
} from "../controllers/discoveryController.js";

const router = Router();

/**
 * Complete discovery homepage
 *
 * GET /api/discovery
 */
router.get("/", discoveryHome);

/**
 * Businesses
 */
router.get(
  "/businesses/featured",
  featuredBusinesses,
);

router.get(
  "/businesses/trending",
  trendingBusinesses,
);

router.get(
  "/businesses/new",
  newBusinesses,
);

/**
 * Products
 */
router.get(
  "/products/trending",
  trendingProducts,
);

router.get(
  "/products/new",
  newProducts,
);

/**
 * Services
 */
router.get(
  "/services/new",
  newServices,
);

/**
 * Promotions
 */
router.get(
  "/promotions",
  promotions,
);

/**
 * Categories
 */
router.get(
  "/categories",
  categories,
);

export default router;