import { Router } from "express";

import {
  createPostController,
  getMyPostsController,
  getPostController,
  updatePostController,
  deletePostController,
  addPostMediaController,
  setPrimaryPostMediaController,
  deletePostMediaController,
  reorderPostMediaController,
} from "../controllers/postController.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { uploadProductImage } from "../middleware/uploadMiddleware.js";

const router = Router();

/**
 * Create a post
 */
router.post("/", authenticate, createPostController);

/**
 * Get posts belonging to a business
 */
router.get("/business/:businessId", authenticate, getMyPostsController);

/**
 * Get a single post
 */
router.get("/:id", authenticate, getPostController);

/**
 * Update a post
 */
router.patch("/:id", authenticate, updatePostController);

/**
 * Delete a post
 */
router.delete("/:id", authenticate, deletePostController);

/**
 * Add post media
 */
router.post(
  "/:id/media",
  authenticate,
  uploadProductImage.single("image"),
  addPostMediaController,
);

/**
 * Set primary post media
 */
router.patch(
  "/:id/media/:mediaId/primary",
  authenticate,
  setPrimaryPostMediaController,
);

/**
 * Delete post media
 */
router.delete("/:id/media/:mediaId", authenticate, deletePostMediaController);

/**
 * Reorder post media
 */
router.patch("/:id/media/reorder", authenticate, reorderPostMediaController);

export default router;
