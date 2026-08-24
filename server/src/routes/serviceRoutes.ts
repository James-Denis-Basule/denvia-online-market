import { Router } from "express";

import {
  createServiceController,
  getMyServicesController,
  getServiceController,
  updateServiceController,
  deleteServiceController,
} from "../controllers/serviceController.js";

import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

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