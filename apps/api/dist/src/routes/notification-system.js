"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("@hey/helpers/logger"));
const zod_validator_1 = require("@hono/zod-validator");
const client_1 = require("@prisma/client");
const hono_1 = require("hono");
const zod_1 = require("zod");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const errorHandler_1 = require("../middlewares/errorHandler");
const rateLimiter_1 = require("../middlewares/rateLimiter");
const prisma = new client_1.PrismaClient();
const notificationSystemRouter = new hono_1.Hono();
// Validation schemas
const createNotificationSchema = zod_1.z.object({
    actionMetadata: zod_1.z.record(zod_1.z.any()).optional(),
    actionUrl: zod_1.z.string().url().optional(),
    isGlobal: zod_1.z.boolean().default(false),
    message: zod_1.z.string().min(1).max(1000),
    priority: zod_1.z.enum(["Low", "Normal", "High", "Urgent"]).default("Normal"),
    recipientWallets: zod_1.z.array(zod_1.z.string().min(42).max(42)).optional(),
    title: zod_1.z.string().min(1).max(200),
    type: zod_1.z.enum([
        "Welcome",
        "Premium",
        "Quest",
        "Reward",
        "Referral",
        "System",
        "Marketing"
    ])
});
const getNotificationsSchema = zod_1.z.object({
    walletAddress: zod_1.z.string().min(42).max(42)
});
const markAsReadSchema = zod_1.z.object({
    notificationIds: zod_1.z.array(zod_1.z.string())
});
// POST /notification-system - Create notification (equivalent to makeNotif.php)
notificationSystemRouter.post("/", authMiddleware_1.default, (0, rateLimiter_1.rateLimiter)({ max: 10, windowMs: 60000 }), // 10 requests per minute
(0, zod_validator_1.zValidator)("json", createNotificationSchema), async (c) => {
    try {
        const data = c.req.valid("json");
        const { type, title, message, priority, actionUrl, actionMetadata, recipientWallets, isGlobal } = data;
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
        }
        else if (recipientWallets && recipientWallets.length > 1) {
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
        return c.json({
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
        }, 201);
    }
    catch (error) {
        logger_1.default.error("Error creating notification:", error);
        return (0, errorHandler_1.errorHandler)(error, c);
    }
});
// GET /notification-system/:walletAddress - Get user notifications (equivalent to GetNotifs.php)
notificationSystemRouter.get("/:walletAddress", (0, rateLimiter_1.rateLimiter)({ max: 30, windowMs: 60000 }), (0, zod_validator_1.zValidator)("param", getNotificationsSchema), async (c) => {
    try {
        const { walletAddress } = c.req.valid("param");
        const page = Number.parseInt(c.req.query("page") || "1");
        const limit = Number.parseInt(c.req.query("limit") || "20");
        const unreadOnly = c.req.query("unreadOnly") === "true";
        const offset = (page - 1) * limit;
        const where = { walletAddress };
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
    }
    catch (error) {
        logger_1.default.error("Error getting notifications:", error);
        return (0, errorHandler_1.errorHandler)(error, c);
    }
});
// PUT /notification-system/mark-read - Mark notifications as read
notificationSystemRouter.put("/mark-read", authMiddleware_1.default, (0, rateLimiter_1.rateLimiter)({ max: 20, windowMs: 60000 }), (0, zod_validator_1.zValidator)("json", markAsReadSchema), async (c) => {
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
            return c.json({ error: "Some notifications not found or unauthorized" }, 400);
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
    }
    catch (error) {
        logger_1.default.error("Error marking notifications as read:", error);
        return (0, errorHandler_1.errorHandler)(error, c);
    }
});
// PUT /notification-system/mark-all-read - Mark all notifications as read
notificationSystemRouter.put("/mark-all-read", authMiddleware_1.default, (0, rateLimiter_1.rateLimiter)({ max: 5, windowMs: 60000 }), async (c) => {
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
    }
    catch (error) {
        logger_1.default.error("Error marking all notifications as read:", error);
        return (0, errorHandler_1.errorHandler)(error, c);
    }
});
// DELETE /notification-system/:notificationId - Delete notification
notificationSystemRouter.delete("/:notificationId", authMiddleware_1.default, (0, rateLimiter_1.rateLimiter)({ max: 20, windowMs: 60000 }), async (c) => {
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
    }
    catch (error) {
        logger_1.default.error("Error deleting notification:", error);
        return (0, errorHandler_1.errorHandler)(error, c);
    }
});
// GET /notification-system/stats/:walletAddress - Get notification statistics
notificationSystemRouter.get("/stats/:walletAddress", (0, rateLimiter_1.rateLimiter)({ max: 30, windowMs: 60000 }), (0, zod_validator_1.zValidator)("param", getNotificationsSchema), async (c) => {
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
                byPriority: byPriority.reduce((acc, item) => {
                    acc[item.priority] = item._count.priority;
                    return acc;
                }, {}),
                byType: byType.reduce((acc, item) => {
                    acc[item.type] = item._count.type;
                    return acc;
                }, {}),
                readCount: totalCount - unreadCount,
                totalCount,
                unreadCount
            },
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Error getting notification stats:", error);
        return (0, errorHandler_1.errorHandler)(error, c);
    }
});
exports.default = notificationSystemRouter;
