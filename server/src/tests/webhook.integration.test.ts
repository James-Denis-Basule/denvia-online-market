import test from "node:test";

import assert from "node:assert/strict";

import crypto from "node:crypto";

import mongoose from "mongoose";

import { MongoMemoryReplSet } from "mongodb-memory-server";

import app from "../app.js";

import User from "../models/User.js";

import Order from "../models/Order.js";

import Payment from "../models/Payment.js";

import Delivery from "../models/Delivery.js";

const PAYMENT_WEBHOOK_SECRET = "dev-payment-webhook-secret";

const DELIVERY_WEBHOOK_SECRET = "dev-delivery-webhook-secret";

function signPayload(
  payload: string,
  secret = PAYMENT_WEBHOOK_SECRET,
) {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}

async function createPaymentFixture() {
  const user = await User.create({
    firstName: "Webhook",
    lastName: "Customer",
    email: `webhook-${crypto.randomUUID()}@example.com`,
    password: "secret123",
    role: "user",
  });

  const businessId = new mongoose.Types.ObjectId();

  const productId = new mongoose.Types.ObjectId();

  const order = await Order.create({
    userId: user._id,
    customer: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
    items: [
      {
        productId,
        businessId,
        name: "Webhook Test Product",
        price: 100000,
        currency: "UGX",
        quantity: 1,
      },
    ],
    status: "pending",
    subtotal: 100000,
    deliveryFee: 0,
    paymentFee: 0,
    total: 100000,
    currency: "UGX",
    paymentMethod: "mobile_money",
    paymentProvider: "mobile_money",
    paymentStatus: "pending",
    shippingMethod: "standard",
    deliveryAddress: "Kampala, Uganda",
  });

  const payment = await Payment.create({
    orderId: order._id,
    userId: user._id,
    amount: 100000,
    currency: "UGX",
    provider: "mobile_money",
    method: "mobile_money",
    reference: `pay_${crypto.randomUUID()}`,
    status: "pending",
  });

  return {
    user,
    order,
    payment,
  };
}

async function createDeliveryFixture() {
  const user = await User.create({
    firstName: "Delivery",
    lastName: "Webhook Customer",
    email: `delivery-webhook-${crypto.randomUUID()}@example.com`,
    password: "secret123",
    role: "user",
  });

  const businessId = new mongoose.Types.ObjectId();

  const productId = new mongoose.Types.ObjectId();

  const order = await Order.create({
    userId: user._id,
    customer: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
    items: [
      {
        productId,
        businessId,
        name: "Delivery Webhook Test Product",
        price: 100000,
        currency: "UGX",
        quantity: 1,
      },
    ],
    status: "packed",
    subtotal: 100000,
    deliveryFee: 0,
    paymentFee: 0,
    total: 100000,
    currency: "UGX",
    paymentMethod: "mobile_money",
    paymentProvider: "mobile_money",
    paymentStatus: "paid",
    shippingMethod: "standard",
    deliveryAddress: "Kampala, Uganda",
  });

  const delivery = await Delivery.create({
    orderId: order._id,
    userId: user._id,
    businessId,
    method: "standard",
    provider: "courier",
    status: "assigned",
    trackingCode: "DEL-WEBHOOK-001",
    address: "Kampala, Uganda",
    events: [
      {
        status: "assigned",
        courier: "courier",
        trackingCode: "DEL-WEBHOOK-001",
        createdAt: new Date(),
      },
    ],
  });

  return {
    user,
    order,
    delivery,
  };
}

test(
  "payment webhook processes a provider event only once",
  async () => {
    const mongo = await MongoMemoryReplSet.create({
      replSet: {
        count: 1,
      },
    });

    await mongoose.connect(mongo.getUri());

    const server = app.listen(0);

    try {
      const { order } = await createPaymentFixture();

      const payloadObject = {
        orderId: String(order._id),
        status: "paid",
        provider: "mobile_money",
        reference: "provider-ref-001",
        providerEventId: "event-001",
      };

      const payload = JSON.stringify(payloadObject);

      const signature = signPayload(payload);

      const firstResponse = await fetch(
        `http://127.0.0.1:${(server.address() as any).port}/api/webhooks/payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-signature": signature,
          },
          body: payload,
        },
      );

      assert.equal(firstResponse.status, 200);

      const firstBody = await firstResponse.json();

      assert.equal(firstBody.success, true);

      assert.equal(firstBody.data.status, "paid");

      assert.equal(
        firstBody.data.providerEventId,
        "event-001",
      );

      const secondResponse = await fetch(
        `http://127.0.0.1:${(server.address() as any).port}/api/webhooks/payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-signature": signature,
          },
          body: payload,
        },
      );

      assert.equal(secondResponse.status, 200);

      const secondBody = await secondResponse.json();

      assert.equal(secondBody.success, true);

      assert.equal(secondBody.data.status, "paid");

      assert.equal(
        secondBody.data.providerEventId,
        "event-001",
      );

      const paymentCount =
        await Payment.countDocuments({
          provider: "mobile_money",
          providerEventId: "event-001",
        });

      assert.equal(paymentCount, 1);

      const payment = await Payment.findOne({
        orderId: order._id,
      }).lean();

      assert.equal(payment?.status, "paid");

      assert.equal(
        payment?.providerEventId,
        "event-001",
      );

      const updatedOrder =
        await Order.findById(order._id).lean();

      assert.equal(
        updatedOrder?.paymentStatus,
        "paid",
      );

      assert.equal(updatedOrder?.status, "paid");
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) =>
          error ? reject(error) : resolve(),
        );
      });

      await mongoose.disconnect();

      await mongo.stop();
    }
  },
);

test(
  "concurrent duplicate payment webhooks with the same provider event ID are idempotent",
  async () => {
    const mongo = await MongoMemoryReplSet.create({
      replSet: {
        count: 1,
      },
    });

    await mongoose.connect(mongo.getUri());

    const server = app.listen(0);

    try {
      const { order } = await createPaymentFixture();

      const payloadObject = {
        orderId: String(order._id),
        status: "paid",
        provider: "mobile_money",
        reference: "provider-ref-concurrent",
        providerEventId: "event-concurrent-001",
      };

      const payload = JSON.stringify(payloadObject);

      const signature = signPayload(payload);

      const address = server.address();

      const port =
        typeof address === "object" && address
          ? address.port
          : 0;

      const url =
        `http://127.0.0.1:${port}/api/webhooks/payment`;

      const sendWebhook = () =>
        fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-signature": signature,
          },
          body: payload,
        });

      const [responseOne, responseTwo] =
        await Promise.all([
          sendWebhook(),
          sendWebhook(),
        ]);

      assert.equal(responseOne.status, 200);

      assert.equal(responseTwo.status, 200);

      const bodyOne = await responseOne.json();

      const bodyTwo = await responseTwo.json();

      assert.equal(bodyOne.success, true);

      assert.equal(bodyTwo.success, true);

      assert.equal(bodyOne.data.status, "paid");

      assert.equal(bodyTwo.data.status, "paid");

      assert.equal(
        bodyOne.data.providerEventId,
        "event-concurrent-001",
      );

      assert.equal(
        bodyTwo.data.providerEventId,
        "event-concurrent-001",
      );

      const paymentCount =
        await Payment.countDocuments({
          provider: "mobile_money",
          providerEventId:
            "event-concurrent-001",
        });

      assert.equal(paymentCount, 1);

      const payment = await Payment.findOne({
        orderId: order._id,
      }).lean();

      assert.equal(payment?.status, "paid");

      assert.equal(
        payment?.providerEventId,
        "event-concurrent-001",
      );

      const updatedOrder =
        await Order.findById(order._id).lean();

      assert.equal(
        updatedOrder?.paymentStatus,
        "paid",
      );

      assert.equal(updatedOrder?.status, "paid");
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) =>
          error ? reject(error) : resolve(),
        );
      });

      await mongoose.disconnect();

      await mongo.stop();
    }
  },
);

test(
  "delivery webhook processes a provider event only once",
  async () => {
    const mongo = await MongoMemoryReplSet.create({
      replSet: {
        count: 1,
      },
    });

    await mongoose.connect(mongo.getUri());

    const server = app.listen(0);

    try {
      const { order } = await createDeliveryFixture();

      const payloadObject = {
        orderId: String(order._id),
        status: "in_transit",
        courier: "courier",
        trackingCode: "DEL-WEBHOOK-001",
        provider: "courier",
        providerEventId: "delivery-event-001",
      };

      const payload = JSON.stringify(payloadObject);

      const signature = signPayload(
        payload,
        DELIVERY_WEBHOOK_SECRET,
      );

      const address = server.address();

      const port =
        typeof address === "object" && address
          ? address.port
          : 0;

      const url =
        `http://127.0.0.1:${port}/api/webhooks/delivery`;

      const firstResponse = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-signature": signature,
        },
        body: payload,
      });

      assert.equal(firstResponse.status, 200);

      const firstBody = await firstResponse.json();

      assert.equal(firstBody.success, true);

      assert.equal(
        firstBody.data.status,
        "in_transit",
      );

      assert.equal(
        firstBody.data.providerEventId,
        "delivery-event-001",
      );

      const secondResponse = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-signature": signature,
        },
        body: payload,
      });

      assert.equal(secondResponse.status, 200);

      const secondBody = await secondResponse.json();

      assert.equal(secondBody.success, true);

      assert.equal(
        secondBody.data.status,
        "in_transit",
      );

      assert.equal(
        secondBody.data.providerEventId,
        "delivery-event-001",
      );

      const delivery = await Delivery.findOne({
        orderId: order._id,
      }).lean();

      assert.equal(delivery?.status, "in_transit");

      assert.equal(
        delivery?.providerEventId,
        "delivery-event-001",
      );

      assert.equal(delivery?.events?.length, 2);

      const inTransitEvents =
        delivery?.events?.filter(
          (event) =>
            event.status === "in_transit",
        ) ?? [];

      assert.equal(inTransitEvents.length, 1);

      const updatedOrder =
        await Order.findById(order._id).lean();

      assert.equal(updatedOrder?.status, "shipped");
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) =>
          error ? reject(error) : resolve(),
        );
      });

      await mongoose.disconnect();

      await mongo.stop();
    }
  },
);

test(
  "concurrent duplicate delivery webhooks with the same provider event ID are idempotent",
  async () => {
    const mongo = await MongoMemoryReplSet.create({
      replSet: {
        count: 1,
      },
    });

    await mongoose.connect(mongo.getUri());

    const server = app.listen(0);

    try {
      const { order } = await createDeliveryFixture();

      const payloadObject = {
        orderId: String(order._id),
        status: "in_transit",
        courier: "courier",
        trackingCode: "DEL-WEBHOOK-CONCURRENT",
        provider: "courier",
        providerEventId:
          "delivery-event-concurrent-001",
      };

      const payload = JSON.stringify(payloadObject);

      const signature = signPayload(
        payload,
        DELIVERY_WEBHOOK_SECRET,
      );

      const address = server.address();

      const port =
        typeof address === "object" && address
          ? address.port
          : 0;

      const url =
        `http://127.0.0.1:${port}/api/webhooks/delivery`;

      const sendWebhook = () =>
        fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-signature": signature,
          },
          body: payload,
        });

      const [responseOne, responseTwo] =
        await Promise.all([
          sendWebhook(),
          sendWebhook(),
        ]);

      assert.equal(responseOne.status, 200);

      assert.equal(responseTwo.status, 200);

      const bodyOne = await responseOne.json();

      const bodyTwo = await responseTwo.json();

      assert.equal(bodyOne.success, true);

      assert.equal(bodyTwo.success, true);

      assert.equal(
        bodyOne.data.status,
        "in_transit",
      );

      assert.equal(
        bodyTwo.data.status,
        "in_transit",
      );

      assert.equal(
        bodyOne.data.providerEventId,
        "delivery-event-concurrent-001",
      );

      assert.equal(
        bodyTwo.data.providerEventId,
        "delivery-event-concurrent-001",
      );

      const delivery =
        await Delivery.findOne({
          orderId: order._id,
        }).lean();

      assert.equal(
        delivery?.providerEventId,
        "delivery-event-concurrent-001",
      );

      assert.equal(
        delivery?.status,
        "in_transit",
      );

      assert.equal(delivery?.events?.length, 2);

      const inTransitEvents =
        delivery?.events?.filter(
          (event) =>
            event.status === "in_transit",
        ) ?? [];

      assert.equal(inTransitEvents.length, 1);

      const updatedOrder =
        await Order.findById(order._id).lean();

      assert.equal(updatedOrder?.status, "shipped");
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) =>
          error ? reject(error) : resolve(),
        );
      });

      await mongoose.disconnect();

      await mongo.stop();
    }
  },
);
test(
  "late payment paid webhook does not regress a confirmed order",
  async () => {
    const mongo = await MongoMemoryReplSet.create({
      replSet: {
        count: 1,
      },
    });
    await mongoose.connect(mongo.getUri());
    const server = app.listen(0);

    try {
      const { order } = await createPaymentFixture();

      order.status = "confirmed";
      await order.save();

      const payloadObject = {
        orderId: String(order._id),
        status: "paid",
        provider: "mobile_money",
        reference: "provider-ref-late-confirmed",
        providerEventId: "event-late-confirmed-001",
      };

      const payload = JSON.stringify(payloadObject);
      const signature = signPayload(payload);

      const address = server.address();
      const port =
        typeof address === "object" && address
          ? address.port
          : 0;

      const response = await fetch(
        `http://127.0.0.1:${port}/api/webhooks/payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-signature": signature,
          },
          body: payload,
        },
      );

      assert.equal(response.status, 200);

      const updatedOrder = await Order.findById(
        order._id,
      ).lean();

      assert.equal(updatedOrder?.paymentStatus, "paid");
      assert.equal(updatedOrder?.status, "confirmed");
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) =>
          error ? reject(error) : resolve(),
        );
      });

      await mongoose.disconnect();
      await mongo.stop();
    }
  },
);

test(
  "late payment paid webhook does not regress a shipped order",
  async () => {
    const mongo = await MongoMemoryReplSet.create({
      replSet: {
        count: 1,
      },
    });
    await mongoose.connect(mongo.getUri());
    const server = app.listen(0);

    try {
      const { order } = await createPaymentFixture();

      order.status = "shipped";
      await order.save();

      const payloadObject = {
        orderId: String(order._id),
        status: "paid",
        provider: "mobile_money",
        reference: "provider-ref-late-shipped",
        providerEventId: "event-late-shipped-001",
      };

      const payload = JSON.stringify(payloadObject);
      const signature = signPayload(payload);

      const address = server.address();
      const port =
        typeof address === "object" && address
          ? address.port
          : 0;

      const response = await fetch(
        `http://127.0.0.1:${port}/api/webhooks/payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-signature": signature,
          },
          body: payload,
        },
      );

      assert.equal(response.status, 200);

      const updatedOrder = await Order.findById(
        order._id,
      ).lean();

      assert.equal(updatedOrder?.paymentStatus, "paid");
      assert.equal(updatedOrder?.status, "shipped");
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) =>
          error ? reject(error) : resolve(),
        );
      });

      await mongoose.disconnect();
      await mongo.stop();
    }
  },
);

test(
  "late delivery in_transit webhook does not regress a completed order",
  async () => {
    const mongo = await MongoMemoryReplSet.create({
      replSet: {
        count: 1,
      },
    });
    await mongoose.connect(mongo.getUri());
    const server = app.listen(0);

    try {
      const { order, delivery } =
        await createDeliveryFixture();

      order.status = "completed";
      await order.save();

      delivery.status = "in_transit";
      delivery.events = [
        {
          status: "assigned",
          courier: "courier",
          trackingCode: "DEL-WEBHOOK-001",
          createdAt: new Date(),
        },
        {
          status: "in_transit",
          courier: "courier",
          trackingCode: "DEL-WEBHOOK-001",
          createdAt: new Date(),
        },
      ];
      await delivery.save();

      const payloadObject = {
        orderId: String(order._id),
        status: "in_transit",
        courier: "courier",
        trackingCode: "DEL-WEBHOOK-001",
        provider: "courier",
        providerEventId: "delivery-event-late-completed-001",
      };

      const payload = JSON.stringify(payloadObject);
      const signature = signPayload(
        payload,
        DELIVERY_WEBHOOK_SECRET,
      );

      const address = server.address();
      const port =
        typeof address === "object" && address
          ? address.port
          : 0;

      const response = await fetch(
        `http://127.0.0.1:${port}/api/webhooks/delivery`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-signature": signature,
          },
          body: payload,
        },
      );

      assert.equal(response.status, 200);

      const updatedOrder = await Order.findById(
        order._id,
      ).lean();

      assert.equal(updatedOrder?.status, "completed");

      const updatedDelivery =
        await Delivery.findById(delivery._id).lean();

      assert.equal(
        updatedDelivery?.status,
        "in_transit",
      );
      assert.equal(
        updatedDelivery?.providerEventId,
        "delivery-event-late-completed-001",
      );
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) =>
          error ? reject(error) : resolve(),
        );
      });

      await mongoose.disconnect();
      await mongo.stop();
    }
  },
);

test(
  "out-of-order delivery assigned webhook is rejected after in_transit",
  async () => {
    const mongo = await MongoMemoryReplSet.create({
      replSet: {
        count: 1,
      },
    });
    await mongoose.connect(mongo.getUri());
    const server = app.listen(0);

    try {
      const { order, delivery } =
        await createDeliveryFixture();

      delivery.status = "in_transit";
      delivery.events = [
        {
          status: "assigned",
          courier: "courier",
          trackingCode: "DEL-WEBHOOK-001",
          createdAt: new Date(),
        },
        {
          status: "in_transit",
          courier: "courier",
          trackingCode: "DEL-WEBHOOK-001",
          createdAt: new Date(),
        },
      ];
      await delivery.save();

      order.status = "shipped";
      await order.save();

      const payloadObject = {
        orderId: String(order._id),
        status: "assigned",
        courier: "courier",
        trackingCode: "DEL-WEBHOOK-001",
        provider: "courier",
        providerEventId: "delivery-event-out-of-order-001",
      };

      const payload = JSON.stringify(payloadObject);
      const signature = signPayload(
        payload,
        DELIVERY_WEBHOOK_SECRET,
      );

      const address = server.address();
      const port =
        typeof address === "object" && address
          ? address.port
          : 0;

      const response = await fetch(
        `http://127.0.0.1:${port}/api/webhooks/delivery`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-signature": signature,
          },
          body: payload,
        },
      );

      assert.equal(response.status, 400);

      const unchangedDelivery =
        await Delivery.findById(delivery._id).lean();

      assert.equal(
        unchangedDelivery?.status,
        "in_transit",
      );
      assert.equal(
        unchangedDelivery?.providerEventId,
        undefined,
      );

      const unchangedOrder = await Order.findById(
        order._id,
      ).lean();

      assert.equal(unchangedOrder?.status, "shipped");
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) =>
          error ? reject(error) : resolve(),
        );
      });

      await mongoose.disconnect();
      await mongo.stop();
    }
  },
);
