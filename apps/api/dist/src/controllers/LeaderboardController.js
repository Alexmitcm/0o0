"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicLeaderboard = exports.getLeaderboardStats = exports.getUserLeaderboardHistory = exports.getLeaderboard = void 0;
const LeaderboardService_1 = require("../services/LeaderboardService");
const logger_1 = __importDefault(require("../utils/logger"));
const getLeaderboard = async (c) => {
    try {
        const type = c.req.query("type") || "AllTime";
        const period = c.req.query("period") || "AllTime";
        const userWalletAddress = c.get("walletAddress");
        const leaderboard = userWalletAddress
            ? await LeaderboardService_1.LeaderboardService.getLeaderboardWithUserRank(type, period, userWalletAddress)
            : await LeaderboardService_1.LeaderboardService.getOrCreateLeaderboard(type, period);
        return c.json({
            data: leaderboard,
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error getting leaderboard:", error);
        return c.json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to get leaderboard",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 500);
    }
};
exports.getLeaderboard = getLeaderboard;
const getUserLeaderboardHistory = async (c) => {
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
        const limit = Number.parseInt(c.req.query("limit") || "10");
        const history = await LeaderboardService_1.LeaderboardService.getUserLeaderboardHistory(walletAddress, limit);
        return c.json({
            data: history,
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error getting user leaderboard history:", error);
        return c.json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to get user leaderboard history",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 500);
    }
};
exports.getUserLeaderboardHistory = getUserLeaderboardHistory;
const getLeaderboardStats = async (c) => {
    try {
        const stats = await LeaderboardService_1.LeaderboardService.getLeaderboardStats();
        return c.json({
            data: stats,
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error getting leaderboard stats:", error);
        return c.json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to get leaderboard stats",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 500);
    }
};
exports.getLeaderboardStats = getLeaderboardStats;
const getPublicLeaderboard = async (c) => {
    try {
        const type = c.req.query("type") || "AllTime";
        const period = c.req.query("period") || "AllTime";
        const leaderboard = await LeaderboardService_1.LeaderboardService.getOrCreateLeaderboard(type, period);
        return c.json({
            data: leaderboard,
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error getting public leaderboard:", error);
        return c.json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to get leaderboard",
                timestamp: new Date().toISOString()
            },
            success: false
        }, 500);
    }
};
exports.getPublicLeaderboard = getPublicLeaderboard;
