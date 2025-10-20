import type { Context } from "hono";
import * as LootBoxService from "../services/LootBoxService";
import logger from "../utils/logger";

export const getLootBoxes = async (c: Context) => {
  try {
    const lootBoxes = await LootBoxService.getActiveLootBoxes();

    return c.json({
      data: lootBoxes,
      success: true
    });
  } catch (error) {
    logger.error("Error getting loot boxes:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get loot boxes",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      500
    );
  }
};

export const getLootBoxById = async (c: Context) => {
  try {
    const id = c.req.param("id");

    if (!id) {
      return c.json(
        {
          error: {
            code: "INVALID_PARAMETERS",
            message: "Loot box ID is required",
            timestamp: new Date().toISOString()
          },
          success: false
        },
        400
      );
    }

    const lootBox = await LootBoxService.getLootBoxById(id);

    if (!lootBox) {
      return c.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Loot box not found",
            timestamp: new Date().toISOString()
          },
          success: false
        },
        404
      );
    }

    return c.json({
      data: lootBox,
      success: true
    });
  } catch (error) {
    logger.error("Error getting loot box by ID:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get loot box",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      500
    );
  }
};

export const checkLootBoxAvailability = async (c: Context) => {
  try {
    const walletAddress = c.get("walletAddress");
    const lootBoxId = c.req.param("id");

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

    if (!lootBoxId) {
      return c.json(
        {
          error: {
            code: "INVALID_PARAMETERS",
            message: "Loot box ID is required",
            timestamp: new Date().toISOString()
          },
          success: false
        },
        400
      );
    }

    const availability = await LootBoxService.canUserOpenLootBox(
      walletAddress,
      lootBoxId
    );

    return c.json({
      data: availability,
      success: true
    });
  } catch (error) {
    logger.error("Error checking loot box availability:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to check loot box availability",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      500
    );
  }
};

export const openLootBox = async (c: Context) => {
  try {
    const walletAddress = c.get("walletAddress");
    const lootBoxId = c.req.param("id");

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

    if (!lootBoxId) {
      return c.json(
        {
          error: {
            code: "INVALID_PARAMETERS",
            message: "Loot box ID is required",
            timestamp: new Date().toISOString()
          },
          success: false
        },
        400
      );
    }

    const body = await c.req.json();
    const { adData, requestInfo } = body;

    // Get request information for security
    const requestInfoData = {
      ipAddress:
        c.req.header("x-forwarded-for") ||
        c.req.header("x-real-ip") ||
        "unknown",
      sessionId: requestInfo?.sessionId || "unknown",
      userAgent: c.req.header("user-agent") || "unknown"
    };

    const result = await LootBoxService.openLootBox(
      walletAddress,
      lootBoxId,
      adData,
      requestInfoData
    );

    if (!result.success) {
      return c.json(
        {
          data: {
            nextAvailableAt: result.nextAvailableAt
          },
          error: {
            code: "LOOT_BOX_UNAVAILABLE",
            message: result.error || "Cannot open loot box",
            timestamp: new Date().toISOString()
          },
          success: false
        },
        400
      );
    }

    return c.json({
      data: result,
      success: true
    });
  } catch (error) {
    logger.error("Error opening loot box:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to open loot box",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      500
    );
  }
};

export const getUserLootBoxHistory = async (c: Context) => {
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

    const history = await LootBoxService.getUserLootBoxHistory(
      walletAddress,
      limit,
      offset
    );

    return c.json({
      data: history,
      success: true
    });
  } catch (error) {
    logger.error("Error getting user loot box history:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get loot box history",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      500
    );
  }
};

export const getUserCooldownStatus = async (c: Context) => {
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

    const cooldowns = await LootBoxService.getUserCooldownStatus(walletAddress);

    return c.json({
      data: cooldowns,
      success: true
    });
  } catch (error) {
    logger.error("Error getting user cooldown status:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get cooldown status",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      500
    );
  }
};

export const getUserDailyLimitStatus = async (c: Context) => {
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

    const dailyLimits =
      await LootBoxService.getUserDailyLimitStatus(walletAddress);

    return c.json({
      data: dailyLimits,
      success: true
    });
  } catch (error) {
    logger.error("Error getting user daily limit status:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get daily limit status",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      500
    );
  }
};

// Admin endpoints
export const createLootBox = async (c: Context) => {
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

    // Admin role check is handled by middleware
    // const isAdmin = await checkAdminRole(adminWalletAddress);
    // if (!isAdmin) {
    //   return c.json({ error: "Unauthorized" }, 403);
    // }

    const body = await c.req.json();
    const lootBox = await LootBoxService.createLootBox(body);

    return c.json({
      data: lootBox,
      success: true
    });
  } catch (error) {
    logger.error("Error creating loot box:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create loot box",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      500
    );
  }
};

export const addRewardToLootBox = async (c: Context) => {
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

    // Admin role check is handled by middleware

    const lootBoxId = c.req.param("id");
    const body = await c.req.json();
    const { rewardType, rewardValue, probability } = body;

    if (!rewardType || !rewardValue || probability === undefined) {
      return c.json(
        {
          error: {
            code: "INVALID_PARAMETERS",
            message: "rewardType, rewardValue, and probability are required",
            timestamp: new Date().toISOString()
          },
          success: false
        },
        400
      );
    }

    const reward = await LootBoxService.addRewardToLootBox(
      lootBoxId,
      rewardType,
      rewardValue,
      probability
    );

    return c.json({
      data: reward,
      success: true
    });
  } catch (error) {
    logger.error("Error adding reward to loot box:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to add reward to loot box",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      500
    );
  }
};

export const updateLootBox = async (c: Context) => {
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

    // Admin role check is handled by middleware

    const id = c.req.param("id");
    const body = await c.req.json();

    const lootBox = await LootBoxService.updateLootBox(id, body);

    return c.json({
      data: lootBox,
      success: true
    });
  } catch (error) {
    logger.error("Error updating loot box:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update loot box",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      500
    );
  }
};

export const deleteLootBox = async (c: Context) => {
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

    // Admin role check is handled by middleware

    const id = c.req.param("id");
    const result = await LootBoxService.deleteLootBox(id);

    return c.json({
      data: result,
      success: true
    });
  } catch (error) {
    logger.error("Error deleting loot box:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to delete loot box",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      500
    );
  }
};

export const getLootBoxStats = async (c: Context) => {
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

    // Admin role check is handled by middleware

    const id = c.req.param("id");
    const stats = await LootBoxService.getLootBoxStats(id);

    return c.json({
      data: stats,
      success: true
    });
  } catch (error) {
    logger.error("Error getting loot box stats:", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get loot box stats",
          timestamp: new Date().toISOString()
        },
        success: false
      },
      500
    );
  }
};
