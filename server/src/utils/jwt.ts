import jwt from 'jsonwebtoken';
import authConfig from '../config/auth.js';

export interface AccessTokenPayload {
  userId: string;
  role: string;
  activeAccountType?: "customer" | "business";
}

export function generateAccessToken(
  payload: AccessTokenPayload,
): string {
  return jwt.sign(
    payload,
    authConfig.accessTokenSecret,
    {
      expiresIn: authConfig.accessTokenExpiresIn,
    },
  );
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId },
    authConfig.refreshTokenSecret,
    {
      expiresIn: authConfig.refreshTokenExpiresIn,
    },
  );
}

export function verifyAccessToken(token: string) {
  return jwt.verify(
    token,
    authConfig.accessTokenSecret,
  ) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(
    token,
    authConfig.refreshTokenSecret,
  ) as { userId: string };
}