"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGameStats = exports.getGameLeaderboard = exports.getGameAnalytics = void 0;
const zod_1 = require("zod");
const client_1 = __importDefault(require("../../prisma/client"));
const analyticsSchema = zod_1.z.object({
    gameId: zod_1.z.string().optional(),
    metric: zod_1.z.enum(["plays", "likes", "ratings", "reports"]).optional(),
    period: zod_1.z.enum(["day", "week", "month", "year"]).default("week")
});
const getGameAnalytics = async (c) => {
    try {
        const query = c.req.query();
        const { gameId, period } = analyticsSchema.parse(query);
        const now = new Date();
        const startDate = new Date();
        switch (period) {
            case "day":
                startDate.setDate(now.getDate() - 1);
                break;
            case "week":
                startDate.setDate(now.getDate() - 7);
                break;
            case "month":
                startDate.setMonth(now.getMonth() - 1);
                break;
            case "year":
                startDate.setFullYear(now.getFullYear() - 1);
                break;
        }
        const where = gameId ? { gameId } : {};
        const timeFilter = { createdAt: { gte: startDate } };
        const analytics = await Promise.all([
            // Play count analytics
            client_1.default.gamePlay.groupBy({
                _avg: { playDuration: true, score: true },
                _count: { id: true },
                _sum: { playDuration: true, score: true },
                by: ["gameId"],
                where: { ...where, ...timeFilter }
            }),
            // Rating analytics
            client_1.default.gameRating.groupBy({
                _avg: { rating: true },
                _count: { id: true },
                by: ["gameId"],
                where: { ...where, ...timeFilter }
            }),
            // Like analytics
            client_1.default.gameLike.groupBy({
                _count: { id: true },
                by: ["gameId"],
                where: { ...where, ...timeFilter }
            }),
            // Report analytics
            client_1.default.gameReport.groupBy({
                _count: { id: true },
                by: ["gameId"],
                where: { ...where, ...timeFilter }
            })
        ]);
        // Get game details if specific game requested
        let gameDetails = null;
        if (gameId) {
            gameDetails = await client_1.default.game.findUnique({
                select: {
                    createdAt: true,
                    id: true,
                    slug: true,
                    status: true,
                    title: true
                },
                where: { id: gameId }
            });
        }
        return c.json({
            analytics: {
                likes: analytics[2],
                plays: analytics[0],
                ratings: analytics[1],
                reports: analytics[3]
            },
            gameDetails,
            gameId,
            period,
            success: true,
            summary: {
                avgRating: analytics[1].length > 0
                    ? analytics[1].reduce((sum, item) => sum + (item._avg.rating || 0), 0) / analytics[1].length
                    : 0,
                totalLikes: analytics[2].reduce((sum, item) => sum + item._count.id, 0),
                totalPlays: analytics[0].reduce((sum, item) => sum + item._count.id, 0),
                totalReports: analytics[3].reduce((sum, item) => sum + item._count.id, 0)
            }
        });
    }
    catch (error) {
        console.error("Error fetching game analytics:", error);
        return c.json({
            error: "Failed to fetch analytics",
            success: false
        }, 500);
    }
};
exports.getGameAnalytics = getGameAnalytics;
const getGameLeaderboard = async (c) => {
    try {
        const query = c.req.query();
        const { gameId } = zod_1.z.object({ gameId: zod_1.z.string() }).parse(query);
        const leaderboard = await client_1.default.gamePlay.findMany({
            orderBy: { score: "desc" },
            select: {
                completed: true,
                createdAt: true,
                id: true,
                playDuration: true,
                playerAddress: true,
                score: true
            },
            take: 50,
            where: { gameId, score: { not: null } }
        });
        // Get user info for top players
        const playerAddresses = leaderboard.map((play) => play.playerAddress);
        const users = await client_1.default.user.findMany({
            select: {
                avatarUrl: true,
                displayName: true,
                username: true,
                walletAddress: true
            },
            where: { walletAddress: { in: playerAddresses } }
        });
        const userMap = new Map(users.map((user) => [user.walletAddress, user]));
        const enrichedLeaderboard = leaderboard.map((play, index) => ({
            rank: index + 1,
            ...play,
            user: userMap.get(play.playerAddress) || {
                avatarUrl: null,
                displayName: `Player ${play.playerAddress.slice(0, 6)}...`,
                username: null,
                walletAddress: play.playerAddress
            }
        }));
        return c.json({
            gameId,
            leaderboard: enrichedLeaderboard,
            success: true
        });
    }
    catch (error) {
        console.error("Error fetching leaderboard:", error);
        return c.json({
            error: "Failed to fetch leaderboard",
            success: false
        }, 500);
    }
};
exports.getGameLeaderboard = getGameLeaderboard;
const getGameStats = async (c) => {
    try {
        const query = c.req.query();
        const { gameId } = zod_1.z.object({ gameId: zod_1.z.string() }).parse(query);
        const [game, playStats, ratingStats, socialStats] = await Promise.all([
            client_1.default.game.findUnique({
                include: {
                    categories: true,
                    GameTag: true
                },
                where: { id: gameId }
            }),
            client_1.default.gamePlay.aggregate({
                _avg: { playDuration: true, score: true },
                _count: { id: true },
                _max: { score: true },
                _sum: { playDuration: true },
                where: { gameId }
            }),
            client_1.default.gameRating.aggregate({
                _avg: { rating: true },
                _count: { id: true },
                where: { gameId }
            }),
            Promise.all([
                client_1.default.gameLike.count({ where: { gameId } }),
                client_1.default.gameDislike.count({ where: { gameId } }),
                client_1.default.gameReport.count({ where: { gameId } })
            ])
        ]);
        if (!game) {
            return c.json({ error: "Game not found", success: false }, 404);
        }
        return c.json({
            game: {
                categories: game.categories,
                description: game.description,
                id: game.id,
                slug: game.slug,
                tags: game.GameTag,
                title: game.title
            },
            stats: {
                plays: {
                    avgDuration: playStats._avg.playDuration || 0,
                    avgScore: playStats._avg.score || 0,
                    maxScore: playStats._max.score || 0,
                    total: playStats._count.id,
                    totalDuration: playStats._sum.playDuration || 0
                },
                ratings: {
                    average: ratingStats._avg.rating || 0,
                    total: ratingStats._count.id
                },
                social: {
                    dislikes: socialStats[1],
                    likes: socialStats[0],
                    reports: socialStats[2]
                }
            },
            success: true
        });
    }
    catch (error) {
        console.error("Error fetching game stats:", error);
        return c.json({
            error: "Failed to fetch game stats",
            success: false
        }, 500);
    }
};
exports.getGameStats = getGameStats;
