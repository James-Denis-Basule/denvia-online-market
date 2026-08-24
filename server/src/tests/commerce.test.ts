import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSellerDashboardSummary,
  calculateCartTotals,
  calculateCheckoutTotals,
  updateOrderStatus,
  validateOrderStatusTransition,
} from '../services/commerceService.js';
import {
  applyWebhookPaymentState,
  createPaymentIntent,
  isPaymentTransitionAllowed,
  updatePaymentStatus,
  validatePaymentStatus,
} from '../services/paymentService.js';
import {
  applyWebhookDeliveryState,
  isDeliveryTransitionAllowed,
  updateDeliveryStatus,
} from '../services/deliveryService.js';

test('cart totals sum item quantities and prices', () => {
  const totals = calculateCartTotals([
    { price: 5000, quantity: 2 },
    { price: 1500, quantity: 3 },
  ]);

  assert.equal(totals.subtotal, 5000 * 2 + 1500 * 3);
  assert.equal(totals.total, totals.subtotal);
  assert.equal(totals.itemCount, 5);
});

test('checkout totals include delivery and payment fees', () => {
  const totals = calculateCheckoutTotals(200000, 'express', 'card');

  assert.equal(totals.deliveryFee, 15000);
  assert.equal(totals.paymentFee, 1200);
  assert.equal(totals.total, 216200);
});

test('unsupported payment and shipping methods are rejected', () => {
  assert.throws(
    () => calculateCheckoutTotals(200000, 'international', 'card'),
    /Unsupported shipping method: international/,
  );

  assert.throws(
    () => calculateCheckoutTotals(200000, 'standard', 'bank_transfer'),
    /Unsupported payment method: bank_transfer/,
  );
});

test('order status transitions follow the defined lifecycle', () => {
  assert.equal(validateOrderStatusTransition('pending', 'paid'), true);
  assert.throws(
    () => validateOrderStatusTransition('pending', 'shipped'),
    /Order cannot move from pending to shipped/,
  );

  assert.equal(validateOrderStatusTransition('packed', 'shipped'), true);
});

test('payment intents create a valid provider-backed payment reference', () => {
  const payment = createPaymentIntent({
    orderId: '67d8d1f5d39b5b8f5f41de7b',
    userId: '67d8d1f5d39b5b8f5f41de7c',
    amount: 205000,
    provider: 'mobile_money',
    method: 'mobile_money',
  });

  assert.equal(payment.status, 'pending');
  assert.equal(payment.provider, 'mobile_money');
  assert.equal(payment.providerLabel, 'Mobile money');
  assert.match(payment.reference, /^pay_/);
  assert.equal(validatePaymentStatus('paid'), 'paid');
  assert.equal(isPaymentTransitionAllowed('pending', 'paid'), true);
  assert.equal(isPaymentTransitionAllowed('pending', 'refunded'), false);
  assert.equal(updatePaymentStatus('pending', 'paid'), 'paid');
  assert.throws(() => updatePaymentStatus('pending', 'refunded'), /Payment cannot move from pending to refunded/);
});

test('delivery status transition rules validate progress correctly', () => {
  assert.equal(isDeliveryTransitionAllowed('pending', 'assigned'), true);
  assert.equal(isDeliveryTransitionAllowed('assigned', 'in_transit'), true);
  assert.equal(isDeliveryTransitionAllowed('in_transit', 'delivered'), true);
  assert.throws(() => updateDeliveryStatus('pending', 'delivered'), /Delivery cannot move from pending to delivered/);
  assert.equal(updateDeliveryStatus('assigned', 'in_transit'), 'in_transit');
  assert.deepEqual(applyWebhookDeliveryState('pending', 'assigned', { courier: 'courier', trackingCode: 'TR-1' }), {
    status: 'assigned',
    courier: 'courier',
    trackingCode: 'TR-1',
  });
});

test('payment webhook state updates are validated correctly', () => {
  assert.deepEqual(applyWebhookPaymentState('pending', 'paid', { provider: 'mobile_money', reference: 'pay_123' }), {
    status: 'paid',
    provider: 'mobile_money',
    reference: 'pay_123',
  });

  assert.throws(() => applyWebhookPaymentState('pending', 'refunded'), /Payment cannot move from pending to refunded/);
});

test('seller dashboard summary aggregates order counts and revenue correctly', () => {
  const summary = buildSellerDashboardSummary([
    { _id: '1', status: 'pending', total: 100000, createdAt: '2026-08-01T00:00:00.000Z', items: [{ quantity: 2 }] },
    { _id: '2', status: 'paid', total: 250000, createdAt: '2026-08-02T00:00:00.000Z', items: [{ quantity: 1 }] },
    { _id: '3', status: 'shipped', total: 320000, createdAt: '2026-08-03T00:00:00.000Z', items: [{ quantity: 3 }] },
    { _id: '4', status: 'completed', total: 180000, createdAt: '2026-08-04T00:00:00.000Z', items: [{ quantity: 1 }] },
  ]);

  assert.equal(summary.overview.totalOrders, 4);
  assert.equal(summary.overview.pendingOrders, 1);
  assert.equal(summary.overview.paidOrders, 1);
  assert.equal(summary.overview.shippedOrders, 1);
  assert.equal(summary.overview.completedOrders, 1);
  assert.equal(summary.overview.totalRevenue, 850000);
  assert.equal(summary.overview.paidRevenue, 750000);
  assert.equal(summary.overview.completedRevenue, 180000);
  assert.equal(summary.overview.averageOrderValue, 212500);
  assert.deepEqual(summary.recentOrders[0].status, 'completed');
});

test('order status update rejects invalid ids and invalid transitions', async () => {
  await assert.rejects(
    async () => updateOrderStatus('not-a-valid-id', 'paid'),
    /Valid orderId is required/,
  );

  await assert.rejects(
    async () => updateOrderStatus('67d8d1f5d39b5b8f5f41de7b', 'shipped'),
    /Database unavailable/,
  );
});
