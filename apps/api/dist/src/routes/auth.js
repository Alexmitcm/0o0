"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("@hey/helpers/logger"));
const hono_1 = require("hono");
const zod_1 = require("zod");
const rateLimiter_1 = require("@/middlewares/rateLimiter");
const AuthService_1 = __importDefault(require("../services/AuthService"));
const JwtService_1 = __importDefault(require("../services/JwtService"));
const status_1 = __importDefault(require("./auth/status"));
const auth = new hono_1.Hono();
// Validation schemas
const loginSchema = zod_1.z.object({
    selectedProfileId: zod_1.z.string().min(1, "Profile ID is required"),
    walletAddress: zod_1.z
        .string()
        .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address format")
});
const syncLensSchema = zod_1.z.object({
    lensAccessToken: zod_1.z.string().min(1, "Lens access token is required"),
    selectedProfileId: zod_1.z.string().optional()
});
const profileUpdateSchema = zod_1.z.object({
    avatarUrl: zod_1.z.string().url().optional(),
    bio: zod_1.z.string().max(500).optional(),
    displayName: zod_1.z.string().min(1).max(100).optional(),
    email: zod_1.z.string().email().optional(),
    location: zod_1.z.string().max(100).optional(),
    twitterHandle: zod_1.z.string().max(50).optional(),
    username: zod_1.z.string().min(1).max(50).optional(),
    website: zod_1.z.string().url().optional()
});
/**
 * POST /api/auth/login
 * Unified login and onboarding endpoint
 * Handles both new user registration and existing user login
 */
auth.post("/login", async (c) => {
    try {
        const body = await c.req.json();
        // Validate request body
        const validationResult = loginSchema.safeParse(body);
        if (!validationResult.success) {
            return c.json({
                details: validationResult.error.errors,
                error: "Invalid request data",
                success: false
            }, 400);
        }
        const { walletAddress, selectedProfileId } = validationResult.data;
        logger_1.default.info(`Login request received for wallet: ${walletAddress}, profile: ${selectedProfileId}`);
        // Process login/onboarding
        const result = await AuthService_1.default.loginOrOnboard({
            selectedProfileId,
            walletAddress
        });
        logger_1.default.info(`Login successful for wallet: ${walletAddress}, isNewUser: ${result.isNewUser}`);
        return c.json(result);
    }
    catch (error) {
        logger_1.default.error("Error in login endpoint:", error);
        const errorMessage = error instanceof Error ? error.message : "Authentication failed";
        return c.json({
            error: errorMessage,
            success: false
        }, 500);
    }
});
/**
 * POST /api/auth/exchange
 * Exchange a Lens access token for a backend JWT
 * Accepts token from Authorization: Bearer <lensToken> or body { lensAccessToken, selectedProfileId? }
 */
auth.post("/exchange", rateLimiter_1.moderateRateLimit, async (c) => {
    try {
        const authHeader = c.req.header("Authorization");
        const bearerLens = authHeader?.startsWith("Bearer ")
            ? authHeader.substring(7)
            : undefined;
        const body = (await c.req.json().catch(() => ({})));
        const lensAccessToken = bearerLens ?? body.lensAccessToken;
        const selectedProfileId = body.selectedProfileId;
        if (!lensAccessToken) {
            return c.json({
                error: "Lens access token is required",
                success: false
            }, 401);
        }
        const result = await AuthService_1.default.syncLens({
            lensAccessToken,
            selectedProfileId
        });
        return c.json(result);
    }
    catch (error) {
        logger_1.default.error("Error in exchange endpoint:", error);
        const message = error instanceof Error ? error.message : "Exchange failed";
        return c.json({
            error: message,
            success: false
        }, 500);
    }
});
/**
 * POST /api/auth/sync-lens
 * Sync Lens authentication with our backend system
 * Validates Lens access token and creates our own JWT
 */
auth.post("/sync-lens", rateLimiter_1.moderateRateLimit, async (c) => {
    try {
        const body = await c.req.json();
        // Validate request body
        const validationResult = syncLensSchema.safeParse(body);
        if (!validationResult.success) {
            return c.json({
                details: validationResult.error.errors,
                error: "Invalid request data",
                success: false
            }, 400);
        }
        const { lensAccessToken, selectedProfileId } = validationResult.data;
        logger_1.default.info("Lens sync request received");
        // Process Lens sync
        const result = await AuthService_1.default.syncLens({
            lensAccessToken,
            selectedProfileId
        });
        logger_1.default.info("Lens sync successful");
        return c.json(result);
    }
    catch (error) {
        logger_1.default.error("Error in sync-lens endpoint:", error);
        const errorMessage = error instanceof Error ? error.message : "Lens sync failed";
        // Check if this is a client error (invalid token, etc.)
        if (errorMessage.includes("Invalid Lens access token") ||
            errorMessage.includes("Invalid request data")) {
            return c.json({
                error: errorMessage,
                success: false
            }, 400);
        }
        // Server errors get 500
        return c.json({
            error: errorMessage,
            success: false
        }, 500);
    }
});
/**
 * GET /api/auth/profile
 * Get user profile by wallet address (requires authentication)
 */
auth.get("/profile", async (c) => {
    try {
        // Get wallet address from query params or headers
        const walletAddress = c.req.query("walletAddress") || c.req.header("X-Wallet-Address");
        if (!walletAddress) {
            return c.json({
                error: "Wallet address is required",
                success: false
            }, 400);
        }
        const profile = await AuthService_1.default.getUserProfile(walletAddress);
        if (!profile) {
            return c.json({
                error: "User not found",
                success: false
            }, 404);
        }
        return c.json({
            profile,
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error getting user profile:", error);
        return c.json({
            error: "Failed to get user profile",
            success: false
        }, 500);
    }
});
/**
 * PUT /api/auth/profile
 * Update user profile (requires authentication)
 */
auth.put("/profile", async (c) => {
    try {
        const body = await c.req.json();
        // Validate request body
        const validationResult = profileUpdateSchema.safeParse(body);
        if (!validationResult.success) {
            return c.json({
                details: validationResult.error.errors,
                error: "Invalid request data",
                success: false
            }, 400);
        }
        const walletAddress = c.req.query("walletAddress") || c.req.header("X-Wallet-Address");
        if (!walletAddress) {
            return c.json({
                error: "Wallet address is required",
                success: false
            }, 400);
        }
        const updatedProfile = await AuthService_1.default.updateUserProfile(walletAddress, validationResult.data);
        logger_1.default.info(`Profile updated for wallet: ${walletAddress}`);
        return c.json({
            profile: updatedProfile,
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error updating user profile:", error);
        return c.json({
            error: "Failed to update user profile",
            success: false
        }, 500);
    }
});
/**
 * GET /api/auth/profiles
 * Get available profiles for a wallet
 */
auth.get("/profiles", async (c) => {
    try {
        const walletAddress = c.req.query("walletAddress");
        if (!walletAddress) {
            return c.json({
                error: "Wallet address is required",
                success: false
            }, 400);
        }
        const result = await AuthService_1.default.getAvailableProfiles(walletAddress);
        return c.json({
            linkedProfileId: result.linkedProfileId,
            profiles: result.profiles,
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error getting available profiles:", error);
        return c.json({
            error: "Failed to get available profiles",
            success: false
        }, 500);
    }
});
/**
 * POST /api/auth/validate
 * Validate JWT token and return user data
 */
auth.post("/validate", async (c) => {
    try {
        const body = await c.req.json();
        const { token } = body;
        if (!token) {
            return c.json({
                error: "Token is required",
                success: false
            }, 400);
        }
        const userProfile = await AuthService_1.default.validateToken(token);
        if (!userProfile) {
            return c.json({
                error: "Invalid or expired token",
                success: false
            }, 401);
        }
        return c.json({
            profile: userProfile,
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error validating token:", error);
        return c.json({
            error: "Failed to validate token",
            success: false
        }, 500);
    }
});
/**
 * GET /api/auth/health
 * Health check endpoint
 */
auth.get("/health", (c) => {
    return c.json({
        message: "Auth service is healthy",
        success: true,
        timestamp: new Date().toISOString()
    });
});
/**
 * POST /api/auth/debug-token
 * Debug endpoint to inspect Lens token without validation
 */
auth.post("/debug-token", async (c) => {
    try {
        const body = await c.req.json();
        const { lensAccessToken } = body;
        if (!lensAccessToken) {
            return c.json({
                error: "Lens access token is required",
                success: false
            }, 400);
        }
        // Try to decode the JWT token
        try {
            const tokenParts = lensAccessToken.split(".");
            if (tokenParts.length !== 3) {
                return c.json({
                    error: "Invalid JWT format",
                    success: false,
                    tokenParts: tokenParts.length
                }, 400);
            }
            // Decode the payload (second part of JWT)
            const payload = JSON.parse(Buffer.from(tokenParts[1], "base64").toString());
            return c.json({
                success: true,
                tokenInfo: {
                    expiresAt: payload.exp
                        ? new Date(payload.exp * 1000).toISOString()
                        : null,
                    hasValidFormat: true,
                    isExpired: payload.exp ? Date.now() > payload.exp * 1000 : null,
                    issuedAt: payload.iat
                        ? new Date(payload.iat * 1000).toISOString()
                        : null,
                    payload: payload,
                    profileId: payload.profileId || payload.id,
                    walletAddress: payload.sub
                }
            });
        }
        catch (decodeError) {
            return c.json({
                decodeError: decodeError instanceof Error
                    ? decodeError.message
                    : "Unknown error",
                error: "Failed to decode JWT token",
                success: false
            }, 400);
        }
    }
    catch (error) {
        logger_1.default.error("Error in debug-token endpoint:", error);
        return c.json({
            error: "Failed to process token",
            success: false
        }, 500);
    }
});
/**
 * POST /api/auth/refresh
 * Refresh backend JWT using the current Authorization bearer token
 */
auth.post("/refresh", rateLimiter_1.moderateRateLimit, async (c) => {
    try {
        const authHeader = c.req.header("Authorization");
        const bearer = authHeader?.startsWith("Bearer ")
            ? authHeader.substring(7)
            : undefined;
        if (!bearer) {
            return c.json({
                error: "Authorization bearer token is required",
                success: false
            }, 401);
        }
        const refreshed = JwtService_1.default.refreshToken(bearer);
        if (!refreshed) {
            return c.json({
                error: "Invalid or expired token",
                success: false
            }, 401);
        }
        // Verify the new token to extract wallet address
        const payload = JwtService_1.default.verifyToken(refreshed);
        if (!payload) {
            return c.json({
                error: "Failed to verify refreshed token",
                success: false
            }, 401);
        }
        // Try to fetch the latest user profile; fall back to minimal payload if missing
        let user = await AuthService_1.default.getUserProfile(payload.walletAddress);
        if (!user) {
            user = {
                avatarUrl: undefined,
                bio: undefined,
                displayName: undefined,
                email: undefined,
                lastActiveAt: new Date(),
                linkedProfileId: payload.linkedProfileId,
                location: undefined,
                referrerAddress: undefined,
                registrationDate: new Date(),
                status: payload.status,
                totalLogins: 0,
                twitterHandle: undefined,
                username: undefined,
                walletAddress: payload.walletAddress,
                website: undefined
            };
        }
        return c.json({
            success: true,
            token: refreshed,
            user
        });
    }
    catch (error) {
        logger_1.default.error("Error in refresh endpoint:", error);
        return c.json({
            error: "Failed to refresh token",
            success: false
        }, 500);
    }
});
// Add status route
auth.route("/status", status_1.default);
exports.default = auth;
