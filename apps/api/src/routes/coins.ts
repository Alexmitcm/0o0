import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import {
  awardCoins,
  getPublicUserCoinHistory,
  getTopUsers,
  getUserBalance,
  getUserCoinHistory,
  getUserTransactions,
  spendCoins
} from "../controllers/CoinController";
import authMiddleware from "../middlewares/authMiddleware";
import {
  checkCoinBalance,
  coinRateLimit,
  logCoinOperation,
  validateCoinOperation,
  validateSourceType
} from "../middlewares/coinSecurity";
import { moderateRateLimit } from "../middlewares/rateLimiter";

const app = new Hono();

// Validation schemas
const awardCoinsSchema = z.object({
  amount: z.number().int().positive(),
  coinType: z.enum(["Experience", "Achievement", "Social", "Premium"]),
  description: z.string().optional(),
  sourceId: z.string().optional(),
  sourceMetadata: z.record(z.any()).optional(),
  sourceType: z.enum([
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
  ])
});

const spendCoinsSchema = z.object({
  amount: z.number().int().positive(),
  coinType: z.enum(["Experience", "Achievement", "Social", "Premium"]),
  description: z.string().optional(),
  sourceId: z.string().optional(),
  sourceMetadata: z.record(z.any()).optional(),
  sourceType: z.enum([
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
  ])
});

/**
 * GET /coins/balance
 * Get user's coin balance
 */
app.get("/balance", moderateRateLimit, authMiddleware, getUserBalance);

/**
 * GET /coins/transactions
 * Get user's coin transaction history
 */
app.get(
  "/transactions",
  moderateRateLimit,
  authMiddleware,
  getUserTransactions
);

/**
 * GET /coins/history
 * Get user's coin earning history
 */
app.get("/history", moderateRateLimit, authMiddleware, getUserCoinHistory);

/**
 * GET /coins/history/:walletAddress
 * Get public user's coin earning history
 */
app.get("/history/:walletAddress", moderateRateLimit, getPublicUserCoinHistory);

/**
 * GET /coins/top
 * Get top users by coin balance
 */
app.get("/top", moderateRateLimit, getTopUsers);

/**
 * POST /coins/award
 * Award coins to user
 */
app.post(
  "/award",
  moderateRateLimit,
  authMiddleware,
  coinRateLimit,
  validateCoinOperation,
  validateSourceType,
  logCoinOperation,
  zValidator("json", awardCoinsSchema),
  awardCoins
);

/**
 * POST /coins/spend
 * Spend coins from user's balance
 */
app.post(
  "/spend",
  moderateRateLimit,
  authMiddleware,
  coinRateLimit,
  validateCoinOperation,
  validateSourceType,
  checkCoinBalance,
  logCoinOperation,
  zValidator("json", spendCoinsSchema),
  spendCoins
);

export default app;
