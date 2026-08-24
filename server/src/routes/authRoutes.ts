import { Router } from "express";
import {
  getCurrentUser,
  login,
  logout,
  refreshAccessToken,
  register,
} from '../controllers/authController.js';
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshAccessToken);
router.get("/me", authenticate, getCurrentUser);
router.post('/logout', logout);

export default router;
