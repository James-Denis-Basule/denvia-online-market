import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { createNotification, getNotificationsForUser, markNotificationAsRead } from '../services/notificationService.js';

test('notification service creates and marks notifications as read', async () => {
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), {});

  try {
    const userId = new mongoose.Types.ObjectId().toString();
    const notification = await createNotification(userId, {
      type: 'order_status',
      title: 'Order accepted',
      message: 'Your order is being processed.',
      metadata: { orderId: 'order-123', status: 'paid' },
    });

    assert.equal(notification.type, 'order_status');
    assert.equal(notification.title, 'Order accepted');

    const notifications = await getNotificationsForUser(userId, 10);
    assert.equal(notifications.length, 1);

    const marked = await markNotificationAsRead(userId, String(notification._id));
    assert.equal(marked.isRead, true);

    const unread = await getNotificationsForUser(userId, 10, true);
    assert.equal(unread.length, 0);
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
});
