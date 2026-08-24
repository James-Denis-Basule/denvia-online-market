import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import Order from '../models/Order.js';
import Delivery from '../models/Delivery.js';
import { assignDeliveryToOrder, updateDeliveryStatusForOrder } from '../services/deliveryService.js';

let mongo: MongoMemoryServer;

test('delivery lifecycle updates delivery and order statuses (integration)', async (t) => {
  // start in-memory mongo
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();

  await mongoose.connect(uri, {});

  // create a user, business and an order
  const userId = new mongoose.Types.ObjectId();
  const businessId = new mongoose.Types.ObjectId();
  const productId = new mongoose.Types.ObjectId();

  const order = await Order.create({
    userId,
    items: [
      {
        productId,
        businessId,
        name: 'Integration product',
        price: 10000,
        currency: 'UGX',
        quantity: 1,
      },
    ],
    subtotal: 10000,
    deliveryFee: 5000,
    paymentFee: 0,
    total: 15000,
    currency: 'UGX',
    paymentMethod: 'cash_on_delivery',
    paymentProvider: 'cash_on_delivery',
    paymentStatus: 'pending',
    shippingMethod: 'delivery',
    deliveryAddress: 'Test address',
    status: 'paid', // start from paid so mapping to packed/shipped/completed is forward
  } as any);

  // Assign delivery
  const delivery = await assignDeliveryToOrder(String(order._id), 'local_dispatch', 'TRK-INT-1');
  assert.equal(delivery.status, 'assigned');

  // Refresh order from DB
  const updatedOrder1 = await Order.findById(order._id).lean();
  // assigned -> mapped to 'packed'
  assert.equal(updatedOrder1?.status, 'packed');

  // Move to in_transit
  const delivery2 = await updateDeliveryStatusForOrder(String(order._id), 'in_transit', { courier: 'local_dispatch' });
  assert.equal(delivery2.status, 'in_transit');
  const updatedOrder2 = await Order.findById(order._id).lean();
  assert.equal(updatedOrder2?.status, 'shipped');

  // Move to delivered
  const delivery3 = await updateDeliveryStatusForOrder(String(order._id), 'delivered', { courier: 'local_dispatch' });
  assert.equal(delivery3.status, 'delivered');
  const updatedOrder3 = await Order.findById(order._id).lean();
  assert.equal(updatedOrder3?.status, 'completed');

  // Assert events exist on delivery document
  const persistedDelivery = await Delivery.findOne({ orderId: order._id }).sort({ createdAt: -1 }).lean();
  assert.ok(persistedDelivery);
  assert.ok(Array.isArray((persistedDelivery as any).events));
  assert(persistedDelivery && (persistedDelivery as any).events.length >= 3);

  // cleanup
  await mongoose.disconnect();
  await mongo.stop();
});
