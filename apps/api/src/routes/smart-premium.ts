import logger from "@hey/helpers/logger";
import { Hono } from "hono";
import { z } from "zod";
import SmartPremiumService from "../services/SmartPremiumService";

const smartPremium = new Hono();

// Validation schemas
const smartLinkSchema = z.object({
  familyWalletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Family Wallet address"),
  lensProfileId: z.string().min(1, "Lens Profile ID is required"),
  metaMaskAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid MetaMask address")
});

/**
 * GET /api/smart-premium/status
 * بررسی هوشمند وضعیت پرمیوم
 */
smartPremium.get("/status", async (c) => {
  try {
    const metaMaskAddress = c.req.query("metaMaskAddress");

    if (!metaMaskAddress) {
      return c.json(
        {
          error: "MetaMask address is required",
          success: false
        },
        400
      );
    }

    const status =
      await SmartPremiumService.checkSmartPremiumStatus(metaMaskAddress);

    return c.json({
      success: true,
      ...status
    });
  } catch (error) {
    logger.error("Error checking smart premium status:", error);
    return c.json(
      {
        error: "Failed to check premium status",
        success: false
      },
      500
    );
  }
});

/**
 * POST /api/smart-premium/link
 * اتصال هوشمند کیف پول‌ها
 */
smartPremium.post("/link", async (c) => {
  try {
    const body = await c.req.json();
    const validationResult = smartLinkSchema.safeParse(body);

    if (!validationResult.success) {
      return c.json(
        {
          details: validationResult.error.errors,
          error: "Invalid request data",
          success: false
        },
        400
      );
    }

    const { metaMaskAddress, familyWalletAddress, lensProfileId } =
      validationResult.data;

    const result = await SmartPremiumService.smartLinkWallets(
      metaMaskAddress,
      familyWalletAddress,
      lensProfileId
    );

    return c.json(result);
  } catch (error) {
    logger.error("Error in smart wallet linking:", error);
    return c.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to link wallets",
        success: false
      },
      500
    );
  }
});

/**
 * GET /api/smart-premium/user-status
 * دریافت وضعیت کامل کاربر
 */
smartPremium.get("/user-status", async (c) => {
  try {
    const metaMaskAddress = c.req.query("metaMaskAddress");

    if (!metaMaskAddress) {
      return c.json(
        {
          error: "MetaMask address is required",
          success: false
        },
        400
      );
    }

    const status =
      await SmartPremiumService.getUserSmartStatus(metaMaskAddress);

    return c.json({
      success: true,
      ...status
    });
  } catch (error) {
    logger.error("Error getting user smart status:", error);
    return c.json(
      {
        error: "Failed to get user status",
        success: false
      },
      500
    );
  }
});

export default smartPremium;
