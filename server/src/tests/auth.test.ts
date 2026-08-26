import test from 'node:test';

import assert from 'node:assert/strict';

import mongoose from 'mongoose';

import { MongoMemoryServer } from 'mongodb-memory-server';

import User from '../models/User.js';

import { loginUser } from '../services/authService.js';

import { hashPassword } from '../utils/password.js';

test('unverified users cannot log in', async () => {
  const mongo = await MongoMemoryServer.create();

  await mongoose.connect(mongo.getUri(), {});

  try {
    const password = 'TestPassword@2026';

    await User.create({
      firstName: 'Unverified',
      lastName: 'User',
      email: 'unverified@example.com',
      password: await hashPassword(password),
      isEmailVerified: false,
    });

    await assert.rejects(
      () => loginUser('unverified@example.com', password),
      (error: unknown) => {
        assert.equal(
          error instanceof Error ? error.message : '',
          'Please verify your email address before logging in',
        );

        assert.equal(
          typeof error === 'object' &&
            error !== null &&
            'statusCode' in error
            ? error.statusCode
            : undefined,
          403,
        );

        return true;
      },
    );

    const user = await User.findOne({
      email: 'unverified@example.com',
    }).select('+refreshToken');

    assert.ok(user);
    assert.equal(user.refreshToken, undefined);
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
});

test('verified users can log in', async () => {
  const mongo = await MongoMemoryServer.create();

  await mongoose.connect(mongo.getUri(), {});

  try {
    const password = 'TestPassword@2026';

    await User.create({
      firstName: 'Verified',
      lastName: 'User',
      email: 'verified@example.com',
      password: await hashPassword(password),
      isEmailVerified: true,
    });

    const result = await loginUser(
      'verified@example.com',
      password,
    );

    assert.ok(result.accessToken);
    assert.ok(result.refreshToken);
    assert.equal(result.user.email, 'verified@example.com');
    assert.equal(result.user.isEmailVerified, true);
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
});
