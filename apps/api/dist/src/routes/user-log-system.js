"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const hono_1 = require("hono");
const zod_1 = require("zod");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const handleApiError_1 = __importDefault(require("../utils/handleApiError"));
const prisma = new client_1.PrismaClient();
const userLogSystem = new hono_1.Hono();
// Validation schemas
const logUserSchema = zod_1.z.object({
    action: zod_1.z.string(),
    details: zod_1.z.record(zod_1.z.any()).optional(),
    ipAddress: zod_1.z.string().optional(),
    userAgent: zod_1.z.string().optional(),
    walletAddress: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/)
});
const checkLevelValueSchema = zod_1.z.object({
    totalEq: zod_1.z.number().int().min(0),
    walletAddress: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/)
});
const growthCalculateSchema = zod_1.z.object({
    period: zod_1.z.enum(["daily", "weekly", "monthly"]).default("daily"),
    walletAddress: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/)
});
// POST /log - Log user action
userLogSystem.post("/log", async (c) => {
    try {
        const body = await c.req.json();
        const { walletAddress, action, details, ipAddress, userAgent } = logUserSchema.parse(body);
        // Get user info
        const user = await prisma.user.findUnique({
            select: { id: true, totalEq: true, username: true },
            where: { walletAddress }
        });
        if (!user) {
            return c.json({
                error: "User not found",
                success: false
            }, 404);
        }
        // Create log entry
        const logEntry = await prisma.userLog.create({
            data: {
                action,
                details: details || {},
                ipAddress: ipAddress || c.req.header("x-forwarded-for") || "unknown",
                timestamp: new Date(),
                userAgent: userAgent || c.req.header("user-agent") || "unknown",
                walletAddress
            }
        });
        return c.json({
            logId: logEntry.id,
            message: "User action logged successfully",
            success: true
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// POST /check-level-value - Check user's level value
userLogSystem.post("/check-level-value", async (c) => {
    try {
        const body = await c.req.json();
        const { walletAddress, totalEq } = checkLevelValueSchema.parse(body);
        // Find matching EQ level
        const level = await prisma.eqLevelsStamina.findFirst({
            where: {
                maxEq: { gte: totalEq },
                minEq: { lte: totalEq }
            }
        });
        // Calculate stamina based on level
        let stamina = 0;
        if (level) {
            stamina = level.levelValue;
        }
        else {
            // Default stamina calculation
            if (totalEq >= 2) {
                stamina = 2500;
            }
            else if (totalEq === 1) {
                stamina = 1500;
            }
            else {
                stamina = 1600;
            }
        }
        // Check if user is old (more than 90 days)
        const user = await prisma.user.findUnique({
            select: { createdAt: true },
            where: { walletAddress }
        });
        if (user) {
            const daysSinceCreation = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceCreation > 90) {
                stamina = 500; // Old accounts get reduced stamina
            }
        }
        return c.json({
            level: level || null,
            levelValue: level?.levelValue || 0,
            stamina,
            success: true,
            totalEq,
            walletAddress
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// POST /growth-calculate - Calculate user growth
userLogSystem.post("/growth-calculate", async (c) => {
    try {
        const body = await c.req.json();
        const { walletAddress, period } = growthCalculateSchema.parse(body);
        const user = await prisma.user.findUnique({
            select: { coins: true, createdAt: true, totalEq: true },
            where: { walletAddress }
        });
        if (!user) {
            return c.json({
                error: "User not found",
                success: false
            }, 404);
        }
        // Calculate period start date
        const now = new Date();
        let periodStart;
        switch (period) {
            case "daily":
                periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case "weekly":
                periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case "monthly":
                periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
        }
        // Get user logs for the period
        const logs = await prisma.userLog.findMany({
            orderBy: { timestamp: "desc" },
            where: {
                timestamp: { gte: periodStart },
                walletAddress
            }
        });
        // Calculate growth metrics
        const totalActions = logs.length;
        const uniqueActions = new Set(logs.map((log) => log.action)).size;
        const avgActionsPerDay = totalActions / (period === "daily" ? 1 : period === "weekly" ? 7 : 30);
        // Get coin transactions for the period
        const coinTransactions = await prisma.coinTransaction.findMany({
            where: {
                createdAt: { gte: periodStart },
                walletAddress
            }
        });
        const totalCoinsEarned = coinTransactions
            .filter((tx) => tx.transactionType === "Earned")
            .reduce((sum, tx) => sum + tx.amount, 0);
        const totalCoinsSpent = coinTransactions
            .filter((tx) => tx.transactionType === "Spent")
            .reduce((sum, tx) => sum + tx.amount, 0);
        return c.json({
            growth: {
                avgActionsPerDay: Math.round(avgActionsPerDay * 100) / 100,
                currentCoins: user.coins,
                currentEq: user.totalEq,
                netCoins: totalCoinsEarned - totalCoinsSpent,
                totalActions,
                totalCoinsEarned,
                totalCoinsSpent,
                uniqueActions
            },
            logs: logs.slice(0, 10), // Last 10 actions
            period,
            success: true,
            walletAddress
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// GET /logs/:walletAddress - Get user logs
userLogSystem.get("/logs/:walletAddress", async (c) => {
    try {
        const walletAddress = c.req.param("walletAddress");
        const page = Number.parseInt(c.req.query("page") || "1");
        const limit = Number.parseInt(c.req.query("limit") || "50");
        const action = c.req.query("action");
        const skip = (page - 1) * limit;
        const where = { walletAddress };
        if (action) {
            where.action = action;
        }
        const [logs, total] = await Promise.all([
            prisma.userLog.findMany({
                orderBy: { timestamp: "desc" },
                skip,
                take: limit,
                where
            }),
            prisma.userLog.count({ where })
        ]);
        return c.json({
            logs,
            pagination: {
                limit,
                page,
                pages: Math.ceil(total / limit),
                total
            },
            success: true
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// GET /logs/stats - Get log statistics
userLogSystem.get("/logs/stats", authMiddleware_1.default, async (c) => {
    try {
        const [totalLogs, uniqueUsers, actionStats, recentLogs] = await Promise.all([
            prisma.userLog.count(),
            prisma.userLog.findMany({
                distinct: ["walletAddress"],
                select: { walletAddress: true }
            }),
            prisma.userLog.groupBy({
                _count: { action: true },
                by: ["action"]
            }),
            prisma.userLog.findMany({
                include: {
                    user: {
                        select: {
                            username: true,
                            walletAddress: true
                        }
                    }
                },
                orderBy: { timestamp: "desc" },
                take: 10
            })
        ]);
        return c.json({
            stats: {
                actionStats: actionStats.map((stat) => ({
                    action: stat.action,
                    count: stat._count.action
                })),
                recentLogs,
                totalLogs,
                uniqueUsers: uniqueUsers.length
            },
            success: true
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// POST /update-users-coin - Update users' coins based on age
userLogSystem.post("/update-users-coin", authMiddleware_1.default, async (c) => {
    try {
        const body = await c.req.json();
        const { chunkSize = 100, maxAge = 60 } = zod_1.z
            .object({
            chunkSize: zod_1.z.number().int().positive().default(100),
            maxAge: zod_1.z.number().int().positive().default(60)
        })
            .parse(body);
        const cutoffDate = new Date(Date.now() - maxAge * 24 * 60 * 60 * 1000);
        // Get users older than maxAge days
        const users = await prisma.user.findMany({
            select: {
                createdAt: true,
                totalEq: true,
                walletAddress: true
            },
            take: chunkSize,
            where: {
                createdAt: { lt: cutoffDate },
                totalEq: { lt: 2 }
            }
        });
        const results = [];
        for (const user of users) {
            try {
                // Calculate new coin amount based on age and EQ
                const daysSinceCreation = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
                let newCoins = 0;
                if (user.totalEq >= 2) {
                    newCoins = 2500;
                }
                else if (user.totalEq === 1) {
                    newCoins = 1500;
                }
                else {
                    newCoins = 1600;
                }
                // Reduce coins for old accounts
                if (daysSinceCreation > 90) {
                    newCoins = 500;
                }
                // Update user coins
                await prisma.user.update({
                    data: { coins: newCoins },
                    where: { walletAddress: user.walletAddress }
                });
                // Log the update
                await prisma.userLog.create({
                    data: {
                        action: "coin_update",
                        details: {
                            daysSinceCreation,
                            newCoins,
                            oldCoins: 0, // We don't track old coins
                            totalEq: user.totalEq
                        },
                        timestamp: new Date(),
                        walletAddress: user.walletAddress
                    }
                });
                results.push({
                    daysSinceCreation,
                    newCoins,
                    totalEq: user.totalEq,
                    walletAddress: user.walletAddress
                });
            }
            catch (error) {
                console.error(`Error updating user ${user.walletAddress}:`, error);
                results.push({
                    error: error instanceof Error ? error.message : "Unknown error",
                    walletAddress: user.walletAddress
                });
            }
        }
        return c.json({
            message: `Updated ${results.length} users`,
            results,
            success: true
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// GET /logs/export/:walletAddress - Export user logs as CSV
userLogSystem.get("/logs/export/:walletAddress", async (c) => {
    try {
        const walletAddress = c.req.param("walletAddress");
        const action = c.req.query("action");
        const where = { walletAddress };
        if (action) {
            where.action = action;
        }
        const logs = await prisma.userLog.findMany({
            orderBy: { timestamp: "desc" },
            where
        });
        const csvHeaders = [
            "id",
            "walletAddress",
            "action",
            "details",
            "ipAddress",
            "userAgent",
            "timestamp"
        ];
        const csvRows = logs.map((log) => [
            log.id,
            log.walletAddress,
            log.action,
            JSON.stringify(log.details),
            log.ipAddress,
            log.userAgent,
            log.timestamp.toISOString()
        ]);
        const csv = [
            csvHeaders.join(","),
            ...csvRows.map((row) => row.join(","))
        ].join("\n");
        c.header("Content-Type", "text/csv");
        c.header("Content-Disposition", `attachment; filename=user_logs_${walletAddress}.csv`);
        return c.text(csv);
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
exports.default = userLogSystem;
