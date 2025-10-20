import { Hono } from 'hono';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../middlewares/authMiddleware';
import { ApiError } from '../errors/ApiError';
import handleApiError from '../utils/handleApiError';

const prisma = new PrismaClient();
const tournamentSystem = new Hono();

// Validation schemas
const createTournamentSchema = z.object({
  gameName: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  tagForSeo: z.string().optional(),
  minimumCoin: z.number().positive().optional(),
  minimumRefer: z.number().int().positive().optional(),
  maximumRefer: z.number().int().positive().optional(),
  storageCapacity: z.number().int().positive().optional(),
  tournamentPrize: z.number().positive().optional(),
  type: z.enum(['Balanced', 'Unbalanced']).default('Balanced'),
  prizePool: z.number().positive().optional(),
  minCoins: z.number().positive().optional(),
  equilibriumMin: z.number().int().positive().optional(),
  equilibriumMax: z.number().int().positive().optional(),
  prizeTokenAddress: z.string().optional(),
  chainId: z.number().int().positive().optional(),
});

const joinTournamentSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  tournamentId: z.string(),
  coinsBurned: z.number().positive().optional(),
});

const disableTournamentSchema = z.object({
  tournamentId: z.string(),
});

// Helper function to generate random tournament ID
function generateTournamentId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper function to check user eligibility for tournament
async function checkUserEligibility(walletAddress: string, tournament: any): Promise<{ eligible: boolean; reason?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { walletAddress },
      include: {
        userCoinBalance: true,
        userTransactions: {
          where: { tournamentId: tournament.id }
        }
      }
    });

    if (!user) {
      return { eligible: false, reason: 'User not found' };
    }

    // Check minimum coins
    if (tournament.minimumCoin && user.userCoinBalance && user.userCoinBalance.totalCoins < tournament.minimumCoin) {
      return { eligible: false, reason: 'Insufficient coins' };
    }

    // Check referral requirements
    if (tournament.minimumRefer && (user.leftNode + user.rightNode) < tournament.minimumRefer) {
      return { eligible: false, reason: 'Insufficient referrals' };
    }

    if (tournament.maximumRefer && (user.leftNode + user.rightNode) > tournament.maximumRefer) {
      return { eligible: false, reason: 'Too many referrals' };
    }

    // Check if user already joined
    if (user.userTransactions.length > 0) {
      return { eligible: false, reason: 'Already joined tournament' };
    }

    // Check equilibrium requirements for Balanced tournaments
    if (tournament.type === 'Balanced') {
      if (tournament.equilibriumMin && user.totalEq < tournament.equilibriumMin) {
        return { eligible: false, reason: 'Equilibrium too low' };
      }
      if (tournament.equilibriumMax && user.totalEq > tournament.equilibriumMax) {
        return { eligible: false, reason: 'Equilibrium too high' };
      }
    }

    return { eligible: true };
  } catch (error) {
    console.error('Error in checkUserEligibility:', error);
    return { eligible: false, reason: 'Error checking eligibility' };
  }
}

// POST /create - Create new tournament
tournamentSystem.post('/create', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const data = createTournamentSchema.parse(body);

    // Generate unique tournament ID
    let tournamentId = generateTournamentId();
    while (await prisma.tournament.findUnique({ where: { tournamentId } })) {
      tournamentId = generateTournamentId();
    }

    // Create tournament
    const tournament = await prisma.tournament.create({
      data: {
        name: data.gameName,
        gameName: data.gameName,
        type: data.type,
        status: 'Upcoming',
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        prizePool: data.prizePool || 0,
        minCoins: data.minCoins,
        equilibriumMin: data.equilibriumMin,
        equilibriumMax: data.equilibriumMax,
        prizeTokenAddress: data.prizeTokenAddress,
        chainId: data.chainId,
        tournamentId,
        coinsGathered: 0,
        isDisabled: false,
        tagForSeo: data.tagForSeo,
        minimumCoin: data.minimumCoin,
        minimumRefer: data.minimumRefer,
        maximumRefer: data.maximumRefer,
        storageCapacity: data.storageCapacity,
        tournamentPrize: data.tournamentPrize
      }
    });

    return c.json({
      success: true,
      message: 'Tournament created successfully',
      tournamentId: tournament.tournamentId,
      tagForSeo: tournament.tagForSeo,
      tournament: {
        id: tournament.id,
        name: tournament.name,
        type: tournament.type,
        status: tournament.status,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        prizePool: tournament.prizePool
      }
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /all - Get all tournaments
tournamentSystem.get('/all', async (c) => {
  try {
    const tournaments = await prisma.tournament.findMany({
      where: { isDisabled: false },
      include: {
        participants: {
          include: {
            user: {
              select: {
                username: true,
                walletAddress: true
              }
            }
          }
        },
        userTransactions: {
          select: {
            walletAddress: true,
            coinsGathered: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate coins gathered per wallet
    const tournamentsWithStats = tournaments.map(tournament => {
      const coinsPerWallet = tournament.userTransactions.reduce((acc, tx) => {
        acc[tx.walletAddress] = (acc[tx.walletAddress] || 0) + Number(tx.coinsGathered);
        return acc;
      }, {} as Record<string, number>);

      return {
        ...tournament,
        coinsGatheredPerWallet: coinsPerWallet,
        participantCount: tournament.participants.length,
        totalCoinsGathered: tournament.coinsGathered
      };
    });

    return c.json({
      success: true,
      tournaments: tournamentsWithStats
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /simple - Get simplified tournament list
tournamentSystem.get('/simple', async (c) => {
  try {
    const tournaments = await prisma.tournament.findMany({
      where: { isDisabled: false },
      select: {
        id: true,
        name: true,
        gameName: true,
        type: true,
        status: true,
        startDate: true,
        endDate: true,
        prizePool: true,
        coinsGathered: true,
        isDisabled: true,
        tournamentId: true,
        tagForSeo: true,
        minimumCoin: true,
        minimumRefer: true,
        maximumRefer: true,
        storageCapacity: true,
        tournamentPrize: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return c.json({
      success: true,
      tournaments
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /:id - Get single tournament
tournamentSystem.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                username: true,
                walletAddress: true,
                status: true
              }
            }
          }
        },
        userTransactions: {
          include: {
            user: {
              select: {
                username: true,
                walletAddress: true
              }
            }
          }
        }
      }
    });

    if (!tournament) {
      throw new ApiError('Tournament not found', 404);
    }

    return c.json({
      success: true,
      tournament
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

// POST /join - Join tournament
tournamentSystem.post('/join', async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress, tournamentId, coinsBurned } = joinTournamentSchema.parse(body);

    // Get tournament
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!tournament) {
      throw new ApiError('Tournament not found', 404);
    }

    if (tournament.isDisabled) {
      throw new ApiError('Tournament is disabled', 400);
    }

    // Check if tournament is still open
    const now = new Date();
    if (now < tournament.startDate) {
      throw new ApiError('Tournament has not started yet', 400);
    }
    if (now > tournament.endDate) {
      throw new ApiError('Tournament has ended', 400);
    }

    // Check user eligibility
    const eligibility = await checkUserEligibility(walletAddress, tournament);
    if (!eligibility.eligible) {
      throw new ApiError(eligibility.reason || 'Not eligible for tournament', 400);
    }

    // Check if user already joined
    const existingParticipation = await prisma.tournamentParticipant.findUnique({
      where: {
        tournamentId_walletAddress: {
          tournamentId,
          walletAddress
        }
      }
    });

    if (existingParticipation) {
      throw new ApiError('Already joined tournament', 400);
    }

    // Join tournament
    const participant = await prisma.tournamentParticipant.create({
      data: {
        tournamentId,
        walletAddress,
        eligibilityType: tournament.type,
        coinsBurned: coinsBurned || 0
      }
    });

    return c.json({
      success: true,
      message: 'Successfully joined tournament',
      participant
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

// POST /disable - Disable tournament
tournamentSystem.post('/disable', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { tournamentId } = disableTournamentSchema.parse(body);

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!tournament) {
      throw new ApiError('Tournament not found', 404);
    }

    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { isDisabled: true }
    });

    return c.json({
      success: true,
      message: 'Tournament disabled successfully'
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /history/:walletAddress - Get user tournament history
tournamentSystem.get('/history/:walletAddress', async (c) => {
  try {
    const walletAddress = c.req.param('walletAddress');

    const userTransactions = await prisma.userTransaction.findMany({
      where: { walletAddress },
      include: {
        tournament: {
          select: {
            name: true,
            type: true,
            status: true,
            startDate: true,
            endDate: true,
            prizePool: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return c.json({
      success: true,
      tournaments: userTransactions
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

// POST /settle - Settle tournament (admin only)
tournamentSystem.post('/settle', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { tournamentId, settlementTxHash } = z.object({
      tournamentId: z.string(),
      settlementTxHash: z.string().optional()
    }).parse(body);

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                walletAddress: true,
                userCoinBalance: true
              }
            }
          }
        }
      }
    });

    if (!tournament) {
      throw new ApiError('Tournament not found', 404);
    }

    if (tournament.status === 'Settled') {
      throw new ApiError('Tournament already settled', 400);
    }

    // Calculate prize distribution
    const totalCoins = Number(tournament.coinsGathered);
    const participants = tournament.participants.filter(p => Number(p.coinsBurned) > 0);

    if (participants.length === 0) {
      throw new ApiError('No participants with coins to settle', 400);
    }

    // Calculate prize share for each participant
    const updatedParticipants = participants.map(participant => {
      const share = Number(participant.coinsBurned) / totalCoins;
      const prizeAmount = Number(tournament.prizePool) * share;
      const prizeShareBps = Math.floor(share * 10000); // Basis points

      return {
        ...participant,
        prizeShareBps,
        prizeAmount
      };
    });

    // Update participants with prize information
    await prisma.$transaction(
      updatedParticipants.map(participant =>
        prisma.tournamentParticipant.update({
          where: { id: participant.id },
          data: {
            prizeShareBps: participant.prizeShareBps,
            prizeAmount: participant.prizeAmount
          }
        })
      )
    );

    // Update tournament status
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        status: 'Settled',
        settledAt: new Date(),
        settlementTxHash
      }
    });

    return c.json({
      success: true,
      message: 'Tournament settled successfully',
      participants: updatedParticipants.length,
      totalPrizePool: tournament.prizePool
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /leaderboard/:tournamentId - Get tournament leaderboard
tournamentSystem.get('/leaderboard/:tournamentId', async (c) => {
  try {
    const tournamentId = c.req.param('tournamentId');

    const participants = await prisma.tournamentParticipant.findMany({
      where: { tournamentId },
      include: {
        user: {
          select: {
            username: true,
            walletAddress: true,
            status: true
          }
        }
      },
      orderBy: { coinsBurned: 'desc' }
    });

    const leaderboard = participants.map((participant, index) => ({
      rank: index + 1,
      walletAddress: participant.walletAddress,
      username: participant.user.username,
      coinsBurned: Number(participant.coinsBurned),
      prizeAmount: participant.prizeAmount ? Number(participant.prizeAmount) : 0,
      prizeShareBps: participant.prizeShareBps
    }));

    return c.json({
      success: true,
      leaderboard
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

export default tournamentSystem;
