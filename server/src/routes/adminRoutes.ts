import { Router } from "express";

import {
  getDashboardController,
  getUsersController,
  updateUserStatusController,
  deleteUserController,
  getBusinessesController,
  getBusinessController,
  updateBusinessStatusController,
  getProductsController,
  moderateProductController,
  getCategoriesController,
  deleteCategoryController,
  getPostsController,
  deletePostController,
} from "../controllers/adminController.js";

import { requireAdmin } from "../middleware/adminMiddleware.js";

const router = Router();

router.use(requireAdmin);

/*
 * Dashboard
 */

router.get(
  "/dashboard",
  getDashboardController,
);

/*
 * Users
 */

router.get(
  "/users",
  getUsersController,
);

router.patch(
  "/users/:id/status",
  updateUserStatusController,
);

router.delete(
  "/users/:id",
  deleteUserController,
);

/*
 * Businesses
 */

router.get(
  "/businesses",
  getBusinessesController,
);

router.get(
  "/businesses/:id",
  getBusinessController,
);

router.patch(
  "/businesses/:id/status",
  updateBusinessStatusController,
);

/*
 * Products
 */

router.get(
  "/products",
  getProductsController,
);

router.patch(
  "/products/:id/moderation",
  moderateProductController,
);

/*
 * Categories
 */

router.get(
  "/categories",
  getCategoriesController,
);

router.delete(
  "/categories/:id",
  deleteCategoryController,
);

/*
 * Posts
 */

router.get(
  "/posts",
  getPostsController,
);

router.delete(
  "/posts/:id",
  deletePostController,
);

export default router;