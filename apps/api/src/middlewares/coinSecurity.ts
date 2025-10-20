import type { Context, Next } from "hono";
import prisma from "../prisma/client";
import logger from "../utils/logger";

/**
 * Rate limiting for coin operations
 */
export const coinRateLimit = async (c: Context, next: Next) => {
  const walletAddress = c.get("walletAddress");

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

  // Check recent coin operations for this user
  const recentOperations = await prisma.coinTransaction.count({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 60 * 1000) // Last minute
      },
      walletAddress
    }
  });

  // Allow max 10 coin operations per minute
  if (recentOperations >= 10) {
    logger.warn(`Coin rate limit exceeded for user: ${walletAddress}`);
    return c.json(
      {
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many coin operations. Please wait before trying again.",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      429
    );
  }

  await next();
};

/**
 * Validate coin amount and type
 */
export const validateCoinOperation = async (c: Context, next: Next) => {
  const body = await c.req.json();
  const { amount, coinType } = body;

  // Validate amount
  if (typeof amount !== "number" || amount <= 0 || amount > 1000000) {
    return c.json(
      {
        error: {
          code: "INVALID_AMOUNT",
          message: "Amount must be a positive number between 1 and 1,000,000",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      400
    );
  }

  // Validate coin type
  const validCoinTypes = ["Experience", "Achievement", "Social", "Premium"];
  if (!validCoinTypes.includes(coinType)) {
    return c.json(
      {
        error: {
          code: "INVALID_COIN_TYPE",
          message: "Invalid coin type",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      400
    );
  }

  await next();
};

/**
 * Validate source type for coin operations
 */
export const validateSourceType = async (c: Context, next: Next) => {
  const body = await c.req.json();
  const { sourceType } = body;

  const validSourceTypes = [
    "Registration",
    "Referral",
    "Quest",
    "Activity",
    "Social",
    "GamePlay",
    "Tournament",
    "Admin",
    "Bonus",
    "Achievement",
    "DailyLogin",
    "WeeklyChallenge",
    "MonthlyReward"
  ];

  if (!validSourceTypes.includes(sourceType)) {
    return c.json(
      {
        error: {
          code: "INVALID_SOURCE_TYPE",
          message: "Invalid source type",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      400
    );
  }

  await next();
};

/**
 * Check if user has sufficient coin balance
 */
export const checkCoinBalance = async (c: Context, next: Next) => {
  const walletAddress = c.get("walletAddress");
  const body = await c.req.json();
  const { coinType, amount } = body;

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

  // Get user's current balance
  const userBalance = await prisma.userCoinBalance.findUnique({
    where: { walletAddress }
  });

  if (!userBalance) {
    return c.json(
      {
        error: {
          code: "BALANCE_NOT_FOUND",
          message: "User balance not found",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      404
    );
  }

  const currentBalance = userBalance[
    `${coinType.toLowerCase()}Coins` as keyof typeof userBalance
  ] as number;

  if (currentBalance < amount) {
    return c.json(
      {
        error: {
          code: "INSUFFICIENT_BALANCE",
          message: "Insufficient coin balance",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      400
    );
  }

  await next();
};

/**
 * Log coin operations for audit trail
 */
export const logCoinOperation = async (c: Context, next: Next) => {
  const walletAddress = c.get("walletAddress");
  const method = c.req.method;
  const path = c.req.path;

  await next();

  // Log the operation
  logger.info(`Coin operation: ${method} ${path}`, {
    method,
    path,
    timestamp: new Date().toISOString(),
    walletAddress
  });
};

/**
 * Validate admin coin adjustments
 */
export const validateAdminCoinAdjustment = async (c: Context, next: Next) => {
  const body = await c.req.json();
  const { walletAddress, amount, reason } = body;

  // Validate wallet address format
  if (!walletAddress || walletAddress.length < 10) {
    return c.json(
      {
        error: {
          code: "INVALID_WALLET_ADDRESS",
          message: "Invalid wallet address",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      400
    );
  }

  // Validate amount
  if (typeof amount !== "number" || Math.abs(amount) > 1000000) {
    return c.json(
      {
        error: {
          code: "INVALID_AMOUNT",
          message: "Amount must be between -1,000,000 and 1,000,000",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      400
    );
  }

  // Validate reason
  if (!reason || reason.length < 5 || reason.length > 500) {
    return c.json(
      {
        error: {
          code: "INVALID_REASON",
          message: "Reason must be between 5 and 500 characters",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      400
    );
  }

  await next();
};
