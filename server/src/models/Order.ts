import mongoose, { Document, Schema, Types } from "mongoose";

export type OrderStatus =
  | "pending"
  | "paid"
  | "confirmed"
  | "packed"
  | "shipped"
  | "completed"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface IOrderItem {
  productId: Types.ObjectId;
  businessId: Types.ObjectId;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  image?: string;
}

export interface IOrderCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface IOrder extends Document {
  userId?: Types.ObjectId;
  customer: IOrderCustomer;
  items: IOrderItem[];
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  paymentFee: number;
  total: number;
  currency: string;
  paymentMethod?: string;
  paymentStatus?: PaymentStatus;
  paymentProvider?: string;
  deliveryAddress?: string;
  shippingMethod?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
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
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    image: {
      type: String,
      trim: true,
    },
  },
  { _id: true },
);

const orderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    customer: {
      firstName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50,
      },
      lastName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50,
      },
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
    },
    items: {
      type: [orderItemSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["pending", "paid", "confirmed", "packed", "shipped", "completed", "cancelled"],
      default: "pending",
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    paymentFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      default: "UGX",
    },
    paymentMethod: {
      type: String,
      trim: true,
      default: "cash_on_delivery",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentProvider: {
      type: String,
      trim: true,
      default: "cash_on_delivery",
    },
    deliveryAddress: {
      type: String,
      trim: true,
    },
    shippingMethod: {
      type: String,
      trim: true,
      default: "standard",
    },
  },
  {
    timestamps: true,
  },
);

const Order = mongoose.model<IOrder>("Order", orderSchema);

export default Order;
