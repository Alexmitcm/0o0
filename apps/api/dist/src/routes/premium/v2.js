"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const enums_1 = require("@hey/data/enums");
const hono_1 = require("hono");
const zod_1 = require("zod");
const rateLimiter_1 = require("../../middlewares/rateLimiter");
const BlockchainService_1 = __importDefault(require("../../services/BlockchainService"));
const PremiumV2Service_1 = __importDefault(require("../../services/PremiumV2Service"));
const app = new hono_1.Hono();
const determineSchema = zod_1.z.object({
    profileId: zod_1.z.string().optional(),
    walletAddress: zod_1.z.string().min(1, "Wallet address is required")
});
const linkSchema = zod_1.z.object({
    profileId: zod_1.z.string().min(1, "Profile ID is required"),
    walletAddress: zod_1.z.string().min(1, "Wallet address is required")
});
const registrationStatusSchema = zod_1.z.object({
    walletAddress: zod_1.z.string().min(1, "Wallet address is required")
});
const verifyRegistrationSchema = zod_1.z.object({
    profileId: zod_1.z.string().optional(),
    referrerAddress: zod_1.z.string().min(1, "Referrer address is required"),
    transactionHash: zod_1.z.string().min(1, "Transaction hash is required"),
    userAddress: zod_1.z.string().min(1, "User address is required")
});
const validateReferrerSchema = zod_1.z.object({
    referrerAddress: zod_1.z.string().min(1, "Referrer address is required")
});
app.post("/determine-status", rateLimiter_1.moderateRateLimit, async (c) => {
    try {
        const body = await c.req.json();
        const { walletAddress, profileId } = determineSchema.parse(body);
        const result = await PremiumV2Service_1.default.determineStatus(walletAddress, profileId);
        return c.json({ data: result, status: enums_1.Status.Success });
    }
    catch (error) {
        return c.json({
            error: "Failed to determine status",
            message: error instanceof Error ? error.message : "Unknown error"
        }, 500);
    }
});
app.post("/link", rateLimiter_1.moderateRateLimit, async (c) => {
    try {
        const body = await c.req.json();
        const parsed = linkSchema.partial({ walletAddress: true }).parse(body);
        const walletAddress = parsed.walletAddress || c.get("walletAddress");
        if (!walletAddress) {
            return c.json({ error: "Authentication or walletAddress required" }, 401);
        }
        const result = await PremiumV2Service_1.default.linkProfile(walletAddress, parsed.profileId);
        return c.json({ data: result, status: enums_1.Status.Success });
    }
    catch (error) {
        const err = error;
        const code = err?.code;
        if (code === "LINK_ALREADY_EXISTS") {
            return c.json({
                error: "AlreadyLinked",
                linkedProfileId: err?.linkedProfileId,
                message: "This premium wallet is already permanently linked to a Lens profile.",
                walletAddress: err?.walletAddress
            }, 400);
        }
        return c.json({
            error: "Failed to link profile",
            message: err instanceof Error ? err.message : "Unknown error"
        }, 400);
    }
});
exports.default = app;
// Registration endpoints to support the Premium Registration Modal
app.post("/registration/status", rateLimiter_1.moderateRateLimit, async (c) => {
    try {
        const body = await c.req.json();
        const { walletAddress } = registrationStatusSchema.parse(body);
        const isPremium = await BlockchainService_1.default.isWalletPremium(walletAddress);
        return c.json({
            data: {
                canRegister: !isPremium,
                isPremiumOnChain: isPremium
            },
            status: enums_1.Status.Success
        });
    }
    catch {
        return c.json({ error: "Failed to get registration status" }, 500);
    }
});
// Compatibility endpoint for wallet status used by web app
app.get("/wallet-status", rateLimiter_1.moderateRateLimit, async (c) => {
    try {
        const walletAddress = c.get("walletAddress");
        if (!walletAddress) {
            return c.json({ error: "Authentication required" }, 401);
        }
        const isPremium = await BlockchainService_1.default.isWalletPremium(walletAddress);
        return c.json({
            data: {
                isRegistered: isPremium,
                walletAddress
            },
            status: enums_1.Status.Success
        });
    }
    catch {
        return c.json({ error: "Failed to fetch wallet status" }, 500);
    }
});
app.post("/registration/validate-referrer", rateLimiter_1.moderateRateLimit, async (c) => {
    try {
        const body = await c.req.json();
        const { referrerAddress } = validateReferrerSchema.parse(body);
        const result = await BlockchainService_1.default.validateReferrer(referrerAddress);
        return c.json({ data: result, status: enums_1.Status.Success });
    }
    catch {
        return c.json({ error: "Failed to validate referrer" }, 500);
    }
});
app.post("/registration/verify", rateLimiter_1.moderateRateLimit, async (c) => {
    try {
        const body = await c.req.json();
        const { userAddress, referrerAddress, transactionHash, profileId } = verifyRegistrationSchema.parse(body);
        const ok = await BlockchainService_1.default.verifyRegistrationTransaction(userAddress, referrerAddress, transactionHash);
        if (!ok) {
            return c.json({ error: "Registration verification failed" }, 400);
        }
        let linkResult = {};
        if (profileId) {
            try {
                const linked = await PremiumV2Service_1.default.linkProfile(userAddress, profileId);
                linkResult = { linkedProfileId: linked.linkedProfileId };
            }
            catch {
                // If linking fails (e.g., ownership mismatch), we still return success for registration
            }
        }
        return c.json({
            data: {
                verified: true,
                ...linkResult
            },
            status: enums_1.Status.Success
        });
    }
    catch {
        return c.json({ error: "Failed to verify registration" }, 500);
    }
});
// Available profiles for premium wallets that are not linked yet
app.post("/available-profiles", rateLimiter_1.moderateRateLimit, async (c) => {
    try {
        const body = await c.req.json();
        const { walletAddress } = registrationStatusSchema.parse(body);
        const [isPremium, existingLink] = await Promise.all([
            BlockchainService_1.default.isWalletPremium(walletAddress),
            (await Promise.resolve().then(() => __importStar(require("../../prisma/client")))).default.premiumProfile.findUnique({
                where: { walletAddress: walletAddress.toLowerCase() }
            })
        ]);
        if (!isPremium || existingLink) {
            return c.json({
                data: { canLink: false, profiles: [] },
                status: enums_1.Status.Success
            });
        }
        const profiles = (await (await Promise.resolve().then(() => __importStar(require("../../services/ProfileService")))).default.getProfilesByWallet(walletAddress)) || [];
        return c.json({
            data: {
                canLink: true,
                profiles
            },
            status: enums_1.Status.Success
        });
    }
    catch {
        return c.json({ error: "Failed to get available profiles" }, 500);
    }
});
// Auto-link first profile for premium wallets
app.post("/auto-link", rateLimiter_1.moderateRateLimit, async (c) => {
    try {
        const body = await c.req.json();
        const { walletAddress } = registrationStatusSchema.parse(body);
        const profiles = (await (await Promise.resolve().then(() => __importStar(require("../../services/ProfileService")))).default.getProfilesByWallet(walletAddress)) || [];
        if (profiles.length === 0) {
            return c.json({ error: "No profiles found for this wallet" }, 400);
        }
        const firstProfileId = profiles[0].id;
        const result = await PremiumV2Service_1.default.linkProfile(walletAddress, firstProfileId);
        return c.json({
            data: { linkedProfileId: result.linkedProfileId },
            status: enums_1.Status.Success
        });
    }
    catch {
        return c.json({ error: "Failed to auto-link profile" }, 500);
    }
});
