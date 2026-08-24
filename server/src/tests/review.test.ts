import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app.js';
import Business from '../models/Business.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { generateAccessToken } from '../utils/jwt.js';

let mongo: MongoMemoryServer | null = null;

test('POST /api/products/:productId/reviews adds and summarizes a product review', async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), {});

  const user = await User.create({
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    password: 'secret123',
    role: 'business_owner',
  });

  const business = await Business.create({
    ownerId: user._id,
    name: 'Denvia Studio',
    slug: 'denvia-studio',
    email: 'studio@example.com',
  });

  const product = await Product.create({
    businessId: business._id,
    name: 'Smart Growth Plan',
    slug: 'smart-growth-plan',
    price: 120000,
    currency: 'UGX',
    stockQuantity: 15,
    status: 'active',
    isVisible: true,
    media: [],
  });

  const token = generateAccessToken({ userId: user._id.toString(), role: user.role });

  const server = app.listen(0);

  try {
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;

    const response = await fetch(`http://127.0.0.1:${port}/api/products/${product._id}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ rating: 5, title: 'Excellent', comment: 'Very helpful for my workflow.' }),
    });

    const payload = await response.json();
    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.reviewCount, 1);
    assert.equal(payload.data.averageRating, 5);

    const listResponse = await fetch(`http://127.0.0.1:${port}/api/products/${product._id}/reviews`);
    const listPayload = await listResponse.json();
    assert.equal(listResponse.status, 200);
    assert.equal(listPayload.data.reviewCount, 1);
    assert.equal(listPayload.data.reviews.length, 1);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    await mongoose.disconnect();
    await mongo?.stop();
  }
});
