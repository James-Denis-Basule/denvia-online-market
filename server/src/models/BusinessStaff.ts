import mongoose, {
  Document,
  Schema,
  Types,
} from "mongoose";

/**
 * Roles a staff member can hold within a specific business.
 * This is separate from the platform-wide User.role field:
 * a user's global role becomes "business_staff" once they hold
 * ANY membership, but their permissions within a given business
 * are governed by this field.
 */
export type BusinessStaffRole = "manager" | "staff";

export type BusinessStaffStatus = "active" | "invited" | "removed";

export interface IBusinessStaff extends Document {
  businessId: Types.ObjectId;
  userId: Types.ObjectId;
  role: BusinessStaffRole;
  status: BusinessStaffStatus;
  canReceiveOrderNotifications: boolean;
  invitedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const businessStaffSchema = new Schema<IBusinessStaff>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["manager", "staff"],
      default: "staff",
    },

    status: {
      type: String,
      enum: ["active", "invited", "removed"],
      default: "invited",
    },

    canReceiveOrderNotifications: {
      type: Boolean,
      default: true,
    },

    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// A user can only hold one membership record per business.
businessStaffSchema.index(
  { businessId: 1, userId: 1 },
  { unique: true },
);

const BusinessStaff = mongoose.model<IBusinessStaff>(
  "BusinessStaff",
  businessStaffSchema,
);

export default BusinessStaff;
