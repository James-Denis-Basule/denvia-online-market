import test from 'node:test';
import assert from 'node:assert/strict';

import { buildDeliveryProviderRequest, buildPaymentProviderRequest } from '../services/providerAdapterService.js';

test('payment adapter resolves demo-compatible payloads for live mode without secrets', () => {
  const paymentRequest = buildPaymentProviderRequest({
    provider: 'mobile_money',
    orderId: 'order-123',
    amount: 25000,
    currency: 'UGX',
  });

  assert.equal(paymentRequest.provider, 'mobile_money');
  assert.equal(paymentRequest.mode, 'demo');
  assert.equal(paymentRequest.gateway, 'flutterwave');
  assert.ok(paymentRequest.reference.startsWith('demo_'));
});

test('delivery adapter resolves demo-compatible payloads for courier routes', () => {
  const deliveryRequest = buildDeliveryProviderRequest({
    provider: 'courier',
    orderId: 'order-123',
    trackingCode: 'TRK-42',
  });

  assert.equal(deliveryRequest.provider, 'courier');
  assert.equal(deliveryRequest.mode, 'demo');
  assert.equal(deliveryRequest.gateway, 'courier');
  assert.ok(deliveryRequest.reference.startsWith('demo_'));
});
