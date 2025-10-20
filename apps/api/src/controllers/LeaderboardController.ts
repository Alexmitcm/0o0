import type { Context } from "hono";
import { LeaderboardService } from "../services/LeaderboardService";
import logger from "../utils/logger";

export const getLeaderboard = async (c: Context) => {
  try {
    const type = (c.req.query("type") as any) || "AllTime";
    const period = (c.req.query("period") as any) || "AllTime";
    const userWalletAddress = c.get("walletAddress");

    const leaderboard = userWalletAddress
      ? await LeaderboardService.getLeaderboardWithUserRank(
          type,
          period,
          userWalletAddress
        )
      : await LeaderboardService.getOrCreateLeaderboard(type, period);

    return c.json({
      data: leaderboard,
      success: true
    });
  } catch (error) {
    logger.error("Error getting leaderboard:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get leaderboard",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      500
    );
  }
};

export const getUserLeaderboardHistory = async (c: Context) => {
  try {
    const walletAddress = c.get("walletAddress");

    if (!walletAddress) {
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

    const limit = Number.parseInt(c.req.query("limit") || "10");

    const history = await LeaderboardService.getUserLeaderboardHistory(
      walletAddress,
      limit
    );

    return c.json({
      data: history,
      success: true
    });
  } catch (error) {
    logger.error("Error getting user leaderboard history:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get user leaderboard history",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      500
    );
  }
};

export const getLeaderboardStats = async (c: Context) => {
  try {
    const stats = await LeaderboardService.getLeaderboardStats();

    return c.json({
      data: stats,
      success: true
    });
  } catch (error) {
    logger.error("Error getting leaderboard stats:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get leaderboard stats",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      500
    );
  }
};

export const getPublicLeaderboard = async (c: Context) => {
  try {
    const type = (c.req.query("type") as any) || "AllTime";
    const period = (c.req.query("period") as any) || "AllTime";

    const leaderboard = await LeaderboardService.getOrCreateLeaderboard(
      type,
      period
    );

    return c.json({
      data: leaderboard,
      success: true
    });
  } catch (error) {
    logger.error("Error getting public leaderboard:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get leaderboard",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      500
    );
  }
};
