import type { Context } from "hono";
import prisma from "../../prisma/client";
import cacheService from "../../services/CacheService";

export const getCategories = async (c: Context) => {
  try {
    const cacheKey = "categories:all";

    // Try to get from cache first
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) {
      return c.json(cachedResult);
    }

    const categories = await prisma.gameCategory.findMany({
      include: {
        _count: {
          select: {
            games: true
          }
        }
      }
    });

    const transformedCategories = categories.map((category) => ({
      _count: {
        games:
          typeof category._count?.games === "number" ? category._count.games : 0
      },
      description: category.description || `${category.name} games`,
      icon: category.icon || "🎮",
      id: category.id,
      name: category.name,
      slug: category.slug || category.name.toLowerCase().replace(/\s+/g, "-")
    }));

    const result = { categories: transformedCategories };

    // Cache the result for 10 minutes (categories change less frequently)
    await cacheService.set(cacheKey, result, {
      tags: ["categories"],
      ttl: 600 // 10 minutes
    });

    return c.json(result);
  } catch (error) {
    console.log("Database error, using fallback categories:", error);

    // Fallback categories
    const fallbackCategories = [
      {
        _count: { games: 0 },
        description: "Free to play games - available to all users",
        icon: "🎮",
        id: "free-to-play",
        name: "Free to Play Games",
        slug: "free-to-play-games"
      },
      {
        _count: { games: 0 },
        description: "Play to earn games - requires premium subscription",
        icon: "💰",
        id: "play-to-earn",
        name: "Play to Earn Games",
        slug: "play-to-earn-games"
      },
      {
        _count: { games: 0 },
        description: "Action games",
        icon: "⚡",
        id: "fallback-1",
        name: "Action",
        slug: "action"
      },
      {
        _count: { games: 0 },
        description: "Puzzle games",
        icon: "🧩",
        id: "fallback-2",
        name: "Puzzle",
        slug: "puzzle"
      },
      {
        _count: { games: 0 },
        description: "Racing games",
        icon: "🏎️",
        id: "fallback-3",
        name: "Racing",
        slug: "racing"
      },
      {
        _count: { games: 0 },
        description: "Strategy games",
        icon: "🎯",
        id: "fallback-4",
        name: "Strategy",
        slug: "strategy"
      },
      {
        _count: { games: 0 },
        description: "Arcade games",
        icon: "🎮",
        id: "fallback-5",
        name: "Arcade",
        slug: "arcade"
      }
    ];

    return c.json({ categories: fallbackCategories });
  }
};
