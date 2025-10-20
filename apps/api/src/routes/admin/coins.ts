import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import {
  adjustUserCoins,
  deactivateOldLeaderboards,
  getCoinSystemStats,
  getCoinTransactions,
  getUserCoinDetails,
  refreshLeaderboard
} from "../../controllers/AdminCoinController";
import { validateAdminCoinAdjustment } from "../../middlewares/coinSecurity";
import { moderateRateLimit } from "../../middlewares/rateLimiter";
import { adminOnly } from "../../middlewares/security";

const app = new Hono();

// Apply admin authentication to all routes
app.use("*", adminOnly);

// Validation schemas
const adjustCoinsSchema = z.object({
  amount: z.number().int(),
  coinType: z.enum(["Experience", "Achievement", "Social", "Premium"]),
  reason: z.string().min(1),
  walletAddress: z.string().min(1)
});

const refreshLeaderboardSchema = z.object({
  period: z.enum(["Daily", "Weekly", "Monthly", "AllTime"]),
  type: z.enum(["FreeToEarn", "PlayToEarn", "AllTime", "Weekly", "Monthly"])
});

/**
 * GET /admin/coins/stats
 * Get coin system statistics
 */
app.get("/stats", moderateRateLimit, getCoinSystemStats);

/**
 * GET /admin/coins/user/:walletAddress
 * Get detailed coin information for a specific user
 */
app.get("/user/:walletAddress", moderateRateLimit, getUserCoinDetails);

/**
 * POST /admin/coins/adjust
 * Adjust user's coin balance (admin only)
 */
app.post(
  "/adjust",
  moderateRateLimit,
  validateAdminCoinAdjustment,
  zValidator("json", adjustCoinsSchema),
  adjustUserCoins
);

/**
 * GET /admin/coins/transactions
 * Get coin transactions with filters
 */
app.get("/transactions", moderateRateLimit, getCoinTransactions);

/**
 * POST /admin/coins/leaderboard/refresh
 * Force refresh a leaderboard
 */
app.post(
  "/leaderboard/refresh",
  moderateRateLimit,
  zValidator("json", refreshLeaderboardSchema),
  refreshLeaderboard
);

/**
 * POST /admin/coins/leaderboard/deactivate-old
 * Deactivate old leaderboards
 */
app.post(
  "/leaderboard/deactivate-old",
  moderateRateLimit,
  deactivateOldLeaderboards
);

export default app;
