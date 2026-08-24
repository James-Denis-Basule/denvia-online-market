import mongoose, { Document, Schema, Types } from "mongoose";

export interface IWishlist extends Document {
  userId: Types.ObjectId;
  productIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const wishlistSchema = new Schema<IWishlist>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    productIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Product" }],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const Wishlist = mongoose.model<IWishlist>("Wishlist", wishlistSchema);

export default Wishlist;
