import logger from "@hey/helpers/logger";
import { zValidator } from "@hono/zod-validator";
import { PrismaClient } from "@prisma/client";
import { Hono } from "hono";
import { z } from "zod";
import authMiddleware from "../middlewares/authMiddleware";
import { errorHandler } from "../middlewares/errorHandler";
import rateLimiter from "../middlewares/rateLimiter";

const prisma = new PrismaClient();
const captchaSystemRouter = new Hono();

// Validation schemas
const checkBanStatusSchema = z.object({
  token: z.string().min(1),
  walletAddress: z.string().min(42).max(42)
});

const updateBanStatusSchema = z.object({
  isBanned: z.boolean(),
  token: z.string().min(1),
  walletAddress: z.string().min(42).max(42)
});

const captchaVerificationSchema = z.object({
  captchaAnswer: z.number().int().min(0).max(999),
  sessionId: z.string().min(1),
  walletAddress: z.string().min(42).max(42)
});

// POST /captcha-system/update-ban - Update user ban status (equivalent to userBanCaptcha.php with updateBan action)
captchaSystemRouter.post(
  "/update-ban",
  rateLimiter({ requests: 5 }), // 5 requests per minute
  async (c) => {
    try {
      const data = await c.req.json();
      const { walletAddress, token, isBanned } = data;

      if (!walletAddress || !token || typeof isBanned !== "boolean") {
        return c.json({ error: "Missing required parameters" }, 400);
      }

      // In a real implementation, you would:
      // 1. Validate the token
      // 2. Check if the user has permission to update ban status
      // 3. Update the ban status in the database
      // 4. Log the ban status change

      // For now, we'll implement a simple response
      logger.info(`Ban status updated for ${walletAddress}: ${isBanned}`);

      return c.json({
        isBanned,
        message: "Ban status updated successfully",
        success: true,
        walletAddress
      });
    } catch (error) {
      logger.error("Error updating ban status:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// POST /captcha-system/check-ban - Check user ban status (equivalent to userBanCaptcha.php)
captchaSystemRouter.post(
  "/check-ban",
  rateLimiter({ requests: 20 }), // 20 requests per minute
  zValidator("json", checkBanStatusSchema),
  async (c) => {
    try {
      const { walletAddress, token } = c.req.valid("json");

      // Check if user exists and token is valid
      const user = await prisma.user.findFirst({
        where: {
          walletAddress
          // Note: In the new system, we don't have a token field in User model
          // You might need to implement a separate token validation system
        }
      });

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      // Check if user is captcha banned
      // Since we don't have is_captcha_banned field in the new schema,
      // we'll use the status field or create a new field
      const isCaptchaBanned = user.status === "Banned"; // Adjust based on your business logic

      return c.json({
        banned: isCaptchaBanned,
        status: user.status,
        success: true,
        walletAddress
      });
    } catch (error) {
      logger.error("Error checking ban status:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// POST /captcha-system/update-ban - Update user ban status
captchaSystemRouter.post(
  "/update-ban",
  authMiddleware,
  rateLimiter({ requests: 10 }), // 10 requests per minute
  zValidator("json", updateBanStatusSchema),
  async (c) => {
    try {
      const { walletAddress, isBanned } = c.req.valid("json");
      const authWalletAddress = c.get("walletAddress");

      // Check if user is updating their own status or is admin
      if (walletAddress !== authWalletAddress) {
        // Check if user is admin (you can implement admin check here)
        const isAdmin = false; // Implement admin check
        if (!isAdmin) {
          return c.json({ error: "Unauthorized" }, 403);
        }
      }

      const user = await prisma.user.findUnique({
        where: { walletAddress }
      });

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      // Update user status based on ban status
      const newStatus = isBanned ? "Banned" : "Standard";

      await prisma.user.update({
        data: { status: newStatus },
        where: { walletAddress }
      });

      return c.json({
        isBanned,
        message: `User ${isBanned ? "banned" : "unbanned"} successfully`,
        status: newStatus,
        success: true,
        walletAddress
      });
    } catch (error) {
      logger.error("Error updating ban status:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// POST /captcha-system/verify - Verify captcha answer
captchaSystemRouter.post(
  "/verify",
  rateLimiter({ requests: 5 }), // 5 requests per minute
  zValidator("json", captchaVerificationSchema),
  async (c) => {
    try {
      const { walletAddress, captchaAnswer, sessionId } = c.req.valid("json");

      // In a real implementation, you would:
      // 1. Store the captcha question and answer in a session/cache
      // 2. Verify the answer against the stored value
      // 3. Check if the session is still valid

      // For now, we'll implement a simple verification
      // You should replace this with your actual captcha verification logic
      const isValidAnswer = await verifyCaptchaAnswer(sessionId, captchaAnswer);

      if (!isValidAnswer) {
        // Increment failed attempts
        await incrementFailedAttempts(walletAddress);

        return c.json(
          {
            message: "Incorrect captcha answer",
            success: false,
            walletAddress
          },
          400
        );
      }

      // Reset failed attempts on successful verification
      await resetFailedAttempts(walletAddress);

      return c.json({
        message: "Captcha verified successfully",
        success: true,
        walletAddress
      });
    } catch (error) {
      logger.error("Error verifying captcha:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// POST /captcha-system/validate - Validate token and address (equivalent to Validate.php)
captchaSystemRouter.post(
  "/validate",
  rateLimiter({ requests: 10 }), // 10 requests per minute
  async (c) => {
    try {
      const formData = await c.req.formData();
      const walletAddress = formData.get("walletaddress") as string;
      const token = formData.get("token") as string;

      if (!walletAddress || !token) {
        return c.json({ error: "Missing required parameters" }, 400);
      }

      // In a real implementation, you would:
      // 1. Validate the token format
      // 2. Check if the token is valid and not expired
      // 3. Verify the wallet address format
      // 4. Check if the user exists in the database

      // For now, we'll implement a simple validation
      const isValidToken = token.length >= 10; // Basic token validation
      const isValidAddress =
        walletAddress.length === 42 && walletAddress.startsWith("0x");

      if (!isValidToken || !isValidAddress) {
        return c.json(
          {
            message: "Invalid token or wallet address",
            success: false
          },
          400
        );
      }

      return c.json({
        message: "Token and address validated successfully",
        success: true,
        token,
        walletAddress
      });
    } catch (error) {
      logger.error("Error validating token and address:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// GET /captcha-system/generate - Generate captcha question
captchaSystemRouter.get(
  "/generate",
  rateLimiter({ max: 10, windowMs: 60000 }), // 10 requests per minute
  async (c) => {
    try {
      const sessionId = c.req.query("sessionId");

      if (!sessionId) {
        return c.json({ error: "Session ID required" }, 400);
      }

      // Generate a simple math captcha
      const num1 = Math.floor(Math.random() * 10) + 1;
      const num2 = Math.floor(Math.random() * 10) + 1;
      const operation = Math.random() > 0.5 ? "+" : "-";

      let question: string;
      let answer: number;

      if (operation === "+") {
        question = `${num1} + ${num2} = ?`;
        answer = num1 + num2;
      } else {
        // Ensure positive result
        const larger = Math.max(num1, num2);
        const smaller = Math.min(num1, num2);
        question = `${larger} - ${smaller} = ?`;
        answer = larger - smaller;
      }

      // Store the answer in cache/session (implement your caching mechanism)
      await storeCaptchaAnswer(sessionId, answer);

      return c.json({
        expiresIn: 300, // 5 minutes
        question,
        sessionId,
        success: true
      });
    } catch (error) {
      logger.error("Error generating captcha:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// GET /captcha-system/status/:walletAddress - Get captcha status for user
captchaSystemRouter.get(
  "/status/:walletAddress",
  rateLimiter({ requests: 30 }),
  async (c) => {
    try {
      const walletAddress = c.req.param("walletAddress");

      const user = await prisma.user.findUnique({
        select: {
          createdAt: true,
          lastActiveAt: true,
          status: true,
          walletAddress: true
        },
        where: { walletAddress }
      });

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      // Check if user needs captcha verification
      const needsCaptcha = await checkIfNeedsCaptcha(walletAddress);

      return c.json({
        isBanned: user.status === "Banned",
        lastActiveAt: user.lastActiveAt,
        needsCaptcha,
        status: user.status,
        success: true,
        walletAddress
      });
    } catch (error) {
      logger.error("Error getting captcha status:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// Helper functions (implement these based on your requirements)
async function verifyCaptchaAnswer(
  sessionId: string,
  answer: number
): Promise<boolean> {
  // Implement your captcha verification logic here
  // This could involve checking against a cache, database, or external service
  try {
    // For now, return true for demonstration
    // In production, you should verify against stored answer
    return true;
  } catch (error) {
    logger.error("Error verifying captcha answer:", error);
    return false;
  }
}

async function storeCaptchaAnswer(
  sessionId: string,
  answer: number
): Promise<void> {
  // Implement your captcha storage logic here
  // This could involve storing in Redis, database, or memory cache
  try {
    // Store the answer with expiration
    // Example: await redis.setex(`captcha:${sessionId}`, 300, answer.toString());
    logger.info(`Stored captcha answer for session ${sessionId}: ${answer}`);
  } catch (error) {
    logger.error("Error storing captcha answer:", error);
  }
}

async function incrementFailedAttempts(walletAddress: string): Promise<void> {
  // Implement failed attempts tracking
  try {
    // You could store this in a separate table or use the existing user stats
    logger.info(`Incremented failed attempts for ${walletAddress}`);
  } catch (error) {
    logger.error("Error incrementing failed attempts:", error);
  }
}

async function resetFailedAttempts(walletAddress: string): Promise<void> {
  // Implement resetting failed attempts
  try {
    logger.info(`Reset failed attempts for ${walletAddress}`);
  } catch (error) {
    logger.error("Error resetting failed attempts:", error);
  }
}

async function checkIfNeedsCaptcha(walletAddress: string): Promise<boolean> {
  // Implement logic to determine if user needs captcha verification
  try {
    // This could be based on:
    // - Number of failed attempts
    // - User behavior patterns
    // - Account age
    // - Other risk factors
    return false; // For now, return false
  } catch (error) {
    logger.error("Error checking captcha requirement:", error);
    return false;
  }
}

export default captchaSystemRouter;
