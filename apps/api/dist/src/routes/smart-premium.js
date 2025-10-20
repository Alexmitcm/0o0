"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("@hey/helpers/logger"));
const hono_1 = require("hono");
const zod_1 = require("zod");
const SmartPremiumService_1 = __importDefault(require("../services/SmartPremiumService"));
const smartPremium = new hono_1.Hono();
// Validation schemas
const smartLinkSchema = zod_1.z.object({
    familyWalletAddress: zod_1.z
        .string()
        .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Family Wallet address"),
    lensProfileId: zod_1.z.string().min(1, "Lens Profile ID is required"),
    metaMaskAddress: zod_1.z
        .string()
        .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid MetaMask address")
});
/**
 * GET /api/smart-premium/status
 * بررسی هوشمند وضعیت پرمیوم
 */
smartPremium.get("/status", async (c) => {
    try {
        const metaMaskAddress = c.req.query("metaMaskAddress");
        if (!metaMaskAddress) {
            return c.json({
                error: "MetaMask address is required",
                success: false
            }, 400);
        }
        const status = await SmartPremiumService_1.default.checkSmartPremiumStatus(metaMaskAddress);
        return c.json({
            success: true,
            ...status
        });
    }
    catch (error) {
        logger_1.default.error("Error checking smart premium status:", error);
        return c.json({
            error: "Failed to check premium status",
            success: false
        }, 500);
    }
});
/**
 * POST /api/smart-premium/link
 * اتصال هوشمند کیف پول‌ها
 */
smartPremium.post("/link", async (c) => {
    try {
        const body = await c.req.json();
        const validationResult = smartLinkSchema.safeParse(body);
        if (!validationResult.success) {
            return c.json({
                details: validationResult.error.errors,
                error: "Invalid request data",
                success: false
            }, 400);
        }
        const { metaMaskAddress, familyWalletAddress, lensProfileId } = validationResult.data;
        const result = await SmartPremiumService_1.default.smartLinkWallets(metaMaskAddress, familyWalletAddress, lensProfileId);
        return c.json(result);
    }
    catch (error) {
        logger_1.default.error("Error in smart wallet linking:", error);
        return c.json({
            error: error instanceof Error ? error.message : "Failed to link wallets",
            success: false
        }, 500);
    }
});
/**
 * GET /api/smart-premium/user-status
 * دریافت وضعیت کامل کاربر
 */
smartPremium.get("/user-status", async (c) => {
    try {
        const metaMaskAddress = c.req.query("metaMaskAddress");
        if (!metaMaskAddress) {
            return c.json({
                error: "MetaMask address is required",
                success: false
            }, 400);
        }
        const status = await SmartPremiumService_1.default.getUserSmartStatus(metaMaskAddress);
        return c.json({
            success: true,
            ...status
        });
    }
    catch (error) {
        logger_1.default.error("Error getting user smart status:", error);
        return c.json({
            error: "Failed to get user status",
            success: false
        }, 500);
    }
});
exports.default = smartPremium;
