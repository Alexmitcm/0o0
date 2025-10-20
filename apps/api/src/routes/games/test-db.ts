import type { Context } from "hono";
import prisma from "../../prisma/client";

export const testDb = async (c: Context) => {
  try {
    // Simple query to test database connection
    const gameCount = await prisma.game.count();

    // Try to get all games with minimal includes
    const games = await prisma.game.findMany({
      include: {
        categories: true
      },
      take: 5
    });

    return c.json({
      gameCount,
      games: games.map((game) => ({
        categories: game.categories.map((cat) => cat.name),
        createdAt: game.createdAt,
        id: game.id,
        slug: game.slug,
        status: game.status,
        title: game.title
      })),
      success: true
    });
  } catch (error) {
    console.error("Database test error:", error);
    return c.json(
      {
        details: JSON.stringify(error, null, 2),
        error: error instanceof Error ? error.message : "Unknown error",
        success: false
      },
      500
    );
  }
};
