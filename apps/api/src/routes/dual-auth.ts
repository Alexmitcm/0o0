import logger from "@hey/helpers/logger";
import { Hono } from "hono";
import { z } from "zod";
import DualWalletService, {
  type DualWalletLinkRequest
} from "../services/DualWalletService";

const dualAuth = new Hono();

// Validation schemas
const linkWalletsSchema = z.object({
  familyWalletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Family Wallet address"),
  lensProfileId: z.string().min(1, "Lens Profile ID is required"),
  metaMaskAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid MetaMask address")
});

/**
 * GET /api/dual-auth/premium-status
 * بررسی وضعیت پرمیوم MetaMask
 */
dualAuth.get("/premium-status", async (c) => {
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

    const status = await DualWalletService.checkPremiumStatus(metaMaskAddress);

    return c.json({
      success: true,
      ...status
    });
  } catch (error) {
    logger.error("Error checking premium status:", error);
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
 * GET /api/dual-auth/lens-profiles
 * دریافت پروفایل‌های Lens از Family Wallet
 */
dualAuth.get("/lens-profiles", async (c) => {
  try {
    const familyWalletAddress = c.req.query("familyWalletAddress");

    if (!familyWalletAddress) {
      return c.json(
        {
          error: "Family Wallet address is required",
          success: false
        },
        400
      );
    }

    const profiles =
      await DualWalletService.getLensProfiles(familyWalletAddress);

    return c.json({
      profiles,
      success: true
    });
  } catch (error) {
    logger.error("Error getting Lens profiles:", error);
    return c.json(
      {
        error: "Failed to get Lens profiles",
        success: false
      },
      500
    );
  }
});

/**
 * POST /api/dual-auth/link-wallets
 * اتصال MetaMask به پروفایل Lens
 */
dualAuth.post("/link-wallets", async (c) => {
  try {
    const body = await c.req.json();
    const validationResult = linkWalletsSchema.safeParse(body);

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

    const result = await DualWalletService.linkWallets(
      validationResult.data as DualWalletLinkRequest
    );
    return c.json(result);
  } catch (error) {
    logger.error("Error linking wallets:", error);
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
 * GET /api/dual-auth/user-status
 * دریافت وضعیت کاربر
 */
dualAuth.get("/user-status", async (c) => {
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

    const status = await DualWalletService.getUserStatus(metaMaskAddress);

    return c.json({
      success: true,
      ...status
    });
  } catch (error) {
    logger.error("Error getting user status:", error);
    return c.json(
      {
        error: "Failed to get user status",
        success: false
      },
      500
    );
  }
});

/**
 * POST /api/dual-auth/validate
 * اعتبارسنجی توکن
 */
dualAuth.post("/validate", async (c) => {
  try {
    const body = await c.req.json();
    const { token } = body;

    if (!token) {
      return c.json(
        {
          error: "Token is required",
          success: false
        },
        400
      );
    }

    const payload = await DualWalletService.validateToken(token);

    if (!payload) {
      return c.json(
        {
          error: "Invalid token",
          success: false
        },
        401
      );
    }

    return c.json({
      success: true,
      user: payload
    });
  } catch (error) {
    logger.error("Error validating token:", error);
    return c.json(
      {
        error: "Token validation failed",
        success: false
      },
      500
    );
  }
});

export default dualAuth;
