import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      throw new AppError(
        'Authentication required',
        401,
      );
    }

    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new AppError(
        'Invalid authorization header',
        401,
      );
    }

    const payload = verifyAccessToken(token);

    req.user = {
      userId: payload.userId,
      role: payload.role,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    next(
      new AppError(
        'Invalid or expired access token',
        401,
      ),
    );
  }
}

/**
 * Like `authenticate`, but never rejects the request. If a valid
 * Bearer token is present, `req.user` is populated exactly as
 * `authenticate` would. If no token, an invalid token, or an expired
 * token is present, the request simply proceeds as a guest
 * (`req.user` stays undefined). Used on routes that must support both
 * authenticated and guest access — e.g. order creation.
 */
export function optionalAuthenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      next();
      return;
    }

    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      next();
      return;
    }

    const payload = verifyAccessToken(token);

    req.user = {
      userId: payload.userId,
      role: payload.role,
    };

    next();
  } catch {
    // Invalid/expired token on a guest-accessible route: proceed as
    // a guest rather than blocking the request.
    next();
  }
}