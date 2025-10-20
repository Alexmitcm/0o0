import logger from "@hey/helpers/logger";
import { zValidator } from "@hono/zod-validator";
import { PrismaClient } from "@prisma/client";
import { Hono } from "hono";
import { z } from "zod";
import authMiddleware from "../middlewares/authMiddleware";
import { errorHandler } from "../middlewares/errorHandler";
import rateLimiter from "../middlewares/rateLimiter";

const prisma = new PrismaClient();
const usersRouter = new Hono();

// Validation schemas
const createUserSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  referrerAddress: z.string().min(42).max(42).optional(),
  registrationTxHash: z.string().optional(),
  username: z.string().min(3).max(50).optional(),
  walletAddress: z.string().min(42).max(42)
});

const updateUserSchema = z.object({
  bio: z.string().max(500).optional(),
  displayName: z.string().min(1).max(100).optional(),
  location: z.string().max(100).optional(),
  twitterHandle: z.string().max(50).optional(),
  username: z.string().min(3).max(50).optional(),
  website: z.string().url().optional()
});

const getUserDataSchema = z.object({
  walletAddress: z.string().min(42).max(42)
});

// POST /users - Create or get user
usersRouter.post(
  "/",
  rateLimiter({ max: 10, windowMs: 60000 }), // 10 requests per minute
  zValidator("json", createUserSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");
      const {
        walletAddress,
        username,
        displayName,
        referrerAddress,
        registrationTxHash
      } = data;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        include: {
          userCoinBalance: true,
          userStats: true
        },
        where: { walletAddress }
      });

      if (existingUser) {
        // Update last active time
        await prisma.user.update({
          data: {
            lastActiveAt: new Date(),
            totalLogins: { increment: 1 }
          },
          where: { walletAddress }
        });

        return c.json({
          message: "User found",
          success: true,
          user: {
            achievementCoins:
              existingUser.userCoinBalance?.achievementCoins || 0,
            avatarUrl: existingUser.avatarUrl,
            bio: existingUser.bio,
            coins: existingUser.userCoinBalance?.totalCoins || 0,
            displayName: existingUser.displayName,
            experienceCoins: existingUser.userCoinBalance?.experienceCoins || 0,
            lastActiveAt: existingUser.lastActiveAt,
            location: existingUser.location,
            premiumCoins: existingUser.userCoinBalance?.premiumCoins || 0,
            referrerAddress: existingUser.referrerAddress,
            registrationDate: existingUser.registrationDate,
            socialCoins: existingUser.userCoinBalance?.socialCoins || 0,
            status: existingUser.status,
            totalLogins: existingUser.totalLogins + 1,
            twitterHandle: existingUser.twitterHandle,
            username: existingUser.username,
            walletAddress: existingUser.walletAddress,
            website: existingUser.website
          }
        });
      }

      // Create new user
      const newUser = await prisma.user.create({
        data: {
          displayName: displayName || username,
          referrerAddress,
          registrationTxHash,
          status: "Standard",
          username,
          walletAddress
        },
        include: {
          userCoinBalance: true,
          userStats: true
        }
      });

      // Initialize coin balance
      await prisma.userCoinBalance.create({
        data: {
          achievementCoins: 0,
          experienceCoins: 0,
          premiumCoins: 0,
          socialCoins: 0,
          totalCoins: 0,
          walletAddress
        }
      });

      // Initialize user stats
      await prisma.userStats.create({
        data: {
          daysAsPremium: 0,
          questsCompleted: 0,
          questsInProgress: 0,
          referralCount: 0,
          totalComments: 0,
          totalEarnings: 0,
          totalFollowers: 0,
          totalFollowing: 0,
          totalLikes: 0,
          totalPosts: 0,
          walletAddress
        }
      });

      return c.json(
        {
          message: "User created successfully",
          success: true,
          user: {
            achievementCoins: 0,
            avatarUrl: newUser.avatarUrl,
            bio: newUser.bio,
            coins: 0,
            displayName: newUser.displayName,
            experienceCoins: 0,
            lastActiveAt: newUser.lastActiveAt,
            location: newUser.location,
            premiumCoins: 0,
            referrerAddress: newUser.referrerAddress,
            registrationDate: newUser.registrationDate,
            socialCoins: 0,
            status: newUser.status,
            totalLogins: newUser.totalLogins,
            twitterHandle: newUser.twitterHandle,
            username: newUser.username,
            walletAddress: newUser.walletAddress,
            website: newUser.website
          }
        },
        201
      );
    } catch (error) {
      logger.error("Error creating/getting user:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// GET /users/:walletAddress - Get user data
usersRouter.get(
  "/:walletAddress",
  rateLimiter({ max: 30, windowMs: 60000 }), // 30 requests per minute
  zValidator("param", getUserDataSchema),
  async (c) => {
    try {
      const { walletAddress } = c.req.valid("param");

      const user = await prisma.user.findUnique({
        include: {
          userCoinBalance: true,
          userNotifications: {
            orderBy: { createdAt: "desc" },
            take: 10,
            where: { isRead: false }
          },
          userStats: true
        },
        where: { walletAddress }
      });

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      // Get tournament participation
      const tournamentIds = await prisma.tournamentParticipant.findMany({
        select: { tournamentId: true },
        where: { walletAddress }
      });

      return c.json({
        success: true,
        user: {
          achievementCoins: user.userCoinBalance?.achievementCoins || 0,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          coins: user.userCoinBalance?.totalCoins || 0,
          displayName: user.displayName,
          experienceCoins: user.userCoinBalance?.experienceCoins || 0,
          hasTournaments: tournamentIds.length > 0,
          lastActiveAt: user.lastActiveAt,
          location: user.location,
          premiumCoins: user.userCoinBalance?.premiumCoins || 0,
          referrerAddress: user.referrerAddress,
          registrationDate: user.registrationDate,
          socialCoins: user.userCoinBalance?.socialCoins || 0,
          stats: user.userStats,
          status: user.status,
          totalLogins: user.totalLogins,
          tournamentIds: tournamentIds.map((t) => t.tournamentId),
          twitterHandle: user.twitterHandle,
          unreadNotifications: user.userNotifications.length,
          username: user.username,
          walletAddress: user.walletAddress,
          website: user.website
        }
      });
    } catch (error) {
      logger.error("Error getting user data:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// PUT /users/:walletAddress - Update user
usersRouter.put(
  "/:walletAddress",
  authMiddleware,
  rateLimiter({ max: 20, windowMs: 60000 }), // 20 requests per minute
  zValidator("param", getUserDataSchema),
  zValidator("json", updateUserSchema),
  async (c) => {
    try {
      const { walletAddress } = c.req.valid("param");
      const updateData = c.req.valid("json");
      const authWalletAddress = c.get("walletAddress");

      // Check if user is updating their own profile
      if (walletAddress !== authWalletAddress) {
        return c.json({ error: "Unauthorized" }, 403);
      }

      const updatedUser = await prisma.user.update({
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          userCoinBalance: true,
          userStats: true
        },
        where: { walletAddress }
      });

      return c.json({
        message: "User updated successfully",
        success: true,
        user: {
          achievementCoins: updatedUser.userCoinBalance?.achievementCoins || 0,
          avatarUrl: updatedUser.avatarUrl,
          bio: updatedUser.bio,
          coins: updatedUser.userCoinBalance?.totalCoins || 0,
          displayName: updatedUser.displayName,
          experienceCoins: updatedUser.userCoinBalance?.experienceCoins || 0,
          lastActiveAt: updatedUser.lastActiveAt,
          location: updatedUser.location,
          premiumCoins: updatedUser.userCoinBalance?.premiumCoins || 0,
          referrerAddress: updatedUser.referrerAddress,
          registrationDate: updatedUser.registrationDate,
          socialCoins: updatedUser.userCoinBalance?.socialCoins || 0,
          status: updatedUser.status,
          totalLogins: updatedUser.totalLogins,
          twitterHandle: updatedUser.twitterHandle,
          username: updatedUser.username,
          walletAddress: updatedUser.walletAddress,
          website: updatedUser.website
        }
      });
    } catch (error) {
      logger.error("Error updating user:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// GET /users/:walletAddress/stats - Get user statistics
usersRouter.get(
  "/:walletAddress/stats",
  rateLimiter({ max: 30, windowMs: 60000 }),
  zValidator("param", getUserDataSchema),
  async (c) => {
    try {
      const { walletAddress } = c.req.valid("param");

      const user = await prisma.user.findUnique({
        include: {
          gameFavorites: { select: { id: true } },
          gameLikes: { select: { id: true } },
          gameRatings: { select: { id: true } },
          gameReviews: { select: { id: true } },
          tournamentParticipants: { select: { id: true } },
          userCoinBalance: true,
          userStats: true
        },
        where: { walletAddress }
      });

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      return c.json({
        stats: {
          ...user.userStats,
          achievementCoins: user.userCoinBalance?.achievementCoins || 0,
          coins: user.userCoinBalance?.totalCoins || 0,
          experienceCoins: user.userCoinBalance?.experienceCoins || 0,
          premiumCoins: user.userCoinBalance?.premiumCoins || 0,
          socialCoins: user.userCoinBalance?.socialCoins || 0,
          totalGameFavorites: user.gameFavorites.length,
          totalGameLikes: user.gameLikes.length,
          totalGameRatings: user.gameRatings.length,
          totalGameReviews: user.gameReviews.length,
          totalTournaments: user.tournamentParticipants.length
        },
        success: true
      });
    } catch (error) {
      logger.error("Error getting user stats:", error);
      return errorHandler(error as Error, c);
    }
  }
);

export default usersRouter;
