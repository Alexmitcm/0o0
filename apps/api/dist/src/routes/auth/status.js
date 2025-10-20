"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("@hey/helpers/logger"));
const hono_1 = require("hono");
const client_1 = __importDefault(require("../../prisma/client"));
const address_1 = require("../../utils/address");
const status = new hono_1.Hono();
/**
 * POST /api/auth/status
 * Get user status (Standard or Premium)
 */
status.post("/", async (c) => {
    try {
        const body = await c.req.json();
        const { walletAddress } = body;
        if (!walletAddress) {
            return c.json({
                error: "Wallet address is required",
                success: false
            }, 400);
        }
        const normalizedAddress = (0, address_1.normalizeAddress)(walletAddress);
        logger_1.default.info(`Status check for wallet: ${normalizedAddress}`);
        // Check if user exists in database
        const user = await client_1.default.user.findUnique({
            select: {
                linkedProfileId: true,
                status: true
            },
            where: { walletAddress: normalizedAddress }
        });
        if (!user) {
            // User doesn't exist, return Standard status
            return c.json({
                isPremium: false,
                linkedProfileId: null,
                status: "Standard",
                success: true
            });
        }
        return c.json({
            isPremium: user.status === "Premium",
            linkedProfileId: user.linkedProfileId,
            status: user.status,
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error in status endpoint:", error);
        const errorMessage = error instanceof Error ? error.message : "Status check failed";
        return c.json({
            error: errorMessage,
            success: false
        }, 500);
    }
});
exports.default = status;
