import type { Context } from "hono";
import prisma from "../../prisma/client";

export const getSimilarGames = async (c: Context) => {
  try {
    const slug = c.req.param("slug");
    const game = await prisma.game.findUnique({
      include: { categories: true, GameTag: true },
      where: { slug }
    });
    if (!game) return c.json({ games: [] });

    // Match by shared tags and categories, exclude self
    const tagNames = (game as any).GameTag?.map((t: any) => t.name) || [];
    const categoryNames =
      (game as any).categories?.map((c: any) => c.name) || [];

    const games = await prisma.game.findMany({
      include: { categories: true, GameTag: true },
      take: 12,
      where: {
        OR: [
          tagNames.length
            ? {
                GameTag: {
                  some: { name: { in: tagNames } }
                }
              }
            : undefined,
          categoryNames.length
            ? {
                categories: {
                  some: { name: { in: categoryNames } }
                }
              }
            : undefined
        ].filter(Boolean) as any,
        slug: { not: slug },
        status: "Published"
      }
    });

    const origin = new URL(c.req.url).origin;
    const toAbsolute = (u?: string) => {
      if (!u) return u;
      if (/^https?:\/\//i.test(u)) return u;
      return `${origin}${u}`;
    };

    const normalized = games.map((g: any) => ({
      categories: (g as any).categories?.map((c: any) => ({
        description: "",
        icon: "🎮",
        id: c.id,
        name: c.name,
        slug: c.name.toLowerCase().replace(/\s+/g, "-")
      })),
      description: g.description,
      entryFilePath: g.entryFilePath ?? "index.html",
      gameFileUrl: g.packageUrl,
      height: g.height,
      id: g.id,
      isFeatured: false,
      likeCount: 0,
      playCount: 0,
      rating: 0,
      ratingCount: 0,
      slug: g.slug,
      source: "Self",
      status: g.status,
      tags: (g as any).GameTag?.map((t: any) => t.name) || [],
      thumb1Url: toAbsolute(g.coverImageUrl || g.iconUrl),
      thumb2Url: toAbsolute(g.iconUrl || g.coverImageUrl),
      title: g.title,
      width: g.width
    }));

    return c.json({ games: normalized });
  } catch (_error) {
    return c.json({ games: [] });
  }
};
