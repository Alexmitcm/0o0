import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import {
  getLeaderboard,
  getLeaderboardStats,
  getPublicLeaderboard,
  getUserLeaderboardHistory
} from "../controllers/LeaderboardController";
import authMiddleware from "../middlewares/authMiddleware";
import { moderateRateLimit } from "../middlewares/rateLimiter";

const app = new Hono();

// Validation schemas
const leaderboardQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
  period: z.enum(["Daily", "Weekly", "Monthly", "AllTime"]).optional(),
  type: z
    .enum(["FreeToEarn", "PlayToEarn", "AllTime", "Weekly", "Monthly"])
    .optional()
});

/**
 * GET /leaderboard
 * Get leaderboard with user rank (authenticated)
 */
app.get(
  "/",
  moderateRateLimit,
  authMiddleware,
  zValidator("query", leaderboardQuerySchema),
  getLeaderboard
);

/**
 * GET /leaderboard/public
 * Get public leaderboard (no authentication required)
 */
app.get(
  "/public",
  moderateRateLimit,
  zValidator("query", leaderboardQuerySchema),
  getPublicLeaderboard
);

/**
 * GET /leaderboard/history
 * Get user's leaderboard history
 */
app.get(
  "/history",
  moderateRateLimit,
  authMiddleware,
  getUserLeaderboardHistory
);

/**
 * GET /leaderboard/stats
 * Get leaderboard statistics
 */
app.get("/stats", moderateRateLimit, getLeaderboardStats);

export default app;
