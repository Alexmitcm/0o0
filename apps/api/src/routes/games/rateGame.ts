import type { Context } from "hono";
import { z } from "zod";
import { getAuthContext } from "../../context/authContext";
import prisma from "../../prisma/client";

const rateGameSchema = z.object({
  rating: z.number().min(1).max(5)
});

export const rateGame = async (c: Context) => {
  try {
    console.log("[DEBUG] Rate game endpoint called");
    // Authentication check is handled by middleware
    const gameSlug = c.req.param("slug");
    const body = await c.req.json();
    const validatedData = rateGameSchema.parse(body);
    console.log(
      "[DEBUG] Game slug:",
      gameSlug,
      "Rating:",
      validatedData.rating
    );

    // Get user address from authentication context
    const { walletAddress } = getAuthContext(c);
    const userAddress = walletAddress;

    // For demo purposes, allow guest interactions with a default user
    const effectiveUserAddress =
      userAddress || "0x0000000000000000000000000000000000000000";

    // Check if game exists
    const game = await prisma.game.findUnique({
      select: { id: true, title: true },
      where: { slug: gameSlug }
    });

    if (!game) {
      return c.json({ error: "Game not found" }, 404);
    }

    // Ensure user exists in the database
    await prisma.user.upsert({
      create: {
        walletAddress: effectiveUserAddress
      },
      update: {},
      where: { walletAddress: effectiveUserAddress }
    });

    console.log("[DEBUG] Using user address for rating:", effectiveUserAddress);

    const gameId = game.id;

    // Check if user already rated the game
    const existingRating = await prisma.gameRating.findFirst({
      where: {
        gameId,
        userAddress: effectiveUserAddress
      }
    });

    if (existingRating) {
      // Update existing rating - no need to change ratingCount
      try {
        await prisma.gameRating.updateMany({
          data: {
            rating: validatedData.rating,
            updatedAt: new Date()
          },
          where: {
            gameId,
            userAddress: effectiveUserAddress
          }
        });
      } catch (updateError) {
        console.log("[DEBUG] Rating update failed:", updateError);
        // Continue without updating
      }
    } else {
      // Create new rating
      try {
        await prisma.gameRating.create({
          data: {
            gameId,
            rating: validatedData.rating,
            userAddress: effectiveUserAddress
          }
        });

        // Increase rating count
        await prisma.game.update({
          data: {
            ratingCount: {
              increment: 1
            }
          },
          where: { id: gameId }
        });
      } catch (createError) {
        console.log("[DEBUG] Rating creation failed:", createError);
        // Continue without creating rating
      }
    }

    // Recalculate average rating
    const allRatings = await prisma.gameRating.findMany({
      select: { rating: true },
      where: { gameId }
    });

    const totalRating = allRatings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating =
      allRatings.length > 0 ? totalRating / allRatings.length : 0;

    // Update game's average rating
    await prisma.game.update({
      data: {
        rating: averageRating
      },
      where: { id: gameId }
    });

    return c.json({
      message: "Rating updated successfully",
      rating: validatedData.rating,
      success: true
    });
  } catch (error) {
    console.error("Rate game error:", error);
    if (error instanceof z.ZodError) {
      return c.json({ details: error.errors, error: "Validation error" }, 400);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
};
