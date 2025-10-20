"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const authContext_1 = require("../../context/authContext");
const authMiddleware_1 = __importDefault(require("../../middlewares/authMiddleware"));
const requirePremium_1 = __importDefault(require("../../middlewares/requirePremium"));
const client_1 = __importDefault(require("../../prisma/client"));
const BlockchainService_1 = __importDefault(require("../../services/BlockchainService"));
const app = new hono_1.Hono();
app.use("*", authMiddleware_1.default);
app.use("*", requirePremium_1.default);
app.get("/", async (c) => {
    try {
        const auth = (0, authContext_1.getAuthContext)(c);
        if (!auth?.walletAddress) {
            return c.json({ error: "Unauthorized" }, 401);
        }
        const wallet = auth.walletAddress;
        // Read on-chain balances directly
        const [referralWei, game] = await Promise.all([
            BlockchainService_1.default.getReferralReward(wallet),
            BlockchainService_1.default.getGameVaultRewards(wallet)
        ]);
        const referral = referralWei;
        const balancedGame = game.balanced;
        const unbalancedGame = game.unbalanced;
        // Update local DB snapshot (if schema has a place; here we store in UserStats totalEarnings-like field)
        try {
            await client_1.default.userStats.upsert({
                create: {
                    referralCount: 0,
                    totalEarnings: referralWei.toString(),
                    walletAddress: wallet
                },
                update: {
                    totalEarnings: referralWei.toString()
                },
                where: { walletAddress: wallet }
            });
        }
        catch {
            // best-effort snapshot
        }
        // Convert to human-readable decimal strings (assume 18 decimals)
        const toDecimal = (v) => Number(v) / 1e18;
        const referralDec = toDecimal(referral);
        const balancedDec = toDecimal(balancedGame);
        const unbalancedDec = toDecimal(unbalancedGame);
        const total = referralDec + balancedDec + unbalancedDec;
        return c.json({
            sources: {
                balancedGame: balancedDec.toFixed(2),
                referral: referralDec.toFixed(2),
                unbalancedGame: unbalancedDec.toFixed(2)
            },
            totalClaimableBalance: total.toFixed(2)
        });
    }
    catch {
        return c.json({ error: "Failed to refresh reward balance" }, 500);
    }
});
exports.default = app;
