"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_validator_1 = require("@hono/zod-validator");
const hono_1 = require("hono");
const zod_1 = require("zod");
const AdminCoinController_1 = require("../../controllers/AdminCoinController");
const coinSecurity_1 = require("../../middlewares/coinSecurity");
const rateLimiter_1 = require("../../middlewares/rateLimiter");
const security_1 = require("../../middlewares/security");
const app = new hono_1.Hono();
// Apply admin authentication to all routes
app.use("*", security_1.adminOnly);
// Validation schemas
const adjustCoinsSchema = zod_1.z.object({
    amount: zod_1.z.number().int(),
    coinType: zod_1.z.enum(["Experience", "Achievement", "Social", "Premium"]),
    reason: zod_1.z.string().min(1),
    walletAddress: zod_1.z.string().min(1)
});
const refreshLeaderboardSchema = zod_1.z.object({
    period: zod_1.z.enum(["Daily", "Weekly", "Monthly", "AllTime"]),
    type: zod_1.z.enum(["FreeToEarn", "PlayToEarn", "AllTime", "Weekly", "Monthly"])
});
/**
 * GET /admin/coins/stats
 * Get coin system statistics
 */
app.get("/stats", rateLimiter_1.moderateRateLimit, AdminCoinController_1.getCoinSystemStats);
/**
 * GET /admin/coins/user/:walletAddress
 * Get detailed coin information for a specific user
 */
app.get("/user/:walletAddress", rateLimiter_1.moderateRateLimit, AdminCoinController_1.getUserCoinDetails);
/**
 * POST /admin/coins/adjust
 * Adjust user's coin balance (admin only)
 */
app.post("/adjust", rateLimiter_1.moderateRateLimit, coinSecurity_1.validateAdminCoinAdjustment, (0, zod_validator_1.zValidator)("json", adjustCoinsSchema), AdminCoinController_1.adjustUserCoins);
/**
 * GET /admin/coins/transactions
 * Get coin transactions with filters
 */
app.get("/transactions", rateLimiter_1.moderateRateLimit, AdminCoinController_1.getCoinTransactions);
/**
 * POST /admin/coins/leaderboard/refresh
 * Force refresh a leaderboard
 */
app.post("/leaderboard/refresh", rateLimiter_1.moderateRateLimit, (0, zod_validator_1.zValidator)("json", refreshLeaderboardSchema), AdminCoinController_1.refreshLeaderboard);
/**
 * POST /admin/coins/leaderboard/deactivate-old
 * Deactivate old leaderboards
 */
app.post("/leaderboard/deactivate-old", rateLimiter_1.moderateRateLimit, AdminCoinController_1.deactivateOldLeaderboards);
exports.default = app;
