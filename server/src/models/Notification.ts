import mongoose, { Document, Schema, Types } from "mongoose";

export type NotificationType =
  | "order_status"
  | "delivery_status"
  | "payment_status"
  | "new_order"
  | "new_feedback"
  | "system";

export interface INotification extends Document {
  userId: Types.ObjectId;
  businessId?: Types.ObjectId;
  orderId?: Types.ObjectId;
  feedbackId?: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
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
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      index: true,
    },
    feedbackId: {
      type: Schema.Types.ObjectId,
      ref: "ProductReview",
      index: true,
    },
    type: {
      type: String,
      enum: [
        "order_status",
        "delivery_status",
        "payment_status",
        "new_order",
        "new_feedback",
        "system",
      ],
      required: true,
      default: "system",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
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

const Notification = mongoose.model<INotification>("Notification", notificationSchema);

export default Notification;
