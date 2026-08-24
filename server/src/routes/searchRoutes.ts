import { Router } from "express";

import {
  searchController,
} from "../controllers/searchController.js";

const router = Router();

/**
 * Marketplace search
 */
router.get(
  "/",
  searchController,
);

export default router;