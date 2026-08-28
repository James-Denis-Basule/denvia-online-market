import User from "../models/User.js";

import { sendEmailVerificationEmail } from "./emailService.js";

import { hashPassword, comparePassword } from "../utils/password.js";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

import { AppError } from "../utils/AppError.js";

import type { RegisterInput } from "../types/auth.js";

import {
  generateEmailVerificationToken,
  hashEmailVerificationToken,
  getEmailVerificationExpiration,
} from "../utils/emailVerification.js";

export async function registerUser(input: RegisterInput) {
  const existingUser = await User.findOne({
    email: input.email,
  });

  if (existingUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  const hashedPassword = await hashPassword(input.password);

  const emailVerificationToken =
    generateEmailVerificationToken();

  const emailVerificationTokenHash =
    hashEmailVerificationToken(emailVerificationToken);

  const emailVerificationExpiresAt =
    getEmailVerificationExpiration();

  const user = await User.create({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    password: hashedPassword,
    phone: input.phone,
    emailVerificationTokenHash,
    emailVerificationExpiresAt,
  });

  try {
    await sendEmailVerificationEmail(
      user.email,
      user.firstName,
      emailVerificationToken,
    );
  } catch (error) {
    await User.deleteOne({
      _id: user._id,
    });

    throw error;
  }

  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
  };
}

export async function verifyEmail(token: string) {
  const tokenHash = hashEmailVerificationToken(token);

  const user = await User.findOne({
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpiresAt: {
      $gt: new Date(),
    },
  }).select(
    "+emailVerificationTokenHash +emailVerificationExpiresAt",
  );

  if (!user) {
    throw new AppError(
      "Invalid or expired email verification token",
      400,
    );
  }

  if (user.isEmailVerified) {
    return {
      alreadyVerified: true,
    };
  }

  user.isEmailVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpiresAt = undefined;

  await user.save();

  return {
    alreadyVerified: false,
  };
}

export async function loginUser(email: string, password: string) {
  const user = await User.findOne({
    email: email.toLowerCase().trim(),
  }).select("+password");

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isActive) {
    throw new AppError("This account has been deactivated", 403);
  }

  const passwordMatches = await comparePassword(
    password,
    user.password,
  );

  if (!passwordMatches) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isEmailVerified) {
    throw new AppError(
      "Please verify your email address before logging in",
      403,
    );
  }

  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    role: user.role,
  });

  const refreshToken = generateRefreshToken(
    user._id.toString(),
  );

  user.refreshToken = refreshToken;

  await user.save();

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    },
  };
}

export async function refreshUserAccessToken(
  refreshToken: string,
) {
  let payload: { userId: string };

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(
      "Invalid or expired refresh token",
      401,
    );
  }

  const user = await User.findById(payload.userId).select(
    "+refreshToken",
  );

  if (!user) {
    throw new AppError("User account not found", 404);
  }

  if (!user.isActive) {
    throw new AppError(
      "This account has been deactivated",
      403,
    );
  }

  if (!user.refreshToken) {
    throw new AppError(
      "Refresh token is no longer valid",
      401,
    );
  }

  if (user.refreshToken !== refreshToken) {
    throw new AppError(
      "Refresh token is no longer valid",
      401,
    );
  }

  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    role: user.role,
  });

  /*
   * Rotate the refresh token after every successful refresh.
   *
   * The previous refresh token becomes invalid immediately
   * because only the newly generated token is stored.
   */

  const newRefreshToken = generateRefreshToken(
    user._id.toString(),
  );

  user.refreshToken = newRefreshToken;

  await user.save();

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logoutUser(refreshToken: string) {
  const user = await User.findOne({
    refreshToken,
  }).select("+refreshToken");

  if (user) {
    user.refreshToken = undefined;

    await user.save();
  }
}