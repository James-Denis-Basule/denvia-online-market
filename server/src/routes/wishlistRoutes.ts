import { Router } from "express";
import {
  getWishlistController,
  addWishlistItemController,
  removeWishlistItemController,
} from "../controllers/wishlistController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", authenticate, getWishlistController);
router.post("/items", authenticate, addWishlistItemController);
router.delete("/items/:productId", authenticate, removeWishlistItemController);

export default router;
