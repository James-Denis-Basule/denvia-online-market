import crypto from "node:crypto";

const VERIFICATION_TOKEN_BYTES = 32;

export const EMAIL_VERIFICATION_EXPIRATION_MS =
  24 * 60 * 60 * 1000;

export function generateEmailVerificationToken(): string {
  return crypto.randomBytes(VERIFICATION_TOKEN_BYTES).toString("hex");
}

export function hashEmailVerificationToken(token: string): string {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

export function getEmailVerificationExpiration(): Date {
  return new Date(
    Date.now() + EMAIL_VERIFICATION_EXPIRATION_MS,
  );
}
