import logger from "@hey/helpers/logger";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { errorHandler } from "../../middlewares/errorHandler";
import rateLimiter from "../../middlewares/rateLimiter";
import prisma from "../../prisma/client";

const banSecurityRouter = new Hono();

// Validation schemas
const banCheckSchema = z.object({
  wallet_address: z.string().min(42).max(42)
});

const banUserSchema = z.object({
  walletAddress: z.string().min(42).max(42),
  reason: z.string().min(1).max(500),
  duration: z.number().int().min(0).optional(), // Duration in hours, 0 = permanent
  cheatCount: z.number().int().min(0).optional()
});

const unbanUserSchema = z.object({
  walletAddress: z.string().min(42).max(42)
});

// POST /ban-security/check-ban - Check if user is banned (equivalent to banCheck.php)
banSecurityRouter.post(
  "/check-ban",
  rateLimiter({ max: 30, windowMs: 60000 }),
  zValidator("json", banCheckSchema),
  async (c) => {
    try {
      const { wallet_address } = c.req.valid("json");

      // Check if the user is banned and get the ban date
      const user = await prisma.user.findUnique({
        where: { walletAddress: wallet_address },
        select: {
          walletAddress: true,
          banned: true
        }
      });

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      // Check for ban in play history
      const banRecord = await prisma.playHistory.findFirst({
        where: {
          walletAddress: wallet_address,
          action: "ban"
        },
        orderBy: { timestamp: "desc" }
      });

      if (user.banned && banRecord) {
        const currentDate = new Date();
        const banEndDate = new Date(banRecord.timestamp);
        banEndDate.setHours(banEndDate.getHours() + 24); // Default 24 hour ban

        if (currentDate < banEndDate) {
          const remainingTime = Math.max(0, banEndDate.getTime() - currentDate.getTime());
          const hours = Math.floor(remainingTime / (1000 * 60 * 60));
          const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
          
          return c.json({
            banned: true,
            remaining_time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          });
        } else {
          // Ban has expired, unban the user
          await prisma.$transaction(async (tx) => {
            // Delete the ban record
            await tx.playHistory.deleteMany({
              where: {
                walletAddress: wallet_address,
                action: "ban"
              }
            });

            // Update user status
            await tx.user.update({
              where: { walletAddress: wallet_address },
              data: {
                banned: false,
                cheatCount: 0
              }
            });

            // Reset coins
            await tx.userCoinBalance.updateMany({
              where: { walletAddress: wallet_address },
              data: {
                totalCoins: 0,
                experienceCoins: 0,
                achievementCoins: 0,
                socialCoins: 0,
                premiumCoins: 0
              }
            });
          });

          return c.json({ banned: "False and Updated records" });
        }
      } else {
        return c.json({ banned: false });
      }
    } catch (error) {
      logger.error("Error checking ban status:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// POST /ban-security/ban-user - Ban a user
banSecurityRouter.post(
  "/ban-user",
  rateLimiter({ max: 10, windowMs: 60000 }),
  zValidator("json", banUserSchema),
  async (c) => {
    try {
      const { walletAddress, reason, duration = 24, cheatCount = 1 } = c.req.valid("json");

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { walletAddress }
      });

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      // Ban the user
      await prisma.$transaction(async (tx) => {
        // Update user status
        await tx.user.update({
          where: { walletAddress },
          data: {
            banned: true,
            cheatCount
          }
        });

        // Log the ban
        await tx.playHistory.create({
          data: {
            walletAddress,
            action: "ban",
            metadata: {
              reason,
              duration,
              cheatCount,
              bannedAt: new Date()
            },
            timestamp: new Date()
          }
        });
      });

      return c.json({
        success: true,
        message: "User banned successfully",
        duration: duration === 0 ? "permanent" : `${duration} hours`
      });
    } catch (error) {
      logger.error("Error banning user:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// POST /ban-security/unban-user - Unban a user
banSecurityRouter.post(
  "/unban-user",
  rateLimiter({ max: 10, windowMs: 60000 }),
  zValidator("json", unbanUserSchema),
  async (c) => {
    try {
      const { walletAddress } = c.req.valid("json");

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { walletAddress }
      });

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      // Unban the user
      await prisma.$transaction(async (tx) => {
        // Update user status
        await tx.user.update({
          where: { walletAddress },
          data: {
            banned: false,
            cheatCount: 0
          }
        });

        // Delete ban records
        await tx.playHistory.deleteMany({
          where: {
            walletAddress,
            action: "ban"
          }
        });
      });

      return c.json({
        success: true,
        message: "User unbanned successfully"
      });
    } catch (error) {
      logger.error("Error unbanning user:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// GET /ban-security/banned-users - Get list of banned users
banSecurityRouter.get(
  "/banned-users",
  rateLimiter({ max: 20, windowMs: 60000 }),
  async (c) => {
    try {
      const page = parseInt(c.req.query("page") || "1");
      const limit = parseInt(c.req.query("limit") || "20");
      const offset = (page - 1) * limit;

      const [bannedUsers, total] = await Promise.all([
        prisma.user.findMany({
          where: { banned: true },
          select: {
            walletAddress: true,
            username: true,
            displayName: true,
            cheatCount: true,
            createdAt: true
          },
          skip: offset,
          take: limit,
          orderBy: { createdAt: "desc" }
        }),
        prisma.user.count({
          where: { banned: true }
        })
      ]);

      return c.json({
        success: true,
        data: bannedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error("Error getting banned users:", error);
      return errorHandler(error as Error, c);
    }
  }
);

export default banSecurityRouter;
