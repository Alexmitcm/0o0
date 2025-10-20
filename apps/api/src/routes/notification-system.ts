import logger from "@hey/helpers/logger";
import { zValidator } from "@hono/zod-validator";
import { PrismaClient } from "@prisma/client";
import { Hono } from "hono";
import { z } from "zod";
import authMiddleware from "../middlewares/authMiddleware";
import { errorHandler } from "../middlewares/errorHandler";
import rateLimiter from "../middlewares/rateLimiter";

const prisma = new PrismaClient();
const notificationSystemRouter = new Hono();

// Validation schemas
const createNotificationSchema = z.object({
  actionMetadata: z.record(z.any()).optional(),
  actionUrl: z.string().url().optional(),
  isGlobal: z.boolean().default(false),
  message: z.string().min(1).max(1000),
  priority: z.enum(["Low", "Normal", "High", "Urgent"]).default("Normal"),
  recipientWallets: z.array(z.string().min(42).max(42)).optional(),
  title: z.string().min(1).max(200),
  type: z.enum([
    "Welcome",
    "Premium",
    "Quest",
    "Reward",
    "Referral",
    "System",
    "Marketing"
  ])
});

const getNotificationsSchema = z.object({
  walletAddress: z.string().min(42).max(42)
});

const markAsReadSchema = z.object({
  notificationIds: z.array(z.string())
});

// POST /notification-system - Create notification (equivalent to makeNotif.php)
notificationSystemRouter.post(
  "/",
  authMiddleware,
  rateLimiter({ max: 10, windowMs: 60000 }), // 10 requests per minute
  zValidator("json", createNotificationSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");
      const {
        type,
        title,
        message,
        priority,
        actionUrl,
        actionMetadata,
        recipientWallets,
        isGlobal
      } = data;

      // Create notification
      const notification = await prisma.userNotification.create({
        data: {
          actionMetadata,
          actionUrl,
          message,
          priority,
          title,
          type,
          walletAddress: isGlobal ? "GLOBAL" : recipientWallets?.[0] || ""
        }
      });

      // If it's a global notification, create entries for all users
      if (isGlobal) {
        const users = await prisma.user.findMany({
          select: { walletAddress: true }
        });

        const globalNotifications = users.map((user) => ({
          actionMetadata,
          actionUrl,
          message,
          priority,
          title,
          type,
          walletAddress: user.walletAddress
        }));

        await prisma.userNotification.createMany({
          data: globalNotifications
        });
      } else if (recipientWallets && recipientWallets.length > 1) {
        // Create notifications for multiple recipients
        const multiNotifications = recipientWallets.map((walletAddress) => ({
          actionMetadata,
          actionUrl,
          message,
          priority,
          title,
          type,
          walletAddress
        }));

        await prisma.userNotification.createMany({
          data: multiNotifications
        });
      }

      return c.json(
        {
          message: "Notification created successfully",
          notification: {
            actionUrl: notification.actionUrl,
            createdAt: notification.createdAt,
            id: notification.id,
            message: notification.message,
            priority: notification.priority,
            title: notification.title,
            type: notification.type
          },
          success: true
        },
        201
      );
    } catch (error) {
      logger.error("Error creating notification:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// GET /notification-system/:walletAddress - Get user notifications (equivalent to GetNotifs.php)
notificationSystemRouter.get(
  "/:walletAddress",
  rateLimiter({ max: 30, windowMs: 60000 }),
  zValidator("param", getNotificationsSchema),
  async (c) => {
    try {
      const { walletAddress } = c.req.valid("param");
      const page = Number.parseInt(c.req.query("page") || "1");
      const limit = Number.parseInt(c.req.query("limit") || "20");
      const unreadOnly = c.req.query("unreadOnly") === "true";
      const offset = (page - 1) * limit;

      const where: any = { walletAddress };
      if (unreadOnly) {
        where.isRead = false;
      }

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.userNotification.findMany({
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: limit,
          where
        }),
        prisma.userNotification.count({ where }),
        prisma.userNotification.count({
          where: { isRead: false, walletAddress }
        })
      ]);

      return c.json({
        notifications: notifications.map((notification) => ({
          actionMetadata: notification.actionMetadata,
          actionUrl: notification.actionUrl,
          createdAt: notification.createdAt,
          id: notification.id,
          isRead: notification.isRead,
          message: notification.message,
          priority: notification.priority,
          readAt: notification.readAt,
          title: notification.title,
          type: notification.type
        })),
        pagination: {
          limit,
          page,
          total,
          totalPages: Math.ceil(total / limit)
        },
        success: true,
        unreadCount
      });
    } catch (error) {
      logger.error("Error getting notifications:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// PUT /notification-system/mark-read - Mark notifications as read
notificationSystemRouter.put(
  "/mark-read",
  authMiddleware,
  rateLimiter({ max: 20, windowMs: 60000 }),
  zValidator("json", markAsReadSchema),
  async (c) => {
    try {
      const { notificationIds } = c.req.valid("json");
      const walletAddress = c.get("walletAddress");

      // Verify notifications belong to the user
      const notifications = await prisma.userNotification.findMany({
        where: {
          id: { in: notificationIds },
          walletAddress
        }
      });

      if (notifications.length !== notificationIds.length) {
        return c.json(
          { error: "Some notifications not found or unauthorized" },
          400
        );
      }

      // Mark as read
      await prisma.userNotification.updateMany({
        data: {
          isRead: true,
          readAt: new Date()
        },
        where: {
          id: { in: notificationIds },
          walletAddress
        }
      });

      return c.json({
        message: "Notifications marked as read",
        success: true,
        updatedCount: notificationIds.length
      });
    } catch (error) {
      logger.error("Error marking notifications as read:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// PUT /notification-system/mark-all-read - Mark all notifications as read
notificationSystemRouter.put(
  "/mark-all-read",
  authMiddleware,
  rateLimiter({ max: 5, windowMs: 60000 }),
  async (c) => {
    try {
      const walletAddress = c.get("walletAddress");

      const result = await prisma.userNotification.updateMany({
        data: {
          isRead: true,
          readAt: new Date()
        },
        where: {
          isRead: false,
          walletAddress
        }
      });

      return c.json({
        message: "All notifications marked as read",
        success: true,
        updatedCount: result.count
      });
    } catch (error) {
      logger.error("Error marking all notifications as read:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// DELETE /notification-system/:notificationId - Delete notification
notificationSystemRouter.delete(
  "/:notificationId",
  authMiddleware,
  rateLimiter({ max: 20, windowMs: 60000 }),
  async (c) => {
    try {
      const notificationId = c.req.param("notificationId");
      const walletAddress = c.get("walletAddress");

      const notification = await prisma.userNotification.findFirst({
        where: {
          id: notificationId,
          walletAddress
        }
      });

      if (!notification) {
        return c.json({ error: "Notification not found" }, 404);
      }

      await prisma.userNotification.delete({
        where: { id: notificationId }
      });

      return c.json({
        message: "Notification deleted successfully",
        success: true
      });
    } catch (error) {
      logger.error("Error deleting notification:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// GET /notification-system/stats/:walletAddress - Get notification statistics
notificationSystemRouter.get(
  "/stats/:walletAddress",
  rateLimiter({ max: 30, windowMs: 60000 }),
  zValidator("param", getNotificationsSchema),
  async (c) => {
    try {
      const { walletAddress } = c.req.valid("param");

      const [totalCount, unreadCount, byType, byPriority] = await Promise.all([
        prisma.userNotification.count({
          where: { walletAddress }
        }),
        prisma.userNotification.count({
          where: { isRead: false, walletAddress }
        }),
        prisma.userNotification.groupBy({
          _count: { type: true },
          by: ["type"],
          where: { walletAddress }
        }),
        prisma.userNotification.groupBy({
          _count: { priority: true },
          by: ["priority"],
          where: { walletAddress }
        })
      ]);

      return c.json({
        stats: {
          byPriority: byPriority.reduce(
            (acc, item) => {
              acc[item.priority] = item._count.priority;
              return acc;
            },
            {} as Record<string, number>
          ),
          byType: byType.reduce(
            (acc, item) => {
              acc[item.type] = item._count.type;
              return acc;
            },
            {} as Record<string, number>
          ),
          readCount: totalCount - unreadCount,
          totalCount,
          unreadCount
        },
        success: true
      });
    } catch (error) {
      logger.error("Error getting notification stats:", error);
      return errorHandler(error as Error, c);
    }
  }
);

export default notificationSystemRouter;
