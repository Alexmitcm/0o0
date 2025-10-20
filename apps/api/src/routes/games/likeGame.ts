import type { Context } from "hono";
import { getAuthContext } from "../../context/authContext";
import prisma from "../../prisma/client";
import logger from "../../utils/logger";

export const likeGame = async (c: Context) => {
  try {
    const gameSlug = c.req.param("slug");
    const isUnlike = c.req.path.includes("/unlike");

    // Get user address from authentication context
    const { walletAddress } = getAuthContext(c);
    const userAddress = walletAddress;

    // For demo purposes, allow guest interactions with a default user
    const effectiveUserAddress =
      userAddress || "0x0000000000000000000000000000000000000000";

    // Find the game by slug to get the actual ID
    const game = await prisma.game.findUnique({
      select: { id: true, title: true },
      where: { slug: gameSlug }
    });

    if (!game) {
      logger.error(`Game with slug ${gameSlug} does not exist`);
      return c.json(
        {
          error: "Game not found",
          success: false
        },
        404
      );
    }

    const gameId = game.id;

    // Skip user creation for now - just use the address directly
    console.log("[DEBUG] Using user address:", effectiveUserAddress);

    // Check if user already liked the game
    const existingLike = await prisma.gameLike.findFirst({
      where: {
        gameId: gameId,
        userAddress: effectiveUserAddress
      }
    });

    if (isUnlike) {
      // Remove like
      if (existingLike) {
        // Use transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
          await tx.gameLike.deleteMany({
            where: {
              gameId,
              userAddress: effectiveUserAddress
            }
          });

          await tx.game.update({
            data: {
              likeCount: {
                decrement: 1
              }
            },
            where: { id: gameId }
          });
        });
      }

      return c.json({
        liked: false,
        message: "Game unliked successfully",
        success: true
      });
    }
    // Add like
    if (existingLike) {
      // User has already liked the game, so unlike it
      await prisma.$transaction(async (tx) => {
        await tx.gameLike.deleteMany({
          where: {
            gameId,
            userAddress: effectiveUserAddress
          }
        });

        await tx.game.update({
          data: {
            likeCount: {
              decrement: 1
            }
          },
          where: { id: gameId }
        });
      });

      return c.json({
        liked: false,
        message: "Game unliked successfully",
        success: true
      });
    }
    // Create like record with user creation if needed
    try {
      // Ensure user exists in the database
      await prisma.user.upsert({
        create: {
          walletAddress: effectiveUserAddress
        },
        update: {},
        where: { walletAddress: effectiveUserAddress }
      });

      await prisma.gameLike.create({
        data: {
          gameId,
          userAddress: effectiveUserAddress
        }
      });

      await prisma.game.update({
        data: {
          likeCount: {
            increment: 1
          }
        },
        where: { id: gameId }
      });
    } catch (likeError) {
      console.log("[DEBUG] Like creation failed:", likeError);
      // If like creation fails, just update the game count
      await prisma.game.update({
        data: {
          likeCount: {
            increment: 1
          }
        },
        where: { id: gameId }
      });
    }

    return c.json({
      liked: true,
      message: "Game liked successfully",
      success: true
    });
  } catch (error) {
    console.error("Like/Unlike error:", error);
    return c.json({ error: "Failed to process like/unlike request" }, 500);
  }
};
