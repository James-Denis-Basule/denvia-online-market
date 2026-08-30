import { Router } from "express";

import {
  createBusinessController,
  getBusinessController,
  getMyBusinessesController,
  updateBusinessController,
  deleteBusinessController,
  getPublicBusinessesController,
  getPublicBusinessController,
  getPublicBusinessProductsController,
  getBusinessWhatsAppLinkController,
  selectBusinessController,
  uploadBusinessImageController,
} from "../controllers/businessController.js";

import { authenticate } from "../middleware/authMiddleware.js";

import { getPublicServicesController } from "../controllers/serviceController.js";
// import { uploadBusinessImage } from "../middleware/uploadMiddleware.js";

const router = Router();

/**
 * Public business listing
 */
router.get("/", getPublicBusinessesController);

/**
 * Authenticated user's businesses
 *
 * IMPORTANT:
 * This must come before "/:id"
 * to prevent "my-businesses" from being treated as a business ID.
 */
router.get("/my-businesses", authenticate, getMyBusinessesController);

router.patch("/:id/select", authenticate, selectBusinessController);

/**
 * Authenticated user's single business
 */
router.get("/my/:id", authenticate, getBusinessController);

/**
 * Create business
 */
router.post("/", authenticate, createBusinessController);

/**
 * Public business products
 */
router.get("/:businessId/products", getPublicBusinessProductsController);

/**
 * Public business services
 */
router.get("/:businessId/services", getPublicServicesController);

/**
 * Public WhatsApp contact link
 */
router.get("/:businessId/whatsapp", getBusinessWhatsAppLinkController);

/**
 * Update authenticated user's business
 */
router.patch("/my/:id", authenticate, updateBusinessController);

/**
 * Upload business logo or cover image
 */
router.post(
  "/:id/image",
  authenticate,
  // uploadBusinessImage.single("image"),
  uploadBusinessImageController,
);

/**
 * Delete authenticated user's business
 */
router.delete("/:id", authenticate, deleteBusinessController);

/**
 * Public business details
 *
 * IMPORTANT:
 * Keep this dynamic route AFTER all specific routes.
 */
router.get("/:id", getPublicBusinessController);

export default router;
