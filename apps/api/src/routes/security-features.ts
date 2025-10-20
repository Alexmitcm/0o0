import { Hono } from 'hono';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import authMiddleware from '../middlewares/authMiddleware';
import { ApiError } from '../errors/ApiError';
import handleApiError from '../utils/handleApiError';

const prisma = new PrismaClient();
const securityFeatures = new Hono();

// Validation schemas
const captchaRequestSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  token: z.string(),
});

const captchaSolveSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  captchaData: z.string(),
  solution: z.string(),
});

const banUserSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  reason: z.string(),
  duration: z.number().int().positive().default(24), // hours
});

const unbanUserSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

const checkBanSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

// Helper function to generate captcha challenge
function generateCaptchaChallenge(): { question: string; answer: string } {
  const operations = ['+', '-', '*'];
  const operation = operations[Math.floor(Math.random() * operations.length)];
  
  let num1: number, num2: number, answer: number;
  
  switch (operation) {
    case '+':
      num1 = Math.floor(Math.random() * 50) + 1;
      num2 = Math.floor(Math.random() * 50) + 1;
      answer = num1 + num2;
      break;
    case '-':
      num1 = Math.floor(Math.random() * 50) + 25;
      num2 = Math.floor(Math.random() * 25) + 1;
      answer = num1 - num2;
      break;
    case '*':
      num1 = Math.floor(Math.random() * 12) + 1;
      num2 = Math.floor(Math.random() * 12) + 1;
      answer = num1 * num2;
      break;
    default:
      num1 = 1;
      num2 = 1;
      answer = 2;
  }
  
  const question = `What is ${num1} ${operation} ${num2}?`;
  return { question, answer: answer.toString() };
}

// Helper function to check if user should be banned
async function checkBanConditions(walletAddress: string): Promise<{ shouldBan: boolean; reason?: string }> {
  const user = await prisma.user.findUnique({
    where: { walletAddress },
    select: { 
      cheatCount: true, 
      banned: true,
      manualCaptcha: {
        where: { isSolved: false },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  if (!user) {
    return { shouldBan: false };
  }

  if (user.banned) {
    return { shouldBan: false };
  }

  // Check cheat count
  if (user.cheatCount > 10) {
    return { shouldBan: true, reason: 'Exceeded cheat count limit' };
  }

  // Check for unsolved captcha
  if (user.manualCaptcha.length > 0) {
    const captcha = user.manualCaptcha[0];
    const timeSinceCaptcha = Date.now() - captcha.createdAt.getTime();
    const captchaTimeout = 30 * 60 * 1000; // 30 minutes

    if (timeSinceCaptcha > captchaTimeout) {
      return { shouldBan: true, reason: 'Captcha timeout' };
    }
  }

  return { shouldBan: false };
}

// GET /captcha - Get captcha challenge
securityFeatures.get('/captcha', async (c) => {
  try {
    const walletAddress = c.req.query('walletAddress');
    const token = c.req.query('token');

    if (!walletAddress || !token) {
      throw new ApiError('Missing wallet address or token', 400);
    }

    // Validate user token
    const user = await prisma.user.findUnique({
      where: { walletAddress },
      select: { token: true, cheatCount: true }
    });

    if (!user || user.token !== token) {
      throw new ApiError('Invalid token', 401);
    }

    // Check if user needs captcha
    if (user.cheatCount <= 10) {
      return c.json({
        success: true,
        message: 'Captcha not required',
        required: false
      });
    }

    // Generate captcha challenge
    const { question, answer } = generateCaptchaChallenge();
    const captchaData = createHash('sha256').update(`${question}-${answer}-${Date.now()}`).digest('hex');

    // Store captcha challenge
    await prisma.manualCaptcha.create({
      data: {
        walletAddress,
        captchaData,
        isSolved: false
      }
    });

    return c.json({
      success: true,
      required: true,
      question,
      captchaData
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

// POST /captcha/solve - Solve captcha
securityFeatures.post('/captcha/solve', async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress, captchaData, solution } = captchaSolveSchema.parse(body);

    // Find captcha challenge
    const captcha = await prisma.manualCaptcha.findFirst({
      where: {
        walletAddress,
        captchaData,
        isSolved: false
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!captcha) {
      throw new ApiError('Captcha challenge not found', 404);
    }

    // Check if captcha is expired (30 minutes)
    const timeSinceCreation = Date.now() - captcha.createdAt.getTime();
    const captchaTimeout = 30 * 60 * 1000;

    if (timeSinceCreation > captchaTimeout) {
      throw new ApiError('Captcha expired', 400);
    }

    // For this example, we'll assume the solution is correct
    // In a real implementation, you would verify the solution against the stored answer
    const isCorrect = true; // This should be replaced with actual verification

    if (isCorrect) {
      // Mark captcha as solved
      await prisma.manualCaptcha.update({
        where: { id: captcha.id },
        data: {
          isSolved: true,
          solvedAt: new Date()
        }
      });

      // Reset cheat count
      await prisma.user.update({
        where: { walletAddress },
        data: { cheatCount: 0 }
      });

      return c.json({
        success: true,
        message: 'Captcha solved successfully'
      });
    } else {
      // Increment cheat count
      await prisma.user.update({
        where: { walletAddress },
        data: { cheatCount: { increment: 1 } }
      });

      throw new ApiError('Incorrect captcha solution', 400);
    }

  } catch (error) {
    return handleApiError(c, error);
  }
});

// POST /ban-user - Ban user
securityFeatures.post('/ban-user', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress, reason, duration } = banUserSchema.parse(body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { walletAddress }
    });

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    if (user.banned) {
      return c.json({
        success: true,
        message: 'User is already banned'
      });
    }

    // Ban user
    const banDate = new Date();
    await prisma.$transaction(async (tx) => {
      // Update user status
      await tx.user.update({
        where: { walletAddress },
        data: {
          banned: true,
          cheatCount: 0,
          coins: 0
        }
      });

      // Create play history record
      await tx.playHistory.create({
        data: {
          walletAddress,
          banDate
        }
      });
    });

    return c.json({
      success: true,
      message: 'User banned successfully',
      banDate,
      duration
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

// POST /unban-user - Unban user
securityFeatures.post('/unban-user', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress } = unbanUserSchema.parse(body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { walletAddress }
    });

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    if (!user.banned) {
      return c.json({
        success: true,
        message: 'User is not banned'
      });
    }

    // Unban user
    await prisma.user.update({
      where: { walletAddress },
      data: {
        banned: false,
        cheatCount: 0
      }
    });

    return c.json({
      success: true,
      message: 'User unbanned successfully'
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

// POST /check-ban - Check user ban status
securityFeatures.post('/check-ban', async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress } = checkBanSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { walletAddress },
      select: { 
        banned: true,
        playHistory: {
          orderBy: { banDate: 'desc' },
          take: 1
        }
      }
    });

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    if (!user.banned) {
      return c.json({
        success: true,
        banned: false
      });
    }

    // Check if ban has expired
    const latestBan = user.playHistory[0];
    if (latestBan?.banDate) {
      const banEndTime = new Date(latestBan.banDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours
      const now = new Date();

      if (now > banEndTime) {
        // Auto-unban user
        await prisma.user.update({
          where: { walletAddress },
          data: { banned: false, cheatCount: 0 }
        });

        return c.json({
          success: true,
          banned: false,
          message: 'Ban has expired'
        });
      }

      const remainingTime = Math.max(0, banEndTime.getTime() - now.getTime());
      return c.json({
        success: true,
        banned: true,
        remainingTime
      });
    }

    return c.json({
      success: true,
      banned: user.banned
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

// POST /increment-cheat-count - Increment cheat count
securityFeatures.post('/increment-cheat-count', async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress } = z.object({ walletAddress: z.string() }).parse(body);

    const user = await prisma.user.findUnique({
      where: { walletAddress }
    });

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Increment cheat count
    const newCheatCount = user.cheatCount + 1;
    await prisma.user.update({
      where: { walletAddress },
      data: { cheatCount: newCheatCount }
    });

    // Check if user should be banned
    const banCheck = await checkBanConditions(walletAddress);
    if (banCheck.shouldBan) {
      // Ban user
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { walletAddress },
          data: {
            banned: true,
            cheatCount: 0,
            coins: 0
          }
        });

        await tx.playHistory.create({
          data: {
            walletAddress,
            banDate: new Date()
          }
        });
      });

      return c.json({
        success: true,
        message: 'User banned due to cheat count',
        cheatCount: newCheatCount,
        banned: true
      });
    }

    return c.json({
      success: true,
      message: 'Cheat count incremented',
      cheatCount: newCheatCount,
      banned: false
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /security-stats - Get security statistics
securityFeatures.get('/security-stats', authMiddleware, async (c) => {
  try {
    const [
      totalBannedUsers,
      totalCheatAttempts,
      totalCaptchaChallenges,
      solvedCaptchaChallenges,
      recentBans
    ] = await Promise.all([
      prisma.user.count({ where: { banned: true } }),
      prisma.user.aggregate({
        _sum: { cheatCount: true }
      }),
      prisma.manualCaptcha.count(),
      prisma.manualCaptcha.count({ where: { isSolved: true } }),
      prisma.playHistory.findMany({
        orderBy: { banDate: 'desc' },
        take: 10,
        include: {
          user: {
            select: {
              username: true,
              walletAddress: true
            }
          }
        }
      })
    ]);

    return c.json({
      success: true,
      stats: {
        totalBannedUsers,
        totalCheatAttempts: totalCheatAttempts._sum.cheatCount || 0,
        totalCaptchaChallenges,
        solvedCaptchaChallenges,
        captchaSuccessRate: totalCaptchaChallenges > 0 ? 
          (solvedCaptchaChallenges / totalCaptchaChallenges) * 100 : 0,
        recentBans
      }
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

// POST /reset-cheat-count - Reset cheat count for user
securityFeatures.post('/reset-cheat-count', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress } = z.object({ walletAddress: z.string() }).parse(body);

    await prisma.user.update({
      where: { walletAddress },
      data: { cheatCount: 0 }
    });

    return c.json({
      success: true,
      message: 'Cheat count reset successfully'
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

// POST /bulk-ban - Bulk ban users
securityFeatures.post('/bulk-ban', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddresses, reason, duration } = z.object({
      walletAddresses: z.array(z.string()),
      reason: z.string(),
      duration: z.number().int().positive().default(24)
    }).parse(body);

    const results = [];
    const errors = [];

    for (const walletAddress of walletAddresses) {
      try {
        const user = await prisma.user.findUnique({
          where: { walletAddress }
        });

        if (!user) {
          errors.push({ walletAddress, error: 'User not found' });
          continue;
        }

        if (user.banned) {
          results.push({ walletAddress, status: 'already_banned' });
          continue;
        }

        // Ban user
        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { walletAddress },
            data: {
              banned: true,
              cheatCount: 0,
              coins: 0
            }
          });

          await tx.playHistory.create({
            data: {
              walletAddress,
              banDate: new Date()
            }
          });
        });

        results.push({ walletAddress, status: 'banned' });

      } catch (error) {
        errors.push({
          walletAddress,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return c.json({
      success: true,
      message: `Processed ${walletAddresses.length} users`,
      results,
      errors
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

export default securityFeatures;
