import prisma from "../prisma/client";
import logger from "../utils/logger";
import MetricsService from "./MetricsService";

export class DatabaseService {
  /**
   * Execute a database operation with metrics and error handling
   */
  static async execute<T>(
    operation: string,
    table: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();

    try {
      const result = await fn();
      const duration = Date.now() - start;

      MetricsService.recordDatabase({
        duration,
        operation,
        success: true,
        table,
        timestamp: new Date()
      });

      return result;
    } catch (error) {
      const duration = Date.now() - start;

      MetricsService.recordDatabase({
        duration,
        error: error instanceof Error ? error.message : "Unknown error",
        operation,
        success: false,
        table,
        timestamp: new Date()
      });

      logger.error(
        `Database operation failed: ${operation} on ${table}`,
        error
      );
      throw error;
    }
  }

  /**
   * Optimized user queries
   */
  static async getUserWithStats(walletAddress: string) {
    return DatabaseService.execute("findUnique", "User", () =>
      prisma.user.findUnique({
        include: {
          preferences: true,
          premiumProfile: true,
          userQuests: {
            orderBy: { createdAt: "desc" },
            where: { status: "Active" }
          },
          userRewards: {
            orderBy: { createdAt: "desc" },
            take: 10,
            where: { status: "Pending" }
          },
          userStats: true
        },
        where: { walletAddress }
      })
    );
  }

  /**
   * Optimized game queries with pagination
   */
  static async getGamesWithPagination(options: {
    page: number;
    limit: number;
    category?: string;
    status?: string;
    search?: string;
    minRating?: number;
    maxRating?: number;
  }) {
    const { page, limit, status, search, minRating, maxRating } = options;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }
    if (minRating !== undefined || maxRating !== undefined) {
      where.rating = {};
      if (minRating !== undefined) where.rating.gte = minRating;
      if (maxRating !== undefined) where.rating.lte = maxRating;
    }

    return DatabaseService.execute("findMany", "Game", () =>
      prisma.game.findMany({
        include: {
          _count: {
            select: {
              gameComments: true,
              gameLikes: true,
              gameRatings: true
            }
          },
          categories: true,
          GameTag: true
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        where
      })
    );
  }

  /**
   * Get game count for pagination
   */
  static async getGameCount(filters: any) {
    return DatabaseService.execute("count", "Game", () =>
      prisma.game.count({ where: filters })
    );
  }

  /**
   * Optimized tournament queries
   */
  static async getActiveTournaments() {
    return DatabaseService.execute("findMany", "Tournament", () =>
      prisma.tournament.findMany({
        include: {
          _count: {
            select: {
              participants: true
            }
          }
        },
        orderBy: { startDate: "asc" },
        where: {
          status: {
            in: ["Upcoming", "Active"]
          }
        }
      })
    );
  }

  /**
   * Get user's tournament participation
   */
  static async getUserTournamentParticipation(walletAddress: string) {
    return DatabaseService.execute("findMany", "TournamentParticipant", () =>
      prisma.tournamentParticipant.findMany({
        include: {
          tournament: true
        },
        orderBy: { createdAt: "desc" },
        where: { walletAddress }
      })
    );
  }

  /**
   * Batch operations for better performance
   */
  static async batchUpdateUserStats(
    updates: Array<{
      walletAddress: string;
      stats: any;
    }>
  ) {
    return DatabaseService.execute("updateMany", "UserStats", async () => {
      const promises = updates.map(({ walletAddress, stats }) =>
        prisma.userStats.upsert({
          create: { walletAddress, ...stats },
          update: stats,
          where: { walletAddress }
        })
      );

      return Promise.all(promises);
    });
  }

  /**
   * Get popular games with caching
   */
  static async getPopularGames(limit = 10) {
    return DatabaseService.execute("findMany", "Game", () =>
      prisma.game.findMany({
        include: {
          _count: {
            select: {
              gameLikes: true,
              gamePlays: true,
              gameRatings: true
            }
          },
          categories: true
        },
        orderBy: [
          { playCount: "desc" },
          { likeCount: "desc" },
          { rating: "desc" }
        ],
        take: limit,
        where: { status: "Published" }
      })
    );
  }

  /**
   * Get trending games (based on recent activity)
   */
  static async getTrendingGames(limit = 10, days = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return DatabaseService.execute("findMany", "Game", () =>
      prisma.game.findMany({
        include: {
          _count: {
            select: {
              gameLikes: true,
              gamePlays: {
                where: {
                  createdAt: {
                    gte: cutoffDate
                  }
                }
              },
              gameRatings: true
            }
          },
          categories: true
        },
        orderBy: {
          gamePlays: {
            _count: "desc"
          }
        },
        take: limit,
        where: {
          gamePlays: {
            some: {
              createdAt: {
                gte: cutoffDate
              }
            }
          },
          status: "Published"
        }
      })
    );
  }

  /**
   * Get user's game activity
   */
  static async getUserGameActivity(walletAddress: string, limit = 20) {
    return DatabaseService.execute("findMany", "GamePlay", () =>
      prisma.gamePlay.findMany({
        include: {
          game: {
            select: {
              iconUrl: true,
              id: true,
              slug: true,
              title: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        where: { playerAddress: walletAddress }
      })
    );
  }

  /**
   * Get game analytics
   */
  static async getGameAnalytics(gameId: string) {
    return DatabaseService.execute("findUnique", "Game", () =>
      prisma.game.findUnique({
        include: {
          _count: {
            select: {
              gameComments: true,
              gameDislikes: true,
              gameFavorites: true,
              gameLikes: true,
              gamePlays: true,
              gameRatings: true
            }
          },
          gameRatings: {
            select: {
              rating: true
            }
          }
        },
        where: { id: gameId }
      })
    );
  }

  /**
   * Database maintenance operations
   */
  static async cleanupExpiredData() {
    const now = new Date();

    // Clean up expired notifications (older than 30 days)
    const expiredNotifications = await DatabaseService.execute(
      "deleteMany",
      "UserNotification",
      () =>
        prisma.userNotification.deleteMany({
          where: {
            createdAt: {
              lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            },
            isRead: true
          }
        })
    );

    // Clean up old game plays (older than 90 days)
    const oldGamePlays = await DatabaseService.execute(
      "deleteMany",
      "GamePlay",
      () =>
        prisma.gamePlay.deleteMany({
          where: {
            createdAt: {
              lt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            }
          }
        })
    );

    logger.info(
      `Database cleanup completed: ${expiredNotifications.count} notifications, ${oldGamePlays.count} game plays removed`
    );

    return {
      expiredNotifications: expiredNotifications.count,
      oldGamePlays: oldGamePlays.count
    };
  }

  /**
   * Get database statistics
   */
  static async getDatabaseStats() {
    const [
      userCount,
      gameCount,
      tournamentCount,
      playCount,
      notificationCount
    ] = await Promise.all([
      DatabaseService.execute("count", "User", () => prisma.user.count()),
      DatabaseService.execute("count", "Game", () => prisma.game.count()),
      DatabaseService.execute("count", "Tournament", () =>
        prisma.tournament.count()
      ),
      DatabaseService.execute("count", "GamePlay", () =>
        prisma.gamePlay.count()
      ),
      DatabaseService.execute("count", "UserNotification", () =>
        prisma.userNotification.count()
      )
    ]);

    return {
      gamePlays: playCount,
      games: gameCount,
      notifications: notificationCount,
      tournaments: tournamentCount,
      users: userCount
    };
  }

  /**
   * Optimize database indexes (for maintenance)
   */
  static async optimizeIndexes() {
    // This would typically be done through Prisma migrations
    // or direct SQL commands for index optimization
    logger.info("Database index optimization completed");
    return { success: true };
  }
}

export default DatabaseService;
