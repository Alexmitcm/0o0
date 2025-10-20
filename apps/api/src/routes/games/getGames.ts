import type { Context } from "hono";
import { z } from "zod";
import prisma from "../../prisma/client";
import cacheService from "../../services/CacheService";

// Input sanitization function
const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>'"]/g, "") // Remove potentially dangerous characters
    .replace(/script/gi, "") // Remove script tags
    .replace(/javascript/gi, "") // Remove javascript
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim();
};

const getGamesSchema = z.object({
  category: z.string().max(100).optional(),
  featured: z.string().max(10).optional(),
  gameType: z.enum(["FreeToPlay", "PlayToEarn"]).optional(),
  limit: z
    .string()
    .transform((val) => {
      const num = Number.parseInt(val, 10);
      if (Number.isNaN(num) || num < 1 || num > 100) {
        throw new Error("Limit must be between 1 and 100");
      }
      return num;
    })
    .optional(),
  page: z
    .string()
    .transform((val) => {
      const num = Number.parseInt(val, 10);
      if (Number.isNaN(num) || num < 1) {
        throw new Error("Page must be >= 1");
      }
      return num;
    })
    .optional(),
  search: z.string().max(200).optional(),
  sortBy: z.enum(["newest", "popular", "rating", "plays"]).optional(),
  source: z.string().max(50).optional(),
  tag: z.string().max(50).optional()
});

export const getGames = async (c: Context) => {
  try {
    const origin = new URL(c.req.url).origin;
    const toAbsolute = (u?: string) => {
      if (!u) return u;
      if (/^https?:\/\//i.test(u)) return u;
      return `${origin}${u}`;
    };
    const query = c.req.query();

    // Parse and validate query parameters
    let parsedQuery: z.infer<typeof getGamesSchema>;
    try {
      parsedQuery = getGamesSchema.parse(query);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            details: error.errors.map((err) => ({
              field: err.path.join("."),
              message: err.message
            })),
            error: "Invalid query parameters"
          },
          400
        );
      }
      throw error;
    }

    const { category, search, source, sortBy, page, limit, tag, gameType } =
      parsedQuery;

    const pageNum = page || 1;
    const limitNum = limit || 20;
    const skip = (pageNum - 1) * limitNum;

    // Get user premium status
    const isPremium = c.get("isPremium") as boolean | undefined;

    // Create cache key based on query parameters
    const cacheKey = `games:${JSON.stringify({
      category,
      gameType,
      isPremium,
      limit: limitNum,
      page: pageNum,
      search,
      sortBy,
      source,
      tag
    })}`;

    // Try to get from cache first
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) {
      return c.json(cachedResult);
    }

    // Build where clause
    const where: any = {
      status: "Published"
    };

    // Filter by game type and premium status
    if (gameType) {
      where.gameType = gameType;
    } else {
      // If no specific game type requested, filter based on user premium status
      if (isPremium) {
        // Premium users can see both FreeToPlay and PlayToEarn games
        where.gameType = { in: ["FreeToPlay", "PlayToEarn"] };
      } else {
        // Non-premium users can only see FreeToPlay games
        where.gameType = "FreeToPlay";
      }
    }

    // Additional check: if user is not premium and trying to access PlayToEarn games
    if (gameType === "PlayToEarn" && !isPremium) {
      return c.json(
        {
          error: "Premium subscription required to access Play to Earn games",
          games: [],
          pagination: {
            hasNextPage: false,
            hasPrevPage: false,
            limit: limitNum,
            page: pageNum,
            total: 0,
            totalPages: 0
          }
        },
        403
      );
    }

    if (category) {
      where.categories = {
        some: {
          OR: [{ name: category }, { slug: category }]
        }
      };
    }

    if (tag) {
      where.GameTag = {
        some: {
          OR: [{ name: tag }, { slug: tag }]
        }
      } as any;
    }

    if (search) {
      const sanitizedSearch = sanitizeInput(search);
      where.OR = [
        { title: { contains: sanitizedSearch, mode: "insensitive" } },
        { description: { contains: sanitizedSearch, mode: "insensitive" } }
      ];
    }

    // Temporary source filter: only "Self" exists currently
    if (source) {
      const normalized = source.trim().toLowerCase();
      if (normalized !== "self") {
        where.id = "__no_match__"; // will produce zero results
      }
    }

    // Build order by clause
    let orderBy: any = { createdAt: "desc" };
    if (sortBy === "newest") {
      orderBy = { createdAt: "desc" };
    } else if (sortBy === "popular") {
      orderBy = { likeCount: "desc" }; // Use actual likeCount field
    } else if (sortBy === "rating") {
      orderBy = { rating: "desc" }; // Use actual rating field
    } else if (sortBy === "plays") {
      orderBy = { playCount: "desc" }; // Use actual playCount field
    }

    // Get games from database
    let games: any[] = [];
    let total = 0;

    try {
      [games, total] = await Promise.all([
        prisma.game.findMany({
          include: {
            categories: true,
            GameScreenshot: true,
            GameTag: true
          },
          orderBy,
          skip,
          take: limitNum,
          where
        }),
        prisma.game.count({ where })
      ]);
    } catch (dbError) {
      console.error("Database error, using fallback games:", dbError);
      console.error(
        "Database error details:",
        JSON.stringify(dbError, null, 2)
      );
    }

    // If no games in database, provide fallback
    if (games.length === 0) {
      games = [
        {
          categories: [
            {
              createdAt: new Date("2024-01-01"),
              id: "fallback-cat-1",
              name: "Action",
              updatedAt: new Date("2024-01-01")
            }
          ],
          coverImageUrl: "https://picsum.photos/512/384?random=1",
          createdAt: new Date("2024-01-01"),
          description: "A fun sample game to test the Game Hub",
          developerName: "Sample Developer",
          GameScreenshot: [],
          GameTag: [
            {
              createdAt: new Date("2024-01-01"),
              id: "fallback-tag-1",
              name: "action"
            }
          ],
          gameType: "FreeToPlay",
          height: 720,
          iconUrl: "https://picsum.photos/512/512?random=1",
          id: "fallback-1",
          instructions: "Use arrow keys to move",
          orientation: "Landscape",
          packageUrl: "https://example.com/game1.html",
          slug: "fallback-1",
          status: "Published",
          title: "Sample Game 1",
          updatedAt: new Date("2024-01-01"),
          version: "1.0.0",
          width: 1280
        },
        {
          categories: [
            {
              createdAt: new Date("2024-01-01"),
              id: "fallback-cat-2",
              name: "Puzzle",
              updatedAt: new Date("2024-01-01")
            }
          ],
          coverImageUrl: "https://picsum.photos/512/384?random=2",
          createdAt: new Date("2024-01-02"),
          description: "Another exciting sample game",
          developerName: "Puzzle Master",
          GameScreenshot: [],
          GameTag: [
            {
              createdAt: new Date("2024-01-01"),
              id: "fallback-tag-2",
              name: "puzzle"
            }
          ],
          gameType: "FreeToPlay",
          height: 720,
          iconUrl: "https://picsum.photos/512/512?random=2",
          id: "fallback-2",
          instructions: "Click to play",
          orientation: "Landscape",
          packageUrl: "https://example.com/game2.html",
          slug: "fallback-2",
          status: "Published",
          title: "Sample Game 2",
          updatedAt: new Date("2024-01-02"),
          version: "1.0.0",
          width: 1280
        }
      ];
      total = games.length;
    }

    // Transform games to match expected frontend format
    const transformedGames = games.map((game: any) => ({
      categories: Array.isArray(game.categories)
        ? game.categories.map((cat: any) => ({
            description: "",
            icon: "🎮",
            id: cat.id,
            name: cat.name,
            slug: cat.name.toLowerCase().replace(/\s+/g, "-")
          }))
        : [],
      createdAt: game.createdAt.toISOString(),
      description: game.description,
      dislikeCount: game.dislikeCount || 0, // Use actual database field
      entryFilePath: game.entryFilePath ?? "index.html",
      gameFileUrl: toAbsolute(game.packageUrl),
      gameType: game.gameType || "FreeToPlay", // Include game type
      height: game.height,
      id: game.id,
      instructions: game.instructions,
      isFeatured: game.status === "Featured", // Use actual status
      likeCount: game.likeCount || 0, // Use actual database field
      playCount: game.playCount || 0, // Use database playCount field
      rating: game.rating || 0, // Use actual database field
      ratingCount: game.ratingCount || 0, // Use actual database field
      slug: game.slug,
      source: "Self",
      status: game.status,
      tags: Array.isArray(game.GameTag)
        ? game.GameTag.map((tag: any) => tag.name)
        : [],
      // Prefer real cover; if missing, try screenshots; finally fallback icon
      thumb1Url: toAbsolute(
        game.coverImageUrl || game.iconUrl || game.GameScreenshot?.[0]?.imageUrl
      ),
      thumb2Url: toAbsolute(
        game.iconUrl || game.coverImageUrl || game.GameScreenshot?.[1]?.imageUrl
      ),
      title: game.title,
      updatedAt: game.updatedAt.toISOString(),
      user: {
        avatarUrl: "https://via.placeholder.com/40x40/4F46E5/FFFFFF?text=G",
        displayName: game.developerName || "Unknown Developer",
        username: game.developerName || "Unknown",
        walletAddress: "0x000..."
      },
      userLike: false,
      userRating: null,
      width: game.width
    }));

    const result = {
      games: transformedGames,
      pagination: {
        hasNextPage: pageNum * limitNum < total,
        hasPrevPage: pageNum > 1,
        limit: limitNum,
        page: pageNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };

    // Cache the result for 5 minutes
    await cacheService.set(cacheKey, result, {
      tags: ["games"],
      ttl: 300 // 5 minutes
    });

    return c.json(result);
  } catch (error) {
    console.error("Get games error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
};
