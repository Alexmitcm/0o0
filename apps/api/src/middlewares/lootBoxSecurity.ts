import type { Context, Next } from "hono";
import logger from "../utils/logger";

// Rate limiting for loot box operations
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// IP-based rate limiting
const IP_RATE_LIMIT = {
  maxRequests: 10, // Max 10 loot box operations per minute per IP
  windowMs: 60 * 1000 // 1 minute
};

// User-based rate limiting
const USER_RATE_LIMIT = {
  maxRequests: 5, // Max 5 loot box operations per minute per user
  windowMs: 60 * 1000 // 1 minute
};

export const lootBoxRateLimit = async (c: Context, next: Next) => {
  const ipAddress =
    c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";
  const walletAddress = c.get("walletAddress");

  const now = Date.now();

  // Check IP rate limit
  const ipKey = `ip:${ipAddress}`;
  const ipLimit = rateLimitMap.get(ipKey);

  if (ipLimit) {
    if (now < ipLimit.resetTime) {
      if (ipLimit.count >= IP_RATE_LIMIT.maxRequests) {
        logger.warn(`IP rate limit exceeded for ${ipAddress}`);
        return c.json(
          {
            error: {
              code: "RATE_LIMIT_EXCEEDED",
              message: "Too many requests from this IP address",
              timestamp: new Date().toISOString()
            },
            success: false
          },
          429
        );
      }
      ipLimit.count++;
    } else {
      rateLimitMap.set(ipKey, {
        count: 1,
        resetTime: now + IP_RATE_LIMIT.windowMs
      });
    }
  } else {
    rateLimitMap.set(ipKey, {
      count: 1,
      resetTime: now + IP_RATE_LIMIT.windowMs
    });
  }

  // Check user rate limit
  if (walletAddress) {
    const userKey = `user:${walletAddress}`;
    const userLimit = rateLimitMap.get(userKey);

    if (userLimit) {
      if (now < userLimit.resetTime) {
        if (userLimit.count >= USER_RATE_LIMIT.maxRequests) {
          logger.warn(`User rate limit exceeded for ${walletAddress}`);
          return c.json(
            {
              error: {
                code: "USER_RATE_LIMIT_EXCEEDED",
                message:
                  "Too many loot box operations. Please wait before trying again.",
                timestamp: new Date().toISOString()
              },
              success: false
            },
            429
          );
        }
        userLimit.count++;
      } else {
        rateLimitMap.set(userKey, {
          count: 1,
          resetTime: now + USER_RATE_LIMIT.windowMs
        });
      }
    } else {
      rateLimitMap.set(userKey, {
        count: 1,
        resetTime: now + USER_RATE_LIMIT.windowMs
      });
    }
  }

  await next();
};

// Validate loot box open requests
export const validateLootBoxOpen = async (c: Context, next: Next) => {
  const walletAddress = c.get("walletAddress");
  const body = await c.req.json();

  // Validate required fields
  if (!walletAddress) {
    return c.json(
      {
        error: {
          code: "AUTHENTICATION_REQUIRED",
          message: "Authentication required",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      401
    );
  }

  // Validate request body
  if (body.adData) {
    const { adWatched, adProvider, adPlacementId } = body.adData;

    if (adWatched && (!adProvider || !adPlacementId)) {
      return c.json(
        {
          error: {
            code: "INVALID_AD_DATA",
            message:
              "Ad provider and placement ID are required when ad is watched",
            timestamp: new Date().toISOString()
          },
          success: false
        },
        400
      );
    }
  }

  // Validate request info
  if (body.requestInfo) {
    const { sessionId } = body.requestInfo;

    if (!sessionId || typeof sessionId !== "string") {
      return c.json(
        {
          error: {
            code: "INVALID_SESSION",
            message: "Valid session ID is required",
            timestamp: new Date().toISOString()
          },
          success: false
        },
        400
      );
    }
  }

  await next();
};

// Anti-cheat protection
export const antiCheatProtection = async (c: Context, next: Next) => {
  const walletAddress = c.get("walletAddress");
  const ipAddress =
    c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";
  const userAgent = c.req.header("user-agent") || "unknown";

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /automated/i,
    /script/i
  ];

  if (suspiciousPatterns.some((pattern) => pattern.test(userAgent))) {
    logger.warn(
      `Suspicious user agent detected: ${userAgent} for wallet ${walletAddress}`
    );
    return c.json(
      {
        error: {
          code: "SUSPICIOUS_ACTIVITY",
          message: "Request blocked due to suspicious activity",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      403
    );
  }

  // Check for rapid requests from same IP
  const rapidRequestKey = `rapid:${ipAddress}`;
  const rapidRequests = rateLimitMap.get(rapidRequestKey);

  if (rapidRequests && rapidRequests.count > 20) {
    logger.warn(`Rapid requests detected from IP: ${ipAddress}`);
    return c.json(
      {
        error: {
          code: "RAPID_REQUESTS_DETECTED",
          message: "Too many rapid requests detected",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      429
    );
  }

  await next();
};

// Validate ad data integrity
export const validateAdData = async (c: Context, next: Next) => {
  const body = await c.req.json();

  if (body.adData) {
    const { adProvider, adPlacementId, adRewardId } = body.adData;

    // Validate ad provider
    const validProviders = ["google", "admob", "unity", "ironsource", "mock"];
    if (adProvider && !validProviders.includes(adProvider.toLowerCase())) {
      return c.json(
        {
          error: {
            code: "INVALID_AD_PROVIDER",
            message: "Invalid ad provider specified",
            timestamp: new Date().toISOString()
          },
          success: false
        },
        400
      );
    }

    // Validate placement ID format
    if (adPlacementId && !/^[a-zA-Z0-9_-]+$/.test(adPlacementId)) {
      return c.json(
        {
          error: {
            code: "INVALID_PLACEMENT_ID",
            message: "Invalid ad placement ID format",
            timestamp: new Date().toISOString()
          },
          success: false
        },
        400
      );
    }

    // Validate reward ID format
    if (adRewardId && !/^[a-zA-Z0-9_-]+$/.test(adRewardId)) {
      return c.json(
        {
          error: {
            code: "INVALID_REWARD_ID",
            message: "Invalid ad reward ID format",
            timestamp: new Date().toISOString()
          },
          success: false
        },
        400
      );
    }
  }

  await next();
};

// Clean up rate limit map periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // Clean up every minute

export default {
  antiCheatProtection,
  lootBoxRateLimit,
  validateAdData,
  validateLootBoxOpen
};
