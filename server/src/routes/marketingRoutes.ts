import { Router } from "express";
import {
  getMarketingPlansController,
  getMarketingUsageController,
  consumeMarketingCreditsController,
} from "../controllers/marketingController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/plans", getMarketingPlansController);
router.get("/usage", authenticate, getMarketingUsageController);
router.post("/credits/consume", authenticate, consumeMarketingCreditsController);

export default router;
