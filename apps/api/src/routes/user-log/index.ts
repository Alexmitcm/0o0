import logger from "@hey/helpers/logger";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { errorHandler } from "../../middlewares/errorHandler";
import rateLimiter from "../../middlewares/rateLimiter";
import prisma from "../../prisma/client";

const userLogRouter = new Hono();

// Validation schemas
const checkLevelValueSchema = z.object({
  walletAddress: z.string().min(42).max(42)
});

const logUserSchema = z.object({
  action: z.string().min(1),
  metadata: z.record(z.any()).optional(),
  walletAddress: z.string().min(42).max(42)
});

const growthCalculateSchema = z.object({
  walletAddress: z.string().min(42).max(42)
});

// Function to calculate level value based on creation date and node conditions
function calculateLevelValue(userData: any): number {
  const creationDate = new Date(userData.createdAt);
  const currentDate = new Date();
  const daysSinceCreation = Math.floor(
    (currentDate.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceCreation < 30) {
    return 2000;
  }

  // Base stamina value
  const baseStamina = 500;

  // Check Total_eq value
  if (userData.totalEq !== null && userData.totalEq !== undefined) {
    // If eq is more than 2, give 2500 stamina
    if (userData.totalEq >= 2) {
      return 2500;
    }
    // If eq is 1, give 1500 stamina (unless account is older than 3 months)
    if (userData.totalEq === 1) {
      // If account is older than 3 months (90 days), return base stamina
      if (daysSinceCreation > 90) {
        return baseStamina;
      }
      return 1500;
    }
  }

  // If account is older than 3 months, return base stamina (500) regardless of other conditions
  if (daysSinceCreation > 90) {
    return baseStamina;
  }
  return 1600;
}

// GET /user-log/check-level-value - Check user level value (equivalent to check_level_value.php)
userLogRouter.get(
  "/check-level-value",
  rateLimiter({ max: 30, windowMs: 60000 }),
  zValidator("query", checkLevelValueSchema),
  async (c) => {
    try {
      const { walletAddress } = c.req.valid("query");

      // Get user data
      const user = await prisma.user.findUnique({
        select: {
          banned: true,
          createdAt: true,
          leftNode: true,
          rightNode: true,
          totalEq: true,
          walletAddress: true
        },
        where: { walletAddress }
      });

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      // Check if user is banned
      if (user.banned) {
        return c.json({
          levelValue: 0,
          walletAddress: user.walletAddress
        });
      }

      // Calculate level value
      const levelValue = calculateLevelValue(user);

      return c.json({
        levelValue,
        walletAddress: user.walletAddress
      });
    } catch (error) {
      logger.error("Error checking level value:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// POST /user-log/log-user - Log user action (equivalent to loguser.php)
userLogRouter.post(
  "/log-user",
  rateLimiter({ max: 50, windowMs: 60000 }),
  zValidator("json", logUserSchema),
  async (c) => {
    try {
      const { walletAddress, action, metadata } = c.req.valid("json");

      // Log user action to play history
      await prisma.playHistory.create({
        data: {
          action,
          metadata: metadata || {},
          timestamp: new Date(),
          walletAddress
        }
      });

      return c.json({
        message: "User action logged successfully",
        success: true
      });
    } catch (error) {
      logger.error("Error logging user action:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// POST /user-log/growth-calculate - Calculate user growth (equivalent to growth_calculate.php)
userLogRouter.post(
  "/growth-calculate",
  rateLimiter({ max: 20, windowMs: 60000 }),
  zValidator("json", growthCalculateSchema),
  async (c) => {
    try {
      const { walletAddress } = c.req.valid("json");

      // Get user data
      const user = await prisma.user.findUnique({
        include: {
          userCoinBalance: true,
          userStats: true
        },
        where: { walletAddress }
      });

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      // Calculate growth metrics
      const growthMetrics = {
        daysAsPremium: user.userStats?.daysAsPremium || 0,
        levelValue: calculateLevelValue(user),
        questsCompleted: user.userStats?.questsCompleted || 0,
        referralCount: user.userStats?.referralCount || 0,
        totalCoins: user.userCoinBalance?.totalCoins || 0,
        totalFollowers: user.userStats?.totalFollowers || 0,
        totalFollowing: user.userStats?.totalFollowing || 0,
        totalLikes: user.userStats?.totalLikes || 0,
        totalPosts: user.userStats?.totalPosts || 0,
        walletAddress: user.walletAddress
      };

      return c.json({
        data: growthMetrics,
        success: true
      });
    } catch (error) {
      logger.error("Error calculating growth:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// POST /user-log/update-users-coin - Update user coins (equivalent to update_users_coin.php)
userLogRouter.post(
  "/update-users-coin",
  rateLimiter({ max: 10, windowMs: 60000 }),
  zValidator(
    "json",
    z.object({
      amount: z.number().int(),
      coinType: z.enum(["Experience", "Achievement", "Social", "Premium"]),
      reason: z.string().optional(),
      walletAddress: z.string().min(42).max(42)
    })
  ),
  async (c) => {
    try {
      const { walletAddress, coinType, amount, reason } = c.req.valid("json");

      // Update user coin balance
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
          achievementCoins:
            coinType === "Achievement" ? { increment: amount } : undefined,
          experienceCoins:
            coinType === "Experience" ? { increment: amount } : undefined,
          premiumCoins:
            coinType === "Premium" ? { increment: amount } : undefined,
          socialCoins:
            coinType === "Social" ? { increment: amount } : undefined,
          totalCoins: { increment: amount }
        },
        where: { walletAddress }
      });

      // Log the transaction
      await prisma.coinTransaction.create({
        data: {
          amount,
          coinType,
          reason: reason || "System update",
          timestamp: new Date(),
          walletAddress
        }
      });

      return c.json({
        message: "User coins updated successfully",
        success: true
      });
    } catch (error) {
      logger.error("Error updating user coins:", error);
      return errorHandler(error as Error, c);
    }
  }
);

export default userLogRouter;
