import logger from "@hey/helpers/logger";
import { zValidator } from "@hono/zod-validator";
import { PrismaClient } from "@prisma/client";
import { Hono } from "hono";
import { z } from "zod";
import authMiddleware from "../middlewares/authMiddleware";
import { errorHandler } from "../middlewares/errorHandler";
import rateLimiter from "../middlewares/rateLimiter";

const prisma = new PrismaClient();
const adminGamesRouter = new Hono();

// Validation schemas
const createGameSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  gameFileUrl: z.string().url(),
  thumb1Url: z.string().url().optional(),
  thumb2Url: z.string().url().optional(),
  category: z.string().min(1),
  tags: z.array(z.string()).optional(),
  instructions: z.string().optional(),
  developer: z.string().optional(),
  version: z.string().optional(),
  website: z.string().url().optional(),
  width: z.number().int().min(1).default(1280),
  height: z.number().int().min(1).default(720),
  isFeatured: z.boolean().default(false),
  status: z.enum(["Draft", "Pending", "Published", "Rejected"]).default("Published")
});

const updateGameSchema = createGameSchema.partial();

const gameActionSchema = z.object({
  action: z.enum(["publish", "unpublish", "feature", "unfeature", "delete"]),
  gameId: z.string().min(1)
});

// GET /admin/games - Get all games for admin management
adminGamesRouter.get(
  "/",
  authMiddleware,
  rateLimiter({ requests: 30 }),
  async (c) => {
    try {
      const page = Number.parseInt(c.req.query("page") || "1");
      const limit = Number.parseInt(c.req.query("limit") || "50");
      const search = c.req.query("search");
      const status = c.req.query("status");
      const category = c.req.query("category");
      const offset = (page - 1) * limit;

      const where: any = {};
      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { developer: { contains: search, mode: "insensitive" } }
        ];
      }
      if (status) {
        where.status = status;
      }
      if (category) {
        where.categories = {
          some: {
            slug: category
          }
        };
      }

      const [games, total] = await Promise.all([
        prisma.game.findMany({
          include: {
            categories: true,
            GameScreenshot: true,
            GameTag: true,
            _count: {
              select: {
                gameLikes: true,
                gameRatings: true,
                gameFavorites: true,
                gameReports: true
              }
            }
          },
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: limit,
          where
        }),
        prisma.game.count({ where })
      ]);

      return c.json({
        games: games.map((game) => ({
          id: game.id,
          title: game.title,
          description: game.description,
          category: game.categories[0]?.name || "Uncategorized",
          thumbnail: game.thumb1Url,
          gameUrl: game.gameFileUrl,
          isActive: game.status === "Published",
          playCount: game.playCount,
          rating: game.rating,
          likeCount: game._count.gameLikes,
          ratingCount: game._count.gameRatings,
          favoriteCount: game._count.gameFavorites,
          reportCount: game._count.gameReports,
          createdAt: game.createdAt,
          updatedAt: game.updatedAt,
          status: game.status,
          isFeatured: game.isFeatured,
          developer: game.developer,
          version: game.version,
          website: game.website,
          width: game.width,
          height: game.height,
          instructions: game.instructions,
          tags: game.GameTag.map(tag => tag.name),
          screenshots: game.GameScreenshot.map(screenshot => screenshot.url)
        })),
        pagination: {
          limit,
          page,
          total,
          totalPages: Math.ceil(total / limit)
        },
        success: true
      });
    } catch (error) {
      logger.error("Error getting admin games:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// GET /admin/games/stats - Get game statistics
adminGamesRouter.get(
  "/stats",
  authMiddleware,
  rateLimiter({ requests: 30 }),
  async (c) => {
    try {
      const [
        totalGames,
        publishedGames,
        pendingGames,
        draftGames,
        rejectedGames,
        featuredGames,
        totalPlays,
        totalLikes,
        totalRatings,
        categoryDistribution,
        recentGames,
        topGames
      ] = await Promise.all([
        prisma.game.count(),
        prisma.game.count({ where: { status: "Published" } }),
        prisma.game.count({ where: { status: "Pending" } }),
        prisma.game.count({ where: { status: "Draft" } }),
        prisma.game.count({ where: { status: "Rejected" } }),
        prisma.game.count({ where: { isFeatured: true } }),
        prisma.game.aggregate({
          _sum: { playCount: true }
        }),
        prisma.gameLike.count(),
        prisma.gameRating.count(),
        prisma.game.findMany({
          include: {
            categories: true
          },
          select: {
            categories: {
              select: {
                name: true
              }
            }
          }
        }),
        prisma.game.findMany({
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            developer: true
          },
          take: 10
        }),
        prisma.game.findMany({
          orderBy: { playCount: "desc" },
          select: {
            id: true,
            title: true,
            playCount: true,
            rating: true,
            status: true,
            developer: true
          },
          take: 10
        })
      ]);

      // Calculate category distribution
      const categoryStats: Record<string, number> = {};
      categoryDistribution.forEach(game => {
        game.categories.forEach(category => {
          categoryStats[category.name] = (categoryStats[category.name] || 0) + 1;
        });
      });

      return c.json({
        stats: {
          totalGames,
          publishedGames,
          pendingGames,
          draftGames,
          rejectedGames,
          featuredGames,
          totalPlays: totalPlays._sum.playCount || 0,
          totalLikes,
          totalRatings,
          averageRating: totalRatings > 0 ? 
            (await prisma.gameRating.aggregate({
              _avg: { rating: true }
            }))._avg.rating || 0 : 0,
          categoryDistribution: categoryStats,
          recentGames,
          topGames
        },
        success: true
      });
    } catch (error) {
      logger.error("Error getting game stats:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// POST /admin/games - Create new game
adminGamesRouter.post(
  "/",
  authMiddleware,
  rateLimiter({ requests: 10 }),
  zValidator("json", createGameSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");
      const { walletAddress } = c.get("authContext") || {};

      // Generate slug from title
      const slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      // Check if slug already exists
      const existingGame = await prisma.game.findUnique({
        where: { slug }
      });

      if (existingGame) {
        return c.json({ error: "Game with this title already exists" }, 400);
      }

      // Create game
      const game = await prisma.game.create({
        data: {
          ...data,
          slug,
          developer: data.developer || "Unknown",
          version: data.version || "1.0.0",
          playCount: 0,
          rating: 0,
          ratingCount: 0,
          likeCount: 0,
          developerWallet: walletAddress || "0x0000000000000000000000000000000000000000"
        }
      });

      // Create category if it doesn't exist
      if (data.category) {
        await prisma.category.upsert({
          create: {
            name: data.category,
            slug: data.category.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            description: `Games in ${data.category} category`,
            icon: "🎮"
          },
          update: {},
          where: { slug: data.category.toLowerCase().replace(/[^a-z0-9]+/g, "-") }
        });

        // Link game to category
        await prisma.gameCategory.create({
          data: {
            gameId: game.id,
            categoryId: (await prisma.category.findUnique({
              where: { slug: data.category.toLowerCase().replace(/[^a-z0-9]+/g, "-") }
            }))?.id || ""
          }
        });
      }

      // Create tags if provided
      if (data.tags && data.tags.length > 0) {
        for (const tagName of data.tags) {
          await prisma.tag.upsert({
            create: {
              name: tagName,
              slug: tagName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
              description: `Tag: ${tagName}`
            },
            update: {},
            where: { slug: tagName.toLowerCase().replace(/[^a-z0-9]+/g, "-") }
          });

          await prisma.gameTag.create({
            data: {
              gameId: game.id,
              tagId: (await prisma.tag.findUnique({
                where: { slug: tagName.toLowerCase().replace(/[^a-z0-9]+/g, "-") }
              }))?.id || ""
            }
          });
        }
      }

      return c.json({
        game: {
          id: game.id,
          title: game.title,
          description: game.description,
          slug: game.slug,
          status: game.status,
          isFeatured: game.isFeatured,
          createdAt: game.createdAt
        },
        message: "Game created successfully",
        success: true
      }, 201);
    } catch (error) {
      logger.error("Error creating game:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// PUT /admin/games/:id - Update game
adminGamesRouter.put(
  "/:id",
  authMiddleware,
  rateLimiter({ requests: 20 }),
  zValidator("param", z.object({ id: z.string() })),
  zValidator("json", updateGameSchema),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const updateData = c.req.valid("json");

      // Check if game exists
      const existingGame = await prisma.game.findUnique({
        where: { id }
      });

      if (!existingGame) {
        return c.json({ error: "Game not found" }, 404);
      }

      // Update game
      const game = await prisma.game.update({
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        where: { id }
      });

      return c.json({
        game: {
          id: game.id,
          title: game.title,
          description: game.description,
          status: game.status,
          isFeatured: game.isFeatured,
          updatedAt: game.updatedAt
        },
        message: "Game updated successfully",
        success: true
      });
    } catch (error) {
      logger.error("Error updating game:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// POST /admin/games/:id/action - Perform action on game
adminGamesRouter.post(
  "/:id/action",
  authMiddleware,
  rateLimiter({ requests: 20 }),
  zValidator("param", z.object({ id: z.string() })),
  zValidator("json", z.object({ action: z.enum(["publish", "unpublish", "feature", "unfeature", "delete"]) })),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const { action } = c.req.valid("json");

      const game = await prisma.game.findUnique({
        where: { id }
      });

      if (!game) {
        return c.json({ error: "Game not found" }, 404);
      }

      let updateData: any = {};
      let message = "";

      switch (action) {
        case "publish":
          updateData = { status: "Published" };
          message = "Game published successfully";
          break;
        case "unpublish":
          updateData = { status: "Draft" };
          message = "Game unpublished successfully";
          break;
        case "feature":
          updateData = { isFeatured: true };
          message = "Game featured successfully";
          break;
        case "unfeature":
          updateData = { isFeatured: false };
          message = "Game unfeatured successfully";
          break;
        case "delete":
          await prisma.game.delete({ where: { id } });
          return c.json({
            message: "Game deleted successfully",
            success: true
          });
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.game.update({
          data: updateData,
          where: { id }
        });
      }

      return c.json({
        message,
        success: true
      });
    } catch (error) {
      logger.error("Error performing game action:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// DELETE /admin/games/:id - Delete game
adminGamesRouter.delete(
  "/:id",
  authMiddleware,
  rateLimiter({ requests: 10 }),
  zValidator("param", z.object({ id: z.string() })),
  async (c) => {
    try {
      const { id } = c.req.valid("param");

      const game = await prisma.game.findUnique({
        where: { id }
      });

      if (!game) {
        return c.json({ error: "Game not found" }, 404);
      }

      await prisma.game.delete({
        where: { id }
      });

      return c.json({
        message: "Game deleted successfully",
        success: true
      });
    } catch (error) {
      logger.error("Error deleting game:", error);
      return errorHandler(error as Error, c);
    }
  }
);

export default adminGamesRouter;
