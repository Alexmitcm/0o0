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
const adminSystemRouter = new hono_1.Hono();
// Validation schemas
const createUserSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(1).max(100).optional(),
    referrerAddress: zod_1.z.string().min(42).max(42).optional(),
    status: zod_1.z.enum(["Standard", "Premium", "Banned"]).default("Standard"),
    username: zod_1.z.string().min(3).max(50).optional(),
    walletAddress: zod_1.z.string().min(42).max(42)
});
const updateUserSchema = zod_1.z.object({
    bio: zod_1.z.string().max(500).optional(),
    displayName: zod_1.z.string().min(1).max(100).optional(),
    location: zod_1.z.string().max(100).optional(),
    status: zod_1.z.enum(["Standard", "Premium", "Banned"]).optional(),
    twitterHandle: zod_1.z.string().max(50).optional(),
    username: zod_1.z.string().min(3).max(50).optional(),
    website: zod_1.z.string().url().optional()
});
const getUserSchema = zod_1.z.object({
    walletAddress: zod_1.z.string().min(42).max(42)
});
const banUserSchema = zod_1.z.object({
    duration: zod_1.z.number().int().min(0).optional(), // Duration in hours, 0 = permanent
    reason: zod_1.z.string().min(1).max(500),
    walletAddress: zod_1.z.string().min(42).max(42)
});
const adjustCoinsSchema = zod_1.z.object({
    amount: zod_1.z.number().int(),
    coinType: zod_1.z
        .enum(["Experience", "Achievement", "Social", "Premium"])
        .default("Experience"),
    reason: zod_1.z.string().min(1).max(500),
    walletAddress: zod_1.z.string().min(42).max(42)
});
// GET /admin-system/users - Get all users (equivalent to admin.php)
adminSystemRouter.get("/users", authMiddleware_1.default, (0, rateLimiter_1.rateLimiter)({ max: 30, windowMs: 60000 }), async (c) => {
    try {
        const page = Number.parseInt(c.req.query("page") || "1");
        const limit = Number.parseInt(c.req.query("limit") || "50");
        const search = c.req.query("search");
        const status = c.req.query("status");
        const offset = (page - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { walletAddress: { contains: search } },
                { username: { contains: search } },
                { displayName: { contains: search } }
            ];
        }
        if (status) {
            where.status = status;
        }
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                include: {
                    _count: {
                        select: {
                            gameFavorites: true,
                            gameLikes: true,
                            gameRatings: true,
                            gameReviews: true,
                            tournamentParticipants: true
                        }
                    },
                    userCoinBalance: true,
                    userStats: true
                },
                orderBy: { createdAt: "desc" },
                skip: offset,
                take: limit,
                where
            }),
            prisma.user.count({ where })
        ]);
        return c.json({
            pagination: {
                limit,
                page,
                total,
                totalPages: Math.ceil(total / limit)
            },
            success: true,
            users: users.map((user) => ({
                achievementCoins: user.userCoinBalance?.achievementCoins || 0,
                avatarUrl: user.avatarUrl,
                bio: user.bio,
                coins: user.userCoinBalance?.totalCoins || 0,
                displayName: user.displayName,
                experienceCoins: user.userCoinBalance?.experienceCoins || 0,
                gameStats: {
                    totalFavorites: user._count.gameFavorites,
                    totalLikes: user._count.gameLikes,
                    totalRatings: user._count.gameRatings,
                    totalReviews: user._count.gameReviews,
                    totalTournaments: user._count.tournamentParticipants
                },
                lastActiveAt: user.lastActiveAt,
                location: user.location,
                premiumCoins: user.userCoinBalance?.premiumCoins || 0,
                referrerAddress: user.referrerAddress,
                registrationDate: user.registrationDate,
                socialCoins: user.userCoinBalance?.socialCoins || 0,
                stats: user.userStats,
                status: user.status,
                totalLogins: user.totalLogins,
                twitterHandle: user.twitterHandle,
                username: user.username,
                walletAddress: user.walletAddress,
                website: user.website
            }))
        });
    }
    catch (error) {
        logger_1.default.error("Error getting users:", error);
        return (0, errorHandler_1.errorHandler)(error, c);
    }
});
// POST /admin-system/users - Create user (equivalent to manage_user.php create)
adminSystemRouter.post("/users", authMiddleware_1.default, (0, rateLimiter_1.rateLimiter)({ max: 10, windowMs: 60000 }), (0, zod_validator_1.zValidator)("json", createUserSchema), async (c) => {
    try {
        const data = c.req.valid("json");
        const { walletAddress, username, displayName, referrerAddress, status } = data;
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { walletAddress }
        });
        if (existingUser) {
            return c.json({ error: "User already exists" }, 400);
        }
        // Create user
        const user = await prisma.user.create({
            data: {
                displayName: displayName || username,
                referrerAddress,
                status,
                username,
                walletAddress
            }
        });
        // Initialize coin balance
        await prisma.userCoinBalance.create({
            data: {
                achievementCoins: 0,
                experienceCoins: 0,
                premiumCoins: 0,
                socialCoins: 0,
                totalCoins: 0,
                walletAddress
            }
        });
        // Initialize user stats
        await prisma.userStats.create({
            data: {
                daysAsPremium: 0,
                questsCompleted: 0,
                questsInProgress: 0,
                referralCount: 0,
                totalComments: 0,
                totalEarnings: 0,
                totalFollowers: 0,
                totalFollowing: 0,
                totalLikes: 0,
                totalPosts: 0,
                walletAddress
            }
        });
        return c.json({
            message: "User created successfully",
            success: true,
            user: {
                displayName: user.displayName,
                referrerAddress: user.referrerAddress,
                registrationDate: user.registrationDate,
                status: user.status,
                username: user.username,
                walletAddress: user.walletAddress
            }
        }, 201);
    }
    catch (error) {
        logger_1.default.error("Error creating user:", error);
        return (0, errorHandler_1.errorHandler)(error, c);
    }
});
// GET /admin-system/users/:walletAddress - Get specific user
adminSystemRouter.get("/users/:walletAddress", authMiddleware_1.default, (0, rateLimiter_1.rateLimiter)({ max: 30, windowMs: 60000 }), (0, zod_validator_1.zValidator)("param", getUserSchema), async (c) => {
    try {
        const { walletAddress } = c.req.valid("param");
        const user = await prisma.user.findUnique({
            include: {
                coinTransactions: {
                    orderBy: { createdAt: "desc" },
                    take: 20
                },
                gameFavorites: { select: { createdAt: true, id: true } },
                gameLikes: { select: { createdAt: true, id: true } },
                gameRatings: { select: { createdAt: true, id: true, rating: true } },
                gameReviews: { select: { createdAt: true, id: true, rating: true } },
                tournamentParticipants: {
                    include: {
                        tournament: {
                            select: {
                                id: true,
                                name: true,
                                prizePool: true,
                                status: true
                            }
                        }
                    }
                },
                userCoinBalance: true,
                userNotifications: {
                    orderBy: { createdAt: "desc" },
                    take: 10
                },
                userStats: true
            },
            where: { walletAddress }
        });
        if (!user) {
            return c.json({ error: "User not found" }, 404);
        }
        return c.json({
            success: true,
            user: {
                achievementCoins: user.userCoinBalance?.achievementCoins || 0,
                avatarUrl: user.avatarUrl,
                bio: user.bio,
                coins: user.userCoinBalance?.totalCoins || 0,
                displayName: user.displayName,
                experienceCoins: user.userCoinBalance?.experienceCoins || 0,
                gameActivity: {
                    averageRating: user.gameRatings.length > 0
                        ? user.gameRatings.reduce((sum, r) => sum + r.rating, 0) /
                            user.gameRatings.length
                        : 0,
                    totalFavorites: user.gameFavorites.length,
                    totalLikes: user.gameLikes.length,
                    totalRatings: user.gameRatings.length,
                    totalReviews: user.gameReviews.length
                },
                lastActiveAt: user.lastActiveAt,
                location: user.location,
                premiumCoins: user.userCoinBalance?.premiumCoins || 0,
                recentNotifications: user.userNotifications,
                recentTransactions: user.coinTransactions,
                referrerAddress: user.referrerAddress,
                registrationDate: user.registrationDate,
                socialCoins: user.userCoinBalance?.socialCoins || 0,
                stats: user.userStats,
                status: user.status,
                totalLogins: user.totalLogins,
                tournamentActivity: user.tournamentParticipants.map((participant) => ({
                    coinsBurned: participant.coinsBurned,
                    createdAt: participant.createdAt,
                    prizeAmount: participant.prizeAmount,
                    prizePool: participant.tournament.prizePool,
                    tournamentId: participant.tournament.id,
                    tournamentName: participant.tournament.name,
                    tournamentStatus: participant.tournament.status
                })),
                twitterHandle: user.twitterHandle,
                username: user.username,
                walletAddress: user.walletAddress,
                website: user.website
            }
        });
    }
    catch (error) {
        logger_1.default.error("Error getting user:", error);
        return (0, errorHandler_1.errorHandler)(error, c);
    }
});
// PUT /admin-system/users/:walletAddress - Update user
adminSystemRouter.put("/users/:walletAddress", authMiddleware_1.default, (0, rateLimiter_1.rateLimiter)({ max: 20, windowMs: 60000 }), (0, zod_validator_1.zValidator)("param", getUserSchema), (0, zod_validator_1.zValidator)("json", updateUserSchema), async (c) => {
    try {
        const { walletAddress } = c.req.valid("param");
        const updateData = c.req.valid("json");
        const user = await prisma.user.update({
            data: {
                ...updateData,
                updatedAt: new Date()
            },
            where: { walletAddress }
        });
        return c.json({
            message: "User updated successfully",
            success: true,
            user: {
                bio: user.bio,
                displayName: user.displayName,
                location: user.location,
                status: user.status,
                twitterHandle: user.twitterHandle,
                updatedAt: user.updatedAt,
                username: user.username,
                walletAddress: user.walletAddress,
                website: user.website
            }
        });
    }
    catch (error) {
        logger_1.default.error("Error updating user:", error);
        return (0, errorHandler_1.errorHandler)(error, c);
    }
});
// POST /admin-system/ban-user - Ban user (equivalent to banCheck.php)
adminSystemRouter.post("/ban-user", authMiddleware_1.default, (0, rateLimiter_1.rateLimiter)({ max: 10, windowMs: 60000 }), (0, zod_validator_1.zValidator)("json", banUserSchema), async (c) => {
    try {
        const { walletAddress, reason, duration } = c.req.valid("json");
        const user = await prisma.user.findUnique({
            where: { walletAddress }
        });
        if (!user) {
            return c.json({ error: "User not found" }, 404);
        }
        // Update user status to banned
        await prisma.user.update({
            data: { status: "Banned" },
            where: { walletAddress }
        });
        // Record admin action
        await prisma.adminAction.create({
            data: {
                actionType: "BlockUser",
                adminUserId: c.get("walletAddress"), // Assuming admin wallet address
                metadata: {
                    bannedAt: new Date().toISOString(),
                    duration
                },
                reason,
                status: "Completed",
                targetWallet: walletAddress
            }
        });
        return c.json({
            duration,
            message: "User banned successfully",
            reason,
            success: true,
            walletAddress
        });
    }
    catch (error) {
        logger_1.default.error("Error banning user:", error);
        return (0, errorHandler_1.errorHandler)(error, c);
    }
});
// POST /admin-system/adjust-coins - Adjust user coins
adminSystemRouter.post("/adjust-coins", authMiddleware_1.default, (0, rateLimiter_1.rateLimiter)({ max: 10, windowMs: 60000 }), (0, zod_validator_1.zValidator)("json", adjustCoinsSchema), async (c) => {
    try {
        const { walletAddress, amount, coinType, reason } = c.req.valid("json");
        const user = await prisma.user.findUnique({
            include: { userCoinBalance: true },
            where: { walletAddress }
        });
        if (!user) {
            return c.json({ error: "User not found" }, 404);
        }
        const currentBalance = user.userCoinBalance || {
            achievementCoins: 0,
            experienceCoins: 0,
            premiumCoins: 0,
            socialCoins: 0,
            totalCoins: 0
        };
        const newTotalCoins = currentBalance.totalCoins + amount;
        const newCoinTypeBalance = currentBalance[`${coinType.toLowerCase()}Coins`] + amount;
        // Update coin balance
        await prisma.userCoinBalance.upsert({
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
                description: `Admin adjustment: ${reason}`,
                sourceType: "Admin",
                transactionType: amount > 0 ? "Earned" : "Spent",
                walletAddress
            }
        });
        // Record admin action
        await prisma.adminAction.create({
            data: {
                actionType: "AdminAdjustment",
                adminUserId: c.get("walletAddress"),
                metadata: {
                    amount,
                    coinType,
                    newBalance: newTotalCoins,
                    previousBalance: currentBalance.totalCoins
                },
                reason,
                status: "Completed",
                targetWallet: walletAddress
            }
        });
        return c.json({
            amount,
            coinType,
            message: "Coins adjusted successfully",
            newBalance: newTotalCoins,
            previousBalance: currentBalance.totalCoins,
            success: true,
            walletAddress
        });
    }
    catch (error) {
        logger_1.default.error("Error adjusting coins:", error);
        return (0, errorHandler_1.errorHandler)(error, c);
    }
});
// GET /admin-system/stats - Get system statistics
adminSystemRouter.get("/stats", authMiddleware_1.default, (0, rateLimiter_1.rateLimiter)({ max: 30, windowMs: 60000 }), async (c) => {
    try {
        const [totalUsers, activeUsers, bannedUsers, premiumUsers, totalCoins, totalTransactions, recentUsers, topUsers] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({
                where: {
                    lastActiveAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                    }
                }
            }),
            prisma.user.count({ where: { status: "Banned" } }),
            prisma.user.count({ where: { status: "Premium" } }),
            prisma.userCoinBalance.aggregate({
                _sum: { totalCoins: true }
            }),
            prisma.coinTransaction.count(),
            prisma.user.findMany({
                orderBy: { createdAt: "desc" },
                select: {
                    createdAt: true,
                    displayName: true,
                    status: true,
                    username: true,
                    walletAddress: true
                },
                take: 10
            }),
            prisma.user.findMany({
                include: {
                    userCoinBalance: true
                },
                orderBy: {
                    userCoinBalance: {
                        totalCoins: "desc"
                    }
                },
                select: {
                    displayName: true,
                    userCoinBalance: {
                        select: {
                            totalCoins: true
                        }
                    },
                    username: true,
                    walletAddress: true
                },
                take: 10
            })
        ]);
        return c.json({
            stats: {
                activeUsers,
                bannedUsers,
                premiumUsers,
                recentUsers,
                topUsers: topUsers.map((user) => ({
                    displayName: user.displayName,
                    totalCoins: user.userCoinBalance?.totalCoins || 0,
                    username: user.username,
                    walletAddress: user.walletAddress
                })),
                totalCoins: totalCoins._sum.totalCoins || 0,
                totalTransactions,
                totalUsers
            },
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error getting admin stats:", error);
        return (0, errorHandler_1.errorHandler)(error, c);
    }
});
exports.default = adminSystemRouter;
