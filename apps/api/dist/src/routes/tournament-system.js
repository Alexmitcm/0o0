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
const tournamentSystemRouter = new hono_1.Hono();
// Validation schemas
const createTournamentSchema = zod_1.z.object({
    chainId: zod_1.z.number().int().optional(),
    endDate: zod_1.z.string().datetime(),
    equilibriumMax: zod_1.z.number().int().min(0).optional(),
    equilibriumMin: zod_1.z.number().int().min(0).optional(),
    minCoins: zod_1.z.number().min(0).optional(),
    name: zod_1.z.string().min(3).max(100),
    prizePool: zod_1.z.number().positive(),
    prizeTokenAddress: zod_1.z.string().optional(),
    startDate: zod_1.z.string().datetime(),
    type: zod_1.z.enum(["Balanced", "Unbalanced"])
});
const joinTournamentSchema = zod_1.z.object({
    coinsBurned: zod_1.z.number().positive(),
    tournamentId: zod_1.z.string().min(1)
});
const getTournamentSchema = zod_1.z.object({
    tournamentId: zod_1.z.string().min(1)
});
// POST /tournament-system - Create tournament (equivalent to addTournoments.php)
tournamentSystemRouter.post("/", authMiddleware_1.default, (0, rateLimiter_1.rateLimiter)({ max: 5, windowMs: 60000 }), // 5 requests per minute
(0, zod_validator_1.zValidator)("json", createTournamentSchema), async (c) => {
    try {
        const data = c.req.valid("json");
        const { name, type, startDate, endDate, prizePool, minCoins, equilibriumMin, equilibriumMax, prizeTokenAddress, chainId } = data;
        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start >= end) {
            return c.json({ error: "End date must be after start date" }, 400);
        }
        if (start <= new Date()) {
            return c.json({ error: "Start date must be in the future" }, 400);
        }
        const tournament = await prisma.tournament.create({
            data: {
                chainId,
                endDate: end,
                equilibriumMax,
                equilibriumMin,
                minCoins,
                name,
                prizePool,
                prizeTokenAddress,
                startDate: start,
                status: "Upcoming",
                type
            }
        });
        return c.json({
            message: "Tournament created successfully",
            success: true,
            tournament: {
                chainId: tournament.chainId,
                createdAt: tournament.createdAt,
                endDate: tournament.endDate,
                equilibriumMax: tournament.equilibriumMax,
                equilibriumMin: tournament.equilibriumMin,
                id: tournament.id,
                minCoins: tournament.minCoins,
                name: tournament.name,
                prizePool: tournament.prizePool,
                prizeTokenAddress: tournament.prizeTokenAddress,
                startDate: tournament.startDate,
                status: tournament.status,
                type: tournament.type
            }
        }, 201);
    }
    catch (error) {
        logger_1.default.error("Error creating tournament:", error);
        return (0, errorHandler_1.errorHandler)(error, c);
    }
});
// GET /tournament-system - Get all tournaments (equivalent to GetAllTournos.php)
tournamentSystemRouter.get("/", (0, rateLimiter_1.rateLimiter)({ max: 30, windowMs: 60000 }), async (c) => {
    try {
        const page = Number.parseInt(c.req.query("page") || "1");
        const limit = Number.parseInt(c.req.query("limit") || "20");
        const status = c.req.query("status");
        const type = c.req.query("type");
        const offset = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        if (type)
            where.type = type;
        const [tournaments, total] = await Promise.all([
            prisma.tournament.findMany({
                include: {
                    _count: {
                        select: {
                            participants: true
                        }
                    },
                    participants: {
                        select: {
                            coinsBurned: true,
                            createdAt: true,
                            id: true,
                            prizeAmount: true,
                            prizeShareBps: true,
                            walletAddress: true
                        }
                    }
                },
                orderBy: { createdAt: "desc" },
                skip: offset,
                take: limit,
                where
            }),
            prisma.tournament.count({ where })
        ]);
        return c.json({
            pagination: {
                limit,
                page,
                total,
                totalPages: Math.ceil(total / limit)
            },
            success: true,
            tournaments: tournaments.map((tournament) => ({
                chainId: tournament.chainId,
                createdAt: tournament.createdAt,
                endDate: tournament.endDate,
                equilibriumMax: tournament.equilibriumMax,
                equilibriumMin: tournament.equilibriumMin,
                id: tournament.id,
                minCoins: tournament.minCoins,
                name: tournament.name,
                participantCount: tournament._count.participants,
                participants: tournament.participants,
                prizePool: tournament.prizePool,
                prizeTokenAddress: tournament.prizeTokenAddress,
                startDate: tournament.startDate,
                status: tournament.status,
                type: tournament.type,
                updatedAt: tournament.updatedAt
            }))
        });
    }
    catch (error) {
        logger_1.default.error("Error getting tournaments:", error);
        return (0, errorHandler_1.errorHandler)(error, c);
    }
});
// GET /tournament-system/:tournamentId - Get single tournament (equivalent to singleTournoment.php)
tournamentSystemRouter.get("/:tournamentId", (0, rateLimiter_1.rateLimiter)({ max: 30, windowMs: 60000 }), (0, zod_validator_1.zValidator)("param", getTournamentSchema), async (c) => {
    try {
        const { tournamentId } = c.req.valid("param");
        const tournament = await prisma.tournament.findUnique({
            include: {
                _count: {
                    select: {
                        participants: true
                    }
                },
                participants: {
                    orderBy: { createdAt: "desc" },
                    select: {
                        coinsBurned: true,
                        createdAt: true,
                        eligibilityType: true,
                        id: true,
                        prizeAmount: true,
                        prizeShareBps: true,
                        updatedAt: true,
                        user: {
                            select: {
                                avatarUrl: true,
                                displayName: true,
                                username: true,
                                walletAddress: true
                            }
                        },
                        walletAddress: true
                    }
                }
            },
            where: { id: tournamentId }
        });
        if (!tournament) {
            return c.json({ error: "Tournament not found" }, 404);
        }
        return c.json({
            success: true,
            tournament: {
                chainId: tournament.chainId,
                createdAt: tournament.createdAt,
                endDate: tournament.endDate,
                equilibriumMax: tournament.equilibriumMax,
                equilibriumMin: tournament.equilibriumMin,
                id: tournament.id,
                minCoins: tournament.minCoins,
                name: tournament.name,
                participantCount: tournament._count.participants,
                participants: tournament.participants,
                prizePool: tournament.prizePool,
                prizeTokenAddress: tournament.prizeTokenAddress,
                settledAt: tournament.settledAt,
                settlementTxHash: tournament.settlementTxHash,
                startDate: tournament.startDate,
                status: tournament.status,
                type: tournament.type,
                updatedAt: tournament.updatedAt
            }
        });
    }
    catch (error) {
        logger_1.default.error("Error getting tournament:", error);
        return (0, errorHandler_1.errorHandler)(error, c);
    }
});
// POST /tournament-system/:tournamentId/join - Join tournament (equivalent to userInsertCoin.php)
tournamentSystemRouter.post("/:tournamentId/join", authMiddleware_1.default, (0, rateLimiter_1.rateLimiter)({ max: 3, windowMs: 60000 }), // 3 requests per minute
(0, zod_validator_1.zValidator)("param", getTournamentSchema), (0, zod_validator_1.zValidator)("json", joinTournamentSchema), async (c) => {
    try {
        const { tournamentId } = c.req.valid("param");
        const { coinsBurned } = c.req.valid("json");
        const walletAddress = c.get("walletAddress");
        // Check if tournament exists and is active
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId }
        });
        if (!tournament) {
            return c.json({ error: "Tournament not found" }, 404);
        }
        if (tournament.status !== "Upcoming" && tournament.status !== "Active") {
            return c.json({ error: "Tournament is not accepting participants" }, 400);
        }
        const now = new Date();
        if (now < tournament.startDate || now > tournament.endDate) {
            return c.json({ error: "Tournament is not currently active" }, 400);
        }
        // Check if user has enough coins
        const userBalance = await prisma.userCoinBalance.findUnique({
            where: { walletAddress }
        });
        if (!userBalance || userBalance.totalCoins < coinsBurned) {
            return c.json({ error: "Insufficient coins" }, 400);
        }
        // Check if user is already participating
        const existingParticipation = await prisma.tournamentParticipant.findUnique({
            where: {
                tournamentId_walletAddress: {
                    tournamentId,
                    walletAddress
                }
            }
        });
        if (existingParticipation) {
            return c.json({ error: "Already participating in this tournament" }, 400);
        }
        // Check minimum coins requirement
        if (tournament.minCoins && coinsBurned < tournament.minCoins) {
            return c.json({
                error: `Minimum coins required: ${tournament.minCoins}`
            }, 400);
        }
        // Start transaction
        await prisma.$transaction(async (tx) => {
            // Create tournament participation
            await tx.tournamentParticipant.create({
                data: {
                    coinsBurned,
                    eligibilityType: tournament.type,
                    tournamentId,
                    walletAddress
                }
            });
            // Deduct coins from user
            await tx.userCoinBalance.update({
                data: {
                    lastUpdatedAt: new Date(),
                    totalCoins: { decrement: coinsBurned }
                },
                where: { walletAddress }
            });
            // Record coin transaction
            await tx.coinTransaction.create({
                data: {
                    amount: -coinsBurned,
                    balanceAfter: userBalance.totalCoins - coinsBurned,
                    balanceBefore: userBalance.totalCoins,
                    coinType: "Experience", // Default coin type for tournaments
                    description: `Joined tournament: ${tournament.name}`,
                    sourceId: tournamentId,
                    sourceType: "Tournament",
                    transactionType: "Spent",
                    walletAddress
                }
            });
        });
        return c.json({
            coinsBurned,
            message: "Successfully joined tournament",
            success: true,
            tournamentId,
            tournamentName: tournament.name,
            walletAddress
        });
    }
    catch (error) {
        logger_1.default.error("Error joining tournament:", error);
        return (0, errorHandler_1.errorHandler)(error, c);
    }
});
// GET /tournament-system/:tournamentId/participants - Get tournament participants
tournamentSystemRouter.get("/:tournamentId/participants", (0, rateLimiter_1.rateLimiter)({ max: 30, windowMs: 60000 }), (0, zod_validator_1.zValidator)("param", getTournamentSchema), async (c) => {
    try {
        const { tournamentId } = c.req.valid("param");
        const page = Number.parseInt(c.req.query("page") || "1");
        const limit = Number.parseInt(c.req.query("limit") || "50");
        const offset = (page - 1) * limit;
        const [participants, total] = await Promise.all([
            prisma.tournamentParticipant.findMany({
                include: {
                    user: {
                        select: {
                            avatarUrl: true,
                            displayName: true,
                            username: true,
                            walletAddress: true
                        }
                    }
                },
                orderBy: { coinsBurned: "desc" },
                skip: offset,
                take: limit,
                where: { tournamentId }
            }),
            prisma.tournamentParticipant.count({
                where: { tournamentId }
            })
        ]);
        return c.json({
            pagination: {
                limit,
                page,
                total,
                totalPages: Math.ceil(total / limit)
            },
            participants: participants.map((participant) => ({
                coinsBurned: participant.coinsBurned,
                createdAt: participant.createdAt,
                eligibilityType: participant.eligibilityType,
                id: participant.id,
                prizeAmount: participant.prizeAmount,
                prizeShareBps: participant.prizeShareBps,
                updatedAt: participant.updatedAt,
                user: participant.user,
                walletAddress: participant.walletAddress
            })),
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error getting tournament participants:", error);
        return (0, errorHandler_1.errorHandler)(error, c);
    }
});
// PUT /tournament-system/:tournamentId/status - Update tournament status
tournamentSystemRouter.put("/:tournamentId/status", authMiddleware_1.default, (0, rateLimiter_1.rateLimiter)({ max: 5, windowMs: 60000 }), (0, zod_validator_1.zValidator)("param", getTournamentSchema), (0, zod_validator_1.zValidator)("json", zod_1.z.object({
    status: zod_1.z.enum(["Upcoming", "Active", "Ended", "Settled"])
})), async (c) => {
    try {
        const { tournamentId } = c.req.valid("param");
        const { status } = c.req.valid("json");
        const tournament = await prisma.tournament.update({
            data: {
                status,
                ...(status === "Settled" && { settledAt: new Date() })
            },
            where: { id: tournamentId }
        });
        return c.json({
            message: "Tournament status updated successfully",
            success: true,
            tournament: {
                id: tournament.id,
                name: tournament.name,
                settledAt: tournament.settledAt,
                status: tournament.status
            }
        });
    }
    catch (error) {
        logger_1.default.error("Error updating tournament status:", error);
        return (0, errorHandler_1.errorHandler)(error, c);
    }
});
exports.default = tournamentSystemRouter;
