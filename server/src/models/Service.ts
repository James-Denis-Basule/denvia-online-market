import mongoose, {
  Document,
  Schema,
  Types,
} from "mongoose";

export type ServiceStatus =
  | "active"
  | "archived"
  | "draft";

export type PricingType =
  | "fixed"
  | "starting_from"
  | "negotiable"
  | "free";

export interface IService extends Document {
  businessId: Types.ObjectId;

  name: string;
  slug: string;
  description?: string;

  category?: string;

  price?: number;
  currency: string;
  pricingType: PricingType;

  duration?: number;

  status: ServiceStatus;
  isVisible: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>(
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
      lowercase: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    category: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    price: {
      type: Number,
      min: 0,
    },

    currency: {
      type: String,
      default: "UGX",
      uppercase: true,
      trim: true,
    },

    pricingType: {
      type: String,
      enum: [
        "fixed",
        "starting_from",
        "negotiable",
        "free",
      ],
      default: "fixed",
    },

    duration: {
      type: Number,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "active",
        "archived",
        "draft",
      ],
      default: "active",
    },

    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

serviceSchema.index({
  businessId: 1,
  slug: 1,
}, {
  unique: true,
});

const Service = mongoose.model<IService>(
  "Service",
  serviceSchema,
);

export default Service;