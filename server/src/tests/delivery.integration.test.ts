import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

import Order from "../models/Order.js";
import Delivery from "../models/Delivery.js";

import {
  assignDeliveryToOrder,
  updateDeliveryStatusForOrder,
} from "../services/deliveryService.js";

let mongo: MongoMemoryReplSet;

test("delivery lifecycle updates delivery and order statuses atomically", async () => {
  mongo = await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
      storageEngine: "wiredTiger",
    },
  });

  const uri = mongo.getUri();

  await mongoose.connect(uri, {});

  try {
    const userId = new mongoose.Types.ObjectId();
    const businessId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();

    const order = await Order.create({
      userId,
      items: [
        {
          productId,
          businessId,
          name: "Integration product",
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
      paymentMethod: "cash_on_delivery",
      paymentProvider: "cash_on_delivery",
      paymentStatus: "pending",
      shippingMethod: "delivery",
      deliveryAddress: "Test address",
      status: "paid",
    } as any);

    // ------------------------------------------------------------
    // Assignment
    // ------------------------------------------------------------

    const delivery = await assignDeliveryToOrder(
      String(order._id),
      "local_dispatch",
      "TRK-INT-1",
    );

    assert.equal(delivery.status, "assigned");

    const updatedOrder1 = await Order.findById(order._id).lean();

    assert.equal(updatedOrder1?.status, "packed");

    // ------------------------------------------------------------
    // In transit
    // ------------------------------------------------------------

    const delivery2 = await updateDeliveryStatusForOrder(
      String(order._id),
      "in_transit",
      {
        courier: "local_dispatch",
      },
    );

    assert.equal(delivery2.status, "in_transit");

    const updatedOrder2 = await Order.findById(order._id).lean();

    assert.equal(updatedOrder2?.status, "shipped");

    // ------------------------------------------------------------
    // Delivered
    // ------------------------------------------------------------

    const delivery3 = await updateDeliveryStatusForOrder(
      String(order._id),
      "delivered",
      {
        courier: "local_dispatch",
      },
    );

    assert.equal(delivery3.status, "delivered");

    const updatedOrder3 = await Order.findById(order._id).lean();

    assert.equal(updatedOrder3?.status, "completed");

    // ------------------------------------------------------------
    // Delivery audit events
    // ------------------------------------------------------------

    const persistedDelivery = await Delivery.findOne({
      orderId: order._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    assert.ok(persistedDelivery);

    assert.ok(
      Array.isArray((persistedDelivery as any).events),
    );

    assert(
      persistedDelivery &&
        (persistedDelivery as any).events.length >= 3,
    );
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
});

test("delivery/order synchronization rolls back atomically when order update fails", async () => {
  const rollbackMongo = await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
      storageEngine: "wiredTiger",
    },
  });

  const uri = rollbackMongo.getUri();

  await mongoose.connect(uri, {});

  try {
    const userId = new mongoose.Types.ObjectId();
    const businessId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();

    const order = await Order.create({
      userId,
      items: [
        {
          productId,
          businessId,
          name: "Rollback product",
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
      paymentMethod: "cash_on_delivery",
      paymentProvider: "cash_on_delivery",
      paymentStatus: "pending",
      shippingMethod: "delivery",
      deliveryAddress: "Rollback address",
      status: "paid",
    } as any);

    await Delivery.create({
      orderId: order._id,
      userId,
      businessId,
      method: "standard",
      provider: "local_dispatch",
      zone: "local",
      status: "assigned",
      trackingCode: "TRK-ROLLBACK",
      address: "Rollback address",
      events: [
        {
          status: "assigned",
          courier: "local_dispatch",
          trackingCode: "TRK-ROLLBACK",
          createdAt: new Date(),
        },
      ],
    });

    /*
     * Force the order lookup inside the transaction to fail by
     * deleting the order before the operation.
     *
     * The delivery remains present, so the service reaches the
     * order synchronization step and must roll back the delivery
     * change when the order is missing.
     */
    await Order.deleteOne({ _id: order._id });

    await assert.rejects(
      updateDeliveryStatusForOrder(
        String(order._id),
        "in_transit",
        {
          courier: "local_dispatch",
        },
      ),
      (error: any) => {
        assert.equal(error.statusCode, 404);
        assert.equal(error.message, "Order not found");
        return true;
      },
    );

    const persistedDelivery = await Delivery.findOne({
      orderId: order._id,
    }).lean();

    assert.ok(persistedDelivery);

    /*
     * The delivery must still be "assigned".
     * If the transaction had not rolled back, it would be
     * "in_transit".
     */
    assert.equal(
      persistedDelivery?.status,
      "assigned",
    );

    assert.equal(
      (persistedDelivery as any).events.length,
      1,
    );

    assert.equal(
      (persistedDelivery as any).events[0].status,
      "assigned",
    );
  } finally {
    await mongoose.disconnect();
    await rollbackMongo.stop();
  }
});