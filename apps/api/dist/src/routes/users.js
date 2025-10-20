"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const zod_validator_1 = require("@hono/zod-validator");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middlewares/errorHandler");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const rateLimiter_1 = require("../middlewares/rateLimiter");
const logger_1 = __importDefault(require("@hey/helpers/logger"));
const prisma = new client_1.PrismaClient();
const usersRouter = new hono_1.Hono();
// Validation schemas
const createUserSchema = zod_1.z.object({
    walletAddress: zod_1.z.string().min(42).max(42),
    username: zod_1.z.string().min(3).max(50).optional(),
    displayName: zod_1.z.string().min(1).max(100).optional(),
    referrerAddress: zod_1.z.string().min(42).max(42).optional(),
    registrationTxHash: zod_1.z.string().optional(),
});
const updateUserSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).max(50).optional(),
    displayName: zod_1.z.string().min(1).max(100).optional(),
    bio: zod_1.z.string().max(500).optional(),
    location: zod_1.z.string().max(100).optional(),
    website: zod_1.z.string().url().optional(),
    twitterHandle: zod_1.z.string().max(50).optional(),
});
const getUserDataSchema = zod_1.z.object({
    walletAddress: zod_1.z.string().min(42).max(42),
});
// POST /users - Create or get user
usersRouter.post("/", (0, rateLimiter_1.rateLimiter)({ max: 10, windowMs: 60000 }), // 10 requests per minute
(0, zod_validator_1.zValidator)("json", createUserSchema), async (c) => {
    try {
        const data = c.req.valid("json");
        const { walletAddress, username, displayName, referrerAddress, registrationTxHash } = data;
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { walletAddress },
            include: {
                userCoinBalance: true,
                userStats: true,
            },
        });
        if (existingUser) {
            // Update last active time
            await prisma.user.update({
                where: { walletAddress },
                data: {
                    lastActiveAt: new Date(),
                    totalLogins: { increment: 1 }
                },
            });
            return c.json({
                success: true,
                message: "User found",
                user: {
                    walletAddress: existingUser.walletAddress,
                    username: existingUser.username,
                    displayName: existingUser.displayName,
                    avatarUrl: existingUser.avatarUrl,
                    bio: existingUser.bio,
                    location: existingUser.location,
                    website: existingUser.website,
                    twitterHandle: existingUser.twitterHandle,
                    registrationDate: existingUser.registrationDate,
                    referrerAddress: existingUser.referrerAddress,
                    status: existingUser.status,
                    lastActiveAt: existingUser.lastActiveAt,
                    totalLogins: existingUser.totalLogins + 1,
                    coins: existingUser.userCoinBalance?.totalCoins || 0,
                    experienceCoins: existingUser.userCoinBalance?.experienceCoins || 0,
                    achievementCoins: existingUser.userCoinBalance?.achievementCoins || 0,
                    socialCoins: existingUser.userCoinBalance?.socialCoins || 0,
                    premiumCoins: existingUser.userCoinBalance?.premiumCoins || 0,
                },
            });
        }
        // Create new user
        const newUser = await prisma.user.create({
            data: {
                walletAddress,
                username,
                displayName: displayName || username,
                referrerAddress,
                registrationTxHash,
                status: "Standard",
            },
            include: {
                userCoinBalance: true,
                userStats: true,
            },
        });
        // Initialize coin balance
        await prisma.userCoinBalance.create({
            data: {
                walletAddress,
                totalCoins: 0,
                experienceCoins: 0,
                achievementCoins: 0,
                socialCoins: 0,
                premiumCoins: 0,
            },
        });
        // Initialize user stats
        await prisma.userStats.create({
            data: {
                walletAddress,
                totalPosts: 0,
                totalComments: 0,
                totalLikes: 0,
                totalFollowers: 0,
                totalFollowing: 0,
                daysAsPremium: 0,
                referralCount: 0,
                totalEarnings: 0,
                questsCompleted: 0,
                questsInProgress: 0,
            },
        });
        return c.json({
            success: true,
            message: "User created successfully",
            user: {
                walletAddress: newUser.walletAddress,
                username: newUser.username,
                displayName: newUser.displayName,
                avatarUrl: newUser.avatarUrl,
                bio: newUser.bio,
                location: newUser.location,
                website: newUser.website,
                twitterHandle: newUser.twitterHandle,
                registrationDate: newUser.registrationDate,
                referrerAddress: newUser.referrerAddress,
                status: newUser.status,
                lastActiveAt: newUser.lastActiveAt,
                totalLogins: newUser.totalLogins,
                coins: 0,
                experienceCoins: 0,
                achievementCoins: 0,
                socialCoins: 0,
                premiumCoins: 0,
            },
        }, 201);
    }
    catch (error) {
        logger_1.default.error("Error creating/getting user:", error);
        return (0, errorHandler_1.errorHandler)(error, c);
    }
});
// GET /users/:walletAddress - Get user data
usersRouter.get("/:walletAddress", (0, rateLimiter_1.rateLimiter)({ max: 30, windowMs: 60000 }), // 30 requests per minute
(0, zod_validator_1.zValidator)("param", getUserDataSchema), async (c) => {
    try {
        const { walletAddress } = c.req.valid("param");
        const user = await prisma.user.findUnique({
            where: { walletAddress },
            include: {
                userCoinBalance: true,
                userStats: true,
                userNotifications: {
                    where: { isRead: false },
                    orderBy: { createdAt: "desc" },
                    take: 10,
                },
            },
        });
        if (!user) {
            return c.json({ error: "User not found" }, 404);
        }
        // Get tournament participation
        const tournamentIds = await prisma.tournamentParticipant.findMany({
            where: { walletAddress },
            select: { tournamentId: true },
        });
        return c.json({
            success: true,
            user: {
                walletAddress: user.walletAddress,
                username: user.username,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                bio: user.bio,
                location: user.location,
                website: user.website,
                twitterHandle: user.twitterHandle,
                registrationDate: user.registrationDate,
                referrerAddress: user.referrerAddress,
                status: user.status,
                lastActiveAt: user.lastActiveAt,
                totalLogins: user.totalLogins,
                coins: user.userCoinBalance?.totalCoins || 0,
                experienceCoins: user.userCoinBalance?.experienceCoins || 0,
                achievementCoins: user.userCoinBalance?.achievementCoins || 0,
                socialCoins: user.userCoinBalance?.socialCoins || 0,
                premiumCoins: user.userCoinBalance?.premiumCoins || 0,
                stats: user.userStats,
                unreadNotifications: user.userNotifications.length,
                hasTournaments: tournamentIds.length > 0,
                tournamentIds: tournamentIds.map(t => t.tournamentId),
            },
        });
    }
    catch (error) {
        logger_1.default.error("Error getting user data:", error);
        return (0, errorHandler_1.errorHandler)(error, c);
    }
});
// PUT /users/:walletAddress - Update user
usersRouter.put("/:walletAddress", authMiddleware_1.default, (0, rateLimiter_1.rateLimiter)({ max: 20, windowMs: 60000 }), // 20 requests per minute
(0, zod_validator_1.zValidator)("param", getUserDataSchema), (0, zod_validator_1.zValidator)("json", updateUserSchema), async (c) => {
    try {
        const { walletAddress } = c.req.valid("param");
        const updateData = c.req.valid("json");
        const authWalletAddress = c.get("walletAddress");
        // Check if user is updating their own profile
        if (walletAddress !== authWalletAddress) {
            return c.json({ error: "Unauthorized" }, 403);
        }
        const updatedUser = await prisma.user.update({
            where: { walletAddress },
            data: {
                ...updateData,
                updatedAt: new Date(),
            },
            include: {
                userCoinBalance: true,
                userStats: true,
            },
        });
        return c.json({
            success: true,
            message: "User updated successfully",
            user: {
                walletAddress: updatedUser.walletAddress,
                username: updatedUser.username,
                displayName: updatedUser.displayName,
                avatarUrl: updatedUser.avatarUrl,
                bio: updatedUser.bio,
                location: updatedUser.location,
                website: updatedUser.website,
                twitterHandle: updatedUser.twitterHandle,
                registrationDate: updatedUser.registrationDate,
                referrerAddress: updatedUser.referrerAddress,
                status: updatedUser.status,
                lastActiveAt: updatedUser.lastActiveAt,
                totalLogins: updatedUser.totalLogins,
                coins: updatedUser.userCoinBalance?.totalCoins || 0,
                experienceCoins: updatedUser.userCoinBalance?.experienceCoins || 0,
                achievementCoins: updatedUser.userCoinBalance?.achievementCoins || 0,
                socialCoins: updatedUser.userCoinBalance?.socialCoins || 0,
                premiumCoins: updatedUser.userCoinBalance?.premiumCoins || 0,
            },
        });
    }
    catch (error) {
        logger_1.default.error("Error updating user:", error);
        return (0, errorHandler_1.errorHandler)(error, c);
    }
});
// GET /users/:walletAddress/stats - Get user statistics
usersRouter.get("/:walletAddress/stats", (0, rateLimiter_1.rateLimiter)({ max: 30, windowMs: 60000 }), (0, zod_validator_1.zValidator)("param", getUserDataSchema), async (c) => {
    try {
        const { walletAddress } = c.req.valid("param");
        const user = await prisma.user.findUnique({
            where: { walletAddress },
            include: {
                userStats: true,
                userCoinBalance: true,
                gameLikes: { select: { id: true } },
                gameRatings: { select: { id: true } },
                gameFavorites: { select: { id: true } },
                gameReviews: { select: { id: true } },
                tournamentParticipants: { select: { id: true } },
            },
        });
        if (!user) {
            return c.json({ error: "User not found" }, 404);
        }
        return c.json({
            success: true,
            stats: {
                ...user.userStats,
                totalGameLikes: user.gameLikes.length,
                totalGameRatings: user.gameRatings.length,
                totalGameFavorites: user.gameFavorites.length,
                totalGameReviews: user.gameReviews.length,
                totalTournaments: user.tournamentParticipants.length,
                coins: user.userCoinBalance?.totalCoins || 0,
                experienceCoins: user.userCoinBalance?.experienceCoins || 0,
                achievementCoins: user.userCoinBalance?.achievementCoins || 0,
                socialCoins: user.userCoinBalance?.socialCoins || 0,
                premiumCoins: user.userCoinBalance?.premiumCoins || 0,
            },
        });
    }
    catch (error) {
        logger_1.default.error("Error getting user stats:", error);
        return (0, errorHandler_1.errorHandler)(error, c);
    }
});
exports.default = usersRouter;
