import crypto from "node:crypto";
import jwt from "jsonwebtoken";

import PhoneVerification from "../models/PhoneVerification.js";
import { AppError } from "../utils/AppError.js";
import authConfig from "../config/auth.js";
import env from "../config/env.js";

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const VERIFICATION_TOKEN_EXPIRY = "20m";

function hashOtp(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

/**
 * Demo-mode SMS send, matching the existing payment/delivery provider
 * pattern (env-driven demo/live mode). In demo mode the OTP is logged
 * rather than actually sent, so this can be swapped for a real SMS
 * provider (Twilio, Africa's Talking, etc.) without touching callers.
 */
async function sendOtpSms(phone: string, code: string) {
  const live = env.smsProviderMode === "live" && Boolean(env.smsProviderApiKey);

  if (!live) {
    console.log(`[DEMO SMS] OTP for ${phone}: ${code}`);
    return { mode: "demo" as const };
  }

  // Real provider integration point. Left unimplemented until a
  // provider (Twilio, Africa's Talking, etc.) and credentials are
  // configured via env.smsProviderApiKey — do not fake success.
  throw new AppError("SMS provider not configured", 503);
}

export async function requestPhoneOtp(phone: string) {
  if (!phone || phone.trim().length < 6) {
    throw new AppError("A valid phone number is required", 400);
  }

  const normalizedPhone = phone.trim();
  const code = generateOtp();

  await PhoneVerification.findOneAndUpdate(
    { phone: normalizedPhone, verified: false },
    {
      phone: normalizedPhone,
      otpHash: hashOtp(code),
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
      attempts: 0,
      verified: false,
    },
    { upsert: true, new: true },
  );

  const sendResult = await sendOtpSms(normalizedPhone, code);

  return {
    phone: normalizedPhone,
    expiresInSeconds: OTP_EXPIRY_MS / 1000,
    mode: sendResult.mode,
  };
}

export async function verifyPhoneOtp(phone: string, code: string) {
  if (!phone || !code) {
    throw new AppError("Phone number and code are required", 400);
  }

  const normalizedPhone = phone.trim();

  const record = await PhoneVerification.findOne({
    phone: normalizedPhone,
    verified: false,
  }).sort({ createdAt: -1 });

  if (!record) {
    throw new AppError("No pending verification for this phone number", 400);
  }

  if (record.expiresAt.getTime() < Date.now()) {
    throw new AppError("This code has expired. Request a new one.", 400);
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    throw new AppError(
      "Too many incorrect attempts. Request a new code.",
      429,
    );
  }

  if (record.otpHash !== hashOtp(code)) {
    record.attempts += 1;
    await record.save();
    throw new AppError("Incorrect code", 400);
  }

  record.verified = true;
  record.verifiedAt = new Date();
  await record.save();

  const verificationToken = jwt.sign(
    { phone: normalizedPhone, purpose: "phone_verification" },
    authConfig.accessTokenSecret,
    { expiresIn: VERIFICATION_TOKEN_EXPIRY },
  );

  return { verificationToken };
}

/**
 * Validates a phone-verification token produced by verifyPhoneOtp and
 * confirms it matches the phone number the caller claims. Used at
 * order-creation time so guest checkout never trusts a client-supplied
 * "phoneVerified" flag directly (spec: never trust client claims).
 */
export function assertPhoneVerificationToken(token: string, phone: string) {
  try {
    const decoded = jwt.verify(token, authConfig.accessTokenSecret) as {
      phone?: string;
      purpose?: string;
    };

    if (
      decoded.purpose !== "phone_verification" ||
      decoded.phone !== phone.trim()
    ) {
      throw new Error("mismatch");
    }
  } catch {
    throw new AppError(
      "Phone verification is invalid, expired, or does not match",
      400,
    );
  }
}
