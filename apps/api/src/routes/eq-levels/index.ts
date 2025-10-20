import logger from "@hey/helpers/logger";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { errorHandler } from "../../middlewares/errorHandler";
import rateLimiter from "../../middlewares/rateLimiter";
import prisma from "../../prisma/client";

const eqLevelsRouter = new Hono();

// Validation schemas
const getEqLevelSchema = z.object({
  walletAddress: z.string().min(42).max(42)
});

const createEqLevelSchema = z.object({
  description: z.string().optional(),
  level: z.number().int().min(1),
  staminaValue: z.number().int().min(0)
});

const updateEqLevelSchema = z.object({
  description: z.string().optional(),
  level: z.number().int().min(1).optional(),
  staminaValue: z.number().int().min(0).optional()
});

// GET /eq-levels/:walletAddress - Get user EQ level and stamina (equivalent to CountEq.php)
eqLevelsRouter.get(
  "/:walletAddress",
  rateLimiter({ max: 30, windowMs: 60000 }),
  zValidator("param", getEqLevelSchema),
  async (c) => {
    try {
      const { walletAddress } = c.req.valid("param");

      // Get user data from users table
      const user = await prisma.user.findUnique({
        select: {
          leftNode: true,
          rightNode: true,
          totalEq: true,
          walletAddress: true
        },
        where: { walletAddress }
      });

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      return c.json({
        leftNode: user.leftNode || 0,
        rightNode: user.rightNode || 0,
        Total_eq: user.totalEq || 0,
        walletAddress: user.walletAddress
      });
    } catch (error) {
      logger.error("Error getting EQ level:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// GET /eq-levels - Get all EQ levels (equivalent to ShowAll.php)
eqLevelsRouter.get(
  "/",
  rateLimiter({ max: 20, windowMs: 60000 }),
  async (c) => {
    try {
      const records = await prisma.eqLevelsStamina.findMany({
        orderBy: { creationDate: "desc" }
      });

      return c.json({ records });
    } catch (error) {
      logger.error("Error getting all EQ levels:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// POST /eq-levels - Create new EQ level
eqLevelsRouter.post(
  "/",
  rateLimiter({ max: 10, windowMs: 60000 }),
  zValidator("json", createEqLevelSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");

      const eqLevel = await prisma.eqLevelsStamina.create({
        data: {
          description: data.description,
          level: data.level,
          staminaValue: data.staminaValue
        }
      });

      return c.json(
        {
          data: eqLevel,
          success: true
        },
        201
      );
    } catch (error) {
      logger.error("Error creating EQ level:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// PUT /eq-levels/:id - Update EQ level
eqLevelsRouter.put(
  "/:id",
  rateLimiter({ max: 10, windowMs: 60000 }),
  zValidator("json", updateEqLevelSchema),
  async (c) => {
    try {
      const id = c.req.param("id");
      const data = c.req.valid("json");

      const eqLevel = await prisma.eqLevelsStamina.update({
        data,
        where: { id }
      });

      return c.json({
        data: eqLevel,
        success: true
      });
    } catch (error) {
      logger.error("Error updating EQ level:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// DELETE /eq-levels/:id - Delete EQ level
eqLevelsRouter.delete(
  "/:id",
  rateLimiter({ max: 10, windowMs: 60000 }),
  async (c) => {
    try {
      const id = c.req.param("id");

      await prisma.eqLevelsStamina.delete({
        where: { id }
      });

      return c.json({
        message: "EQ level deleted successfully",
        success: true
      });
    } catch (error) {
      logger.error("Error deleting EQ level:", error);
      return errorHandler(error as Error, c);
    }
  }
);

export default eqLevelsRouter;
