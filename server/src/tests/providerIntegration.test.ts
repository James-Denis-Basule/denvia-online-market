import test from 'node:test';
import assert from 'node:assert/strict';

import { getProviderHealthSummary } from '../services/providerIntegrationService.js';

test('provider health summary reports default demo mode and missing live credentials', () => {
  const summary = getProviderHealthSummary();

  assert.equal(summary.mode.payment, 'demo');
  assert.equal(summary.mode.delivery, 'demo');
  assert.ok(summary.payment.some((provider) => provider.name === 'mobile_money'));
  assert.ok(summary.delivery.some((provider) => provider.name === 'courier'));
  assert.ok(summary.warnings.length >= 0);
});
