import mongoose, { Document, Schema, Types } from "mongoose";

export interface IProductReview extends Document {
  productId: Types.ObjectId;
  userId: Types.ObjectId;
  businessId?: Types.ObjectId;
  rating: number;
  title?: string;
  comment?: string;
  verifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productReviewSchema = new Schema<IProductReview>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    verifiedPurchase: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

productReviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

const ProductReview = mongoose.model<IProductReview>("ProductReview", productReviewSchema);

export default ProductReview;
