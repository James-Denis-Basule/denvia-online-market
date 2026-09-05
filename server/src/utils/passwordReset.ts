import crypto from "node:crypto";

const RESET_TOKEN_BYTES = 32;

/**
 * Password reset links are shorter-lived than email verification links
 * (1 hour vs 24 hours), since a reset link grants account takeover if
 * intercepted and is expected to be used right after it's requested.
 */
export const PASSWORD_RESET_EXPIRATION_MS = 60 * 60 * 1000;

export function generatePasswordResetToken(): string {
  return crypto.randomBytes(RESET_TOKEN_BYTES).toString("hex");
}

export function hashPasswordResetToken(token: string): string {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

export function getPasswordResetExpiration(): Date {
  return new Date(Date.now() + PASSWORD_RESET_EXPIRATION_MS);
}
