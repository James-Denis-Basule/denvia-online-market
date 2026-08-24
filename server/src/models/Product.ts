import mongoose, { Document, Schema, Types } from "mongoose";

export type ProductStatus = "draft" | "active" | "out_of_stock" | "archived";

export interface ProductMedia {
  _id?: Types.ObjectId;
  url: string;
  publicId: string;
  alt?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface IProduct extends Document {
  businessId: Types.ObjectId;

  name: string;

  slug: string;

  description?: string;

  price: number;

  compareAtPrice?: number;

  currency: string;

  sku?: string;

  stockQuantity: number;

  categoryId?: Types.ObjectId;

  averageRating: number;

  reviewCount: number;

  status: ProductStatus;

  isVisible: boolean;

  media: ProductMedia[];

  createdAt: Date;

  updatedAt: Date;
}

const productMediaSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },

    publicId: {
      type: String,
      required: true,
      trim: true,
    },

    alt: {
      type: String,
      trim: true,
      maxlength: 250,
    },

    isPrimary: {
      type: Boolean,
      default: false,
    },

    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    _id: true,
  },
);

const productSchema = new Schema<IProduct>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 3000,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    compareAtPrice: {
      type: Number,
      min: 0,
    },

    currency: {
      type: String,
      required: true,
      uppercase: true,
      default: "UGX",
    },

    sku: {
      type: String,
      trim: true,
      uppercase: true,
    },

    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      index: true,
    },

    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["draft", "active", "out_of_stock", "archived"],
      default: "draft",
    },

    isVisible: {
      type: Boolean,
      default: true,
    },

    media: {
      type: [productMediaSchema],
      default: [],
    },
  },

  {
    timestamps: true,
  },
);

productSchema.index(
  {
    businessId: 1,
    slug: 1,
  },
  {
    unique: true,
  },
);

productSchema.index(
  {
    businessId: 1,
    sku: 1,
  },
  {
    unique: true,
    sparse: true,
  },
);

const Product = mongoose.model<IProduct>("Product", productSchema);

export default Product;
