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