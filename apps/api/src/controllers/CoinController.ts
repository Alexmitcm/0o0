import type { Context } from "hono";
import { CoinService } from "../services/CoinService";
import logger from "../utils/logger";

export const getUserBalance = async (c: Context) => {
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

    const balance = await CoinService.getUserBalance(walletAddress);

    if (!balance) {
      // Initialize balance if not exists
      await CoinService.initializeUserBalance(walletAddress);
      const newBalance = await CoinService.getUserBalance(walletAddress);

      return c.json({
        data: newBalance,
        success: true
      });
    }

    return c.json({
      data: balance,
      success: true
    });
  } catch (error) {
    logger.error("Error getting user balance:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get user balance",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      500
    );
  }
};

export const getUserTransactions = async (c: Context) => {
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

    const limit = Number.parseInt(c.req.query("limit") || "50");
    const offset = Number.parseInt(c.req.query("offset") || "0");
    const coinType = c.req.query("coinType") as any;

    const transactions = await CoinService.getUserTransactions(
      walletAddress,
      limit,
      offset,
      coinType
    );

    return c.json({
      data: transactions,
      success: true
    });
  } catch (error) {
    logger.error("Error getting user transactions:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get user transactions",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      500
    );
  }
};

export const getUserCoinHistory = async (c: Context) => {
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

    const limit = Number.parseInt(c.req.query("limit") || "50");
    const offset = Number.parseInt(c.req.query("offset") || "0");

    const history = await CoinService.getUserCoinHistory(
      walletAddress,
      limit,
      offset
    );

    return c.json({
      data: history,
      success: true
    });
  } catch (error) {
    logger.error("Error getting user coin history:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get user coin history",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      500
    );
  }
};

export const getPublicUserCoinHistory = async (c: Context) => {
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

    const limit = Number.parseInt(c.req.query("limit") || "50");
    const offset = Number.parseInt(c.req.query("offset") || "0");

    const history = await CoinService.getUserCoinHistory(
      walletAddress,
      limit,
      offset
    );

    return c.json({
      data: history,
      success: true
    });
  } catch (error) {
    logger.error("Error getting public user coin history:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get user coin history",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      500
    );
  }
};

export const getTopUsers = async (c: Context) => {
  try {
    const limit = Number.parseInt(c.req.query("limit") || "100");
    const coinType = c.req.query("coinType") as any;

    const topUsers = await CoinService.getTopUsersByCoins(limit, coinType);

    return c.json({
      data: topUsers,
      success: true
    });
  } catch (error) {
    logger.error("Error getting top users:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get top users",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      500
    );
  }
};

export const awardCoins = async (c: Context) => {
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

    const body = await c.req.json();
    const {
      coinType,
      amount,
      sourceType,
      sourceId,
      sourceMetadata,
      description
    } = body;

    if (!coinType || !amount || !sourceType) {
      return c.json(
        {
          error: {
            code: "INVALID_PARAMETERS",
            message: "coinType, amount, and sourceType are required",
            timestamp: new Date().toISOString()
          },
          success: false
        },
        400
      );
    }

    const success = await CoinService.awardCoins({
      amount,
      coinType,
      description,
      sourceId,
      sourceMetadata,
      sourceType,
      walletAddress
    });

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
          message: "Failed to award coins",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      500
    );
  } catch (error) {
    logger.error("Error awarding coins:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to award coins",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      500
    );
  }
};

export const spendCoins = async (c: Context) => {
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

    const body = await c.req.json();
    const {
      coinType,
      amount,
      sourceType,
      sourceId,
      sourceMetadata,
      description
    } = body;

    if (!coinType || !amount || !sourceType) {
      return c.json(
        {
          error: {
            code: "INVALID_PARAMETERS",
            message: "coinType, amount, and sourceType are required",
            timestamp: new Date().toISOString()
          },
          success: false
        },
        400
      );
    }

    const success = await CoinService.spendCoins(
      walletAddress,
      coinType,
      amount,
      sourceType,
      sourceId,
      sourceMetadata,
      description
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
          message: "Failed to spend coins",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      500
    );
  } catch (error) {
    logger.error("Error spending coins:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to spend coins",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      500
    );
  }
};
