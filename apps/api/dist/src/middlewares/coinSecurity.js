"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAdminCoinAdjustment = exports.logCoinOperation = exports.checkCoinBalance = exports.validateSourceType = exports.validateCoinOperation = exports.coinRateLimit = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Rate limiting for coin operations
 */
const coinRateLimit = async (c, next) => {
    const walletAddress = c.get("walletAddress");
    if (!walletAddress) {
        return c.json({
            error: {
                code: "AUTHENTICATION_REQUIRED",
                message: "Authentication required",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 401);
    }
    // Check recent coin operations for this user
    const recentOperations = await client_1.default.coinTransaction.count({
        where: {
            createdAt: {
                gte: new Date(Date.now() - 60 * 1000) // Last minute
            },
            walletAddress
        }
    });
    // Allow max 10 coin operations per minute
    if (recentOperations >= 10) {
        logger_1.default.warn(`Coin rate limit exceeded for user: ${walletAddress}`);
        return c.json({
            error: {
                code: "RATE_LIMIT_EXCEEDED",
                message: "Too many coin operations. Please wait before trying again.",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 429);
    }
    await next();
};
exports.coinRateLimit = coinRateLimit;
/**
 * Validate coin amount and type
 */
const validateCoinOperation = async (c, next) => {
    const body = await c.req.json();
    const { amount, coinType } = body;
    // Validate amount
    if (typeof amount !== "number" || amount <= 0 || amount > 1000000) {
        return c.json({
            error: {
                code: "INVALID_AMOUNT",
                message: "Amount must be a positive number between 1 and 1,000,000",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 400);
    }
    // Validate coin type
    const validCoinTypes = ["Experience", "Achievement", "Social", "Premium"];
    if (!validCoinTypes.includes(coinType)) {
        return c.json({
            error: {
                code: "INVALID_COIN_TYPE",
                message: "Invalid coin type",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 400);
    }
    await next();
};
exports.validateCoinOperation = validateCoinOperation;
/**
 * Validate source type for coin operations
 */
const validateSourceType = async (c, next) => {
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
        return c.json({
            error: {
                code: "INVALID_SOURCE_TYPE",
                message: "Invalid source type",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 400);
    }
    await next();
};
exports.validateSourceType = validateSourceType;
/**
 * Check if user has sufficient coin balance
 */
const checkCoinBalance = async (c, next) => {
    const walletAddress = c.get("walletAddress");
    const body = await c.req.json();
    const { coinType, amount } = body;
    if (!walletAddress) {
        return c.json({
            error: {
                code: "AUTHENTICATION_REQUIRED",
                message: "Authentication required",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 401);
    }
    // Get user's current balance
    const userBalance = await client_1.default.userCoinBalance.findUnique({
        where: { walletAddress }
    });
    if (!userBalance) {
        return c.json({
            error: {
                code: "BALANCE_NOT_FOUND",
                message: "User balance not found",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 404);
    }
    const currentBalance = userBalance[`${coinType.toLowerCase()}Coins`];
    if (currentBalance < amount) {
        return c.json({
            error: {
                code: "INSUFFICIENT_BALANCE",
                message: "Insufficient coin balance",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 400);
    }
    await next();
};
exports.checkCoinBalance = checkCoinBalance;
/**
 * Log coin operations for audit trail
 */
const logCoinOperation = async (c, next) => {
    const walletAddress = c.get("walletAddress");
    const method = c.req.method;
    const path = c.req.path;
    await next();
    // Log the operation
    logger_1.default.info(`Coin operation: ${method} ${path}`, {
        method,
        path,
        timestamp: new Date().toISOString(),
        walletAddress
    });
};
exports.logCoinOperation = logCoinOperation;
/**
 * Validate admin coin adjustments
 */
const validateAdminCoinAdjustment = async (c, next) => {
    const body = await c.req.json();
    const { walletAddress, amount, reason } = body;
    // Validate wallet address format
    if (!walletAddress || walletAddress.length < 10) {
        return c.json({
            error: {
                code: "INVALID_WALLET_ADDRESS",
                message: "Invalid wallet address",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 400);
    }
    // Validate amount
    if (typeof amount !== "number" || Math.abs(amount) > 1000000) {
        return c.json({
            error: {
                code: "INVALID_AMOUNT",
                message: "Amount must be between -1,000,000 and 1,000,000",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 400);
    }
    // Validate reason
    if (!reason || reason.length < 5 || reason.length > 500) {
        return c.json({
            error: {
                code: "INVALID_REASON",
                message: "Reason must be between 5 and 500 characters",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 400);
    }
    await next();
};
exports.validateAdminCoinAdjustment = validateAdminCoinAdjustment;
