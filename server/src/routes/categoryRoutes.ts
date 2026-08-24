import { Router } from "express";

import {
  createCategoryController,
  getMyCategoriesController,
  getCategoryController,
  updateCategoryController,
  deleteCategoryController,
  getPublicCategoriesController,
  getPublicCategoryController,
} from "../controllers/categoryController.js";

import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * Public category listing
 */
router.get("/", getPublicCategoriesController);

/**
 * Public category details
 */
router.get("/:id", getPublicCategoryController);

/**
 * Create category
 */
router.post("/", authenticate, createCategoryController);

/**
 * Get all categories belonging to a business
 */
router.get(
  "/business/:businessId",
  authenticate,
  getMyCategoriesController,
);

/**
 * Get category for business owner
 */
router.get(
  "/manage/:id",
  authenticate,
  getCategoryController,
);

/**
 * Update category
 */
router.patch(
  "/:id",
  authenticate,
  updateCategoryController,
);

/**
 * Delete category
 */
router.delete(
  "/:id",
  authenticate,
  deleteCategoryController,
);

export default router;