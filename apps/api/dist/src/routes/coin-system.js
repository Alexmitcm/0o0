"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("@hey/helpers/logger"));
const zod_validator_1 = require("@hono/zod-validator");
const client_1 = require("@prisma/client");
const hono_1 = require("hono");
const zod_1 = require("zod");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const errorHandler_1 = require("../middlewares/errorHandler");
const rateLimiter_1 = require("../middlewares/rateLimiter");
const prisma = new client_1.PrismaClient();
const coinSystemRouter = new hono_1.Hono();
// Validation schemas
const updateCoinsSchema = zod_1.z.object({
    amount: zod_1.z.number().int().min(1).max(10000),
    coinType: zod_1.z
        .enum(["Experience", "Achievement", "Social", "Premium"])
        .default("Experience"),
    walletAddress: zod_1.z.string().min(42).max(42)
});
const getCoinsSchema = zod_1.z.object({
    walletAddress: zod_1.z.string().min(42).max(42)
});
const transferCoinsSchema = zod_1.z.object({
    amount: zod_1.z.number().int().min(1),
    coinType: zod_1.z
        .enum(["Experience", "Achievement", "Social", "Premium"])
        .default("Experience"),
    fromWalletAddress: zod_1.z.string().min(42).max(42),
    toWalletAddress: zod_1.z.string().min(42).max(42)
});
// Stamina schema
const staminaUpdateSchema = zod_1.z.object({
    delta: zod_1.z.number().int().min(-1000).max(1000).default(0),
    walletAddress: zod_1.z.string().min(42).max(42)
});
const staminaGetSchema = zod_1.z.object({
    walletAddress: zod_1.z.string().min(42).max(42)
});
// Award coins based on game result
const awardCoinsSchema = zod_1.z.object({
    amount: zod_1.z.number().int().min(0).max(10000).default(0),
    coinType: zod_1.z
        .enum(["Experience", "Achievement", "Social", "Premium"])
        .default("Experience"),
    gameSlug: zod_1.z.string().min(1).optional(),
    outcome: zod_1.z.enum(["win", "loss"]).default("win"),
    staminaCost: zod_1.z.number().int().min(0).max(100).optional(),
    walletAddress: zod_1.z.string().min(42).max(42)
});
// GET /coin-system/:walletAddress - Get user coin data (equivalent to GetUserData.php)
coinSystemRouter.get("/:walletAddress", (0, rateLimiter_1.rateLimiter)({ max: 20, windowMs: 60000 }), // 20 requests per minute
async (c) => {
    try {
        const walletAddress = c.req.param("walletAddress");
        if (!walletAddress ||
            walletAddress.length !== 42 ||
            !walletAddress.startsWith("0x")) {
            return c.json({ error: "Invalid wallet address" }, 400);
        }
        // Get user coin balance
        const userBalance = await prisma.userCoinBalance.findUnique({
            where: { walletAddress }
        });
        // Get user profile
        const userProfile = await prisma.user.findUnique({
            where: { walletAddress }
        });
        // If user doesn't exist, create a default profile
        if (!userProfile) {
            const newUser = await prisma.user.create({
                data: {
                    createdAt: new Date(),
                    displayName: `User ${walletAddress.slice(2, 8)}`,
                    lastActiveAt: new Date(),
                    username: `user_${walletAddress.slice(2, 8)}`,
                    walletAddress
                }
            });
            return c.json({
                success: true,
                user: {
                    achievementCoins: userBalance?.achievementCoins || 0,
                    coins: userBalance?.totalCoins || 0,
                    createdAt: newUser.createdAt,
                    displayName: newUser.displayName,
                    experienceCoins: userBalance?.experienceCoins || 0,
                    id: newUser.id,
                    lastActiveAt: newUser.lastActiveAt,
                    levelValue: 1,
                    premiumCoins: userBalance?.premiumCoins || 0,
                    socialCoins: userBalance?.socialCoins || 0,
                    todaysPoints: 0,
                    username: newUser.username,
                    walletAddress: newUser.walletAddress
                }
            });
        }
        return c.json({
            success: true,
            user: {
                achievementCoins: userBalance?.achievementCoins || 0,
                coins: userBalance?.totalCoins || 0,
                createdAt: userProfile.createdAt,
                displayName: userProfile.displayName,
                experienceCoins: userBalance?.experienceCoins || 0,
                id: userProfile.id,
                lastActiveAt: userProfile.lastActiveAt,
                levelValue: 1,
                premiumCoins: userBalance?.premiumCoins || 0,
                socialCoins: userBalance?.socialCoins || 0,
                todaysPoints: 0,
                username: userProfile.username,
                walletAddress: userProfile.walletAddress
            }
        });
    }
    catch (error) {
        logger_1.default.error("Error fetching user data:", error);
        return (0, errorHandler_1.errorHandler)(error, c);
    }
});
// POST /coin-system/update - Update user coins (equivalent to CoinUpdate.php)
coinSystemRouter.post("/update", authMiddleware_1.default, (0, rateLimiter_1.rateLimiter)({ max: 10, windowMs: 60000 }), // 10 requests per minute
(0, zod_validator_1.zValidator)("json", updateCoinsSchema), async (c) => {
    try {
        const data = c.req.valid("json");
        const { walletAddress, amount, coinType } = data;
        const authWalletAddress = c.get("walletAddress");
        // Check if user is updating their own coins
        if (walletAddress !== authWalletAddress) {
            return c.json({ error: "Unauthorized" }, 403);
        }
        // Check if user exists
        const user = await prisma.user.findUnique({
            include: { userCoinBalance: true },
            where: { walletAddress }
        });
        if (!user) {
            return c.json({ error: "User not found" }, 404);
        }
        // Check if user is banned (you can add ban checking logic here)
        if (user.status === "Banned") {
            return c.json({ error: "User is banned" }, 403);
        }
        // Get current balance
        const currentBalance = user.userCoinBalance || {
            achievementCoins: 0,
            experienceCoins: 0,
            premiumCoins: 0,
            socialCoins: 0,
            totalCoins: 0
        };
        // Calculate new balance
        const newTotalCoins = currentBalance.totalCoins + amount;
        const newCoinTypeBalance = currentBalance[`${coinType.toLowerCase()}Coins`] + amount;
        // Update coin balance
        const updatedBalance = await prisma.userCoinBalance.upsert({
            create: {
                achievementCoins: coinType === "Achievement" ? amount : 0,
                experienceCoins: coinType === "Experience" ? amount : 0,
                premiumCoins: coinType === "Premium" ? amount : 0,
                socialCoins: coinType === "Social" ? amount : 0,
                totalCoins: amount,
                walletAddress
            },
            update: {
                totalCoins: newTotalCoins,
                [`${coinType.toLowerCase()}Coins`]: newCoinTypeBalance,
                lastUpdatedAt: new Date()
            },
            where: { walletAddress }
        });
        // Record coin transaction
        await prisma.coinTransaction.create({
            data: {
                amount,
                balanceAfter: newTotalCoins,
                balanceBefore: currentBalance.totalCoins,
                coinType,
                description: `Earned ${amount} ${coinType} coins from gameplay`,
                sourceType: "GamePlay",
                transactionType: "Earned",
                walletAddress
            }
        });
        // Add coin record
        await prisma.userCoin.create({
            data: {
                amount,
                coinType,
                sourceMetadata: {
                    gameSession: "unknown", // You can pass this from the game
                    timestamp: new Date().toISOString()
                },
                sourceType: "GamePlay",
                walletAddress
            }
        });
        return c.json({
            achievementCoins: updatedBalance.achievementCoins,
            addedAmount: amount,
            coins: updatedBalance.totalCoins,
            coinType,
            experienceCoins: updatedBalance.experienceCoins,
            message: "Coins updated successfully",
            premiumCoins: updatedBalance.premiumCoins,
            socialCoins: updatedBalance.socialCoins,
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error updating coins:", error);
        return (0, errorHandler_1.errorHandler)(error, c);
    }
});
// This route is duplicated - removed to avoid conflicts
// POST /coin-system/transfer - Transfer coins between users
coinSystemRouter.post("/transfer", authMiddleware_1.default, (0, rateLimiter_1.rateLimiter)({ max: 5, windowMs: 60000 }), // 5 requests per minute
(0, zod_validator_1.zValidator)("json", transferCoinsSchema), async (c) => {
    try {
        const data = c.req.valid("json");
        const { fromWalletAddress, toWalletAddress, amount, coinType } = data;
        const authWalletAddress = c.get("walletAddress");
        // Check if user is transferring their own coins
        if (fromWalletAddress !== authWalletAddress) {
            return c.json({ error: "Unauthorized" }, 403);
        }
        // Check if both users exist
        const [fromUser, toUser] = await Promise.all([
            prisma.user.findUnique({
                include: { userCoinBalance: true },
                where: { walletAddress: fromWalletAddress }
            }),
            prisma.user.findUnique({
                include: { userCoinBalance: true },
                where: { walletAddress: toWalletAddress }
            })
        ]);
        if (!fromUser || !toUser) {
            return c.json({ error: "User not found" }, 404);
        }
        // Check if sender has enough coins
        const fromBalance = fromUser.userCoinBalance || {
            achievementCoins: 0,
            experienceCoins: 0,
            premiumCoins: 0,
            socialCoins: 0,
            totalCoins: 0
        };
        const coinTypeBalance = fromBalance[`${coinType.toLowerCase()}Coins`];
        if (coinTypeBalance < amount) {
            return c.json({ error: "Insufficient coins" }, 400);
        }
        // Start transaction
        await prisma.$transaction(async (tx) => {
            // Update sender's balance
            await tx.userCoinBalance.upsert({
                create: {
                    achievementCoins: coinType === "Achievement" ? -amount : 0,
                    experienceCoins: coinType === "Experience" ? -amount : 0,
                    premiumCoins: coinType === "Premium" ? -amount : 0,
                    socialCoins: coinType === "Social" ? -amount : 0,
                    totalCoins: -amount,
                    walletAddress: fromWalletAddress
                },
                update: {
                    totalCoins: { decrement: amount },
                    [`${coinType.toLowerCase()}Coins`]: { decrement: amount },
                    lastUpdatedAt: new Date()
                },
                where: { walletAddress: fromWalletAddress }
            });
            // Update receiver's balance
            await tx.userCoinBalance.upsert({
                create: {
                    achievementCoins: coinType === "Achievement" ? amount : 0,
                    experienceCoins: coinType === "Experience" ? amount : 0,
                    premiumCoins: coinType === "Premium" ? amount : 0,
                    socialCoins: coinType === "Social" ? amount : 0,
                    totalCoins: amount,
                    walletAddress: toWalletAddress
                },
                update: {
                    totalCoins: { increment: amount },
                    [`${coinType.toLowerCase()}Coins`]: { increment: amount },
                    lastUpdatedAt: new Date()
                },
                where: { walletAddress: toWalletAddress }
            });
            // Record transactions
            await tx.coinTransaction.createMany({
                data: [
                    {
                        amount: -amount,
                        balanceAfter: fromBalance.totalCoins - amount,
                        balanceBefore: fromBalance.totalCoins,
                        coinType,
                        description: `Transferred ${amount} ${coinType} coins to ${toWalletAddress}`,
                        sourceType: "Transfer",
                        transactionType: "Transferred",
                        walletAddress: fromWalletAddress
                    },
                    {
                        amount,
                        balanceAfter: (toUser.userCoinBalance?.totalCoins || 0) + amount,
                        balanceBefore: toUser.userCoinBalance?.totalCoins || 0,
                        coinType,
                        description: `Received ${amount} ${coinType} coins from ${fromWalletAddress}`,
                        sourceType: "Transfer",
                        transactionType: "Earned",
                        walletAddress: toWalletAddress
                    }
                ]
            });
        });
        return c.json({
            coinType,
            fromWalletAddress,
            message: "Coins transferred successfully",
            success: true,
            toWalletAddress,
            transferredAmount: amount
        });
    }
    catch (error) {
        logger_1.default.error("Error transferring coins:", error);
        return (0, errorHandler_1.errorHandler)(error, c);
    }
});
// GET /coin-system/:walletAddress/transactions - Get user coin transactions
coinSystemRouter.get("/:walletAddress/transactions", (0, rateLimiter_1.rateLimiter)({ max: 30, windowMs: 60000 }), (0, zod_validator_1.zValidator)("param", getCoinsSchema), async (c) => {
    try {
        const { walletAddress } = c.req.valid("param");
        const page = Number.parseInt(c.req.query("page") || "1");
        const limit = Number.parseInt(c.req.query("limit") || "20");
        const offset = (page - 1) * limit;
        const [transactions, total] = await Promise.all([
            prisma.coinTransaction.findMany({
                orderBy: { createdAt: "desc" },
                skip: offset,
                take: limit,
                where: { walletAddress }
            }),
            prisma.coinTransaction.count({
                where: { walletAddress }
            })
        ]);
        return c.json({
            pagination: {
                limit,
                page,
                total,
                totalPages: Math.ceil(total / limit)
            },
            success: true,
            transactions
        });
    }
    catch (error) {
        logger_1.default.error("Error getting coin transactions:", error);
        return (0, errorHandler_1.errorHandler)(error, c);
    }
});
// GET /coin-system/stats/total - Get total coins in system (equivalent to CountUsersCoins.php)
coinSystemRouter.get("/stats/total", (0, rateLimiter_1.rateLimiter)({ max: 10, windowMs: 60000 }), async (c) => {
    try {
        const totalCoins = await prisma.userCoinBalance.aggregate({
            _sum: {
                achievementCoins: true,
                experienceCoins: true,
                premiumCoins: true,
                socialCoins: true,
                totalCoins: true
            }
        });
        return c.json({
            success: true,
            totalAchievementCoins: totalCoins._sum.achievementCoins || 0,
            totalCoins: totalCoins._sum.totalCoins || 0,
            totalExperienceCoins: totalCoins._sum.experienceCoins || 0,
            totalPremiumCoins: totalCoins._sum.premiumCoins || 0,
            totalSocialCoins: totalCoins._sum.socialCoins || 0
        });
    }
    catch (error) {
        logger_1.default.error("Error getting total coins:", error);
        return (0, errorHandler_1.errorHandler)(error, c);
    }
});
exports.default = coinSystemRouter;
// POST /coin-system/award - Award coins on win/loss game outcomes
coinSystemRouter.post("/award", (0, rateLimiter_1.rateLimiter)({ max: 30, windowMs: 60000 }), (0, zod_validator_1.zValidator)("json", awardCoinsSchema), async (c) => {
    try {
        const { walletAddress, outcome, amount, coinType, gameSlug, staminaCost } = c.req.valid("json");
        // Ensure user exists
        const user = await prisma.user.findUnique({
            include: { userCoinBalance: true },
            where: { walletAddress }
        });
        if (!user) {
            return c.json({ error: "User not found" }, 404);
        }
        // Determine delta based on outcome (win awards amount, loss awards 0)
        const delta = outcome === "win" ? amount : 0;
        // Current balances
        const current = user.userCoinBalance || {
            achievementCoins: 0,
            experienceCoins: 0,
            premiumCoins: 0,
            socialCoins: 0,
            totalCoins: 0
        };
        // Short-circuit if no change
        if (delta === 0) {
            return c.json({
                coins: current.totalCoins,
                coinType,
                message: "No coin change for loss",
                outcome,
                success: true
            });
        }
        // Compute new balances
        const newTotal = current.totalCoins + delta;
        const typedKey = `${coinType.toLowerCase()}Coins`;
        // @ts-ignore - dynamic key update handled below
        const newTyped = (current[typedKey] || 0) + delta;
        // Persist balances
        const updated = await prisma.userCoinBalance.upsert({
            create: {
                achievementCoins: coinType === "Achievement" ? delta : 0,
                experienceCoins: coinType === "Experience" ? delta : 0,
                premiumCoins: coinType === "Premium" ? delta : 0,
                socialCoins: coinType === "Social" ? delta : 0,
                totalCoins: delta,
                walletAddress
            },
            update: {
                totalCoins: newTotal,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore dynamic field
                [typedKey]: newTyped,
                lastUpdatedAt: new Date()
            },
            where: { walletAddress }
        });
        // Optionally consume stamina
        if (typeof staminaCost === "number" && staminaCost > 0) {
            const stats = await prisma.userStats.upsert({
                create: {
                    maxStamina: 100,
                    remainingStamina: Math.max(0, 100 - staminaCost),
                    totalEarnings: 0,
                    walletAddress
                },
                update: {},
                where: { walletAddress }
            });
            const maxStamina = stats.maxStamina || 100;
            const newRemaining = Math.max(0, (stats.remainingStamina || maxStamina) - staminaCost);
            await prisma.userStats.update({
                data: { remainingStamina: newRemaining },
                where: { walletAddress }
            });
        }
        // Record transaction
        await prisma.coinTransaction.create({
            data: {
                amount: delta,
                balanceAfter: updated.totalCoins,
                balanceBefore: current.totalCoins,
                coinType,
                description: outcome === "win"
                    ? `Win reward from ${gameSlug || "game"}`
                    : `Loss recorded for ${gameSlug || "game"}`,
                sourceType: "GameResult",
                transactionType: outcome === "win" ? "Earned" : "None",
                walletAddress
            }
        });
        return c.json({
            addedAmount: delta,
            coins: updated.totalCoins,
            coinType,
            outcome,
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error awarding coins:", error);
        return (0, errorHandler_1.errorHandler)(error, c);
    }
});
// GET /coin-system/stamina/:walletAddress - fetch stamina
coinSystemRouter.get("/stamina/:walletAddress", (0, rateLimiter_1.rateLimiter)({ max: 30, windowMs: 60000 }), (0, zod_validator_1.zValidator)("param", staminaGetSchema), async (c) => {
    try {
        const { walletAddress } = c.req.valid("param");
        // Ensure stamina row exists via upsert into userStats
        const stats = await prisma.userStats.upsert({
            create: {
                maxStamina: 100,
                remainingStamina: 100,
                totalEarnings: 0,
                walletAddress
            },
            update: {},
            where: { walletAddress }
        });
        return c.json({
            maxStamina: stats.maxStamina || 100,
            regenPerHour: 10,
            remainingStamina: stats.remainingStamina || 100,
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error getting stamina:", error);
        return (0, errorHandler_1.errorHandler)(error, c);
    }
});
// PUT /coin-system/stamina - consume/regen stamina by delta
coinSystemRouter.put("/stamina", (0, rateLimiter_1.rateLimiter)({ max: 30, windowMs: 60000 }), (0, zod_validator_1.zValidator)("json", staminaUpdateSchema), async (c) => {
    try {
        const { walletAddress, delta } = c.req.valid("json");
        const stats = await prisma.userStats.upsert({
            create: {
                maxStamina: 100,
                remainingStamina: Math.max(0, Math.min(100, 100 + delta)),
                totalEarnings: 0,
                walletAddress
            },
            update: {},
            where: { walletAddress }
        });
        const maxStamina = stats.maxStamina || 100;
        const newRemaining = Math.max(0, Math.min(maxStamina, (stats.remainingStamina || maxStamina) + delta));
        const updated = await prisma.userStats.update({
            data: { remainingStamina: newRemaining },
            where: { walletAddress }
        });
        return c.json({
            maxStamina: updated.maxStamina || maxStamina,
            remainingStamina: updated.remainingStamina || newRemaining,
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error updating stamina:", error);
        return (0, errorHandler_1.errorHandler)(error, c);
    }
});
