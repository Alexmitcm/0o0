import type { Context } from "hono";
import { z } from "zod";
import prisma from "../../prisma/client";

const createCommentSchema = z.object({
  content: z.string().min(1).max(500),
  gameId: z.string(),
  parentId: z.string().optional() // For replies
});

const getCommentsSchema = z.object({
  gameId: z.string(),
  limit: z.string().optional(),
  page: z.string().optional()
});

export const createGameComment = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { gameId, content, parentId } = createCommentSchema.parse(body);

    // Get user from auth context
    const userAddress = c.get("userAddress");
    if (!userAddress) {
      return c.json({ error: "Authentication required", success: false }, 401);
    }

    // Verify game exists
    const game = await prisma.game.findUnique({
      select: { id: true },
      where: { id: gameId }
    });

    if (!game) {
      return c.json({ error: "Game not found", success: false }, 404);
    }

    // Create comment
    const comment = await prisma.gameComment.create({
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
  } catch (error) {
    console.error("Error creating comment:", error);
    return c.json(
      {
        error: "Failed to create comment",
        success: false
      },
      500
    );
  }
};

export const getGameComments = async (c: Context) => {
  try {
    const query = c.req.query();
    const { gameId, page, limit } = getCommentsSchema.parse(query);

    const pageNum = page ? Number.parseInt(page, 10) : 1;
    const limitNum = limit ? Number.parseInt(limit, 10) : 20;
    const skip = (pageNum - 1) * limitNum;

    const [comments, total] = await Promise.all([
      prisma.gameComment.findMany({
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

      prisma.gameComment.count({
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
  } catch (error) {
    console.error("Error fetching comments:", error);
    return c.json(
      {
        error: "Failed to fetch comments",
        success: false
      },
      500
    );
  }
};

export const likeComment = async (c: Context) => {
  try {
    const { commentId } = c.req.param();
    const userAddress = c.get("userAddress");

    if (!userAddress) {
      return c.json({ error: "Authentication required", success: false }, 401);
    }

    // Check if already liked
    const existingLike = await prisma.gameCommentLike.findUnique({
      where: {
        commentId_userAddress: {
          commentId,
          userAddress
        }
      }
    });

    if (existingLike) {
      // Unlike
      await prisma.gameCommentLike.delete({
        where: { id: existingLike.id }
      });
      return c.json({ liked: false, success: true });
    }
    // Like
    await prisma.gameCommentLike.create({
      data: {
        commentId,
        userAddress
      }
    });
    return c.json({ liked: true, success: true });
  } catch (error) {
    console.error("Error liking comment:", error);
    return c.json(
      {
        error: "Failed to like comment",
        success: false
      },
      500
    );
  }
};
