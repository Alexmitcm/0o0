import type { Context } from "hono";
import { getAuthContext } from "../../context/authContext";
import prisma from "../../prisma/client";
import logger from "../../utils/logger";

export const dislikeGame = async (c: Context) => {
  try {
    const gameSlug = c.req.param("slug");

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
    console.log("[DEBUG] Using user address for dislike:", effectiveUserAddress);

    // Check if user already disliked the game
    const existingDislike = await prisma.gameDislike.findFirst({
      where: {
        gameId,
        userAddress: effectiveUserAddress
      }
    });

    if (existingDislike) {
      // Remove dislike
      try {
        await prisma.gameDislike.deleteMany({
          where: {
            gameId,
            userAddress: effectiveUserAddress
          }
        });

        await prisma.game.update({
          data: {
            dislikeCount: {
              decrement: 1
            }
          },
          where: { id: gameId }
        });
      } catch (deleteError) {
        console.log("[DEBUG] Dislike deletion failed:", deleteError);
        // Just update the game count
        await prisma.game.update({
          data: {
            dislikeCount: {
              decrement: 1
            }
          },
          where: { id: gameId }
        });
      }

      return c.json({
        disliked: false,
        message: "Game undisliked successfully",
        success: true
      });
    }
    
    // Add dislike
    try {
      await prisma.gameDislike.create({
        data: {
          gameId,
          userAddress: effectiveUserAddress
        }
      });

      await prisma.game.update({
        data: {
          dislikeCount: {
            increment: 1
          }
        },
        where: { id: gameId }
      });
    } catch (dislikeError) {
      console.log("[DEBUG] Dislike creation failed:", dislikeError);
      // If dislike creation fails, just update the game count
      await prisma.game.update({
        data: {
          dislikeCount: {
            increment: 1
          }
        },
        where: { id: gameId }
      });
    }

    return c.json({
      disliked: true,
      message: "Game disliked successfully",
      success: true
    });
  } catch (error) {
    console.error("Dislike error:", error);
    return c.json({ error: "Failed to process dislike request" }, 500);
  }
};
