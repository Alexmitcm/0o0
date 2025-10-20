import type { Context } from "hono";
import prisma from "../../prisma/client";

const toAbsoluteUrl = (origin: string, u?: string) => {
  if (!u) return u;
  if (/^https?:\/\//i.test(u)) return u;
  return `${origin}${u}`;
};

export const getPopularGames = async (c: Context) => {
  try {
    const origin = new URL(c.req.url).origin;
    const limit = Number.parseInt(c.req.query("limit") || "20", 10);

    const games = await prisma.game.findMany({
      include: { categories: true, GameScreenshot: true, GameTag: true },
      orderBy: { createdAt: "desc" },
      take: Math.max(1, Math.min(100, limit)),
      where: { status: "Published" as any }
    });

    const transformed = games.map((game: any) => ({
      categories: (game.categories || []).map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug:
          (cat.slug as string) || cat.name.toLowerCase().replace(/\s+/g, "-")
      })),
      createdAt: game.createdAt?.toISOString?.() || new Date().toISOString(),
      description: game.description,
      entryFilePath: game.entryFilePath ?? "index.html",
      gameFileUrl: toAbsoluteUrl(origin, game.packageUrl),
      height: game.height,
      iconUrl: toAbsoluteUrl(origin, game.iconUrl),
      id: game.id,
      instructions: game.instructions,
      slug: game.slug,
      source: "Self",
      status: game.status,
      tags: Array.isArray(game.GameTag)
        ? game.GameTag.map((t: any) => t.name)
        : [],
      thumb1Url: toAbsoluteUrl(
        origin,
        game.coverImageUrl || game.GameScreenshot?.[0]?.imageUrl
      ),
      thumb2Url: toAbsoluteUrl(
        origin,
        game.iconUrl || game.coverImageUrl || game.GameScreenshot?.[1]?.imageUrl
      ),
      title: game.title,
      updatedAt: game.updatedAt?.toISOString?.() || new Date().toISOString(),
      width: game.width
    }));

    return c.json({ games: transformed });
  } catch (error) {
    console.error("Popular games error:", error);
    return c.json({ error: "Failed to fetch popular games" }, 500);
  }
};
