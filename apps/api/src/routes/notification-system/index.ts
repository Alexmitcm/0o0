import logger from "@hey/helpers/logger";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { errorHandler } from "../../middlewares/errorHandler";
import rateLimiter from "../../middlewares/rateLimiter";
import prisma from "../../prisma/client";

const notificationSystemRouter = new Hono();

// Validation schemas
const createNotificationSchema = z.object({
  description: z.string().min(1).max(1000),
  isAll: z.boolean().default(false),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  recipients: z.array(z.string()).optional(),
  title: z.string().min(1).max(200),
  type: z
    .enum(["info", "warning", "error", "success", "promotion"])
    .default("info")
});

const getNotificationsSchema = z.object({
  limit: z.string().optional(),
  page: z.string().optional(),
  recipient: z.string().min(1)
});

const getNotificationsQuerySchema = z.object({
  limit: z.string().optional(),
  page: z.string().optional()
});

const markAsReadSchema = z.object({
  notificationId: z.string().min(1),
  recipient: z.string().min(1)
});

// POST /notification-system/create - Create notification (equivalent to makeNotif.php)
notificationSystemRouter.post(
  "/create",
  rateLimiter({ max: 10, windowMs: 60000 }),
  zValidator("json", createNotificationSchema),
  async (c) => {
    try {
      const {
        title,
        description,
        priority,
        type,
        isAll,
        recipients = []
      } = c.req.valid("json");

      // Create notification
      const notification = await prisma.notification.create({
        data: {
          description,
          isAll,
          priority,
          title,
          type
        }
      });

      // Create notification recipients
      if (isAll) {
        // For global notifications, we'll create a special recipient entry
        await prisma.notificationRecipient.create({
          data: {
            notificationId: notification.id,
            recipient: "all"
          }
        });
      } else {
        // Create individual recipient entries
        await Promise.all(
          recipients.map((recipient) =>
            prisma.notificationRecipient.create({
              data: {
                notificationId: notification.id,
                recipient
              }
            })
          )
        );
      }

      return c.json(
        {
          data: notification,
          message: "Notification created successfully",
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

// POST /notification-system/get - Get notifications (equivalent to GetNotifs.php)
notificationSystemRouter.post(
  "/get",
  rateLimiter({ max: 30, windowMs: 60000 }),
  zValidator("json", getNotificationsSchema),
  async (c) => {
    try {
      const { recipient, page = "1", limit = "10" } = c.req.valid("json");
      const pageNum = Number.parseInt(page, 10);
      const limitNum = Number.parseInt(limit, 10);
      const offset = (pageNum - 1) * limitNum;

      // Get notifications for the recipient
      const notifications = await prisma.notification.findMany({
        include: {
          notificationRecipients: {
            where: {
              recipient: recipient
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limitNum,
        where: {
          OR: [
            {
              notificationRecipients: {
                some: {
                  recipient: recipient
                }
              }
            },
            {
              isAll: true
            }
          ]
        }
      });

      // Process notifications and create recipient entries for global notifications
      const processedNotifications = [];

      for (const notification of notifications) {
        let isSeen = false;

        if (notification.isAll) {
          // Check if global notification has been seen by this recipient
          const existingRecipient =
            await prisma.notificationRecipient.findFirst({
              where: {
                notificationId: notification.id,
                recipient: recipient
              }
            });

          if (existingRecipient) {
            isSeen = existingRecipient.isSeen;
          } else {
            // Create recipient entry for global notification
            await prisma.notificationRecipient.create({
              data: {
                isSeen: false,
                notificationId: notification.id,
                recipient: recipient
              }
            });
          }
        } else {
          isSeen = notification.notificationRecipients[0]?.isSeen || false;
        }

        processedNotifications.push({
          createdAt: notification.createdAt,
          description: notification.description,
          id: notification.id,
          isAll: notification.isAll,
          isSeen,
          priority: notification.priority,
          title: notification.title,
          type: notification.type
        });
      }

      // Get total count
      const total = await prisma.notification.count({
        where: {
          OR: [
            {
              notificationRecipients: {
                some: {
                  recipient: recipient
                }
              }
            },
            {
              isAll: true
            }
          ]
        }
      });

      return c.json({
        data: {
          notifications: processedNotifications,
          pagination: {
            limit: limitNum,
            page: pageNum,
            total,
            totalPages: Math.ceil(total / limitNum)
          }
        },
        success: true
      });
    } catch (error) {
      logger.error("Error getting notifications:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// POST /notification-system/mark-read - Mark notification as read
notificationSystemRouter.post(
  "/mark-read",
  rateLimiter({ max: 50, windowMs: 60000 }),
  zValidator("json", markAsReadSchema),
  async (c) => {
    try {
      const { notificationId, recipient } = c.req.valid("json");

      // Update notification recipient
      await prisma.notificationRecipient.updateMany({
        data: {
          isSeen: true
        },
        where: {
          notificationId,
          recipient
        }
      });

      return c.json({
        message: "Notification marked as read",
        success: true
      });
    } catch (error) {
      logger.error("Error marking notification as read:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// POST /notification-system/mark-all-read - Mark all notifications as read for a user
notificationSystemRouter.post(
  "/mark-all-read",
  rateLimiter({ max: 10, windowMs: 60000 }),
  zValidator(
    "json",
    z.object({
      recipient: z.string().min(1)
    })
  ),
  async (c) => {
    try {
      const { recipient } = c.req.valid("json");

      // Mark all notifications as read for this recipient
      await prisma.notificationRecipient.updateMany({
        data: {
          isSeen: true
        },
        where: {
          recipient
        }
      });

      return c.json({
        message: "All notifications marked as read",
        success: true
      });
    } catch (error) {
      logger.error("Error marking all notifications as read:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// GET /notification-system/unread-count/:recipient - Get unread notification count
notificationSystemRouter.get(
  "/unread-count/:recipient",
  rateLimiter({ max: 30, windowMs: 60000 }),
  async (c) => {
    try {
      const recipient = c.req.param("recipient");

      const unreadCount = await prisma.notificationRecipient.count({
        where: {
          isSeen: false,
          recipient
        }
      });

      return c.json({
        data: {
          unreadCount
        },
        success: true
      });
    } catch (error) {
      logger.error("Error getting unread count:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// DELETE /notification-system/:id - Delete notification
notificationSystemRouter.delete(
  "/:id",
  rateLimiter({ max: 10, windowMs: 60000 }),
  async (c) => {
    try {
      const id = c.req.param("id");

      // Delete notification and its recipients
      await prisma.notification.delete({
        where: { id }
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

// GET /notification-system/admin - Get all notifications for admin
notificationSystemRouter.get(
  "/admin",
  rateLimiter({ max: 20, windowMs: 60000 }),
  zValidator("query", getNotificationsQuerySchema),
  async (c) => {
    try {
      const page = Number.parseInt(c.req.query("page") || "1", 10);
      const limit = Number.parseInt(c.req.query("limit") || "20", 10);
      const offset = (page - 1) * limit;

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          include: {
            _count: {
              select: {
                recipients: true
              }
            }
          },
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: limit
        }),
        prisma.notification.count()
      ]);

      return c.json({
        data: notifications,
        pagination: {
          limit,
          page,
          total,
          totalPages: Math.ceil(total / limit)
        },
        success: true
      });
    } catch (error) {
      logger.error("Error getting admin notifications:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// POST /notification-system/broadcast - Broadcast notification to all users
notificationSystemRouter.post(
  "/broadcast",
  rateLimiter({ max: 5, windowMs: 60000 }),
  zValidator(
    "json",
    z.object({
      description: z.string().min(1).max(1000),
      priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
      title: z.string().min(1).max(200),
      type: z
        .enum(["info", "warning", "error", "success", "promotion"])
        .default("info")
    })
  ),
  async (c) => {
    try {
      const { title, description, priority, type } = c.req.valid("json");

      // Create global notification
      const notification = await prisma.notification.create({
        data: {
          description,
          isAll: true,
          priority,
          title,
          type
        }
      });

      // Create global recipient entry
      await prisma.notificationRecipient.create({
        data: {
          notificationId: notification.id,
          recipient: "all"
        }
      });

      return c.json({
        data: notification,
        message: "Broadcast notification created successfully",
        success: true
      });
    } catch (error) {
      logger.error("Error creating broadcast notification:", error);
      return errorHandler(error as Error, c);
    }
  }
);

export default notificationSystemRouter;
