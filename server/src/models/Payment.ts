import mongoose, { Document, Schema, Types } from "mongoose";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface IPayment extends Document {
  orderId: Types.ObjectId;
  userId?: Types.ObjectId;
  amount: number;
  currency: string;
  provider: string;
  method: string;
  reference: string;
  providerEventId?: string;
  status: PaymentStatus;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
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
      required: false,
      index: true,
    },

    amount: {
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

    provider: {
      type: String,
      required: true,
      trim: true,
    },

    method: {
      type: String,
      required: true,
      trim: true,
    },

    reference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    providerEventId: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

paymentSchema.index(
  { provider: 1, providerEventId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      providerEventId: { $exists: true, $type: "string" },
    },
  },
);

const Payment = mongoose.model<IPayment>("Payment", paymentSchema);

export default Payment;