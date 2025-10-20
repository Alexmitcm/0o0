import logger from "@hey/helpers/logger";
import { Hono } from "hono";
import { z } from "zod";
import SimpleAuthService, {
  type SimpleLoginRequest
} from "../services/SimpleAuthService";

const simpleAuth = new Hono();

// Simple validation schema
const loginSchema = z.object({
  profileId: z.string().min(1, "Profile ID is required"),
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address")
});

/**
 * POST /api/simple-auth/login
 * Ultra-simple login endpoint
 */
simpleAuth.post("/login", async (c) => {
  try {
    const body = await c.req.json();
    const validationResult = loginSchema.safeParse(body);

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

    const result = await SimpleAuthService.login(
      validationResult.data as SimpleLoginRequest
    );
    return c.json(result);
  } catch (error) {
    logger.error("Simple auth login error:", error);
    return c.json(
      {
        error: error instanceof Error ? error.message : "Login failed",
        success: false
      },
      500
    );
  }
});

/**
 * GET /api/simple-auth/status
 * Get user premium status
 */
simpleAuth.get("/status", async (c) => {
  try {
    const walletAddress = c.req.query("walletAddress");

    if (!walletAddress) {
      return c.json(
        {
          error: "Wallet address is required",
          success: false
        },
        400
      );
    }

    const status = await SimpleAuthService.getUserStatus(walletAddress);
    return c.json({
      success: true,
      ...status
    });
  } catch (error) {
    logger.error("Simple auth status error:", error);
    return c.json(
      {
        error: "Failed to get status",
        success: false
      },
      500
    );
  }
});

/**
 * POST /api/simple-auth/validate
 * Validate JWT token
 */
simpleAuth.post("/validate", async (c) => {
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

    const payload = await SimpleAuthService.validateToken(token);

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
    logger.error("Simple auth validate error:", error);
    return c.json(
      {
        error: "Token validation failed",
        success: false
      },
      500
    );
  }
});

export default simpleAuth;
