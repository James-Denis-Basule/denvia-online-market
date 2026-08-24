import mongoose, { Document, Schema, Types } from "mongoose";

export interface ICartItem {
  productId: Types.ObjectId;
  businessId: Types.ObjectId;
  name: string;
  price: number;
  currency: string;
  image?: string;
  quantity: number;
}

export interface ICart extends Document {
  userId: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      default: "UGX",
    },
    image: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
  },
  { _id: true },
);

const cartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      unique: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const Cart = mongoose.model<ICart>("Cart", cartSchema);

export default Cart;
