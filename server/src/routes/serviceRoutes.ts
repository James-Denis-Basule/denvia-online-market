import { Router } from "express";

import {
  createServiceController,
  getMyServicesController,
  getServiceController,
  updateServiceController,
  deleteServiceController,
  getPublicServicesController,
} from "../controllers/serviceController.js";

import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * Public services belonging to a business
 *
 * Example:
 * GET /api/services/public/business/:businessId
 */
router.get(
  "/public/business/:businessId",
  getPublicServicesController,
);

/**
 * Get services belonging to the authenticated user's business
 */
router.get(
  "/business/:businessId",
  authenticate,
  getMyServicesController,
);

/**
 * Get a single service belonging to the authenticated user
 */
router.get(
  "/:id",
  authenticate,
  getServiceController,
);

/**
 * Create a service
 */
router.post(
  "/",
  authenticate,
  createServiceController,
);

/**
 * Update a service
 */
router.patch(
  "/:id",
  authenticate,
  updateServiceController,
);

/**
 * Delete a service
 */
router.delete(
  "/:id",
  authenticate,
  deleteServiceController,
);

export default router;