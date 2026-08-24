import test from 'node:test';
import assert from 'node:assert/strict';

import { mapDeliveryStatusToOrderStatus } from '../services/deliveryService.js';

test('map delivery status to order status mapping', () => {
  assert.equal(mapDeliveryStatusToOrderStatus('pending'), null);
  assert.equal(mapDeliveryStatusToOrderStatus('assigned'), 'packed');
  assert.equal(mapDeliveryStatusToOrderStatus('in_transit'), 'shipped');
  assert.equal(mapDeliveryStatusToOrderStatus('delivered'), 'completed');
  assert.equal(mapDeliveryStatusToOrderStatus('failed'), null);
});
