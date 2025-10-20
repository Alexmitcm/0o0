import logger from "@hey/helpers/logger";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { errorHandler } from "../../middlewares/errorHandler";
import rateLimiter from "../../middlewares/rateLimiter";
import prisma from "../../prisma/client";

const tournamentSystemRouter = new Hono();

// Validation schemas
const createTournamentSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  prize: z.number().positive(),
  entryFee: z.number().min(0),
  maxParticipants: z.number().int().positive(),
  minParticipants: z.number().int().positive().default(2),
  rules: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["upcoming", "active", "completed", "cancelled"]).default("upcoming")
});

const joinTournamentSchema = z.object({
  tournamentId: z.string().min(1),
  walletAddress: z.string().min(42).max(42)
});

const updateTournamentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  prize: z.number().positive().optional(),
  entryFee: z.number().min(0).optional(),
  maxParticipants: z.number().int().positive().optional(),
  minParticipants: z.number().int().positive().optional(),
  rules: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["upcoming", "active", "completed", "cancelled"]).optional()
});

// GET /tournament-system - Get all tournaments (equivalent to GetAllTournos.php)
tournamentSystemRouter.get(
  "/",
  rateLimiter({ max: 30, windowMs: 60000 }),
  async (c) => {
    try {
      const page = Number.parseInt(c.req.query("page") || "1");
      const limit = Number.parseInt(c.req.query("limit") || "20");
      const status = c.req.query("status");
      const category = c.req.query("category");
      const offset = (page - 1) * limit;

      const where: any = {};
      if (status) where.status = status;
      if (category) where.category = category;

      const [tournaments, total] = await Promise.all([
        prisma.tournament.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            participants: {
              select: {
                walletAddress: true,
                joinedAt: true,
                score: true,
                rank: true
              }
            },
            _count: {
              select: {
                participants: true
              }
            }
          }
        }),
        prisma.tournament.count({ where })
      ]);

      // Enrich tournaments with additional data
      const enrichedTournaments = tournaments.map(tournament => ({
        ...tournament,
        participantCount: tournament._count.participants,
        isJoinable: tournament.status === "upcoming" && 
                   tournament.participants.length < tournament.maxParticipants,
        timeRemaining: tournament.status === "active" ? 
          Math.max(0, new Date(tournament.endDate).getTime() - Date.now()) : 0
      }));

      return c.json({
        success: true,
        data: enrichedTournaments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error("Error getting tournaments:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// GET /tournament-system/:id - Get tournament by ID
tournamentSystemRouter.get(
  "/:id",
  rateLimiter({ max: 30, windowMs: 60000 }),
  async (c) => {
    try {
      const id = c.req.param("id");

      const tournament = await prisma.tournament.findUnique({
        where: { id },
        include: {
          participants: {
            select: {
              walletAddress: true,
              joinedAt: true,
              score: true,
              rank: true
            },
            orderBy: { rank: "asc" }
          },
          _count: {
            select: {
              participants: true
            }
          }
        }
      });

      if (!tournament) {
        return c.json({ error: "Tournament not found" }, 404);
      }

      return c.json({
        success: true,
        data: {
          ...tournament,
          participantCount: tournament._count.participants
        }
      });
    } catch (error) {
      logger.error("Error getting tournament:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// POST /tournament-system - Create tournament
tournamentSystemRouter.post(
  "/",
  rateLimiter({ max: 10, windowMs: 60000 }),
  zValidator("json", createTournamentSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");

      const tournament = await prisma.tournament.create({
        data: {
          name: data.name,
          description: data.description,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          prize: data.prize,
          entryFee: data.entryFee,
          maxParticipants: data.maxParticipants,
          minParticipants: data.minParticipants,
          rules: data.rules,
          category: data.category,
          status: data.status
        }
      });

      return c.json({
        success: true,
        data: tournament
      }, 201);
    } catch (error) {
      logger.error("Error creating tournament:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// PUT /tournament-system/:id - Update tournament
tournamentSystemRouter.put(
  "/:id",
  rateLimiter({ max: 10, windowMs: 60000 }),
  zValidator("json", updateTournamentSchema),
  async (c) => {
    try {
      const id = c.req.param("id");
      const data = c.req.valid("json");

      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.description) updateData.description = data.description;
      if (data.startDate) updateData.startDate = new Date(data.startDate);
      if (data.endDate) updateData.endDate = new Date(data.endDate);
      if (data.prize) updateData.prize = data.prize;
      if (data.entryFee) updateData.entryFee = data.entryFee;
      if (data.maxParticipants) updateData.maxParticipants = data.maxParticipants;
      if (data.minParticipants) updateData.minParticipants = data.minParticipants;
      if (data.rules) updateData.rules = data.rules;
      if (data.category) updateData.category = data.category;
      if (data.status) updateData.status = data.status;

      const tournament = await prisma.tournament.update({
        where: { id },
        data: updateData
      });

      return c.json({
        success: true,
        data: tournament
      });
    } catch (error) {
      logger.error("Error updating tournament:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// DELETE /tournament-system/:id - Delete tournament
tournamentSystemRouter.delete(
  "/:id",
  rateLimiter({ max: 5, windowMs: 60000 }),
  async (c) => {
    try {
      const id = c.req.param("id");

      await prisma.tournament.delete({
        where: { id }
      });

      return c.json({
        success: true,
        message: "Tournament deleted successfully"
      });
    } catch (error) {
      logger.error("Error deleting tournament:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// POST /tournament-system/join - Join tournament
tournamentSystemRouter.post(
  "/join",
  rateLimiter({ max: 20, windowMs: 60000 }),
  zValidator("json", joinTournamentSchema),
  async (c) => {
    try {
      const { tournamentId, walletAddress } = c.req.valid("json");

      // Check if tournament exists and is joinable
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
          participants: true
        }
      });

      if (!tournament) {
        return c.json({ error: "Tournament not found" }, 404);
      }

      if (tournament.status !== "upcoming") {
        return c.json({ error: "Tournament is not joinable" }, 400);
      }

      if (tournament.participants.length >= tournament.maxParticipants) {
        return c.json({ error: "Tournament is full" }, 400);
      }

      // Check if user already joined
      const existingParticipant = tournament.participants.find(
        p => p.walletAddress === walletAddress
      );

      if (existingParticipant) {
        return c.json({ error: "User already joined this tournament" }, 400);
      }

      // Check if user has enough coins for entry fee
      if (tournament.entryFee > 0) {
        const userBalance = await prisma.userCoinBalance.findUnique({
          where: { walletAddress }
        });

        if (!userBalance || userBalance.totalCoins < tournament.entryFee) {
          return c.json({ error: "Insufficient coins for entry fee" }, 400);
        }

        // Deduct entry fee
        await prisma.userCoinBalance.update({
          where: { walletAddress },
          data: {
            totalCoins: { decrement: tournament.entryFee }
          }
        });
      }

      // Join tournament
      const participant = await prisma.tournamentParticipant.create({
        data: {
          tournamentId,
          walletAddress,
          joinedAt: new Date(),
          score: 0,
          rank: 0
        }
      });

      return c.json({
        success: true,
        data: participant
      });
    } catch (error) {
      logger.error("Error joining tournament:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// POST /tournament-system/leave - Leave tournament
tournamentSystemRouter.post(
  "/leave",
  rateLimiter({ max: 20, windowMs: 60000 }),
  zValidator("json", joinTournamentSchema),
  async (c) => {
    try {
      const { tournamentId, walletAddress } = c.req.valid("json");

      // Check if tournament exists
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId }
      });

      if (!tournament) {
        return c.json({ error: "Tournament not found" }, 404);
      }

      if (tournament.status !== "upcoming") {
        return c.json({ error: "Cannot leave tournament after it has started" }, 400);
      }

      // Remove participant
      await prisma.tournamentParticipant.deleteMany({
        where: {
          tournamentId,
          walletAddress
        }
      });

      // Refund entry fee if applicable
      if (tournament.entryFee > 0) {
        await prisma.userCoinBalance.update({
          where: { walletAddress },
          data: {
            totalCoins: { increment: tournament.entryFee }
          }
        });
      }

      return c.json({
        success: true,
        message: "Left tournament successfully"
      });
    } catch (error) {
      logger.error("Error leaving tournament:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// POST /tournament-system/start - Start tournament
tournamentSystemRouter.post(
  "/:id/start",
  rateLimiter({ max: 5, windowMs: 60000 }),
  async (c) => {
    try {
      const id = c.req.param("id");

      const tournament = await prisma.tournament.findUnique({
        where: { id },
        include: {
          participants: true
        }
      });

      if (!tournament) {
        return c.json({ error: "Tournament not found" }, 404);
      }

      if (tournament.status !== "upcoming") {
        return c.json({ error: "Tournament cannot be started" }, 400);
      }

      if (tournament.participants.length < tournament.minParticipants) {
        return c.json({ 
          error: `Tournament needs at least ${tournament.minParticipants} participants` 
        }, 400);
      }

      // Start tournament
      await prisma.tournament.update({
        where: { id },
        data: {
          status: "active",
          startDate: new Date()
        }
      });

      return c.json({
        success: true,
        message: "Tournament started successfully"
      });
    } catch (error) {
      logger.error("Error starting tournament:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// POST /tournament-system/end - End tournament
tournamentSystemRouter.post(
  "/:id/end",
  rateLimiter({ max: 5, windowMs: 60000 }),
  async (c) => {
    try {
      const id = c.req.param("id");

      const tournament = await prisma.tournament.findUnique({
        where: { id },
        include: {
          participants: {
            orderBy: { score: "desc" }
          }
        }
      });

      if (!tournament) {
        return c.json({ error: "Tournament not found" }, 404);
      }

      if (tournament.status !== "active") {
        return c.json({ error: "Tournament is not active" }, 400);
      }

      // Update participant ranks
      const participants = tournament.participants.map((participant, index) => ({
        ...participant,
        rank: index + 1
      }));

      await Promise.all(
        participants.map(p => 
          prisma.tournamentParticipant.update({
            where: { id: p.id },
            data: { rank: p.rank }
          })
        )
      );

      // Distribute prizes
      if (tournament.prize > 0 && participants.length > 0) {
        const winner = participants[0];
        await prisma.userCoinBalance.update({
          where: { walletAddress: winner.walletAddress },
          data: {
            totalCoins: { increment: tournament.prize }
          }
        });

        // Log prize transaction
        await prisma.coinTransaction.create({
          data: {
            walletAddress: winner.walletAddress,
            coinType: "Achievement",
            amount: tournament.prize,
            reason: `Tournament prize for ${tournament.name}`,
            timestamp: new Date()
          }
        });
      }

      // End tournament
      await prisma.tournament.update({
        where: { id },
        data: {
          status: "completed",
          endDate: new Date()
        }
      });

      return c.json({
        success: true,
        message: "Tournament ended successfully",
        data: {
          winner: participants[0],
          participants: participants.length
        }
      });
    } catch (error) {
      logger.error("Error ending tournament:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// GET /tournament-system/user/:walletAddress - Get user's tournaments
tournamentSystemRouter.get(
  "/user/:walletAddress",
  rateLimiter({ max: 30, windowMs: 60000 }),
  async (c) => {
    try {
      const walletAddress = c.req.param("walletAddress");
      const page = Number.parseInt(c.req.query("page") || "1");
      const limit = Number.parseInt(c.req.query("limit") || "20");
      const offset = (page - 1) * limit;

      const [participations, total] = await Promise.all([
        prisma.tournamentParticipant.findMany({
          where: { walletAddress },
          skip: offset,
          take: limit,
          orderBy: { joinedAt: "desc" },
          include: {
            tournament: true
          }
        }),
        prisma.tournamentParticipant.count({
          where: { walletAddress }
        })
      ]);

      return c.json({
        success: true,
        data: participations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error("Error getting user tournaments:", error);
      return errorHandler(error as Error, c);
    }
  }
);

export default tournamentSystemRouter;
