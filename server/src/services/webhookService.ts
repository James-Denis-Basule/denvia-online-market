import crypto from "node:crypto";

import { AppError } from "../utils/AppError.js";

export function verifyWebhookSignature(payload: string, signature: string | undefined, secret: string) {
  if (!signature) {
    throw new AppError("Missing webhook signature", 401);
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
    throw new AppError("Invalid webhook signature", 401);
  }

  return true;
}

export function buildWebhookResponse(status: string, message: string) {
  return {
    success: status === "ok",
    message,
  };
}
