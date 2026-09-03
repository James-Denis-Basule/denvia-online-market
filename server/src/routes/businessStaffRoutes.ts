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
} from "../controllers/businessController.js";

import {
  inviteStaffController,
  listStaffController,
  removeStaffController,
  acceptStaffInviteController,
} from "../controllers/businessStaffController.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { requireBusinessManageAccess } from "../middleware/businessAccessMiddleware.js";

import { getPublicServicesController } from "../controllers/serviceController.js";

const router = Router();

/**
 * Invite a staff member to a business.
 * Only the owner, a manager, or an admin can invite.
 */
router.post(
  "/:businessId/staff",
  requireBusinessManageAccess("businessId"),
  inviteStaffController,
);

/**
 * List staff for a business.
 * Only the owner, a manager, or an admin can view the roster.
 */
router.get(
  "/:businessId/staff",
  requireBusinessManageAccess("businessId"),
  listStaffController,
);

/**
 * A staff member accepts their own invite.
 *
 * IMPORTANT:
 * Keep this above the generic "/:businessId/staff/:membershipId" delete
 * route so "accept" is never treated as a membership ID.
 */
router.post(
  "/:businessId/staff/accept",
  authenticate,
  acceptStaffInviteController,
);

/**
 * Remove a staff member from a business.
 */
router.delete(
  "/:businessId/staff/:membershipId",
  requireBusinessManageAccess("businessId"),
  removeStaffController,
);

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
router.get(
  "/my-businesses",
  authenticate,
  getMyBusinessesController,
);

/**
 * Authenticated user's single business
 */
router.get(
  "/my/:id",
  authenticate,
  getBusinessController,
);

/**
 * Create business
 */
router.post(
  "/",
  authenticate,
  createBusinessController,
);

/**
 * Public business products
 */
router.get(
  "/:businessId/products",
  getPublicBusinessProductsController,
);

/**
 * Public business services
 */
router.get(
  "/:businessId/services",
  getPublicServicesController,
);

/**
 * Public WhatsApp contact link
 */
router.get(
  "/:businessId/whatsapp",
  getBusinessWhatsAppLinkController,
);

/**
 * Update authenticated user's business
 */
router.patch(
  "/my/:id",
  authenticate,
  updateBusinessController,
);

/**
 * Delete authenticated user's business
 */
router.delete(
  "/:id",
  authenticate,
  deleteBusinessController,
);

/**
 * Public business details
 *
 * IMPORTANT:
 * Keep this dynamic route AFTER all specific routes.
 */
router.get(
  "/:id",
  getPublicBusinessController,
);

export default router;