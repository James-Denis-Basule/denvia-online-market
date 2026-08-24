import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateRemainingCredits,
  getDefaultPlanCatalog,
} from '../services/marketingService.js';

test('marketing plan catalog exposes the expected default tiers', () => {
  const plans = getDefaultPlanCatalog();

  assert.equal(plans.length, 3);
  assert.deepEqual(
    plans.map((plan) => plan.slug),
    ['free', 'growth', 'pro'],
  );
});

test('credit remaining calculation never drops below zero', () => {
  assert.equal(calculateRemainingCredits(10, 3), 7);
  assert.equal(calculateRemainingCredits(5, 9), 0);
});
