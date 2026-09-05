import { Router } from "express";

import { requestOtpController, verifyOtpController } from "../controllers/otpController.js";
import { createRateLimiter } from "../middleware/securityMiddleware.js";

const router = Router();

const otpRequestRateLimiter = createRateLimiter({
  windowMs: 15 * 60_000,
  maxRequests: 5,
});

const otpVerifyRateLimiter = createRateLimiter({
  windowMs: 15 * 60_000,
  maxRequests: 10,
});

router.post("/request", otpRequestRateLimiter, requestOtpController);
router.post("/verify", otpVerifyRateLimiter, verifyOtpController);

export default router;
