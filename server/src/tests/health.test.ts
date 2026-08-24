import test from 'node:test';
import assert from 'node:assert/strict';

import app from '../app.js';
import { assertValidObjectId } from '../utils/objectId.js';

test('GET /api/health returns the API health payload', async () => {
  const server = app.listen(0);

  try {
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;

    const response = await fetch(`http://127.0.0.1:${port}/api/health`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.match(payload.message, /Denvia Online Market API is running/);
    assert.ok(payload.timestamp);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
});

test('GET /api/search rejects invalid price filters', async () => {
  const server = app.listen(0);

  try {
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;

    const response = await fetch(
      `http://127.0.0.1:${port}/api/search?q=laptop&minPrice=500&maxPrice=100`,
    );

    assert.equal(response.status, 400);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
});

test('admin id validation rejects malformed ObjectIds', () => {
  assert.throws(() => assertValidObjectId('not-a-valid-id', 'user ID'));
});
