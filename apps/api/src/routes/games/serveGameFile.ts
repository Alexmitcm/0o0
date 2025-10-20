import { join } from "node:path";
import { serveStatic } from "@hono/node-server/serve-static";
import type { Context } from "hono";
import prisma from "../../prisma/client";

export const serveGameFile = async (c: Context) => {
  try {
    const slug = c.req.param("slug");
    const filePath = c.req.param("*") || "index.html";

    // Get the game from database
    const game = await prisma.game.findUnique({
      where: { slug }
    });

    if (!game) {
      return c.json({ error: "Game not found" }, 404);
    }

    if (game.status !== "Published") {
      return c.json({ error: "Game is not available" }, 404);
    }

    // Serve files from the games directory using the game's packageUrl
    const packageUrl = game.packageUrl;
    const gameFolder = packageUrl.split('/').slice(-2, -1)[0]; // Extract folder name from packageUrl
    const gamesDir = join(process.cwd(), "uploads", "games", gameFolder);

    // Set CORS headers for game files
    c.header("Access-Control-Allow-Origin", "*");
    c.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    c.header("Access-Control-Allow-Headers", "Content-Type");

    // Use Hono's serveStatic to serve the file
    return serveStatic({
      path: filePath,
      root: gamesDir
    })(c);
  } catch (error) {
    console.error("Serve game file error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
};
