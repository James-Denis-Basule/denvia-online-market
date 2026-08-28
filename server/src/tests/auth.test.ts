import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import User from "../models/User.js";

import {
  loginUser,
  verifyEmail,
} from "../services/authService.js";

import { hashPassword } from "../utils/password.js";

import {
  generateEmailVerificationToken,
  hashEmailVerificationToken,
  getEmailVerificationExpiration,
} from "../utils/emailVerification.js";

test("unverified users cannot log in", async () => {
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), {});

  try {
    const password = "TestPassword@2026";

    await User.create({
      firstName: "Unverified",
      lastName: "User",
      email: "unverified@example.com",
      password: await hashPassword(password),
      isEmailVerified: false,
    });

    await assert.rejects(
      () =>
        loginUser(
          "unverified@example.com",
          password,
        ),
      (error: unknown) => {
        assert.equal(
          error instanceof Error ? error.message : "",
          "Please verify your email address before logging in",
        );

        assert.equal(
          typeof error === "object" &&
            error !== null &&
            "statusCode" in error
            ? error.statusCode
            : undefined,
          403,
        );

        return true;
      },
    );

    const user = await User.findOne({
      email: "unverified@example.com",
    }).select("+refreshToken");

    assert.ok(user);
    assert.equal(user.refreshToken, undefined);
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
});

test("verified users can log in", async () => {
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), {});

  try {
    const password = "TestPassword@2026";

    await User.create({
      firstName: "Verified",
      lastName: "User",
      email: "verified@example.com",
      password: await hashPassword(password),
      isEmailVerified: true,
    });

    const result = await loginUser(
      "verified@example.com",
      password,
    );

    assert.ok(result.accessToken);
    assert.ok(result.refreshToken);
    assert.equal(
      result.user.email,
      "verified@example.com",
    );
    assert.equal(
      result.user.isEmailVerified,
      true,
    );
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
});

test("valid email verification token verifies the user", async () => {
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), {});

  try {
    const token = generateEmailVerificationToken();

    await User.create({
      firstName: "Verification",
      lastName: "User",
      email: "verification@example.com",
      password: await hashPassword(
        "TestPassword@2026",
      ),
      isEmailVerified: false,
      emailVerificationTokenHash:
        hashEmailVerificationToken(token),
      emailVerificationExpiresAt:
        getEmailVerificationExpiration(),
    });

    const result = await verifyEmail(token);

    assert.equal(result.alreadyVerified, false);

    const user = await User.findOne({
      email: "verification@example.com",
    }).select(
      "+emailVerificationTokenHash +emailVerificationExpiresAt",
    );

    assert.ok(user);
    assert.equal(user.isEmailVerified, true);
    assert.equal(
      user.emailVerificationTokenHash,
      undefined,
    );
    assert.equal(
      user.emailVerificationExpiresAt,
      undefined,
    );
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
});

test("invalid email verification token is rejected", async () => {
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), {});

  try {
    const validToken = generateEmailVerificationToken();

    await User.create({
      firstName: "Invalid",
      lastName: "Token",
      email: "invalid-token@example.com",
      password: await hashPassword(
        "TestPassword@2026",
      ),
      isEmailVerified: false,
      emailVerificationTokenHash:
        hashEmailVerificationToken(validToken),
      emailVerificationExpiresAt:
        getEmailVerificationExpiration(),
    });

    await assert.rejects(
      () => verifyEmail("completely-invalid-token"),
      (error: unknown) => {
        assert.equal(
          error instanceof Error ? error.message : "",
          "Invalid or expired email verification token",
        );

        assert.equal(
          typeof error === "object" &&
            error !== null &&
            "statusCode" in error
            ? error.statusCode
            : undefined,
          400,
        );

        return true;
      },
    );
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
});

test("expired email verification token is rejected", async () => {
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), {});

  try {
    const token = generateEmailVerificationToken();

    await User.create({
      firstName: "Expired",
      lastName: "Token",
      email: "expired-token@example.com",
      password: await hashPassword(
        "TestPassword@2026",
      ),
      isEmailVerified: false,
      emailVerificationTokenHash:
        hashEmailVerificationToken(token),
      emailVerificationExpiresAt: new Date(
        Date.now() - 1000,
      ),
    });

    await assert.rejects(
      () => verifyEmail(token),
      (error: unknown) => {
        assert.equal(
          error instanceof Error ? error.message : "",
          "Invalid or expired email verification token",
        );

        assert.equal(
          typeof error === "object" &&
            error !== null &&
            "statusCode" in error
            ? error.statusCode
            : undefined,
          400,
        );

        return true;
      },
    );

    const user = await User.findOne({
      email: "expired-token@example.com",
    }).select(
      "+emailVerificationTokenHash +emailVerificationExpiresAt",
    );

    assert.ok(user);
    assert.equal(user.isEmailVerified, false);
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
});

test("already verified users are handled safely", async () => {
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), {});

  try {
    const token = generateEmailVerificationToken();

    await User.create({
      firstName: "Already",
      lastName: "Verified",
      email: "already-verified@example.com",
      password: await hashPassword(
        "TestPassword@2026",
      ),
      isEmailVerified: true,
      emailVerificationTokenHash:
        hashEmailVerificationToken(token),
      emailVerificationExpiresAt:
        getEmailVerificationExpiration(),
    });

    const result = await verifyEmail(token);

    assert.equal(result.alreadyVerified, true);

    const user = await User.findOne({
      email: "already-verified@example.com",
    }).select(
      "+emailVerificationTokenHash +emailVerificationExpiresAt",
    );

    assert.ok(user);
    assert.equal(user.isEmailVerified, true);
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
});