import mongoose, { Document, Schema, Types } from "mongoose";

export type UserRole =
  | "user"
  | "business_owner"
  | "business_staff"
  | "admin";

export type AccountType = "customer" | "business";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  accountTypes: AccountType[];
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationTokenHash?: string;
  emailVerificationExpiresAt?: Date;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
  notificationPreferences: {
    sms: boolean;
    whatsapp: boolean;
    email: boolean;
    inApp: boolean;
  };
  refreshToken?: string;
  refreshTokenExpiresAt?: Date;
  activeOrganizationId?: Types.ObjectId;
  activeBusinessId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    phone: {
      type: String,
      trim: true,
    },

    accountTypes: {
      type: [String],
      enum: ["customer", "business"],
      default: ["customer"],
      required: true,
    },


    role: {
      type: String,
      enum: ["user", "business_owner", "business_staff", "admin"],
      default: "user",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationTokenHash: {
      type: String,
      select: false,
    },

    emailVerificationExpiresAt: {
      type: Date,
      select: false,
    },

    passwordResetTokenHash: {
      type: String,
      select: false,
    },

    passwordResetExpiresAt: {
      type: Date,
      select: false,
    },

    notificationPreferences: {
      sms: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },

    refreshToken: {
      type: String,
      select: false,
    },

    refreshTokenExpiresAt: {
      type: Date,
      select: false,
    },

    activeOrganizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      default: undefined,
      index: true,
    },

    activeBusinessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      default: undefined,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;
