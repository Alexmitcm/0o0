import type { Context } from "hono";
import { CoinService } from "../services/CoinService";
import { LeaderboardService } from "../services/LeaderboardService";
import logger from "../utils/logger";

export const getCoinSystemStats = async (c: Context) => {
  try {
    const stats = await LeaderboardService.getLeaderboardStats();

    // Get additional coin system stats
    const prisma = (await import("../prisma/client")).default;

    const coinTypeStats = await prisma.userCoin.groupBy({
      _count: { id: true },
      _sum: { amount: true },
      by: ["coinType"]
    });

    const sourceTypeStats = await prisma.userCoin.groupBy({
      _count: { id: true },
      _sum: { amount: true },
      by: ["sourceType"]
    });

    const recentTransactions = await prisma.coinTransaction.findMany({
      include: {
        user: {
          select: {
            displayName: true,
            username: true,
            walletAddress: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    });

    return c.json({
      data: {
        ...stats,
        coinTypeStats,
        recentTransactions,
        sourceTypeStats
      },
      success: true
    });
  } catch (error) {
    logger.error("Error getting coin system stats:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get coin system stats",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      500
    );
  }
};

export const getUserCoinDetails = async (c: Context) => {
  try {
    const walletAddress = c.req.param("walletAddress");

    if (!walletAddress) {
      return c.json(
        {
          error: {
            code: "INVALID_PARAMETERS",
            message: "Wallet address is required",
            timestamp: new Date().toISOString()
          },
          success: false
        },
        400
      );
    }

    const prisma = (await import("../prisma/client")).default;

    // Get user details
    const user = await prisma.user.findUnique({
      select: {
        avatarUrl: true,
        displayName: true,
        lastActiveAt: true,
        registrationDate: true,
        status: true,
        username: true,
        walletAddress: true
      },
      where: { walletAddress }
    });

    if (!user) {
      return c.json(
        {
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
            timestamp: new Date().toISOString()
          },
          success: false
        },
        404
      );
    }

    // Get coin balance
    const balance = await CoinService.getUserBalance(walletAddress);

    // Get coin history
    const history = await CoinService.getUserCoinHistory(walletAddress, 100, 0);

    // Get transactions
    const transactions = await CoinService.getUserTransactions(
      walletAddress,
      100,
      0
    );

    // Get leaderboard history
    const leaderboardHistory =
      await LeaderboardService.getUserLeaderboardHistory(walletAddress, 10);

    return c.json({
      data: {
        balance,
        history,
        leaderboardHistory,
        transactions,
        user
      },
      success: true
    });
  } catch (error) {
    logger.error("Error getting user coin details:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get user coin details",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      500
    );
  }
};

export const adjustUserCoins = async (c: Context) => {
  try {
    const adminWalletAddress = c.get("walletAddress");

    if (!adminWalletAddress) {
      return c.json(
        {
          error: {
            code: "AUTHENTICATION_REQUIRED",
            message: "Authentication required",
            timestamp: new Date().toISOString()
          },
          success: false
        },
        401
      );
    }

    const body = await c.req.json();
    const { walletAddress, coinType, amount, reason } = body;

    if (!walletAddress || !coinType || !amount || !reason) {
      return c.json(
        {
          error: {
            code: "INVALID_PARAMETERS",
            message: "walletAddress, coinType, amount, and reason are required",
            timestamp: new Date().toISOString()
          },
          success: false
        },
        400
      );
    }

    const success = await CoinService.adjustCoins(
      walletAddress,
      coinType,
      amount,
      reason,
      adminWalletAddress
    );

    if (success) {
      return c.json({
        data: { success: true },
        success: true
      });
    }
    return c.json(
      {
        error: {
          code: "OPERATION_FAILED",
          message: "Failed to adjust coins",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      500
    );
  } catch (error) {
    logger.error("Error adjusting user coins:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to adjust coins",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      500
    );
  }
};

export const getCoinTransactions = async (c: Context) => {
  try {
    const limit = Number.parseInt(c.req.query("limit") || "50");
    const offset = Number.parseInt(c.req.query("offset") || "0");
    const coinType = c.req.query("coinType");
    const transactionType = c.req.query("transactionType");
    const walletAddress = c.req.query("walletAddress");

    const prisma = (await import("../prisma/client")).default;

    const where: any = {};
    if (coinType) where.coinType = coinType;
    if (transactionType) where.transactionType = transactionType;
    if (walletAddress) where.walletAddress = walletAddress;

    const transactions = await prisma.coinTransaction.findMany({
      include: {
        user: {
          select: {
            displayName: true,
            status: true,
            username: true,
            walletAddress: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      where
    });

    const total = await prisma.coinTransaction.count({ where });

    return c.json({
      data: {
        pagination: {
          limit,
          page: Math.floor(offset / limit) + 1,
          total,
          totalPages: Math.ceil(total / limit)
        },
        transactions
      },
      success: true
    });
  } catch (error) {
    logger.error("Error getting coin transactions:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get coin transactions",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      500
    );
  }
};

export const refreshLeaderboard = async (c: Context) => {
  try {
    const { type, period } = await c.req.json();

    if (!type || !period) {
      return c.json(
        {
          error: {
            code: "INVALID_PARAMETERS",
            message: "type and period are required",
            timestamp: new Date().toISOString()
          },
          success: false
        },
        400
      );
    }

    // Force refresh leaderboard
    const leaderboard = await LeaderboardService.getOrCreateLeaderboard(
      type,
      period
    );

    return c.json({
      data: leaderboard,
      success: true
    });
  } catch (error) {
    logger.error("Error refreshing leaderboard:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to refresh leaderboard",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      500
    );
  }
};

export const deactivateOldLeaderboards = async (c: Context) => {
  try {
    await LeaderboardService.deactivateOldLeaderboards();

    return c.json({
      data: { success: true },
      success: true
    });
  } catch (error) {
    logger.error("Error deactivating old leaderboards:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to deactivate old leaderboards",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      500
    );
  }
};
