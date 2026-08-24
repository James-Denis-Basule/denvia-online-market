import mongoose, { Document, Schema } from "mongoose";

export type SubscriptionTier = "free" | "growth" | "pro";

export interface ISubscriptionPlan extends Document {
  name: string;
  slug: SubscriptionTier;
  price: number;
  aiCreditsIncluded: number;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      enum: ["free", "growth", "pro"],
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    aiCreditsIncluded: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    features: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const SubscriptionPlan = mongoose.model<ISubscriptionPlan>(
  "SubscriptionPlan",
  subscriptionPlanSchema,
);

export default SubscriptionPlan;
