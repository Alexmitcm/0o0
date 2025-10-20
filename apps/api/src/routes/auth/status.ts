import logger from "@hey/helpers/logger";
import { Hono } from "hono";
import prisma from "../../prisma/client";
import { normalizeAddress } from "../../utils/address";

const status = new Hono();

/**
 * POST /api/auth/status
 * Get user status (Standard or Premium)
 */
status.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return c.json(
        {
          error: "Wallet address is required",
          success: false
        },
        400
      );
    }

    const normalizedAddress = normalizeAddress(walletAddress);

    logger.info(`Status check for wallet: ${normalizedAddress}`);

    // Check if user exists in database
    const user = await prisma.user.findUnique({
      select: {
        linkedProfileId: true,
        status: true
      },
      where: { walletAddress: normalizedAddress }
    });

    if (!user) {
      // User doesn't exist, return Standard status
      return c.json({
        isPremium: false,
        linkedProfileId: null,
        status: "Standard",
        success: true
      });
    }

    return c.json({
      isPremium: user.status === "Premium",
      linkedProfileId: user.linkedProfileId,
      status: user.status,
      success: true
    });
  } catch (error) {
    logger.error("Error in status endpoint:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Status check failed";

    return c.json(
      {
        error: errorMessage,
        success: false
      },
      500
    );
  }
});

export default status;
