"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const ApiError_1 = require("../errors/ApiError");
const handleApiError_1 = __importDefault(require("../utils/handleApiError"));
const prisma = new client_1.PrismaClient();
const notificationSystem = new hono_1.Hono();
// Validation schemas
const createNotificationSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
    priority: zod_1.z.enum(['Low', 'Normal', 'High', 'Urgent']).default('Normal'),
    type: zod_1.z.enum(['Welcome', 'Premium', 'Quest', 'Reward', 'Referral', 'System', 'Marketing']),
    isAll: zod_1.z.boolean().default(false),
    to: zod_1.z.array(zod_1.z.string()).optional(), // Array of wallet addresses
});
const markSeenSchema = zod_1.z.object({
    walletAddress: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    notificationId: zod_1.z.string(),
});
const deleteNotificationSchema = zod_1.z.object({
    notificationId: zod_1.z.string(),
});
// POST /create - Create notification
notificationSystem.post('/create', authMiddleware_1.default, async (c) => {
    try {
        const body = await c.req.json();
        const { title, description, priority, type, isAll, to } = createNotificationSchema.parse(body);
        // Create notification
        const notification = await prisma.notification.create({
            data: {
                title,
                description,
                priority,
                type,
                isAll
            }
        });
        // If isAll is true, create recipient records for all users
        if (isAll) {
            const users = await prisma.user.findMany({
                select: { walletAddress: true }
            });
            await prisma.notificationRecipient.createMany({
                data: users.map(user => ({
                    notificationId: notification.id,
                    recipient: user.walletAddress,
                    isSeen: false
                }))
            });
        }
        else if (to && to.length > 0) {
            // Create recipient records for specific users
            await prisma.notificationRecipient.createMany({
                data: to.map(walletAddress => ({
                    notificationId: notification.id,
                    recipient: walletAddress,
                    isSeen: false
                }))
            });
        }
        return c.json({
            success: true,
            message: 'Notification created successfully',
            notification: {
                id: notification.id,
                title: notification.title,
                description: notification.description,
                priority: notification.priority,
                type: notification.type,
                isAll: notification.isAll,
                createdAt: notification.createdAt
            }
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// GET /all - Get all notifications
notificationSystem.get('/all', async (c) => {
    try {
        const page = parseInt(c.req.query('page') || '1');
        const limit = parseInt(c.req.query('limit') || '10');
        const skip = (page - 1) * limit;
        const [notifications, total] = await Promise.all([
            prisma.notification.findMany({
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    recipients: {
                        select: {
                            recipient: true,
                            isSeen: true,
                            seenAt: true
                        }
                    }
                }
            }),
            prisma.notification.count()
        ]);
        return c.json({
            success: true,
            notifications,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// GET /user/:walletAddress - Get notifications for specific user
notificationSystem.get('/user/:walletAddress', async (c) => {
    try {
        const walletAddress = c.req.param('walletAddress');
        const page = parseInt(c.req.query('page') || '1');
        const limit = parseInt(c.req.query('limit') || '10');
        const skip = (page - 1) * limit;
        // Get notifications where user is a recipient or isAll is true
        const [notifications, total] = await Promise.all([
            prisma.notification.findMany({
                where: {
                    OR: [
                        { isAll: true },
                        {
                            recipients: {
                                some: { recipient: walletAddress }
                            }
                        }
                    ]
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    recipients: {
                        where: { recipient: walletAddress },
                        select: {
                            isSeen: true,
                            seenAt: true
                        }
                    }
                }
            }),
            prisma.notification.count({
                where: {
                    OR: [
                        { isAll: true },
                        {
                            recipients: {
                                some: { recipient: walletAddress }
                            }
                        }
                    ]
                }
            })
        ]);
        // Format notifications with seen status
        const formattedNotifications = notifications.map(notification => ({
            ...notification,
            isSeen: notification.recipients.length > 0 ? notification.recipients[0].isSeen : false,
            seenAt: notification.recipients.length > 0 ? notification.recipients[0].seenAt : null
        }));
        return c.json({
            success: true,
            notifications: formattedNotifications,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// GET /unread/:walletAddress - Get unread notifications for user
notificationSystem.get('/unread/:walletAddress', async (c) => {
    try {
        const walletAddress = c.req.param('walletAddress');
        // Get unread notifications
        const notifications = await prisma.notification.findMany({
            where: {
                OR: [
                    {
                        isAll: true,
                        recipients: {
                            none: { recipient: walletAddress }
                        }
                    },
                    {
                        recipients: {
                            some: {
                                recipient: walletAddress,
                                isSeen: false
                            }
                        }
                    }
                ]
            },
            orderBy: { createdAt: 'desc' },
            include: {
                recipients: {
                    where: { recipient: walletAddress },
                    select: {
                        isSeen: true,
                        seenAt: true
                    }
                }
            }
        });
        // Format notifications
        const formattedNotifications = notifications.map(notification => ({
            ...notification,
            isSeen: notification.recipients.length > 0 ? notification.recipients[0].isSeen : false,
            seenAt: notification.recipients.length > 0 ? notification.recipients[0].seenAt : null
        }));
        return c.json({
            success: true,
            notifications: formattedNotifications,
            unreadCount: formattedNotifications.length
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// POST /mark-seen - Mark notification as seen
notificationSystem.post('/mark-seen', async (c) => {
    try {
        const body = await c.req.json();
        const { walletAddress, notificationId } = markSeenSchema.parse(body);
        // Check if notification exists
        const notification = await prisma.notification.findUnique({
            where: { id: notificationId }
        });
        if (!notification) {
            throw new ApiError_1.ApiError('Notification not found', 404);
        }
        // Check if user is a recipient
        const existingRecipient = await prisma.notificationRecipient.findUnique({
            where: {
                notificationId_recipient: {
                    notificationId,
                    recipient: walletAddress
                }
            }
        });
        if (existingRecipient) {
            // Update existing recipient
            await prisma.notificationRecipient.update({
                where: {
                    notificationId_recipient: {
                        notificationId,
                        recipient: walletAddress
                    }
                },
                data: {
                    isSeen: true,
                    seenAt: new Date()
                }
            });
        }
        else if (notification.isAll) {
            // Create new recipient record for isAll notification
            await prisma.notificationRecipient.create({
                data: {
                    notificationId,
                    recipient: walletAddress,
                    isSeen: true,
                    seenAt: new Date()
                }
            });
        }
        else {
            throw new ApiError_1.ApiError('User is not a recipient of this notification', 400);
        }
        return c.json({
            success: true,
            message: 'Notification marked as seen'
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// POST /mark-all-seen - Mark all notifications as seen for user
notificationSystem.post('/mark-all-seen', async (c) => {
    try {
        const body = await c.req.json();
        const { walletAddress } = zod_1.z.object({ walletAddress: zod_1.z.string() }).parse(body);
        // Get all unread notifications for user
        const unreadNotifications = await prisma.notification.findMany({
            where: {
                OR: [
                    {
                        isAll: true,
                        recipients: {
                            none: { recipient: walletAddress }
                        }
                    },
                    {
                        recipients: {
                            some: {
                                recipient: walletAddress,
                                isSeen: false
                            }
                        }
                    }
                ]
            },
            select: { id: true, isAll: true }
        });
        // Mark all as seen
        for (const notification of unreadNotifications) {
            const existingRecipient = await prisma.notificationRecipient.findUnique({
                where: {
                    notificationId_recipient: {
                        notificationId: notification.id,
                        recipient: walletAddress
                    }
                }
            });
            if (existingRecipient) {
                await prisma.notificationRecipient.update({
                    where: {
                        notificationId_recipient: {
                            notificationId: notification.id,
                            recipient: walletAddress
                        }
                    },
                    data: {
                        isSeen: true,
                        seenAt: new Date()
                    }
                });
            }
            else {
                await prisma.notificationRecipient.create({
                    data: {
                        notificationId: notification.id,
                        recipient: walletAddress,
                        isSeen: true,
                        seenAt: new Date()
                    }
                });
            }
        }
        return c.json({
            success: true,
            message: `Marked ${unreadNotifications.length} notifications as seen`
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// DELETE /:notificationId - Delete notification
notificationSystem.delete('/:notificationId', authMiddleware_1.default, async (c) => {
    try {
        const notificationId = c.req.param('notificationId');
        // Check if notification exists
        const notification = await prisma.notification.findUnique({
            where: { id: notificationId }
        });
        if (!notification) {
            throw new ApiError_1.ApiError('Notification not found', 404);
        }
        // Delete notification (cascade will delete recipients)
        await prisma.notification.delete({
            where: { id: notificationId }
        });
        return c.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// GET /stats - Get notification statistics (admin only)
notificationSystem.get('/stats', authMiddleware_1.default, async (c) => {
    try {
        const [totalNotifications, unreadCount, notificationsByType, notificationsByPriority] = await Promise.all([
            prisma.notification.count(),
            prisma.notificationRecipient.count({
                where: { isSeen: false }
            }),
            prisma.notification.groupBy({
                by: ['type'],
                _count: { type: true }
            }),
            prisma.notification.groupBy({
                by: ['priority'],
                _count: { priority: true }
            })
        ]);
        return c.json({
            success: true,
            stats: {
                totalNotifications,
                unreadCount,
                notificationsByType: notificationsByType.reduce((acc, item) => {
                    acc[item.type] = item._count.type;
                    return acc;
                }, {}),
                notificationsByPriority: notificationsByPriority.reduce((acc, item) => {
                    acc[item.priority] = item._count.priority;
                    return acc;
                }, {})
            }
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// POST /send-welcome - Send welcome notification to new user
notificationSystem.post('/send-welcome', async (c) => {
    try {
        const body = await c.req.json();
        const { walletAddress, username } = zod_1.z.object({
            walletAddress: zod_1.z.string(),
            username: zod_1.z.string()
        }).parse(body);
        const notification = await prisma.notification.create({
            data: {
                title: 'Welcome to the Platform!',
                description: `Welcome ${username}! Start your journey by exploring games and earning rewards.`,
                priority: 'Normal',
                type: 'Welcome',
                isAll: false
            }
        });
        await prisma.notificationRecipient.create({
            data: {
                notificationId: notification.id,
                recipient: walletAddress,
                isSeen: false
            }
        });
        return c.json({
            success: true,
            message: 'Welcome notification sent'
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// POST /send-premium - Send premium upgrade notification
notificationSystem.post('/send-premium', async (c) => {
    try {
        const body = await c.req.json();
        const { walletAddress, username } = zod_1.z.object({
            walletAddress: zod_1.z.string(),
            username: zod_1.z.string()
        }).parse(body);
        const notification = await prisma.notification.create({
            data: {
                title: 'Premium Upgrade Successful!',
                description: `Congratulations ${username}! You now have access to premium features and exclusive content.`,
                priority: 'High',
                type: 'Premium',
                isAll: false
            }
        });
        await prisma.notificationRecipient.create({
            data: {
                notificationId: notification.id,
                recipient: walletAddress,
                isSeen: false
            }
        });
        return c.json({
            success: true,
            message: 'Premium notification sent'
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
exports.default = notificationSystem;
