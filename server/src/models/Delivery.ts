import mongoose, { Document, Schema, Types } from "mongoose";

export type DeliveryStatus = "pending" | "assigned" | "in_transit" | "delivered" | "failed";

export interface IDelivery extends Document {
  orderId: Types.ObjectId;
  userId: Types.ObjectId;
  businessId?: Types.ObjectId;
  method: string;
  provider: string;
  zone?: string;
  eta?: Date;
  status: DeliveryStatus;
  trackingCode?: string;
  address?: string;
  metadata?: Record<string, unknown>;
  events?: Array<{ status: DeliveryStatus; courier?: string; trackingCode?: string; createdAt?: Date }>;
  createdAt: Date;
  updatedAt: Date;
}

const deliverySchema = new Schema<IDelivery>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
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
    },
    method: {
      type: String,
      required: true,
      trim: true,
    },
    provider: {
      type: String,
      required: true,
      trim: true,
      default: "local_dispatch",
    },
    zone: {
      type: String,
      trim: true,
    },
    eta: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["pending", "assigned", "in_transit", "delivered", "failed"],
      default: "pending",
    },
    trackingCode: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    events: {
      type: [
        {
          status: { type: String, enum: ['pending', 'assigned', 'in_transit', 'delivered', 'failed'], required: true },
          courier: { type: String, trim: true },
          trackingCode: { type: String, trim: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const Delivery = mongoose.model<IDelivery>("Delivery", deliverySchema);

export default Delivery;
