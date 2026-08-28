import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

import app from "../app.js";
import Business from "../models/Business.js";
import Delivery from "../models/Delivery.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { generateAccessToken } from "../utils/jwt.js";

function authorizationFor(user: {
  _id: mongoose.Types.ObjectId;
  role: string;
}) {
  return `Bearer ${generateAccessToken({ userId: String(user._id), role: user.role })}`;
}

test("commerce operations enforce customer ownership and seller business ownership", async () => {
  const mongo = await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
    },
  });

  await mongoose.connect(mongo.getUri(), {
    readPreference: "primary",
  });

  await mongo.waitUntilRunning();

  await mongoose.connect(mongo.getUri());

  const server = app.listen(0);

  try {
    const [customerA, customerB, sellerA, sellerB] = await Promise.all([
      User.create({
        firstName: "Customer",
        lastName: "One",
        email: "customer-one@example.com",
        password: "secret123",
        role: "user",
      }),
      User.create({
        firstName: "Customer",
        lastName: "Two",
        email: "customer-two@example.com",
        password: "secret123",
        role: "user",
      }),
      User.create({
        firstName: "Seller",
        lastName: "One",
        email: "seller-one@example.com",
        password: "secret123",
        role: "business_owner",
      }),
      User.create({
        firstName: "Seller",
        lastName: "Two",
        email: "seller-two@example.com",
        password: "secret123",
        role: "business_owner",
      }),
    ]);

    const [businessA, businessB] = await Promise.all([
      Business.create({
        ownerId: sellerA._id,
        name: "Seller One Store",
        slug: "seller-one-store",
        email: "seller-one-store@example.com",
      }),
      Business.create({
        ownerId: sellerB._id,
        name: "Seller Two Store",
        slug: "seller-two-store",
        email: "seller-two-store@example.com",
      }),
    ]);

    const createOrder = (
      userId: mongoose.Types.ObjectId,
      businessId: mongoose.Types.ObjectId,
    ) =>
      Order.create({
        userId,
        customer: {
          firstName: "Test",
          lastName: "Customer",
          email: "test-customer@example.com",
          phone: "+256700000000",
        },
        items: [
          {
            productId: new mongoose.Types.ObjectId(),
            businessId,
            name: "Test product",
            price: 10000,
            currency: "UGX",
            quantity: 1,
          },
        ],
        subtotal: 10000,
        deliveryFee: 5000,
        paymentFee: 0,
        total: 15000,
        currency: "UGX",
        status: "pending",
      });

    const [orderA, orderB, mixedBusinessOrder] = await Promise.all([
      createOrder(customerA._id, businessA._id),
      createOrder(customerB._id, businessB._id),
      Order.create({
        userId: customerA._id,
        customer: {
          firstName: "Customer",
          lastName: "A",
          email: "customer-a@example.com",
          phone: "+256700000001",
        },
        items: [
          {
            productId: new mongoose.Types.ObjectId(),
            businessId: businessA._id,
            name: "Seller A product",
            price: 10000,
            currency: "UGX",
            quantity: 1,
          },
          {
            productId: new mongoose.Types.ObjectId(),
            businessId: businessB._id,
            name: "Seller B product",
            price: 10000,
            currency: "UGX",
            quantity: 1,
          },
        ],
        subtotal: 20000,
        deliveryFee: 5000,
        paymentFee: 0,
        total: 25000,
        currency: "UGX",
        status: "pending",
      }),
    ]);

    await Delivery.create({
      orderId: orderA._id,
      userId: customerA._id,
      businessId: businessA._id,
      method: "standard",
      provider: "local_dispatch",
      status: "pending",
    });

    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;

    const request = (path: string, options: RequestInit = {}) =>
      fetch(`http://127.0.0.1:${port}${path}`, options);

    const jsonRequest = (
      method: string,
      token: string,
      body?: Record<string, unknown>,
    ) => ({
      method,
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const otherCustomerOrder = await request(
      `/api/marketplace/orders/${orderB._id}`,
      {
        headers: {
          Authorization: authorizationFor(customerA),
        },
      },
    );

    assert.equal(otherCustomerOrder.status, 403);

    const otherSellerOrders = await request(
      `/api/marketplace/orders/seller?businessIds=${businessB._id}`,
      {
        headers: {
          Authorization: authorizationFor(sellerA),
        },
      },
    );

    assert.equal(otherSellerOrders.status, 403);

    const otherSellerStatusUpdate = await request(
      `/api/marketplace/orders/${orderB._id}/status`,
      jsonRequest("PATCH", authorizationFor(sellerA), { status: "paid" }),
    );

    assert.equal(otherSellerStatusUpdate.status, 403);

    const mixedBusinessStatusUpdate = await request(
      `/api/marketplace/orders/${mixedBusinessOrder._id}/status`,
      jsonRequest("PATCH", authorizationFor(sellerA), { status: "paid" }),
    );

    assert.equal(mixedBusinessStatusUpdate.status, 403);

    const unauthenticatedAssignment = await request(
      `/api/marketplace/orders/${orderA._id}/assign-delivery`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    assert.equal(unauthenticatedAssignment.status, 401);

    const customerAssignment = await request(
      `/api/marketplace/orders/${orderA._id}/assign-delivery`,
      jsonRequest("POST", authorizationFor(customerA), {
        courier: "local_dispatch",
      }),
    );

    assert.equal(customerAssignment.status, 403);

    const customerDeliveryUpdate = await request(
      `/api/marketplace/orders/${orderA._id}/delivery/status`,
      jsonRequest("PATCH", authorizationFor(customerA), { status: "assigned" }),
    );

    assert.equal(customerDeliveryUpdate.status, 403);

    const customerOwnOrder = await request(
      `/api/marketplace/orders/${orderA._id}`,
      {
        headers: {
          Authorization: authorizationFor(customerA),
        },
      },
    );

    assert.equal(customerOwnOrder.status, 200);

    const customerOwnDelivery = await request(
      `/api/marketplace/orders/${orderA._id}/delivery`,
      {
        headers: {
          Authorization: authorizationFor(customerA),
        },
      },
    );

    assert.equal(customerOwnDelivery.status, 200);

    const sellerOwnOrders = await request(
      `/api/marketplace/orders/seller?businessIds=${businessA._id}`,
      {
        headers: {
          Authorization: authorizationFor(sellerA),
        },
      },
    );

    assert.equal(sellerOwnOrders.status, 200);

    const sellerOwnOrdersPayload = await sellerOwnOrders.json();

    assert.equal(sellerOwnOrdersPayload.data.length, 1);
    assert.equal(sellerOwnOrdersPayload.data[0]._id, String(orderA._id));

    const sellerStatusUpdate = await request(
      `/api/marketplace/orders/${orderA._id}/status`,
      jsonRequest("PATCH", authorizationFor(sellerA), { status: "paid" }),
    );

    assert.equal(sellerStatusUpdate.status, 200);

    const sellerAssignment = await request(
      `/api/marketplace/orders/${orderA._id}/assign-delivery`,
      jsonRequest("POST", authorizationFor(sellerA), {
        courier: "local_dispatch",
        trackingCode: "AUTH-1",
      }),
    );

    assert.equal(sellerAssignment.status, 200);

    const sellerDeliveryUpdate = await request(
      `/api/marketplace/orders/${orderA._id}/delivery/status`,
      jsonRequest("PATCH", authorizationFor(sellerA), { status: "in_transit" }),
    );

    assert.equal(sellerDeliveryUpdate.status, 200);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });

    await mongoose.disconnect();
    await mongo.stop();
  }
});
