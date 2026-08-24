import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { addToWishlist, getWishlist, removeFromWishlist } from "../services/wishlistService.js";

export async function getWishlistController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const wishlist = await getWishlist(req.user.userId);

    res.status(200).json({ success: true, data: wishlist });
  } catch (error) {
    next(error);
  }
}

export async function addWishlistItemController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const { productId } = req.body ?? {};
    const wishlist = await addToWishlist(req.user.userId, productId);

    res.status(200).json({
      success: true,
      message: "Product added to wishlist",
      data: wishlist,
    });
  } catch (error) {
    next(error);
  }
}

export async function removeWishlistItemController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const wishlist = await removeFromWishlist(req.user.userId, String(req.params.productId));

    res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
      data: wishlist,
    });
  } catch (error) {
    next(error);
  }
}
