import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app.js';
import Business from '../models/Business.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { generateAccessToken } from '../utils/jwt.js';

test('cart, quote, and checkout use authoritative product data and inventory', async () => {
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  const server = app.listen(0);

  try {
    const [customer, seller] = await Promise.all([
      User.create({ firstName: 'Cart', lastName: 'Customer', email: 'cart-customer@example.com', password: 'secret123', role: 'user' }),
      User.create({ firstName: 'Catalog', lastName: 'Seller', email: 'catalog-seller@example.com', password: 'secret123', role: 'business_owner' }),
    ]);
    const [business, otherBusiness] = await Promise.all([
      Business.create({ ownerId: seller._id, name: 'Catalog Store', slug: 'catalog-store', email: 'catalog-store@example.com', status: 'active' }),
      Business.create({ ownerId: seller._id, name: 'Other Store', slug: 'other-store', email: 'other-store@example.com', status: 'active' }),
    ]);
    const [product, unavailableProduct] = await Promise.all([
      Product.create({ businessId: business._id, name: 'Authoritative Laptop', slug: 'authoritative-laptop', price: 125000, currency: 'UGX', stockQuantity: 3, status: 'active', isVisible: true, media: [] }),
      Product.create({ businessId: business._id, name: 'Unavailable Laptop', slug: 'unavailable-laptop', price: 90000, currency: 'UGX', stockQuantity: 2, status: 'draft', isVisible: true, media: [] }),
    ]);

    const token = generateAccessToken({ userId: String(customer._id), role: customer.role });
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    const request = (path: string, method: string, body: Record<string, unknown>) => fetch(
      `http://127.0.0.1:${port}${path}`,
      {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );

    const forgedCartItem = await request('/api/marketplace/cart/items', 'POST', {
      productId: String(product._id),
      businessId: String(business._id),
      name: 'Forged name',
      price: 1,
      currency: 'USD',
      image: 'https://attacker.invalid/image.png',
      quantity: 1,
    });
    assert.equal(forgedCartItem.status, 200);

    const cart = await Cart.findOne({ userId: customer._id }).lean();
    assert.equal(cart?.items[0]?.name, product.name);
    assert.equal(cart?.items[0]?.price, product.price);
    assert.equal(cart?.items[0]?.currency, product.currency);
    assert.equal(String(cart?.items[0]?.businessId), String(business._id));

    const forgedBusiness = await request('/api/marketplace/cart/items', 'POST', {
      productId: String(product._id),
      businessId: String(otherBusiness._id),
      quantity: 1,
    });
    assert.equal(forgedBusiness.status, 400);

    const nonexistentProduct = await request('/api/marketplace/cart/items', 'POST', {
      productId: String(new mongoose.Types.ObjectId()),
      quantity: 1,
    });
    assert.equal(nonexistentProduct.status, 404);

    const invalidQuantity = await request('/api/marketplace/cart/items', 'POST', {
      productId: String(product._id),
      quantity: 1.5,
    });
    assert.equal(invalidQuantity.status, 400);

    const excessiveQuantity = await request('/api/marketplace/cart/items', 'POST', {
      productId: String(product._id),
      quantity: 3,
    });
    assert.equal(excessiveQuantity.status, 409);

    const unavailableProductRequest = await request('/api/marketplace/cart/items', 'POST', {
      productId: String(unavailableProduct._id),
      quantity: 1,
    });
    assert.equal(unavailableProductRequest.status, 409);

    const quote = await request('/api/marketplace/checkout/quote', 'POST', {
      items: [{ productId: String(product._id), name: 'Forged quote name', price: 1, quantity: 1 }],
      shippingMethod: 'standard',
      paymentMethod: 'card',
    });
    assert.equal(quote.status, 200);
    const quotePayload = await quote.json();
    assert.equal(quotePayload.data.items[0].name, product.name);
    assert.equal(quotePayload.data.items[0].price, product.price);
    assert.equal(quotePayload.data.subtotal, 125000);
    assert.equal(quotePayload.data.total, 131200);

    const checkoutWithNonexistentProduct = await request('/api/marketplace/orders', 'POST', {
      items: [{ productId: String(new mongoose.Types.ObjectId()), quantity: 1 }],
      shippingMethod: 'standard',
      paymentMethod: 'cash_on_delivery',
    });
    assert.equal(checkoutWithNonexistentProduct.status, 404);

    const checkout = await request('/api/marketplace/orders', 'POST', {
      items: [{ productId: String(product._id), businessId: String(business._id), name: 'Forged order name', price: 1, currency: 'USD', quantity: 2 }],
      shippingMethod: 'express',
      paymentMethod: 'mobile_money',
      deliveryAddress: 'Kampala, Uganda',
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

    const checkoutBeyondInventory = await request('/api/marketplace/orders', 'POST', {
      items: [{ productId: String(product._id), quantity: 2 }],
      shippingMethod: 'standard',
      paymentMethod: 'cash_on_delivery',
    });
    assert.equal(checkoutBeyondInventory.status, 409);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
    await mongoose.disconnect();
    await mongo.stop();
  }
});
