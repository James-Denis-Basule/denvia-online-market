import mongoose, { Document, Schema } from "mongoose";

export type UserRole = "user" | "business_owner" | "business_staff" | "admin";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  refreshToken?: string;
  refreshTokenExpiresAt?: Date;
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
    
    refreshToken: {
      type: String,
      select: false,
    },

    refreshTokenExpiresAt: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;
