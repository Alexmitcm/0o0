"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_validator_1 = require("@hono/zod-validator");
const hono_1 = require("hono");
const zod_1 = require("zod");
const LeaderboardController_1 = require("../controllers/LeaderboardController");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const rateLimiter_1 = require("../middlewares/rateLimiter");
const app = new hono_1.Hono();
// Validation schemas
const leaderboardQuerySchema = zod_1.z.object({
    limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
    offset: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
    period: zod_1.z.enum(["Daily", "Weekly", "Monthly", "AllTime"]).optional(),
    type: zod_1.z
        .enum(["FreeToEarn", "PlayToEarn", "AllTime", "Weekly", "Monthly"])
        .optional()
});
/**
 * GET /leaderboard
 * Get leaderboard with user rank (authenticated)
 */
app.get("/", rateLimiter_1.moderateRateLimit, authMiddleware_1.default, (0, zod_validator_1.zValidator)("query", leaderboardQuerySchema), LeaderboardController_1.getLeaderboard);
/**
 * GET /leaderboard/public
 * Get public leaderboard (no authentication required)
 */
app.get("/public", rateLimiter_1.moderateRateLimit, (0, zod_validator_1.zValidator)("query", leaderboardQuerySchema), LeaderboardController_1.getPublicLeaderboard);
/**
 * GET /leaderboard/history
 * Get user's leaderboard history
 */
app.get("/history", rateLimiter_1.moderateRateLimit, authMiddleware_1.default, LeaderboardController_1.getUserLeaderboardHistory);
/**
 * GET /leaderboard/stats
 * Get leaderboard statistics
 */
app.get("/stats", rateLimiter_1.moderateRateLimit, LeaderboardController_1.getLeaderboardStats);
exports.default = app;
