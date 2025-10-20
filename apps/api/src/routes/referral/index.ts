import logger from "@hey/helpers/logger";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { errorHandler } from "../../middlewares/errorHandler";
import rateLimiter from "../../middlewares/rateLimiter";
import prisma from "../../prisma/client";
import type { AppContext } from "../../types/context";

const referralRouter = new Hono<AppContext>();

// Validation schemas
const getReferralTreeSchema = z.object({
  walletAddress: z.string().min(42).max(42)
});

const refreshReferralSchema = z.object({
  walletAddress: z.string().min(42).max(42)
});

// GET /referral/tree/:walletAddress - Get referral tree (equivalent to tree.php)
referralRouter.get(
  "/tree/:walletAddress",
  rateLimiter({ requests: 30 }),
  zValidator("param", getReferralTreeSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: "Invalid wallet address" }, 400);
    }
  }),
  async (c) => {
    try {
      const { walletAddress } = c.req.valid("param");

      // Get user's referral tree
      const buildTree = async (
        rootAddress: string,
        depth = 0,
        maxDepth = 5
      ): Promise<any> => {
        if (depth >= maxDepth) return null;

        const user = await prisma.user.findUnique({
          select: {
            createdAt: true,
            displayName: true,
            premiumUpgradedAt: true,
            username: true,
            userStats: {
              select: {
                referralCount: true,
                totalEarnings: true
              }
            },
            walletAddress: true
          },
          where: { walletAddress: rootAddress }
        });

        if (!user) return null;

        // Get direct referrals
        const referrals = await prisma.user.findMany({
          select: {
            createdAt: true,
            displayName: true,
            premiumUpgradedAt: true,
            username: true,
            userStats: {
              select: {
                referralCount: true,
                totalEarnings: true
              }
            },
            walletAddress: true
          },
          where: { referrerAddress: rootAddress }
        });

        // Recursively build tree for each referral
        const children = await Promise.all(
          referrals.map((ref) =>
            buildTree(ref.walletAddress, depth + 1, maxDepth)
          )
        );

        return {
          ...user,
          children: children.filter((child) => child !== null),
          level: depth
        };
      };

      const tree = await buildTree(walletAddress);

      if (!tree) {
        return c.json({ error: "User not found" }, 404);
      }

      return c.json({
        data: tree,
        success: true
      });
    } catch (error) {
      logger.error("Error getting referral tree:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// POST /referral/refresh - Refresh referral data (equivalent to referral/refresh.php)
referralRouter.post(
  "/refresh",
  rateLimiter({ requests: 10 }),
  zValidator("json", refreshReferralSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: "Invalid request data" }, 400);
    }
  }),
  async (c) => {
    try {
      const { walletAddress } = c.req.valid("json");

      // Get user
      const user = await prisma.user.findUnique({
        include: {
          userStats: true
        },
        where: { walletAddress }
      });

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      // Count direct referrals
      const directReferrals = await prisma.user.count({
        where: { referrerAddress: walletAddress }
      });

      // Count total referrals (including sub-referrals)
      const countTotalReferrals = async (
        rootAddress: string
      ): Promise<number> => {
        const directRefs = await prisma.user.findMany({
          select: { walletAddress: true },
          where: { referrerAddress: rootAddress }
        });

        let total = directRefs.length;

        for (const ref of directRefs) {
          total += await countTotalReferrals(ref.walletAddress);
        }

        return total;
      };

      const totalReferrals = await countTotalReferrals(walletAddress);

      // Calculate earnings from referrals
      const referralEarnings = await prisma.coinTransaction.aggregate({
        _sum: {
          amount: true
        },
        where: {
          description: {
            contains: "referral"
          },
          walletAddress
        }
      });

      // Update user stats
      await prisma.userStats.update({
        data: {
          referralCount: directReferrals,
          totalEarnings: referralEarnings._sum.amount || 0
        },
        where: { walletAddress }
      });

      // Update referral balance cache
      await prisma.referralBalanceCache.upsert({
        create: {
          equilibriumPoint: totalReferrals,
          isBalanced: directReferrals === totalReferrals,
          leftCount: Math.floor(totalReferrals / 2),
          rightCount: Math.ceil(totalReferrals / 2),
          walletAddress
        },
        update: {
          equilibriumPoint: totalReferrals,
          isBalanced: directReferrals === totalReferrals,
          leftCount: Math.floor(totalReferrals / 2),
          rightCount: Math.ceil(totalReferrals / 2)
        },
        where: { walletAddress }
      });

      return c.json({
        data: {
          directReferrals,
          lastUpdated: new Date(),
          totalEarnings: referralEarnings._sum.amount || 0,
          totalReferrals,
          walletAddress
        },
        success: true
      });
    } catch (error) {
      logger.error("Error refreshing referral data:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// GET /referral/stats/:walletAddress - Get referral statistics
referralRouter.get(
  "/stats/:walletAddress",
  rateLimiter({ requests: 30 }),
  zValidator("param", getReferralTreeSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: "Invalid wallet address" }, 400);
    }
  }),
  async (c) => {
    try {
      const { walletAddress } = c.req.valid("param");

      // Get cached referral data
      const cachedData = await prisma.referralBalanceCache.findUnique({
        where: { walletAddress }
      });

      if (cachedData) {
        return c.json({
          data: cachedData,
          success: true
        });
      }

      // If no cached data, refresh it
      return await referralRouter.fetch(
        new Request(c.req.url, {
          body: JSON.stringify({ walletAddress }),
          headers: { "Content-Type": "application/json" },
          method: "POST"
        })
      );
    } catch (error) {
      logger.error("Error getting referral stats:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// GET /referral/leaderboard - Get referral leaderboard
referralRouter.get("/leaderboard", rateLimiter({ requests: 20 }), async (c) => {
  try {
    const limit = Number.parseInt(c.req.query("limit") || "50", 10);

    const leaderboard = await prisma.referralBalanceCache.findMany({
      orderBy: { equilibriumPoint: "desc" },
      select: {
        equilibriumPoint: true,
        isBalanced: true,
        leftCount: true,
        rightCount: true,
        updatedAt: true,
        walletAddress: true
      },
      take: limit
    });

    return c.json({
      data: leaderboard,
      success: true
    });
  } catch (error) {
    logger.error("Error getting referral leaderboard:", error);
    return errorHandler(error as Error, c);
  }
});

export default referralRouter;
