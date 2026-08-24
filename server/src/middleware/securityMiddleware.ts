import type { NextFunction, Request, Response } from "express";

const requestLogState = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }

  if (Array.isArray(forwarded)) {
    return forwarded[0]?.trim() || req.socket.remoteAddress || "unknown";
  }

  return req.socket.remoteAddress || "unknown";
}

export function createRateLimiter({
  windowMs = 60_000,
  maxRequests = 120,
}: {
  windowMs?: number;
  maxRequests?: number;
} = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = getClientIp(req);
    const now = Date.now();
    const state = requestLogState.get(ip) ?? { count: 0, resetAt: now + windowMs };

    if (now > state.resetAt) {
      state.count = 0;
      state.resetAt = now + windowMs;
    }

    state.count += 1;
    requestLogState.set(ip, state);

    if (state.count > maxRequests) {
      res.status(429).json({
        success: false,
        message: "Too many requests. Please slow down and try again shortly.",
      });
      return;
    }

    next();
  };
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startedAt = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startedAt;
    console.info(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });

  next();
}
