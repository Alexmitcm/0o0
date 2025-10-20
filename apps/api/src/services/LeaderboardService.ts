import type { LeaderboardPeriod, LeaderboardType } from "@prisma/client";
import prisma from "../prisma/client";
import logger from "../utils/logger";

export interface LeaderboardEntry {
  id: string;
  rank: number;
  walletAddress: string;
  displayName?: string;
  username?: string;
  avatarUrl?: string;
  status: string;
  totalCoins: number;
  experienceCoins: number;
  achievementCoins: number;
  socialCoins: number;
  premiumCoins: number;
  lastUpdatedAt: Date;
}

export interface LeaderboardData {
  id: string;
  type: LeaderboardType;
  period: LeaderboardPeriod;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  entries: LeaderboardEntry[];
  totalEntries: number;
  userRank?: number;
  userEntry?: LeaderboardEntry;
}

export class LeaderboardService {
  /**
   * Get or create leaderboard for a specific type and period
   */
  static async getOrCreateLeaderboard(
    type: LeaderboardType,
    period: LeaderboardPeriod
  ): Promise<LeaderboardData> {
    try {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      // Calculate date range based on period
      switch (period) {
        case "Daily":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
          break;
        case "Weekly": {
          const dayOfWeek = now.getDay();
          const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          startDate = new Date(
            now.getTime() - daysToMonday * 24 * 60 * 60 * 1000
          );
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        }
        case "Monthly":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          break;
        case "AllTime":
          startDate = new Date(0);
          endDate = new Date("2099-12-31");
          break;
        default:
          throw new Error(`Invalid period: ${period}`);
      }

      // Find existing leaderboard
      let leaderboard = await prisma.leaderboard.findFirst({
        include: {
          entries: {
            include: {
              user: {
                select: {
                  avatarUrl: true,
                  displayName: true,
                  status: true,
                  username: true
                }
              }
            },
            orderBy: { rank: "asc" }
          }
        },
        where: {
          endDate: { gte: now },
          isActive: true,
          period,
          startDate: { lte: now },
          type
        }
      });

      // Create new leaderboard if none exists
      if (!leaderboard) {
        leaderboard = await LeaderboardService.createLeaderboard(
          type,
          period,
          startDate,
          endDate
        );
      }

      // Update leaderboard entries if needed
      if (LeaderboardService.shouldUpdateLeaderboard(leaderboard)) {
        await LeaderboardService.updateLeaderboardEntries(
          leaderboard.id,
          type,
          period,
          startDate,
          endDate
        );

        // Refetch updated leaderboard
        leaderboard = await prisma.leaderboard.findUniqueOrThrow({
          include: {
            entries: {
              include: {
                user: {
                  select: {
                    avatarUrl: true,
                    displayName: true,
                    status: true,
                    username: true
                  }
                }
              },
              orderBy: { rank: "asc" }
            }
          },
          where: { id: leaderboard.id }
        });
      }

      const entries: LeaderboardEntry[] = leaderboard.entries.map((entry) => ({
        achievementCoins: entry.achievementCoins,
        avatarUrl: entry.user.avatarUrl,
        displayName: entry.user.displayName,
        experienceCoins: entry.experienceCoins,
        id: entry.id,
        lastUpdatedAt: entry.lastUpdatedAt,
        premiumCoins: entry.premiumCoins,
        rank: entry.rank,
        socialCoins: entry.socialCoins,
        status: entry.user.status,
        totalCoins: entry.totalCoins,
        username: entry.user.username,
        walletAddress: entry.walletAddress
      }));

      return {
        endDate: leaderboard.endDate,
        entries,
        id: leaderboard.id,
        isActive: leaderboard.isActive,
        period: leaderboard.period,
        startDate: leaderboard.startDate,
        totalEntries: entries.length,
        type: leaderboard.type
      };
    } catch (error) {
      logger.error("Error getting or creating leaderboard:", error);
      throw error;
    }
  }

  /**
   * Get leaderboard with user's rank
   */
  static async getLeaderboardWithUserRank(
    type: LeaderboardType,
    period: LeaderboardPeriod,
    userWalletAddress: string
  ): Promise<LeaderboardData> {
    try {
      const leaderboard = await LeaderboardService.getOrCreateLeaderboard(
        type,
        period
      );

      // Find user's rank and entry
      const userEntry = leaderboard.entries.find(
        (entry) => entry.walletAddress === userWalletAddress
      );

      const userRank = userEntry ? userEntry.rank : undefined;

      return {
        ...leaderboard,
        userEntry,
        userRank
      };
    } catch (error) {
      logger.error("Error getting leaderboard with user rank:", error);
      throw error;
    }
  }

  /**
   * Get leaderboard entries for a specific user
   */
  static async getUserLeaderboardHistory(
    walletAddress: string,
    limit = 10
  ): Promise<LeaderboardEntry[]> {
    try {
      const entries = await prisma.leaderboardEntry.findMany({
        include: {
          leaderboard: true,
          user: {
            select: {
              avatarUrl: true,
              displayName: true,
              status: true,
              username: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        where: { walletAddress }
      });

      return entries.map((entry) => ({
        achievementCoins: entry.achievementCoins,
        avatarUrl: entry.user.avatarUrl,
        displayName: entry.user.displayName,
        experienceCoins: entry.experienceCoins,
        id: entry.id,
        lastUpdatedAt: entry.lastUpdatedAt,
        premiumCoins: entry.premiumCoins,
        rank: entry.rank,
        socialCoins: entry.socialCoins,
        status: entry.user.status,
        totalCoins: entry.totalCoins,
        username: entry.user.username,
        walletAddress: entry.walletAddress
      }));
    } catch (error) {
      logger.error("Error getting user leaderboard history:", error);
      throw error;
    }
  }

  /**
   * Create a new leaderboard
   */
  private static async createLeaderboard(
    type: LeaderboardType,
    period: LeaderboardPeriod,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    try {
      const leaderboard = await prisma.leaderboard.create({
        data: {
          endDate,
          isActive: true,
          period,
          startDate,
          type
        }
      });

      // Populate initial entries
      await LeaderboardService.updateLeaderboardEntries(
        leaderboard.id,
        type,
        period,
        startDate,
        endDate
      );

      return leaderboard;
    } catch (error) {
      logger.error("Error creating leaderboard:", error);
      throw error;
    }
  }

  /**
   * Update leaderboard entries based on current coin balances
   */
  private static async updateLeaderboardEntries(
    leaderboardId: string,
    _type: LeaderboardType,
    _period: LeaderboardPeriod,
    _startDate: Date,
    _endDate: Date
  ): Promise<void> {
    try {
      // Get top users based on type
      let topUsers: any;

      if (_type === "FreeToEarn") {
        // Only standard users
        topUsers = await prisma.userCoinBalance.findMany({
          include: {
            user: {
              select: {
                avatarUrl: true,
                displayName: true,
                status: true,
                username: true
              }
            }
          },
          orderBy: { totalCoins: "desc" },
          take: 1000, // Limit to top 1000
          where: {
            user: {
              status: "Standard"
            }
          }
        });
      } else if (type === "PlayToEarn") {
        // Only premium users
        topUsers = await prisma.userCoinBalance.findMany({
          include: {
            user: {
              select: {
                avatarUrl: true,
                displayName: true,
                status: true,
                username: true
              }
            }
          },
          orderBy: { totalCoins: "desc" },
          take: 1000,
          where: {
            user: {
              status: "Premium"
            }
          }
        });
      } else {
        // All users
        topUsers = await prisma.userCoinBalance.findMany({
          include: {
            user: {
              select: {
                avatarUrl: true,
                displayName: true,
                status: true,
                username: true
              }
            }
          },
          orderBy: { totalCoins: "desc" },
          take: 1000
        });
      }

      // Clear existing entries
      await prisma.leaderboardEntry.deleteMany({
        where: { leaderboardId }
      });

      // Create new entries
      const entries = topUsers.map((user, index) => ({
        achievementCoins: user.achievementCoins,
        experienceCoins: user.experienceCoins,
        leaderboardId,
        premiumCoins: user.premiumCoins,
        rank: index + 1,
        socialCoins: user.socialCoins,
        totalCoins: user.totalCoins,
        walletAddress: user.walletAddress
      }));

      if (entries.length > 0) {
        await prisma.leaderboardEntry.createMany({
          data: entries
        });
      }

      logger.info(
        `Updated leaderboard ${leaderboardId} with ${entries.length} entries`
      );
    } catch (error) {
      logger.error("Error updating leaderboard entries:", error);
      throw error;
    }
  }

  /**
   * Check if leaderboard needs updating
   */
  private static shouldUpdateLeaderboard(leaderboard: any): boolean {
    const now = new Date();
    const lastUpdate = leaderboard.entries[0]?.lastUpdatedAt;

    if (!lastUpdate) return true;

    const timeSinceUpdate = now.getTime() - lastUpdate.getTime();
    const updateInterval = 5 * 60 * 1000; // 5 minutes

    return timeSinceUpdate > updateInterval;
  }

  /**
   * Get leaderboard statistics
   */
  static async getLeaderboardStats(): Promise<{
    totalUsers: number;
    totalCoins: number;
    averageCoins: number;
    topUser: any;
  }> {
    try {
      const stats = await prisma.userCoinBalance.aggregate({
        _avg: { totalCoins: true },
        _count: { walletAddress: true },
        _sum: { totalCoins: true }
      });

      const topUser = await prisma.userCoinBalance.findFirst({
        include: {
          user: {
            select: {
              avatarUrl: true,
              displayName: true,
              status: true,
              username: true
            }
          }
        },
        orderBy: { totalCoins: "desc" }
      });

      return {
        averageCoins: Math.round(stats._avg.totalCoins || 0),
        topUser: topUser
          ? {
              avatarUrl: topUser.user.avatarUrl,
              displayName: topUser.user.displayName,
              status: topUser.user.status,
              totalCoins: topUser.totalCoins,
              username: topUser.user.username,
              walletAddress: topUser.walletAddress
            }
          : null,
        totalCoins: stats._sum.totalCoins || 0,
        totalUsers: stats._count.walletAddress
      };
    } catch (error) {
      logger.error("Error getting leaderboard stats:", error);
      throw error;
    }
  }

  /**
   * Deactivate old leaderboards
   */
  static async deactivateOldLeaderboards(): Promise<void> {
    try {
      const now = new Date();

      await prisma.leaderboard.updateMany({
        data: {
          isActive: false
        },
        where: {
          endDate: { lt: now },
          isActive: true
        }
      });

      logger.info("Deactivated old leaderboards");
    } catch (error) {
      logger.error("Error deactivating old leaderboards:", error);
      throw error;
    }
  }
}
