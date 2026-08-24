import { Router } from "express";

import {
  createProductController,
  getMyProductsController,
  updateProductController,
  deleteProductController,
  addProductMediaController,
  setPrimaryProductMediaController,
  deleteProductMediaController,
  reorderProductMediaController,
  uploadProductMediaController,
  getPublicProductsController,
  getPublicProductController,
} from "../controllers/productController.js";
import {
  createProductReviewController,
  deleteProductReviewController,
  getProductReviewsController,
  updateProductReviewController,
} from "../controllers/reviewController.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { uploadProductImage } from "../middleware/uploadMiddleware.js";

const router = Router();

/**
 * Create a product
 */
router.post("/", authenticate, createProductController);

/**
 * Public product listing
 */
router.get("/", getPublicProductsController);

/**
 * Get all products belonging to a business
 */
router.get(
  "/business/:businessId",
  authenticate,
  getMyProductsController,
);

/**
 * Product review endpoints
 */
router.get("/:productId/reviews", getProductReviewsController);
router.post("/:productId/reviews", authenticate, createProductReviewController);
router.patch("/:productId/reviews/:reviewId", authenticate, updateProductReviewController);
router.delete("/:productId/reviews/:reviewId", authenticate, deleteProductReviewController);

/**
 * Public product details
 */
router.get("/:id", getPublicProductController);

/**
 * Update a product
 */
router.patch("/:id", authenticate, updateProductController);

/**
 * Delete a product
 */
router.delete("/:id", authenticate, deleteProductController);

/**
 * Add product media
 */
router.post(
  "/:id/media",
  authenticate,
  addProductMediaController,
);

/**
 * Set primary product media
 */
router.patch(
  "/:id/media/:mediaId/primary",
  authenticate,
  setPrimaryProductMediaController,
);

/**
 * Delete product media
 */
router.delete(
  "/:id/media/:mediaId",
  authenticate,
  deleteProductMediaController,
);

/**
 * Reorder product media
 */
router.patch(
  "/:id/media/reorder",
  authenticate,
  reorderProductMediaController,
);

/**
 * Upload product image
 */
router.post(
  "/:id/media/upload",
  authenticate,
  uploadProductImage.single("image"),
  uploadProductMediaController,
);

export default router;