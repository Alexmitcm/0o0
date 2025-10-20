"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.likeComment = exports.getGameComments = exports.createGameComment = void 0;
const zod_1 = require("zod");
const client_1 = __importDefault(require("../../prisma/client"));
const createCommentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(500),
    gameId: zod_1.z.string(),
    parentId: zod_1.z.string().optional() // For replies
});
const getCommentsSchema = zod_1.z.object({
    gameId: zod_1.z.string(),
    limit: zod_1.z.string().optional(),
    page: zod_1.z.string().optional()
});
const createGameComment = async (c) => {
    try {
        const body = await c.req.json();
        const { gameId, content, parentId } = createCommentSchema.parse(body);
        // Get user from auth context
        const userAddress = c.get("userAddress");
        if (!userAddress) {
            return c.json({ error: "Authentication required", success: false }, 401);
        }
        // Verify game exists
        const game = await client_1.default.game.findUnique({
            select: { id: true },
            where: { id: gameId }
        });
        if (!game) {
            return c.json({ error: "Game not found", success: false }, 404);
        }
        // Create comment
        const comment = await client_1.default.gameComment.create({
            data: {
                content,
                gameId,
                parentId,
                userAddress
            },
            include: {
                _count: {
                    select: {
                        likes: true,
                        replies: true
                    }
                },
                user: {
                    select: {
                        avatarUrl: true,
                        displayName: true,
                        username: true,
                        walletAddress: true
                    }
                }
            }
        });
        return c.json({
            comment,
            success: true
        });
    }
    catch (error) {
        console.error("Error creating comment:", error);
        return c.json({
            error: "Failed to create comment",
            success: false
        }, 500);
    }
};
exports.createGameComment = createGameComment;
const getGameComments = async (c) => {
    try {
        const query = c.req.query();
        const { gameId, page, limit } = getCommentsSchema.parse(query);
        const pageNum = page ? Number.parseInt(page, 10) : 1;
        const limitNum = limit ? Number.parseInt(limit, 10) : 20;
        const skip = (pageNum - 1) * limitNum;
        const [comments, total] = await Promise.all([
            client_1.default.gameComment.findMany({
                include: {
                    _count: {
                        select: {
                            likes: true,
                            replies: true
                        }
                    },
                    replies: {
                        include: {
                            _count: {
                                select: { likes: true }
                            },
                            user: {
                                select: {
                                    avatarUrl: true,
                                    displayName: true,
                                    username: true,
                                    walletAddress: true
                                }
                            }
                        },
                        orderBy: { createdAt: "asc" },
                        take: 5 // Limit replies per comment
                    },
                    user: {
                        select: {
                            avatarUrl: true,
                            displayName: true,
                            username: true,
                            walletAddress: true
                        }
                    }
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limitNum,
                where: {
                    gameId,
                    parentId: null // Only top-level comments
                }
            }),
            client_1.default.gameComment.count({
                where: { gameId, parentId: null }
            })
        ]);
        return c.json({
            comments,
            pagination: {
                hasNextPage: skip + limitNum < total,
                hasPrevPage: pageNum > 1,
                limit: limitNum,
                page: pageNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            },
            success: true
        });
    }
    catch (error) {
        console.error("Error fetching comments:", error);
        return c.json({
            error: "Failed to fetch comments",
            success: false
        }, 500);
    }
};
exports.getGameComments = getGameComments;
const likeComment = async (c) => {
    try {
        const { commentId } = c.req.param();
        const userAddress = c.get("userAddress");
        if (!userAddress) {
            return c.json({ error: "Authentication required", success: false }, 401);
        }
        // Check if already liked
        const existingLike = await client_1.default.gameCommentLike.findUnique({
            where: {
                commentId_userAddress: {
                    commentId,
                    userAddress
                }
            }
        });
        if (existingLike) {
            // Unlike
            await client_1.default.gameCommentLike.delete({
                where: { id: existingLike.id }
            });
            return c.json({ liked: false, success: true });
        }
        // Like
        await client_1.default.gameCommentLike.create({
            data: {
                commentId,
                userAddress
            }
        });
        return c.json({ liked: true, success: true });
    }
    catch (error) {
        console.error("Error liking comment:", error);
        return c.json({
            error: "Failed to like comment",
            success: false
        }, 500);
    }
};
exports.likeComment = likeComment;
