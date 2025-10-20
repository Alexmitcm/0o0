import type { Context } from "hono";
import { z } from "zod";
import prisma from "../../prisma/client";

const reportGameSchema = z.object({
  description: z.string().optional(),
  reason: z.enum(["Bug", "Error", "Other"])
});

export const reportGame = async (c: Context) => {
  try {
    const slug = c.req.param("slug");
    const body = await c.req.json();
    const validatedData = reportGameSchema.parse(body);

    // Get the game
    const game = await prisma.game.findUnique({
      where: { slug }
    });

    if (!game) {
      return c.json({ error: "Game not found" }, 404);
    }

    // Get user (optional - anonymous reports are allowed)
    const user = c.get("user");
    const reporterAddress = user?.walletAddress || "anonymous";

    // Create game report
    const gameReport = await prisma.gameReport.create({
      data: {
        description: validatedData.description || "",
        gameId: game.id,
        reason: validatedData.reason,
        reporterAddress
      }
    });

    return c.json({ report: gameReport, success: true });
  } catch (error) {
    console.error("Report game error:", error);
    if (error instanceof z.ZodError) {
      return c.json({ details: error.errors, error: "Validation error" }, 400);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
};
