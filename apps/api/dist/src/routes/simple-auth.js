"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("@hey/helpers/logger"));
const hono_1 = require("hono");
const zod_1 = require("zod");
const SimpleAuthService_1 = __importDefault(require("../services/SimpleAuthService"));
const simpleAuth = new hono_1.Hono();
// Simple validation schema
const loginSchema = zod_1.z.object({
    profileId: zod_1.z.string().min(1, "Profile ID is required"),
    walletAddress: zod_1.z
        .string()
        .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address")
});
/**
 * POST /api/simple-auth/login
 * Ultra-simple login endpoint
 */
simpleAuth.post("/login", async (c) => {
    try {
        const body = await c.req.json();
        const validationResult = loginSchema.safeParse(body);
        if (!validationResult.success) {
            return c.json({
                details: validationResult.error.errors,
                error: "Invalid request data",
                success: false
            }, 400);
        }
        const result = await SimpleAuthService_1.default.login(validationResult.data);
        return c.json(result);
    }
    catch (error) {
        logger_1.default.error("Simple auth login error:", error);
        return c.json({
            error: error instanceof Error ? error.message : "Login failed",
            success: false
        }, 500);
    }
});
/**
 * GET /api/simple-auth/status
 * Get user premium status
 */
simpleAuth.get("/status", async (c) => {
    try {
        const walletAddress = c.req.query("walletAddress");
        if (!walletAddress) {
            return c.json({
                error: "Wallet address is required",
                success: false
            }, 400);
        }
        const status = await SimpleAuthService_1.default.getUserStatus(walletAddress);
        return c.json({
            success: true,
            ...status
        });
    }
    catch (error) {
        logger_1.default.error("Simple auth status error:", error);
        return c.json({
            error: "Failed to get status",
            success: false
        }, 500);
    }
});
/**
 * POST /api/simple-auth/validate
 * Validate JWT token
 */
simpleAuth.post("/validate", async (c) => {
    try {
        const body = await c.req.json();
        const { token } = body;
        if (!token) {
            return c.json({
                error: "Token is required",
                success: false
            }, 400);
        }
        const payload = await SimpleAuthService_1.default.validateToken(token);
        if (!payload) {
            return c.json({
                error: "Invalid token",
                success: false
            }, 401);
        }
        return c.json({
            success: true,
            user: payload
        });
    }
    catch (error) {
        logger_1.default.error("Simple auth validate error:", error);
        return c.json({
            error: "Token validation failed",
            success: false
        }, 500);
    }
});
exports.default = simpleAuth;
