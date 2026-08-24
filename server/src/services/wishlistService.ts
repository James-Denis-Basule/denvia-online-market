import { AppError } from "../utils/AppError.js";
import Wishlist from "../models/Wishlist.js";

export async function getWishlist(userId: string) {
  const wishlist = await Wishlist.findOne({ userId }).lean();

  return wishlist ?? { userId, productIds: [] };
}

export async function addToWishlist(userId: string, productId: string) {
  if (!productId) {
    throw new AppError("Product ID is required", 400);
  }

  const wishlist = await Wishlist.findOneAndUpdate(
    { userId },
    { $addToSet: { productIds: productId } },
    { upsert: true, new: true },
  );

  return wishlist;
}

export async function removeFromWishlist(userId: string, productId: string) {
  if (!productId) {
    throw new AppError("Product ID is required", 400);
  }

  const wishlist = await Wishlist.findOneAndUpdate(
    { userId },
    { $pull: { productIds: productId } },
    { new: true },
  );

  return wishlist ?? { userId, productIds: [] };
}
