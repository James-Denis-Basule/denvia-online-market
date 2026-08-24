import { Router } from "express";
import { getNotificationsController, markNotificationReadController } from "../controllers/notificationController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", authenticate, getNotificationsController);
router.patch("/:notificationId/read", authenticate, markNotificationReadController);

export default router;
