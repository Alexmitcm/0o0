"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.spendCoins = exports.awardCoins = exports.getTopUsers = exports.getPublicUserCoinHistory = exports.getUserCoinHistory = exports.getUserTransactions = exports.getUserBalance = void 0;
const CoinService_1 = require("../services/CoinService");
const logger_1 = __importDefault(require("../utils/logger"));
const getUserBalance = async (c) => {
    try {
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
        const balance = await CoinService_1.CoinService.getUserBalance(walletAddress);
        if (!balance) {
            // Initialize balance if not exists
            await CoinService_1.CoinService.initializeUserBalance(walletAddress);
            const newBalance = await CoinService_1.CoinService.getUserBalance(walletAddress);
            return c.json({
                data: newBalance,
                success: true
            });
        }
        return c.json({
            data: balance,
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error getting user balance:", error);
        return c.json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to get user balance",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 500);
    }
};
exports.getUserBalance = getUserBalance;
const getUserTransactions = async (c) => {
    try {
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
        const limit = Number.parseInt(c.req.query("limit") || "50");
        const offset = Number.parseInt(c.req.query("offset") || "0");
        const coinType = c.req.query("coinType");
        const transactions = await CoinService_1.CoinService.getUserTransactions(walletAddress, limit, offset, coinType);
        return c.json({
            data: transactions,
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error getting user transactions:", error);
        return c.json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to get user transactions",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 500);
    }
};
exports.getUserTransactions = getUserTransactions;
const getUserCoinHistory = async (c) => {
    try {
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
        const limit = Number.parseInt(c.req.query("limit") || "50");
        const offset = Number.parseInt(c.req.query("offset") || "0");
        const history = await CoinService_1.CoinService.getUserCoinHistory(walletAddress, limit, offset);
        return c.json({
            data: history,
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error getting user coin history:", error);
        return c.json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to get user coin history",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 500);
    }
};
exports.getUserCoinHistory = getUserCoinHistory;
const getPublicUserCoinHistory = async (c) => {
    try {
        const walletAddress = c.req.param("walletAddress");
        if (!walletAddress) {
            return c.json({
                error: {
                    code: "INVALID_PARAMETERS",
                    message: "Wallet address is required",
                    timestamp: new Date().toISOString()
                },
                success: false
            }, 400);
        }
        const limit = Number.parseInt(c.req.query("limit") || "50");
        const offset = Number.parseInt(c.req.query("offset") || "0");
        const history = await CoinService_1.CoinService.getUserCoinHistory(walletAddress, limit, offset);
        return c.json({
            data: history,
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error getting public user coin history:", error);
        return c.json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to get user coin history",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 500);
    }
};
exports.getPublicUserCoinHistory = getPublicUserCoinHistory;
const getTopUsers = async (c) => {
    try {
        const limit = Number.parseInt(c.req.query("limit") || "100");
        const coinType = c.req.query("coinType");
        const topUsers = await CoinService_1.CoinService.getTopUsersByCoins(limit, coinType);
        return c.json({
            data: topUsers,
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error getting top users:", error);
        return c.json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to get top users",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 500);
    }
};
exports.getTopUsers = getTopUsers;
const awardCoins = async (c) => {
    try {
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
        const body = await c.req.json();
        const { coinType, amount, sourceType, sourceId, sourceMetadata, description } = body;
        if (!coinType || !amount || !sourceType) {
            return c.json({
                error: {
                    code: "INVALID_PARAMETERS",
                    message: "coinType, amount, and sourceType are required",
                    timestamp: new Date().toISOString()
                },
                success: false
            }, 400);
        }
        const success = await CoinService_1.CoinService.awardCoins({
            amount,
            coinType,
            description,
            sourceId,
            sourceMetadata,
            sourceType,
            walletAddress
        });
        if (success) {
            return c.json({
                data: { success: true },
                success: true
            });
        }
        return c.json({
            error: {
                code: "OPERATION_FAILED",
                message: "Failed to award coins",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 500);
    }
    catch (error) {
        logger_1.default.error("Error awarding coins:", error);
        return c.json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to award coins",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 500);
    }
};
exports.awardCoins = awardCoins;
const spendCoins = async (c) => {
    try {
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
        const body = await c.req.json();
        const { coinType, amount, sourceType, sourceId, sourceMetadata, description } = body;
        if (!coinType || !amount || !sourceType) {
            return c.json({
                error: {
                    code: "INVALID_PARAMETERS",
                    message: "coinType, amount, and sourceType are required",
                    timestamp: new Date().toISOString()
                },
                success: false
            }, 400);
        }
        const success = await CoinService_1.CoinService.spendCoins(walletAddress, coinType, amount, sourceType, sourceId, sourceMetadata, description);
        if (success) {
            return c.json({
                data: { success: true },
                success: true
            });
        }
        return c.json({
            error: {
                code: "OPERATION_FAILED",
                message: "Failed to spend coins",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 500);
    }
    catch (error) {
        logger_1.default.error("Error spending coins:", error);
        return c.json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to spend coins",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 500);
    }
};
exports.spendCoins = spendCoins;
