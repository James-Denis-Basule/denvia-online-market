import test from "node:test";
import assert from "node:assert/strict";

import { createRateLimiter } from "../middleware/securityMiddleware.js";

test("rate limiter blocks repeated requests from the same IP", () => {
  const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 2 });
  const req = {
    headers: {},
    socket: { remoteAddress: "127.0.0.1" },
    method: "GET",
    originalUrl: "/api/marketplace/orders",
  } as any;

  let callCount = 0;

  const res: any = {
    statusCode: 200,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.payload = payload;
      return this;
    },
  };

  for (let index = 0; index < 3; index += 1) {
    limiter(req, res, () => {
      callCount += 1;
    });
  }

  assert.equal(callCount, 2);
  assert.equal(res.statusCode, 429);
});
