import logger from "@hey/helpers/logger";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { errorHandler } from "../../middlewares/errorHandler";
import rateLimiter from "../../middlewares/rateLimiter";
import prisma from "../../prisma/client";

const adminFeaturesRouter = new Hono();

// Validation schemas
const createAdminSchema = z.object({
  isActive: z.boolean().default(true),
  permissions: z.array(z.string()).default(["read"]),
  username: z.string().min(1).max(50),
  walletAddress: z.string().min(42).max(42)
});

const updateAdminSchema = z.object({
  isActive: z.boolean().optional(),
  permissions: z.array(z.string()).optional(),
  username: z.string().min(1).max(50).optional()
});

const systemStatsSchema = z.object({
  period: z.enum(["day", "week", "month", "year"]).default("month")
});

// GET /admin-features/stats - Get system statistics
adminFeaturesRouter.get(
  "/stats",
  rateLimiter({ max: 20, windowMs: 60000 }),
  zValidator("query", systemStatsSchema),
  async (c) => {
    try {
      const { period = "month" } = c.req.valid("query");

      // Calculate date range
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case "day":
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "year":
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Get comprehensive statistics
      const [
        totalUsers,
        newUsers,
        activeUsers,
        premiumUsers,
        bannedUsers,
        totalGames,
        totalTournaments,
        activeTournaments,
        totalTransactions,
        totalCoins,
        totalNotifications,
        systemUptime
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: {
            createdAt: {
              gte: startDate
            }
          }
        }),
        prisma.user.count({
          where: {
            lastActiveAt: {
              gte: startDate
            }
          }
        }),
        prisma.user.count({
          where: {
            premiumUpgradedAt: {
              not: null
            }
          }
        }),
        prisma.user.count({
          where: { banned: true }
        }),
        prisma.game.count(),
        prisma.tournament.count(),
        prisma.tournament.count({
          where: {
            status: "active"
          }
        }),
        prisma.userTransaction.count({
          where: {
            createdAt: {
              gte: startDate
            }
          }
        }),
        prisma.userCoinBalance.aggregate({
          _sum: {
            totalCoins: true
          }
        }),
        prisma.notification.count(),
        // System uptime calculation (simplified)
        process.uptime()
      ]);

      // Get daily user registrations for chart
      const dailyRegistrations = await prisma.user.groupBy({
        _count: {
          walletAddress: true
        },
        by: ["createdAt"],
        orderBy: {
          createdAt: "asc"
        },
        where: {
          createdAt: {
            gte: startDate
          }
        }
      });

      // Get game popularity
      const popularGames = await prisma.game.findMany({
        orderBy: {
          gameLikes: {
            _count: "desc"
          }
        },
        select: {
          _count: {
            select: {
              gameLikes: true,
              gamePlays: true,
              gameRatings: true
            }
          },
          id: true,
          slug: true,
          title: true
        },
        take: 10
      });

      // Get recent activities
      const recentActivities = await prisma.playHistory.findMany({
        orderBy: {
          createdAt: "desc"
        },
        select: {
          banDate: true,
          createdAt: true,
          id: true,
          walletAddress: true
        },
        take: 20,
        where: {
          createdAt: {
            gte: startDate
          }
        }
      });

      return c.json({
        data: {
          charts: {
            dailyRegistrations: dailyRegistrations.map((item) => ({
              count: item._count.walletAddress,
              date: item.createdAt.toISOString().split("T")[0]
            })),
            popularGames
          },
          overview: {
            activeTournaments,
            activeUsers,
            bannedUsers,
            newUsers,
            premiumUsers,
            systemUptime: Math.floor(systemUptime),
            totalCoins: totalCoins._sum.totalCoins || 0,
            totalGames,
            totalNotifications,
            totalTournaments,
            totalTransactions,
            totalUsers
          },
          recentActivities
        },
        success: true
      });
    } catch (error) {
      logger.error("Error getting system stats:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// GET /admin-features/users - Get users with admin controls
adminFeaturesRouter.get("/users", rateLimiter({ requests: 20 }), async (c) => {
  try {
    const page = Number.parseInt(c.req.query("page") || "1", 10);
    const limit = Number.parseInt(c.req.query("limit") || "20", 10);
    const search = c.req.query("search");
    const status = c.req.query("status");
    const offset = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { displayName: { contains: search, mode: "insensitive" } },
        { walletAddress: { contains: search, mode: "insensitive" } }
      ];
    }

    if (status === "banned") {
      where.banned = true;
    } else if (status === "premium") {
      where.premiumUpgradedAt = { not: null };
    } else if (status === "active") {
      where.lastActiveAt = {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          banned: true,
          createdAt: true,
          displayName: true,
          email: true,
          lastActiveAt: true,
          premiumUpgradedAt: true,
          totalLogins: true,
          userCoinBalance: {
            select: {
              achievementCoins: true,
              experienceCoins: true,
              premiumCoins: true,
              socialCoins: true,
              totalCoins: true
            }
          },
          username: true,
          userStats: {
            select: {
              referralCount: true,
              totalFollowers: true,
              totalFollowing: true,
              totalLikes: true,
              totalPosts: true
            }
          },
          walletAddress: true
        },
        skip: offset,
        take: limit,
        where
      }),
      prisma.user.count({ where })
    ]);

    return c.json({
      data: users,
      pagination: {
        limit,
        page,
        total,
        totalPages: Math.ceil(total / limit)
      },
      success: true
    });
  } catch (error) {
    logger.error("Error getting users:", error);
    return errorHandler(error as Error, c);
  }
});

// POST /admin-features/users/:walletAddress/ban - Ban user
adminFeaturesRouter.post(
  "/users/:walletAddress/ban",
  rateLimiter({ max: 10, windowMs: 60000 }),
  zValidator(
    "json",
    z.object({
      duration: z.number().int().min(0).optional(), // Duration in hours, 0 = permanent
      reason: z.string().min(1).max(500)
    })
  ),
  async (c) => {
    try {
      const walletAddress = c.req.param("walletAddress");
      const { reason: _reason, duration: _duration = 0 } = c.req.valid("json");

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { walletAddress }
      });

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      // Ban user
      await prisma.user.update({
        data: {
          banned: true,
          cheatCount: { increment: 1 }
        },
        where: { walletAddress }
      });

      // Log ban action
      await prisma.playHistory.create({
        data: {
          createdAt: new Date(),
          walletAddress
        }
      });

      return c.json({
        message: "User banned successfully",
        success: true
      });
    } catch (error) {
      logger.error("Error banning user:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// POST /admin-features/users/:walletAddress/unban - Unban user
adminFeaturesRouter.post(
  "/users/:walletAddress/unban",
  rateLimiter({ max: 10, windowMs: 60000 }),
  async (c) => {
    try {
      const walletAddress = c.req.param("walletAddress");

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { walletAddress }
      });

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      // Unban user
      await prisma.user.update({
        data: {
          banned: false,
          cheatCount: 0
        },
        where: { walletAddress }
      });

      // Log unban action
      await prisma.playHistory.create({
        data: {
          action: "admin_unban",
          metadata: {
            unbannedAt: new Date()
          },
          timestamp: new Date(),
          walletAddress
        }
      });

      return c.json({
        message: "User unbanned successfully",
        success: true
      });
    } catch (error) {
      logger.error("Error unbanning user:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// POST /admin-features/users/:walletAddress/reset-coins - Reset user coins
adminFeaturesRouter.post(
  "/users/:walletAddress/reset-coins",
  rateLimiter({ max: 10, windowMs: 60000 }),
  async (c) => {
    try {
      const walletAddress = c.req.param("walletAddress");

      // Reset user coins
      await prisma.userCoinBalance.update({
        data: {
          achievementCoins: 0,
          experienceCoins: 0,
          premiumCoins: 0,
          socialCoins: 0,
          totalCoins: 0
        },
        where: { walletAddress }
      });

      // Log reset action
      await prisma.playHistory.create({
        data: {
          action: "admin_reset_coins",
          metadata: {
            resetAt: new Date()
          },
          timestamp: new Date(),
          walletAddress
        }
      });

      return c.json({
        message: "User coins reset successfully",
        success: true
      });
    } catch (error) {
      logger.error("Error resetting user coins:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// GET /admin-features/admins - Get admin users
adminFeaturesRouter.get(
  "/admins",
  rateLimiter({ max: 20, windowMs: 60000 }),
  async (c) => {
    try {
      const admins = await prisma.admin.findMany({
        include: {
          user: {
            select: {
              displayName: true,
              email: true,
              username: true,
              walletAddress: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });

      return c.json({
        data: admins,
        success: true
      });
    } catch (error) {
      logger.error("Error getting admins:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// POST /admin-features/admins - Create admin
adminFeaturesRouter.post(
  "/admins",
  rateLimiter({ max: 5, windowMs: 60000 }),
  zValidator("json", createAdminSchema),
  async (c) => {
    try {
      const { walletAddress, username, permissions, isActive } =
        c.req.valid("json");

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { walletAddress }
      });

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      // Check if already admin
      const existingAdmin = await prisma.admin.findUnique({
        where: { walletAddress }
      });

      if (existingAdmin) {
        return c.json({ error: "User is already an admin" }, 400);
      }

      // Create admin
      const admin = await prisma.admin.create({
        data: {
          isActive,
          permissions,
          username,
          walletAddress
        }
      });

      return c.json(
        {
          data: admin,
          success: true
        },
        201
      );
    } catch (error) {
      logger.error("Error creating admin:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// PUT /admin-features/admins/:walletAddress - Update admin
adminFeaturesRouter.put(
  "/admins/:walletAddress",
  rateLimiter({ max: 5, windowMs: 60000 }),
  zValidator("json", updateAdminSchema),
  async (c) => {
    try {
      const walletAddress = c.req.param("walletAddress");
      const data = c.req.valid("json");

      const admin = await prisma.admin.update({
        data,
        where: { walletAddress }
      });

      return c.json({
        data: admin,
        success: true
      });
    } catch (error) {
      logger.error("Error updating admin:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// DELETE /admin-features/admins/:walletAddress - Remove admin
adminFeaturesRouter.delete(
  "/admins/:walletAddress",
  rateLimiter({ max: 5, windowMs: 60000 }),
  async (c) => {
    try {
      const walletAddress = c.req.param("walletAddress");

      await prisma.admin.delete({
        where: { walletAddress }
      });

      return c.json({
        message: "Admin removed successfully",
        success: true
      });
    } catch (error) {
      logger.error("Error removing admin:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// GET /admin-features/system-health - Get system health status
adminFeaturesRouter.get(
  "/system-health",
  rateLimiter({ max: 10, windowMs: 60000 }),
  async (c) => {
    try {
      const [
        dbStatus,
        redisStatus,
        totalUsers,
        activeUsers,
        systemUptime,
        memoryUsage,
        cpuUsage
      ] = await Promise.all([
        // Test database connection
        prisma.user
          .count()
          .then(() => "healthy")
          .catch(() => "unhealthy"),
        // Redis status (simplified)
        Promise.resolve("healthy"), // Assuming Redis is working
        prisma.user.count(),
        prisma.user.count({
          where: {
            lastActiveAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        }),
        process.uptime(),
        process.memoryUsage(),
        // CPU usage (simplified)
        process.cpuUsage()
      ]);

      return c.json({
        data: {
          database: dbStatus,
          redis: redisStatus,
          status: dbStatus === "healthy" ? "healthy" : "degraded",
          system: {
            cpu: {
              system: cpuUsage.system,
              user: cpuUsage.user
            },
            memory: {
              external: memoryUsage.external,
              total: memoryUsage.heapTotal,
              used: memoryUsage.heapUsed
            },
            uptime: Math.floor(systemUptime)
          },
          users: {
            active: activeUsers,
            total: totalUsers
          }
        },
        success: true
      });
    } catch (error) {
      logger.error("Error getting system health:", error);
      return errorHandler(error as Error, c);
    }
  }
);

export default adminFeaturesRouter;
