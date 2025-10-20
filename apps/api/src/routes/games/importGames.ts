import type { Context } from "hono";
import { z } from "zod";
import prisma from "../../prisma/client";

const gameImportSchema = z.object({
  category: z.string(),
  description: z.string().optional(),
  gameUrl: z.string().url(),
  height: z.number().default(720),
  instructions: z.string().optional(),
  slug: z.string(),
  source: z.string().default("JSON"),
  thumb1Url: z.string().url(),
  thumb2Url: z.string().url(),
  title: z.string(),
  width: z.number().default(1280)
});

const importGamesSchema = z.object({
  games: z.array(gameImportSchema)
});

export const importGames = async (c: Context) => {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const validatedData = importGamesSchema.parse(body);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const gameData of validatedData.games) {
      try {
        // Check if game with slug already exists
        const existingGame = await prisma.game.findUnique({
          where: { slug: gameData.slug }
        });

        if (existingGame) {
          results.push({
            error: "Game with this slug already exists",
            slug: gameData.slug,
            status: "exists",
            title: gameData.title
          });
          errorCount++;
          continue;
        }

        // Get or create category
        let category = await prisma.gameCategory.findUnique({
          where: { name: gameData.category }
        });

        if (!category) {
          category = await prisma.gameCategory.create({
            data: {
              name: gameData.category,
              slug: gameData.category.toLowerCase().replace(/\s+/g, "-")
            }
          });
        }

        // Create the game
        const game = await prisma.game.create({
          data: {
            categories: {
              connect: [{ id: category.id }]
            },
            description: gameData.description,
            externalUrl: gameData.gameUrl,
            gameFileUrl: gameData.gameUrl,
            height: gameData.height,
            instructions: gameData.instructions,
            slug: gameData.slug,
            source: "JSON",
            thumb1Url: gameData.thumb1Url,
            thumb2Url: gameData.thumb2Url,
            title: gameData.title,
            uploadedBy: user.walletAddress,
            width: gameData.width
          }
        });

        results.push({
          gameId: game.id,
          slug: gameData.slug,
          status: "success",
          title: gameData.title
        });
        successCount++;
      } catch (error) {
        results.push({
          error: error instanceof Error ? error.message : "Unknown error",
          slug: gameData.slug,
          status: "error",
          title: gameData.title
        });
        errorCount++;
      }
    }

    return c.json({
      results,
      success: true,
      summary: {
        errors: errorCount,
        success: successCount,
        total: validatedData.games.length
      }
    });
  } catch (error) {
    console.error("Import games error:", error);
    if (error instanceof z.ZodError) {
      return c.json({ details: error.errors, error: "Validation error" }, 400);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
};
