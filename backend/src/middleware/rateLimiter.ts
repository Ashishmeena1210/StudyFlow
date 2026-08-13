import { Request, Response, NextFunction } from "express";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const userRateLimits = new Map<string, RateLimitRecord>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const MAX_REQUESTS = 10; // 10 requests per window

export function aiRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const userId = req.user?.id || req.ip || "anonymous";
  const now = Date.now();

  const userRecord = userRateLimits.get(userId);

  if (!userRecord || now > userRecord.resetTime) {
    userRateLimits.set(userId, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
    next();
    return;
  }

  if (userRecord.count >= MAX_REQUESTS) {
    const retryAfterSecs = Math.ceil((userRecord.resetTime - now) / 1000);
    res.status(429).json({
      error: "Too Many Requests",
      message: `AI resource suggestion rate limit exceeded. Please wait ${retryAfterSecs} seconds before trying again.`,
    });
    return;
  }

  userRecord.count += 1;
  next();
}
