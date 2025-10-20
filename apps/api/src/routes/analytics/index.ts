import logger from "@hey/helpers/logger";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { errorHandler } from "../../middlewares/errorHandler";
import rateLimiter from "../../middlewares/rateLimiter";
import prisma from "../../prisma/client";

const analyticsRouter = new Hono();

// Validation schemas
const getAnalyticsSchema = z.object({
  endDate: z.string().datetime().optional(),
  period: z.enum(["day", "week", "month", "year"]).optional(),
  startDate: z.string().datetime().optional()
});

// GET /analytics/overview - Get analytics overview (equivalent to d3BackEnd.php)
analyticsRouter.get(
  "/overview",
  rateLimiter({ max: 20, windowMs: 60000 }),
  zValidator("query", getAnalyticsSchema),
  async (c) => {
    try {
      const { startDate, endDate, period = "month" } = c.req.valid("query");

      // Set date range
      const now = new Date();
      let start: Date;
      let end: Date = now;

      if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
      } else {
        switch (period) {
          case "day":
            start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case "week":
            start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case "year":
            start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
      }

      // Get user statistics
      const [
        totalUsers,
        newUsers,
        premiumUsers,
        bannedUsers,
        totalGames,
        totalTournaments,
        totalTransactions,
        totalCoins
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: {
            createdAt: {
              gte: start,
              lte: end
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
        prisma.userTransaction.count({
          where: {
            createdAt: {
              gte: start,
              lte: end
            }
          }
        }),
        prisma.userCoinBalance.aggregate({
          _sum: {
            totalCoins: true
          }
        })
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
            gte: start,
            lte: end
          }
        }
      });

      // Get game popularity
      const gameStats = await prisma.game.findMany({
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

      return c.json({
        data: {
          charts: {
            dailyRegistrations: dailyRegistrations.map((item) => ({
              count: item._count.walletAddress,
              date: item.createdAt.toISOString().split("T")[0]
            })),
            gameStats
          },
          overview: {
            bannedUsers,
            newUsers,
            premiumUsers,
            totalCoins: totalCoins._sum.totalCoins || 0,
            totalGames,
            totalTournaments,
            totalTransactions,
            totalUsers
          }
        },
        success: true
      });
    } catch (error) {
      logger.error("Error getting analytics overview:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// GET /analytics/user/:walletAddress - Get user analytics (equivalent to d3BackendUser.php)
analyticsRouter.get(
  "/user/:walletAddress",
  rateLimiter({ max: 30, windowMs: 60000 }),
  async (c) => {
    try {
      const walletAddress = c.req.param("walletAddress");

      // Get user data
      const user = await prisma.user.findUnique({
        include: {
          gameLikes: true,
          gamePlays: true,
          gameRatings: true,
          tournamentParticipants: true,
          userCoinBalance: true,
          userStats: true
        },
        where: { walletAddress }
      });

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      // Get user activity over time
      const activityData = await prisma.playHistory.findMany({
        orderBy: {
          timestamp: "asc"
        },
        where: {
          timestamp: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          },
          walletAddress
        }
      });

      // Group activity by day
      const dailyActivity = activityData.reduce(
        (acc, activity) => {
          const date = activity.timestamp.toISOString().split("T")[0];
          if (!acc[date]) {
            acc[date] = 0;
          }
          acc[date]++;
          return acc;
        },
        {} as Record<string, number>
      );

      return c.json({
        data: {
          activity: Object.entries(dailyActivity).map(([date, count]) => ({
            count,
            date
          })),
          stats: {
            achievementCoins: user.userCoinBalance?.achievementCoins || 0,
            experienceCoins: user.userCoinBalance?.experienceCoins || 0,
            premiumCoins: user.userCoinBalance?.premiumCoins || 0,
            socialCoins: user.userCoinBalance?.socialCoins || 0,
            totalCoins: user.userCoinBalance?.totalCoins || 0,
            totalLikes: user.gameLikes.length,
            totalPlays: user.gamePlays.length,
            totalRatings: user.gameRatings.length,
            totalTournaments: user.tournamentParticipants.length,
            ...user.userStats
          },
          user: {
            banned: user.banned,
            createdAt: user.createdAt,
            displayName: user.displayName,
            premiumUpgradedAt: user.premiumUpgradedAt,
            username: user.username,
            walletAddress: user.walletAddress
          }
        },
        success: true
      });
    } catch (error) {
      logger.error("Error getting user analytics:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// GET /analytics/csv-export - Export data as CSV (equivalent to CsvGenerator/generate_csv.php)
analyticsRouter.get(
  "/csv-export",
  rateLimiter({ max: 5, windowMs: 60000 }),
  async (c) => {
    try {
      const type = c.req.query("type") || "users";
      const format = c.req.query("format") || "csv";

      let data: any[] = [];
      let filename = "";

      switch (type) {
        case "users":
          data = await prisma.user.findMany({
            select: {
              banned: true,
              createdAt: true,
              displayName: true,
              email: true,
              premiumUpgradedAt: true,
              totalLogins: true,
              username: true,
              walletAddress: true
            }
          });
          filename = "users_export.csv";
          break;

        case "games":
          data = await prisma.game.findMany({
            select: {
              createdAt: true,
              description: true,
              id: true,
              isFeatured: true,
              slug: true,
              status: true,
              title: true
            }
          });
          filename = "games_export.csv";
          break;

        case "transactions":
          data = await prisma.userTransaction.findMany({
            select: {
              amount: true,
              coinType: true,
              id: true,
              reason: true,
              timestamp: true,
              transactionHash: true,
              walletAddress: true
            }
          });
          filename = "transactions_export.csv";
          break;

        case "tournaments":
          data = await prisma.tournament.findMany({
            select: {
              createdAt: true,
              description: true,
              endDate: true,
              id: true,
              name: true,
              prize: true,
              startDate: true,
              status: true
            }
          });
          filename = "tournaments_export.csv";
          break;

        default:
          return c.json({ error: "Invalid export type" }, 400);
      }

      // Convert to CSV
      if (data.length === 0) {
        return c.json({ error: "No data to export" }, 404);
      }

      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(","),
        ...data.map((row) =>
          headers
            .map((header) => {
              const value = row[header as keyof typeof row];
              return typeof value === "string" && value.includes(",")
                ? `"${value}"`
                : value;
            })
            .join(",")
        )
      ].join("\n");

      return new Response(csvContent, {
        headers: {
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Type": "text/csv"
        }
      });
    } catch (error) {
      logger.error("Error exporting CSV:", error);
      return errorHandler(error as Error, c);
    }
  }
);

export default analyticsRouter;
