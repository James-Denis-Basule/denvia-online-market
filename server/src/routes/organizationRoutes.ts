import { Router } from "express";

import {
  createOrganizationController,
  getMyOrganizationsController,
  getOrganizationController,
  updateOrganizationController,
  deleteOrganizationController,
  getOrganizationBusinessesController,
  addBusinessToOrganizationController,
  transferBusinessToOrganizationController,
} from "../controllers/organizationController.js";

import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticate);

router.get("/", getMyOrganizationsController);

router.post("/", createOrganizationController);

router.get("/:id", getOrganizationController);

router.patch("/:id", updateOrganizationController);

router.delete("/:id", deleteOrganizationController);

router.get(
  "/:id/businesses",
  getOrganizationBusinessesController,
);

router.post(
  "/:organizationId/businesses/:businessId",
  addBusinessToOrganizationController,
);

router.post(
  "/:organizationId/transfer/:businessId",
  transferBusinessToOrganizationController,
);

export default router;
