import type { Context } from "hono";
import { getAuthContext } from "../../context/authContext";
import prisma from "../../prisma/client";
import logger from "../../utils/logger";

export const unlikeGame = async (c: Context) => {
  try {
    // Accept either numeric/id or slug from route params
    const paramId = c.req.param("id");
    const slugParam = c.req.param("slug");
    let gameId = paramId;

    // Get user address from authentication context
    const { walletAddress } = getAuthContext(c);
    const userAddress = walletAddress;

    // For demo purposes, allow guest interactions with a default user
    const effectiveUserAddress =
      userAddress || "0x0000000000000000000000000000000000000000";

    // First, resolve game by id or slug and verify existence
    if (!gameId && slugParam) {
      const bySlug = await prisma.game.findUnique({
        select: { id: true },
        where: { slug: slugParam }
      });
      gameId = bySlug?.id || "";
    }

    const gameExists = gameId
      ? await prisma.game.findUnique({
          select: { id: true },
          where: { id: gameId }
        })
      : null;

    if (!gameExists) {
      logger.error(
        `Game not found for ${paramId ? `id=${paramId}` : `slug=${slugParam}`}`
      );
      return c.json(
        {
          error: "Game not found",
          success: false
        },
        404
      );
    }

    // Ensure user exists in User table (create if not exists)
    await prisma.user.upsert({
      create: {
        displayName:
          effectiveUserAddress === "0x0000000000000000000000000000000000000000"
            ? "Guest User"
            : "Unknown User",
        lastActiveAt: new Date(),
        registrationDate: new Date(),
        username:
          effectiveUserAddress === "0x0000000000000000000000000000000000000000"
            ? "guest"
            : `user_${effectiveUserAddress.slice(2, 8)}`,
        walletAddress: effectiveUserAddress
      },
      update: {},
      where: { walletAddress: effectiveUserAddress }
    });

    // Check if user already liked the game
    const existingLike = await prisma.gameLike.findUnique({
      where: {
        gameId_userAddress: {
          gameId,
          userAddress: effectiveUserAddress
        }
      }
    });

    if (!existingLike) {
      return c.json({
        liked: false,
        message: "Game was not liked",
        success: true
      });
    }

    // Remove like
    await prisma.gameLike.delete({
      where: {
        gameId_userAddress: {
          gameId,
          userAddress: effectiveUserAddress
        }
      }
    });

    // Decrease like count
    await prisma.game.update({
      data: {
        likeCount: {
          decrement: 1
        }
      },
      where: { id: gameId }
    });

    return c.json({
      liked: false,
      message: "Game unliked successfully",
      success: true
    });
  } catch (error) {
    logger.error("Unlike error:", error);
    return c.json({ error: "Failed to process unlike request" }, 500);
  }
};
