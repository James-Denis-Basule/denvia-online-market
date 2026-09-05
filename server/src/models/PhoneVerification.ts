import mongoose, { Document, Schema } from "mongoose";

export interface IPhoneVerification extends Document {
  phone: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const phoneVerificationSchema = new Schema<IPhoneVerification>(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

const PhoneVerification = mongoose.model<IPhoneVerification>(
  "PhoneVerification",
  phoneVerificationSchema,
);

export default PhoneVerification;
