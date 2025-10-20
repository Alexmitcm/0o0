import { PrismaClient } from "@prisma/client";
import { Hono } from "hono";
import { z } from "zod";
import authMiddleware from "../middlewares/authMiddleware";
import handleApiError from "../utils/handleApiError";

const prisma = new PrismaClient();
const analyticsReporting = new Hono();

// Health check endpoint
analyticsReporting.get("/health", async (c) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    return c.json({
      database: "connected",
      service: "analytics-reporting",
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    });
  } catch (error) {
    return c.json(
      {
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        service: "analytics-reporting",
        status: "unhealthy",
        timestamp: new Date().toISOString()
      },
      503
    );
  }
});

// Validation schemas
const generateReportSchema = z.object({
  endDate: z.string().datetime().optional(),
  filters: z.record(z.any()).optional(),
  format: z.enum(["json", "csv", "excel"]).default("json"),
  reportType: z.enum([
    "users",
    "transactions",
    "tournaments",
    "coins",
    "withdrawals"
  ]),
  startDate: z.string().datetime().optional()
});

const userAnalyticsSchema = z.object({
  endDate: z.string().datetime().optional(),
  period: z.enum(["daily", "weekly", "monthly", "yearly"]).default("monthly"),
  startDate: z.string().datetime().optional()
});

// Helper function to generate CSV
function generateCSV(data: any[], headers: string[]): string {
  const csvHeaders = headers.join(",");
  const csvRows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header];
        return typeof value === "string" && value.includes(",")
          ? `"${value}"`
          : value;
      })
      .join(",")
  );
  return [csvHeaders, ...csvRows].join("\n");
}

// Helper function to generate Excel (simplified)
function generateExcel(data: any[], headers: string[]): string {
  // In a real implementation, you would use a library like xlsx
  // For now, return CSV format
  return generateCSV(data, headers);
}

// GET /dashboard-stats - Get dashboard statistics
analyticsReporting.get("/dashboard-stats", authMiddleware, async (c) => {
  try {
    const [
      totalUsers,
      activeUsers,
      premiumUsers,
      bannedUsers,
      totalCoins,
      totalTransactions,
      totalTournaments,
      totalWithdrawals,
      recentUsers,
      topUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastActiveAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      }),
      prisma.user.count({ where: { status: "Premium" } }),
      prisma.user.count({ where: { banned: true } }),
      prisma.userCoinBalance.aggregate({
        _sum: { totalCoins: true }
      }),
      prisma.coinTransaction.count(),
      prisma.tournament.count(),
      prisma.withdrawTransaction.aggregate({
        _sum: { amount: true }
      }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          createdAt: true,
          status: true,
          username: true,
          walletAddress: true
        },
        take: 5
      }),
      prisma.userCoinBalance.findMany({
        include: {
          user: {
            select: {
              status: true,
              username: true,
              walletAddress: true
            }
          }
        },
        orderBy: { totalCoins: "desc" },
        take: 5
      })
    ]);

    return c.json({
      stats: {
        coins: {
          total: totalCoins._sum.totalCoins || 0
        },
        recentUsers,
        topUsers: topUsers.map((user) => ({
          status: user.user.status,
          totalCoins: user.totalCoins,
          username: user.user.username,
          walletAddress: user.user.walletAddress
        })),
        tournaments: {
          total: totalTournaments
        },
        transactions: {
          total: totalTransactions
        },
        users: {
          active: activeUsers,
          banned: bannedUsers,
          premium: premiumUsers,
          total: totalUsers
        },
        withdrawals: {
          total: Number(totalWithdrawals._sum.amount || 0) / 1000000 // Convert from micro-units
        }
      },
      success: true
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /user-analytics - Get user analytics
analyticsReporting.get("/user-analytics", authMiddleware, async (c) => {
  try {
    const query = c.req.query();
    const { period, startDate, endDate } = userAnalyticsSchema.parse(query);

    const now = new Date();
    let dateFilter: any = {};

    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = {
        createdAt: {
          gte: thirtyDaysAgo
        }
      };
    }

    // Get user registration data
    const userRegistrations = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        banned: true,
        createdAt: true,
        status: true
      },
      where: dateFilter
    });

    // Group by period
    const groupedData: Record<string, any> = {};

    userRegistrations.forEach((user) => {
      let key: string;
      const date = new Date(user.createdAt);

      switch (period) {
        case "daily":
          key = date.toISOString().split("T")[0];
          break;
        case "weekly": {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split("T")[0];
          break;
        }
        case "monthly":
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          break;
        case "yearly":
          key = date.getFullYear().toString();
          break;
        default:
          key = date.toISOString().split("T")[0];
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          banned: 0,
          period: key,
          premium: 0,
          standard: 0,
          total: 0
        };
      }

      groupedData[key].total++;
      if (user.status === "Premium") {
        groupedData[key].premium++;
      } else {
        groupedData[key].standard++;
      }
      if (user.banned) {
        groupedData[key].banned++;
      }
    });

    const analyticsData = Object.values(groupedData);

    return c.json({
      data: analyticsData,
      period,
      success: true
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /coin-analytics - Get coin analytics
analyticsReporting.get("/coin-analytics", authMiddleware, async (c) => {
  try {
    const startDate = c.req.query("startDate");
    const endDate = c.req.query("endDate");

    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };
    }

    const [coinTransactions, coinBalances, coinByType] = await Promise.all([
      prisma.coinTransaction.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          amount: true,
          coinType: true,
          createdAt: true,
          transactionType: true
        },
        where: dateFilter
      }),
      prisma.userCoinBalance.findMany({
        select: {
          achievementCoins: true,
          experienceCoins: true,
          premiumCoins: true,
          socialCoins: true,
          totalCoins: true
        }
      }),
      prisma.coinTransaction.groupBy({
        _count: { coinType: true },
        _sum: { amount: true },
        by: ["coinType"],
        where: dateFilter
      })
    ]);

    // Calculate totals
    const totalCoins = coinBalances.reduce(
      (sum, balance) => sum + balance.totalCoins,
      0
    );
    const totalExperienceCoins = coinBalances.reduce(
      (sum, balance) => sum + balance.experienceCoins,
      0
    );
    const totalAchievementCoins = coinBalances.reduce(
      (sum, balance) => sum + balance.achievementCoins,
      0
    );
    const totalSocialCoins = coinBalances.reduce(
      (sum, balance) => sum + balance.socialCoins,
      0
    );
    const totalPremiumCoins = coinBalances.reduce(
      (sum, balance) => sum + balance.premiumCoins,
      0
    );

    // Group transactions by date
    const transactionsByDate: Record<string, any> = {};
    coinTransactions.forEach((tx) => {
      const date = new Date(tx.createdAt).toISOString().split("T")[0];
      if (!transactionsByDate[date]) {
        transactionsByDate[date] = {
          date,
          earned: 0,
          spent: 0,
          transferred: 0
        };
      }

      if (tx.transactionType === "Earned") {
        transactionsByDate[date].earned += tx.amount;
      } else if (tx.transactionType === "Spent") {
        transactionsByDate[date].spent += tx.amount;
      } else if (tx.transactionType === "Transferred") {
        transactionsByDate[date].transferred += tx.amount;
      }
    });

    return c.json({
      data: {
        byType: coinByType.map((item) => ({
          coinType: item.coinType,
          totalAmount: item._sum.amount || 0,
          transactionCount: item._count.coinType
        })),
        totals: {
          totalAchievementCoins,
          totalCoins,
          totalExperienceCoins,
          totalPremiumCoins,
          totalSocialCoins
        },
        transactionsByDate: Object.values(transactionsByDate)
      },
      success: true
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /tournament-analytics - Get tournament analytics
analyticsReporting.get("/tournament-analytics", authMiddleware, async (c) => {
  try {
    const [tournaments, participants, prizeDistribution] = await Promise.all([
      prisma.tournament.findMany({
        include: {
          participants: true,
          userTransactions: true
        }
      }),
      prisma.tournamentParticipant.findMany({
        include: {
          user: {
            select: {
              username: true,
              walletAddress: true
            }
          }
        }
      }),
      prisma.tournamentParticipant.findMany({
        select: {
          coinsBurned: true,
          prizeAmount: true,
          tournament: {
            select: {
              name: true,
              prizePool: true
            }
          }
        },
        where: {
          prizeAmount: { not: null }
        }
      })
    ]);

    const tournamentStats = tournaments.map((tournament) => ({
      endDate: tournament.endDate,
      id: tournament.id,
      name: tournament.name,
      participantCount: tournament.participants.length,
      prizePool: Number(tournament.prizePool),
      startDate: tournament.startDate,
      status: tournament.status,
      totalCoinsGathered: Number(tournament.coinsGathered),
      type: tournament.type
    }));

    const participantStats = participants.map((participant) => ({
      coinsBurned: Number(participant.coinsBurned),
      prizeAmount: participant.prizeAmount
        ? Number(participant.prizeAmount)
        : 0,
      tournamentName: participant.tournament.name,
      username: participant.user.username,
      walletAddress: participant.user.walletAddress
    }));

    const totalPrizeDistributed = prizeDistribution.reduce(
      (sum, p) => sum + Number(p.prizeAmount || 0),
      0
    );
    const totalCoinsBurned = prizeDistribution.reduce(
      (sum, p) => sum + Number(p.coinsBurned),
      0
    );

    return c.json({
      data: {
        participants: participantStats,
        summary: {
          averageParticipantsPerTournament:
            participants.length / tournaments.length || 0,
          totalCoinsBurned,
          totalParticipants: participants.length,
          totalPrizeDistributed,
          totalTournaments: tournaments.length
        },
        tournaments: tournamentStats
      },
      success: true
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

// POST /generate-report - Generate custom report
analyticsReporting.post("/generate-report", authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { reportType, startDate, endDate, format, filters } =
      generateReportSchema.parse(body);

    let data: any[] = [];
    let headers: string[] = [];

    const dateFilter =
      startDate && endDate
        ? {
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate)
            }
          }
        : {};

    switch (reportType) {
      case "users":
        data = await prisma.user.findMany({
          select: {
            banned: true,
            createdAt: true,
            email: true,
            lastActiveAt: true,
            leftNode: true,
            rightNode: true,
            status: true,
            totalEq: true,
            username: true,
            walletAddress: true
          },
          where: { ...dateFilter, ...filters }
        });
        headers = [
          "walletAddress",
          "username",
          "email",
          "status",
          "banned",
          "totalEq",
          "leftNode",
          "rightNode",
          "createdAt",
          "lastActiveAt"
        ];
        break;

      case "transactions":
        data = await prisma.coinTransaction.findMany({
          include: {
            user: {
              select: {
                username: true,
                walletAddress: true
              }
            }
          },
          where: { ...dateFilter, ...filters }
        });
        headers = [
          "id",
          "walletAddress",
          "username",
          "coinType",
          "amount",
          "transactionType",
          "sourceType",
          "description",
          "createdAt"
        ];
        break;

      case "tournaments":
        data = await prisma.tournament.findMany({
          include: {
            participants: true
          },
          where: { ...dateFilter, ...filters }
        });
        headers = [
          "id",
          "name",
          "type",
          "status",
          "prizePool",
          "coinsGathered",
          "participantCount",
          "startDate",
          "endDate",
          "createdAt"
        ];
        break;

      case "coins":
        data = await prisma.userCoinBalance.findMany({
          include: {
            user: {
              select: {
                status: true,
                username: true,
                walletAddress: true
              }
            }
          },
          where: { ...filters }
        });
        headers = [
          "walletAddress",
          "username",
          "status",
          "totalCoins",
          "experienceCoins",
          "achievementCoins",
          "socialCoins",
          "premiumCoins",
          "lastUpdatedAt"
        ];
        break;

      case "withdrawals":
        data = await prisma.withdrawTransaction.findMany({
          include: {
            user: {
              select: {
                username: true,
                walletAddress: true
              }
            }
          },
          where: { ...dateFilter, ...filters }
        });
        headers = [
          "id",
          "walletAddress",
          "username",
          "userTx",
          "amount",
          "fromField",
          "toField",
          "dateOfTransaction",
          "createdAt"
        ];
        break;
    }

    // Format data based on requested format
    let responseData: any;
    let contentType: string;

    switch (format) {
      case "csv":
        responseData = generateCSV(data, headers);
        contentType = "text/csv";
        break;
      case "excel":
        responseData = generateExcel(data, headers);
        contentType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        break;
      default:
        responseData = { data, headers };
        contentType = "application/json";
    }

    if (format === "csv" || format === "excel") {
      c.header("Content-Type", contentType);
      c.header(
        "Content-Disposition",
        `attachment; filename="${reportType}_report.${format}"`
      );
      return c.text(responseData);
    }

    return c.json({
      data: responseData,
      format,
      reportType,
      success: true
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /export-users-csv - Export users as CSV
analyticsReporting.get("/export-users-csv", authMiddleware, async (c) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        banned: true,
        createdAt: true,
        email: true,
        lastActiveAt: true,
        leftNode: true,
        rightNode: true,
        status: true,
        totalEq: true,
        username: true,
        walletAddress: true
      }
    });

    const headers = [
      "walletAddress",
      "username",
      "email",
      "status",
      "banned",
      "totalEq",
      "leftNode",
      "rightNode",
      "createdAt",
      "lastActiveAt"
    ];
    const csv = generateCSV(users, headers);

    c.header("Content-Type", "text/csv");
    c.header("Content-Disposition", 'attachment; filename="users_export.csv"');
    return c.text(csv);
  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /export-transactions-csv - Export transactions as CSV
analyticsReporting.get(
  "/export-transactions-csv",
  authMiddleware,
  async (c) => {
    try {
      const transactions = await prisma.coinTransaction.findMany({
        include: {
          user: {
            select: {
              username: true,
              walletAddress: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });

      const headers = [
        "id",
        "walletAddress",
        "username",
        "coinType",
        "amount",
        "transactionType",
        "sourceType",
        "description",
        "createdAt"
      ];
      const csv = generateCSV(transactions, headers);

      c.header("Content-Type", "text/csv");
      c.header(
        "Content-Disposition",
        'attachment; filename="transactions_export.csv"'
      );
      return c.text(csv);
    } catch (error) {
      return handleApiError(c, error);
    }
  }
);

// GET /real-time-stats - Get real-time statistics
analyticsReporting.get("/real-time-stats", authMiddleware, async (c) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      activeUsersLastHour,
      activeUsersLastDay,
      transactionsLastHour,
      transactionsLastDay,
      newUsersLastHour,
      newUsersLastDay
    ] = await Promise.all([
      prisma.user.count({
        where: {
          lastActiveAt: { gte: oneHourAgo }
        }
      }),
      prisma.user.count({
        where: {
          lastActiveAt: { gte: oneDayAgo }
        }
      }),
      prisma.coinTransaction.count({
        where: {
          createdAt: { gte: oneHourAgo }
        }
      }),
      prisma.coinTransaction.count({
        where: {
          createdAt: { gte: oneDayAgo }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: oneHourAgo }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: oneDayAgo }
        }
      })
    ]);

    return c.json({
      realTimeStats: {
        lastDay: {
          activeUsers: activeUsersLastDay,
          newUsers: newUsersLastDay,
          transactions: transactionsLastDay
        },
        lastHour: {
          activeUsers: activeUsersLastHour,
          newUsers: newUsersLastHour,
          transactions: transactionsLastHour
        }
      },
      success: true
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

export default analyticsReporting;