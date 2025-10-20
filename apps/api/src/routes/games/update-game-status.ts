import type { Context } from "hono";
import prisma from "../../prisma/client";

export const updateGameStatus = async (c: Context) => {
  try {
    // Update the existing game to Published status
    const updatedGame = await prisma.game.update({
      data: {
        status: "Published"
      },
      include: {
        categories: true
      },
      where: {
        id: "cme32v2790000wjx4fzhjxhv3" // Your uploaded game ID
      }
    });

    return c.json({
      game: {
        categories: updatedGame.categories.map((cat) => cat.name),
        createdAt: updatedGame.createdAt,
        id: updatedGame.id,
        slug: updatedGame.slug,
        status: updatedGame.status,
        title: updatedGame.title
      },
      message: "Game status updated to Published",
      success: true
    });
  } catch (error) {
    console.error("Update game status error:", error);
    return c.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        success: false
      },
      500
    );
  }
};
