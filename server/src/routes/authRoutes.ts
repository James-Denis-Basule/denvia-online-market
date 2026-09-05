import { Router } from "express";
import {
  getCurrentUser,
  login,
  logout,
  refreshAccessToken,
  register,
  verifyEmailAddress,
  forgotPassword,
  resetPasswordController,
  updateNotificationPreferences,
} from '../controllers/authController.js';
import { authenticate } from "../middleware/authMiddleware.js";
import { createRateLimiter } from "../middleware/securityMiddleware.js";

const router = Router();

// Stricter limit than the global rate limiter: password reset requests
// hit the email provider and are a common target for abuse/enumeration.
const passwordResetRateLimiter = createRateLimiter({
  windowMs: 15 * 60_000,
  maxRequests: 5,
});

router.post("/register", register);
router.post("/verify-email", verifyEmailAddress);
router.post("/login", login);
router.post("/refresh", refreshAccessToken);
router.get("/me", authenticate, getCurrentUser);
router.patch(
  "/me/notification-preferences",
  authenticate,
  updateNotificationPreferences,
);
router.post("/logout", logout);
router.post(
  "/forgot-password",
  passwordResetRateLimiter,
  forgotPassword,
);
router.post("/reset-password", resetPasswordController);

export default router;
