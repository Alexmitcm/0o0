import { Hono } from 'hono';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../middlewares/authMiddleware';
import { ApiError } from '../errors/ApiError';
import handleApiError from '../utils/handleApiError';

const prisma = new PrismaClient();
const coinSystem = new Hono();

// Validation schemas
const coinUpdateSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.number().int().positive(),
  sourceType: z.enum(['Registration', 'Referral', 'Quest', 'Activity', 'Social', 'GamePlay', 'Tournament', 'Admin', 'Bonus', 'Achievement', 'DailyLogin', 'WeeklyChallenge', 'LootBox', 'MonthlyReward']).default('Activity'),
  sourceId: z.string().optional(),
  sourceMetadata: z.record(z.any()).optional(),
});

const coinTransferSchema = z.object({
  fromWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  toWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.number().int().positive(),
  coinType: z.enum(['Experience', 'Achievement', 'Social', 'Premium']).default('Experience'),
  description: z.string().optional(),
});

const userInsertCoinSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amountOfCoin: z.number().int().positive(),
  tournamentId: z.string(),
});

// Helper function to check captcha restrictions
async function checkCaptchaRestrictions(walletAddress: string): Promise<{ allowed: boolean; reason?: string }> {
  const user = await prisma.user.findUnique({
    where: { walletAddress },
    select: { 
      banned: true, 
      cheatCount: true, 
      manualCaptcha: { 
        where: { isSolved: false },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  if (!user) {
    return { allowed: false, reason: 'User not found' };
  }

  if (user.banned) {
    return { allowed: false, reason: 'User is banned' };
  }

  // Check if user has unsolved captcha
  if (user.manualCaptcha.length > 0) {
    return { allowed: false, reason: 'Captcha verification required' };
  }

  // Check cheat count
  if (user.cheatCount > 10) {
    return { allowed: false, reason: 'Too many cheat attempts' };
  }

  return { allowed: true };
}

// Helper function to calculate stamina level
async function calculateStaminaLevel(walletAddress: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { walletAddress },
    select: { totalEq: true, createdAt: true }
  });

  if (!user) return 0;

  const { totalEq, createdAt } = user;
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const isNewAccount = createdAt > threeMonthsAgo;

  if (totalEq >= 2) {
    return 2500;
  } else if (totalEq === 1) {
    return isNewAccount ? 1500 : 500;
  } else if (totalEq === 0) {
    return isNewAccount ? 1600 : 500;
  }

  return 500;
}

// Helper function to check daily limits
async function checkDailyLimits(walletAddress: string): Promise<{ allowed: boolean; remaining: number }> {
  const user = await prisma.user.findUnique({
    where: { walletAddress },
    select: { lastCoinUpdated: true, todaysPoints: true }
  });

  if (!user) {
    return { allowed: false, remaining: 0 };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastUpdate = user.lastCoinUpdated ? new Date(user.lastCoinUpdated) : null;
  const lastUpdateDate = lastUpdate ? new Date(lastUpdate.getFullYear(), lastUpdate.getMonth(), lastUpdate.getDate()) : null;

  // If last update was not today, reset daily points
  if (!lastUpdateDate || lastUpdateDate < today) {
    await prisma.user.update({
      where: { walletAddress },
      data: { todaysPoints: 0 }
    });
    return { allowed: true, remaining: 2500 }; // Max daily points
  }

  const remaining = Math.max(0, 2500 - user.todaysPoints);
  return { allowed: remaining > 0, remaining };
}

// POST /coin-update - Update user coins
coinSystem.post('/coin-update', async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress, amount, sourceType, sourceId, sourceMetadata } = coinUpdateSchema.parse(body);

    // Check captcha restrictions
    const captchaCheck = await checkCaptchaRestrictions(walletAddress);
    if (!captchaCheck.allowed) {
      return c.json({
        success: false,
        message: captchaCheck.reason
      }, 403);
    }

    // Check daily limits
    const dailyCheck = await checkDailyLimits(walletAddress);
    if (!dailyCheck.allowed) {
      return c.json({
        success: false,
        message: 'Daily coin limit reached',
        remaining: dailyCheck.remaining
      }, 429);
    }

    // Calculate stamina level
    const staminaLevel = await calculateStaminaLevel(walletAddress);

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get current user data
      const user = await tx.user.findUnique({
        where: { walletAddress },
        select: { 
          coins: true, 
          todaysPoints: true, 
          lastCoinUpdated: true,
          userCoinBalance: true
        }
      });

      if (!user) {
        throw new ApiError('User not found', 404);
      }

      // Calculate new values
      const newCoins = (user.userCoinBalance?.totalCoins || 0) + amount;
      const newTodaysPoints = user.todaysPoints + amount;
      const now = new Date();

      // Update user coins and daily points
      await tx.user.update({
        where: { walletAddress },
        data: {
          lastCoinUpdated: now,
          todaysPoints: newTodaysPoints
        }
      });

      // Update or create coin balance
      await tx.userCoinBalance.upsert({
        where: { walletAddress },
        create: {
          walletAddress,
          totalCoins: newCoins,
          experienceCoins: sourceType === 'Experience' ? amount : 0,
          achievementCoins: sourceType === 'Achievement' ? amount : 0,
          socialCoins: sourceType === 'Social' ? amount : 0,
          premiumCoins: sourceType === 'Premium' ? amount : 0,
          lastUpdatedAt: now
        },
        update: {
          totalCoins: newCoins,
          experienceCoins: sourceType === 'Experience' ? 
            (user.userCoinBalance?.experienceCoins || 0) + amount : 
            (user.userCoinBalance?.experienceCoins || 0),
          achievementCoins: sourceType === 'Achievement' ? 
            (user.userCoinBalance?.achievementCoins || 0) + amount : 
            (user.userCoinBalance?.achievementCoins || 0),
          socialCoins: sourceType === 'Social' ? 
            (user.userCoinBalance?.socialCoins || 0) + amount : 
            (user.userCoinBalance?.socialCoins || 0),
          premiumCoins: sourceType === 'Premium' ? 
            (user.userCoinBalance?.premiumCoins || 0) + amount : 
            (user.userCoinBalance?.premiumCoins || 0),
          lastUpdatedAt: now
        }
      });

      // Create coin transaction record
      await tx.coinTransaction.create({
        data: {
          walletAddress,
          coinType: sourceType === 'Experience' ? 'Experience' : 
                   sourceType === 'Achievement' ? 'Achievement' :
                   sourceType === 'Social' ? 'Social' : 'Premium',
          amount,
          transactionType: 'Earned',
          sourceType,
          sourceId,
          sourceMetadata,
          balanceBefore: user.userCoinBalance?.totalCoins || 0,
          balanceAfter: newCoins,
          description: `Earned ${amount} coins from ${sourceType}`
        }
      });

      // Create user coin record
      await tx.userCoin.create({
        data: {
          walletAddress,
          coinType: sourceType === 'Experience' ? 'Experience' : 
                   sourceType === 'Achievement' ? 'Achievement' :
                   sourceType === 'Social' ? 'Social' : 'Premium',
          amount,
          sourceType,
          sourceId,
          sourceMetadata
        }
      });

      return {
        newCoins,
        todaysPoints: newTodaysPoints,
        remaining: dailyCheck.remaining - amount
      };
    });

    return c.json({
      success: true,
      message: 'Coins updated successfully',
      coins: result.newCoins,
      todaysPoints: result.todaysPoints,
      remaining: result.remaining,
      levelValue: staminaLevel
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

// POST /user-insert-coin - Insert coins into tournament
coinSystem.post('/user-insert-coin', async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress, amountOfCoin, tournamentId } = userInsertCoinSchema.parse(body);

    // Check if user has sufficient coins
    const userBalance = await prisma.userCoinBalance.findUnique({
      where: { walletAddress }
    });

    if (!userBalance || userBalance.totalCoins < amountOfCoin) {
      return c.json({
        success: false,
        message: 'Insufficient coins for the transaction'
      }, 400);
    }

    // Check if tournament exists and is active
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!tournament) {
      return c.json({
        success: false,
        message: 'Tournament not found'
      }, 404);
    }

    if (tournament.isDisabled) {
      return c.json({
        success: false,
        message: 'Tournament is disabled'
      }, 400);
    }

    // Use transaction for data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update tournament coins gathered
      await tx.tournament.update({
        where: { id: tournamentId },
        data: {
          coinsGathered: { increment: amountOfCoin }
        }
      });

      // Deduct coins from user
      await tx.userCoinBalance.update({
        where: { walletAddress },
        data: {
          totalCoins: { decrement: amountOfCoin }
        }
      });

      // Create user transaction record
      await tx.userTransaction.create({
        data: {
          walletAddress,
          tournamentId,
          tournamentName: tournament.name,
          startDate: tournament.startDate,
          endDate: tournament.endDate,
          coinsGathered: amountOfCoin
        }
      });

      // Create tournament of user record
      await tx.tournamentOfUser.upsert({
        where: {
          tournamentId_walletAddress: {
            tournamentId,
            walletAddress
          }
        },
        create: {
          tournamentId,
          walletAddress
        },
        update: {}
      });

      // Create coin transaction record
      await tx.coinTransaction.create({
        data: {
          walletAddress,
          coinType: 'Experience',
          amount: amountOfCoin,
          transactionType: 'Spent',
          sourceType: 'Tournament',
          sourceId: tournamentId,
          balanceBefore: userBalance.totalCoins,
          balanceAfter: userBalance.totalCoins - amountOfCoin,
          description: `Spent ${amountOfCoin} coins on tournament ${tournament.name}`
        }
      });

      return {
        newBalance: userBalance.totalCoins - amountOfCoin,
        tournamentCoins: tournament.coinsGathered + amountOfCoin
      };
    });

    return c.json({
      success: true,
      message: 'Coins inserted into tournament successfully',
      newBalance: result.newBalance,
      tournamentCoins: result.tournamentCoins
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

// POST /coin-transfer - Transfer coins between users
coinSystem.post('/coin-transfer', async (c) => {
  try {
    const body = await c.req.json();
    const { fromWallet, toWallet, amount, coinType, description } = coinTransferSchema.parse(body);

    // Check if both users exist
    const [fromUser, toUser] = await Promise.all([
      prisma.user.findUnique({ where: { walletAddress: fromWallet } }),
      prisma.user.findUnique({ where: { walletAddress: toWallet } })
    ]);

    if (!fromUser || !toUser) {
      throw new ApiError('One or both users not found', 404);
    }

    // Check if sender has sufficient coins
    const fromBalance = await prisma.userCoinBalance.findUnique({
      where: { walletAddress: fromWallet }
    });

    if (!fromBalance || fromBalance.totalCoins < amount) {
      throw new ApiError('Insufficient coins for transfer', 400);
    }

    // Use transaction for transfer
    const result = await prisma.$transaction(async (tx) => {
      // Deduct from sender
      await tx.userCoinBalance.update({
        where: { walletAddress: fromWallet },
        data: {
          totalCoins: { decrement: amount },
          [coinType === 'Experience' ? 'experienceCoins' : 
           coinType === 'Achievement' ? 'achievementCoins' :
           coinType === 'Social' ? 'socialCoins' : 'premiumCoins']: { decrement: amount }
        }
      });

      // Add to receiver
      await tx.userCoinBalance.upsert({
        where: { walletAddress: toWallet },
        create: {
          walletAddress: toWallet,
          totalCoins: amount,
          [coinType === 'Experience' ? 'experienceCoins' : 
           coinType === 'Achievement' ? 'achievementCoins' :
           coinType === 'Social' ? 'socialCoins' : 'premiumCoins']: amount
        },
        update: {
          totalCoins: { increment: amount },
          [coinType === 'Experience' ? 'experienceCoins' : 
           coinType === 'Achievement' ? 'achievementCoins' :
           coinType === 'Social' ? 'socialCoins' : 'premiumCoins']: { increment: amount }
        }
      });

      // Create transaction records for both users
      await tx.coinTransaction.createMany({
        data: [
          {
            walletAddress: fromWallet,
            coinType,
            amount,
            transactionType: 'Transferred',
            sourceType: 'Activity',
            balanceBefore: fromBalance.totalCoins,
            balanceAfter: fromBalance.totalCoins - amount,
            description: description || `Transferred ${amount} ${coinType} coins to ${toWallet}`
          },
          {
            walletAddress: toWallet,
            coinType,
            amount,
            transactionType: 'Earned',
            sourceType: 'Activity',
            balanceBefore: 0, // Will be updated by upsert
            balanceAfter: amount,
            description: description || `Received ${amount} ${coinType} coins from ${fromWallet}`
          }
        ]
      });

      return {
        fromNewBalance: fromBalance.totalCoins - amount,
        toNewBalance: amount
      };
    });

    return c.json({
      success: true,
      message: 'Coins transferred successfully',
      fromNewBalance: result.fromNewBalance,
      toNewBalance: result.toNewBalance
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /coin-balance - Get user coin balance
coinSystem.get('/coin-balance/:walletAddress', async (c) => {
  try {
    const walletAddress = c.req.param('walletAddress');

    const balance = await prisma.userCoinBalance.findUnique({
      where: { walletAddress },
      include: {
        user: {
          select: {
            username: true,
            status: true,
            totalEq: true,
            todaysPoints: true,
            lastCoinUpdated: true
          }
        }
      }
    });

    if (!balance) {
      return c.json({
        success: true,
        balance: {
          totalCoins: 0,
          experienceCoins: 0,
          achievementCoins: 0,
          socialCoins: 0,
          premiumCoins: 0
        },
        user: null
      });
    }

    return c.json({
      success: true,
      balance: {
        totalCoins: balance.totalCoins,
        experienceCoins: balance.experienceCoins,
        achievementCoins: balance.achievementCoins,
        socialCoins: balance.socialCoins,
        premiumCoins: balance.premiumCoins,
        lastUpdatedAt: balance.lastUpdatedAt
      },
      user: balance.user
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /coin-transactions - Get user coin transactions
coinSystem.get('/coin-transactions/:walletAddress', async (c) => {
  try {
    const walletAddress = c.req.param('walletAddress');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.coinTransaction.findMany({
        where: { walletAddress },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.coinTransaction.count({
        where: { walletAddress }
      })
    ]);

    return c.json({
      success: true,
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

// POST /reset-daily-points - Reset daily points for all users (admin only)
coinSystem.post('/reset-daily-points', authMiddleware, async (c) => {
  try {
    await prisma.user.updateMany({
      data: { todaysPoints: 0 }
    });

    return c.json({
      success: true,
      message: 'Daily points reset successfully'
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

export default coinSystem;
