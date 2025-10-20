import type { Context } from "hono";
import { z } from "zod";
import prisma from "../../prisma/client";

const playGameSchema = z.object({
  completed: z.boolean().default(false),
  playDuration: z.number().optional(),
  score: z.number().optional()
});

export const playGame = async (c: Context) => {
  try {
    const slug = c.req.param("slug");
    const body = await c.req.json();
    const validatedData = playGameSchema.parse(body);

    // Get the game
    const game = await prisma.game.findUnique({
      where: { slug }
    });

    // Accept published games for play tracking
    if (!game || game.status !== "Published") {
      return c.json({ error: "Game not found or not available" }, 404);
    }

    // Get user (optional - anonymous plays are allowed)
    const user = c.get("user");
    const playerAddress = user?.walletAddress || "anonymous";

    // Record the play
    const gamePlay = await prisma.gamePlay.create({
      data: {
        completed: validatedData.completed,
        gameId: game.id,
        playDuration: validatedData.playDuration,
        playerAddress,
        score: validatedData.score
      }
    });

    // Note: playCount update removed due to Prisma schema issues
    // Will be re-enabled once schema is properly synced

    return c.json({ gamePlay, success: true });
  } catch (error) {
    console.error("Play game error:", error);
    if (error instanceof z.ZodError) {
      return c.json({ details: error.errors, error: "Validation error" }, 400);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
};
