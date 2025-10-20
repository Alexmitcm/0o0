"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_validator_1 = require("@hono/zod-validator");
const hono_1 = require("hono");
const zod_1 = require("zod");
const CoinController_1 = require("../controllers/CoinController");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const coinSecurity_1 = require("../middlewares/coinSecurity");
const rateLimiter_1 = require("../middlewares/rateLimiter");
const app = new hono_1.Hono();
// Validation schemas
const awardCoinsSchema = zod_1.z.object({
    amount: zod_1.z.number().int().positive(),
    coinType: zod_1.z.enum(["Experience", "Achievement", "Social", "Premium"]),
    description: zod_1.z.string().optional(),
    sourceId: zod_1.z.string().optional(),
    sourceMetadata: zod_1.z.record(zod_1.z.any()).optional(),
    sourceType: zod_1.z.enum([
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
const spendCoinsSchema = zod_1.z.object({
    amount: zod_1.z.number().int().positive(),
    coinType: zod_1.z.enum(["Experience", "Achievement", "Social", "Premium"]),
    description: zod_1.z.string().optional(),
    sourceId: zod_1.z.string().optional(),
    sourceMetadata: zod_1.z.record(zod_1.z.any()).optional(),
    sourceType: zod_1.z.enum([
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
app.get("/balance", rateLimiter_1.moderateRateLimit, authMiddleware_1.default, CoinController_1.getUserBalance);
/**
 * GET /coins/transactions
 * Get user's coin transaction history
 */
app.get("/transactions", rateLimiter_1.moderateRateLimit, authMiddleware_1.default, CoinController_1.getUserTransactions);
/**
 * GET /coins/history
 * Get user's coin earning history
 */
app.get("/history", rateLimiter_1.moderateRateLimit, authMiddleware_1.default, CoinController_1.getUserCoinHistory);
/**
 * GET /coins/history/:walletAddress
 * Get public user's coin earning history
 */
app.get("/history/:walletAddress", rateLimiter_1.moderateRateLimit, CoinController_1.getPublicUserCoinHistory);
/**
 * GET /coins/top
 * Get top users by coin balance
 */
app.get("/top", rateLimiter_1.moderateRateLimit, CoinController_1.getTopUsers);
/**
 * POST /coins/award
 * Award coins to user
 */
app.post("/award", rateLimiter_1.moderateRateLimit, authMiddleware_1.default, coinSecurity_1.coinRateLimit, coinSecurity_1.validateCoinOperation, coinSecurity_1.validateSourceType, coinSecurity_1.logCoinOperation, (0, zod_validator_1.zValidator)("json", awardCoinsSchema), CoinController_1.awardCoins);
/**
 * POST /coins/spend
 * Spend coins from user's balance
 */
app.post("/spend", rateLimiter_1.moderateRateLimit, authMiddleware_1.default, coinSecurity_1.coinRateLimit, coinSecurity_1.validateCoinOperation, coinSecurity_1.validateSourceType, coinSecurity_1.checkCoinBalance, coinSecurity_1.logCoinOperation, (0, zod_validator_1.zValidator)("json", spendCoinsSchema), CoinController_1.spendCoins);
exports.default = app;
