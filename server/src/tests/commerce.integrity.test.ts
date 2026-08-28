import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

import app from "../app.js";
import Business from "../models/Business.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import Delivery from "../models/Delivery.js";
import User from "../models/User.js";
import { generateAccessToken } from "../utils/jwt.js";

test("cart, quote, and checkout use authoritative product data and inventory", async () => {
  const mongo = await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
    },
  });

  await mongoose.connect(mongo.getUri());
  const server = app.listen(0);

  try {
    const [customer, seller] = await Promise.all([
      User.create({
        firstName: "Cart",
        lastName: "Customer",
        email: "cart-customer@example.com",
        password: "secret123",
        role: "user",
      }),
      User.create({
        firstName: "Catalog",
        lastName: "Seller",
        email: "catalog-seller@example.com",
        password: "secret123",
        role: "business_owner",
      }),
    ]);
    const [business, otherBusiness] = await Promise.all([
      Business.create({
        ownerId: seller._id,
        name: "Catalog Store",
        slug: "catalog-store",
        email: "catalog-store@example.com",
        status: "active",
      }),
      Business.create({
        ownerId: seller._id,
        name: "Other Store",
        slug: "other-store",
        email: "other-store@example.com",
        status: "active",
      }),
    ]);
    const [product, unavailableProduct] = await Promise.all([
      Product.create({
        businessId: business._id,
        name: "Authoritative Laptop",
        slug: "authoritative-laptop",
        sku: "AUTH-LAPTOP-001",
        price: 125000,
        currency: "UGX",
        stockQuantity: 3,
        status: "active",
        isVisible: true,
        media: [],
      }),
      Product.create({
        businessId: business._id,
        name: "Unavailable Laptop",
        slug: "unavailable-laptop",
        sku: "UNAVAILABLE-LAPTOP-001",
        price: 90000,
        currency: "UGX",
        stockQuantity: 2,
        status: "draft",
        isVisible: true,
        media: [],
      }),
    ]);

    const token = generateAccessToken({
      userId: String(customer._id),
      role: customer.role,
    });
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const request = (
      path: string,
      method: string,
      body: Record<string, unknown>,
    ) =>
      fetch(`http://127.0.0.1:${port}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

    const forgedCartItem = await request(
      "/api/marketplace/cart/items",
      "POST",
      {
        productId: String(product._id),
        businessId: String(business._id),
        name: "Forged name",
        price: 1,
        currency: "USD",
        image: "https://attacker.invalid/image.png",
        quantity: 1,
      },
    );
    assert.equal(forgedCartItem.status, 200);

    const cart = await Cart.findOne({ userId: customer._id }).lean();
    assert.equal(cart?.items[0]?.name, product.name);
    assert.equal(cart?.items[0]?.price, product.price);
    assert.equal(cart?.items[0]?.currency, product.currency);
    assert.equal(String(cart?.items[0]?.businessId), String(business._id));

    const forgedBusiness = await request(
      "/api/marketplace/cart/items",
      "POST",
      {
        productId: String(product._id),
        businessId: String(otherBusiness._id),
        quantity: 1,
      },
    );
    assert.equal(forgedBusiness.status, 400);

    const nonexistentProduct = await request(
      "/api/marketplace/cart/items",
      "POST",
      {
        productId: String(new mongoose.Types.ObjectId()),
        quantity: 1,
      },
    );
    assert.equal(nonexistentProduct.status, 404);

    const invalidQuantity = await request(
      "/api/marketplace/cart/items",
      "POST",
      {
        productId: String(product._id),
        quantity: 1.5,
      },
    );
    assert.equal(invalidQuantity.status, 400);

    const excessiveQuantity = await request(
      "/api/marketplace/cart/items",
      "POST",
      {
        productId: String(product._id),
        quantity: 3,
      },
    );
    assert.equal(excessiveQuantity.status, 409);

    const unavailableProductRequest = await request(
      "/api/marketplace/cart/items",
      "POST",
      {
        productId: String(unavailableProduct._id),
        quantity: 1,
      },
    );
    assert.equal(unavailableProductRequest.status, 409);

    const quote = await request("/api/marketplace/checkout/quote", "POST", {
      items: [
        {
          productId: String(product._id),
          name: "Forged quote name",
          price: 1,
          quantity: 1,
        },
      ],
      shippingMethod: "standard",
      paymentMethod: "card",
    });
    assert.equal(quote.status, 200);
    const quotePayload = await quote.json();
    assert.equal(quotePayload.data.items[0].name, product.name);
    assert.equal(quotePayload.data.items[0].price, product.price);
    assert.equal(quotePayload.data.subtotal, 125000);
    assert.equal(quotePayload.data.total, 131200);

    const checkoutWithNonexistentProduct = await request(
      "/api/marketplace/orders",
      "POST",
      {
        items: [
          { productId: String(new mongoose.Types.ObjectId()), quantity: 1 },
        ],
        shippingMethod: "standard",
        paymentMethod: "cash_on_delivery",
      },
    );
    assert.equal(checkoutWithNonexistentProduct.status, 404);

    const checkout = await request("/api/marketplace/orders", "POST", {
      items: [
        {
          productId: String(product._id),
          businessId: String(business._id),
          name: "Forged order name",
          price: 1,
          currency: "USD",
          quantity: 2,
        },
      ],
      shippingMethod: "express",
      paymentMethod: "mobile_money",
      deliveryAddress: "Kampala, Uganda",
      subtotal: 2,
      total: 2,
    });
    assert.equal(checkout.status, 201);
    const checkoutPayload = await checkout.json();
    assert.equal(checkoutPayload.data.items[0].name, product.name);
    assert.equal(checkoutPayload.data.items[0].price, product.price);
    assert.equal(checkoutPayload.data.subtotal, 250000);
    assert.equal(checkoutPayload.data.deliveryFee, 15000);
    assert.equal(checkoutPayload.data.paymentFee, 500);
    assert.equal(checkoutPayload.data.total, 265500);

    const updatedProduct = await Product.findById(product._id).lean();
    assert.equal(updatedProduct?.stockQuantity, 1);

    const checkoutBeyondInventory = await request(
      "/api/marketplace/orders",
      "POST",
      {
        items: [{ productId: String(product._id), quantity: 2 }],
        shippingMethod: "standard",
        paymentMethod: "cash_on_delivery",
      },
    );
    assert.equal(checkoutBeyondInventory.status, 409);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await mongoose.disconnect();
    await mongo.stop();
  }
});

test("order cancellation atomically restores stock, refunds paid payment, and fails pending delivery", async () => {
  const mongo = await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
    },
  });

  await mongoose.connect(mongo.getUri());

  const server = app.listen(0);

  try {
    const customer = await User.create({
      firstName: "Cancel",
      lastName: "Customer",
      email: "cancel-customer@example.com",
      password: "secret123",
      role: "user",
    });

    const seller = await User.create({
      firstName: "Cancel",
      lastName: "Seller",
      email: "cancel-seller@example.com",
      password: "secret123",
      role: "business_owner",
    });

    const business = await Business.create({
      ownerId: seller._id,
      name: "Cancellation Store",
      slug: "cancellation-store",
      email: "cancellation-store@example.com",
      status: "active",
    });

    const product = await Product.create({
      businessId: business._id,
      name: "Cancellation Product",
      slug: "cancellation-product",
      price: 100000,
      currency: "UGX",
      stockQuantity: 10,
      status: "active",
      isVisible: true,
      media: [],
    });

    const order = await Order.create({
      userId: customer._id,
      customer: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
      },
      items: [
        {
          productId: product._id,
          businessId: business._id,
          name: product.name,
          price: product.price,
          currency: product.currency,
          quantity: 3,
        },
      ],
      status: "paid",
      subtotal: 300000,
      deliveryFee: 5000,
      paymentFee: 0,
      total: 305000,
      currency: "UGX",
      paymentMethod: "mobile_money",
      paymentProvider: "mobile_money",
      paymentStatus: "paid",
      shippingMethod: "standard",
      deliveryAddress: "Kampala, Uganda",
    });

    await Product.updateOne(
      { _id: product._id },
      { $inc: { stockQuantity: -3 } },
    );

    const payment = await Payment.create({
      orderId: order._id,
      userId: customer._id,
      amount: order.total,
      currency: "UGX",
      provider: "mobile_money",
      method: "mobile_money",
      reference: "cancel-payment-test",
      status: "paid",
    });

    const delivery = await Delivery.create({
      orderId: order._id,
      userId: customer._id,
      businessId: business._id,
      method: "standard",
      provider: "local_dispatch",
      status: "pending",
      address: "Kampala, Uganda",
      events: [],
    });

    const token = generateAccessToken({
      userId: String(customer._id),
      role: customer.role,
    });

    const address = server.address();
    const port =
      typeof address === "object" && address ? address.port : 0;

    const response = await fetch(
      `http://127.0.0.1:${port}/api/marketplace/orders/${order._id}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    assert.equal(response.status, 200);

    const updatedOrder = await Order.findById(order._id).lean();
    const updatedProduct = await Product.findById(product._id).lean();
    const updatedPayment = await Payment.findById(payment._id).lean();
    const updatedDelivery = await Delivery.findById(delivery._id).lean();

    assert.equal(updatedOrder?.status, "cancelled");
    assert.equal(updatedOrder?.paymentStatus, "refunded");
    assert.equal(updatedProduct?.stockQuantity, 10);
    assert.equal(updatedPayment?.status, "refunded");
    assert.equal(updatedDelivery?.status, "failed");
    assert.equal(updatedDelivery?.events?.length, 1);
    assert.equal(updatedDelivery?.events?.[0]?.status, "failed");
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });

    await mongoose.disconnect();
    await mongo.stop();
  }
});
