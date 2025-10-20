import type { Context } from "hono";
import prisma from "../../prisma/client";

export const deleteGame = async (c: Context) => {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const gameId = c.req.param("id");

    // Check if game exists
    const game = await prisma.game.findUnique({
      where: { id: gameId }
    });

    if (!game) {
      return c.json({ error: "Game not found" }, 404);
    }

    // Check if user is the uploader or admin
    if (game.uploadedBy !== user.walletAddress) {
      return c.json({ error: "Unauthorized to delete this game" }, 403);
    }

    // Delete the game (this will cascade delete related records)
    await prisma.game.delete({
      where: { id: gameId }
    });

    return c.json({ message: "Game deleted successfully", success: true });
  } catch (error) {
    console.error("Delete game error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
};
