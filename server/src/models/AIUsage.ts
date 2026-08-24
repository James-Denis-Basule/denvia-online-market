import mongoose, { Document, Schema, Types } from "mongoose";

export interface IAIUsage extends Document {
  userId?: Types.ObjectId;
  businessId?: Types.ObjectId;
  action: string;
  creditsUsed: number;
  status: "success" | "failed" | "pending";
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const aiUsageSchema = new Schema<IAIUsage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    creditsUsed: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ["success", "failed", "pending"],
      default: "success",
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

const AIUsage = mongoose.model<IAIUsage>("AIUsage", aiUsageSchema);

export default AIUsage;
