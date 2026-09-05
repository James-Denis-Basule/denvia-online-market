import crypto from "node:crypto";

const REFERENCE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

export function generateOrderReference(): string {
  let suffix = "";

  for (let i = 0; i < 8; i += 1) {
    const index = crypto.randomInt(0, REFERENCE_CHARS.length);
    suffix += REFERENCE_CHARS[index];
  }

  return `DOM-${suffix}`;
}

export function generateGuestTrackingToken(): string {
  return crypto.randomBytes(24).toString("hex");
}
