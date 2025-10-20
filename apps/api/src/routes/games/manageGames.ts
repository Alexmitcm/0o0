import type { Context } from "hono";
import { z } from "zod";
import prisma from "../../prisma/client";
import { gameValidationSchema } from "../../schemas/gameValidation";
import cacheService from "../../services/CacheService";
import logger from "../../utils/logger";

// Extended validation schema for game creation with additional fields
const createGameSchema = gameValidationSchema.extend({
  categoryIds: z.array(z.string()).optional(),
  screenshotUrls: z.array(z.string().url()).optional(),
  tagNames: z.array(z.string()).optional()
});

const updateGameSchema = createGameSchema.partial().extend({
  id: z.string()
});

const gameListSchema = z.object({
  category: z.string().optional(),
  limit: z.string().optional(),
  page: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "title", "status"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  status: z.enum(["Draft", "Published", "All"]).optional()
});

// Get all games with filtering and pagination
export const getManagedGames = async (c: Context) => {
  try {
    const query = c.req.query();
    const { page, limit, status, category, search, sortBy, sortOrder } =
      gameListSchema.parse(query);

    const pageNum = page ? Number.parseInt(page, 10) : 1;
    const limitNum = limit ? Number.parseInt(limit, 10) : 20;
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (status && status !== "All") {
      where.status = status;
    }

    if (category) {
      where.categories = {
        some: {
          name: category
        }
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { developerName: { contains: search, mode: "insensitive" } }
      ];
    }

    // Build order by clause
    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || "desc";
    } else {
      orderBy.createdAt = "desc";
    }

    // Get games with related data
    const [games, total] = await Promise.all([
      prisma.game.findMany({
        include: {
          categories: true,
          GameScreenshot: {
            orderBy: { order: "asc" }
          },
          GameTag: true
        },
        orderBy,
        skip,
        take: limitNum,
        where
      }),
      prisma.game.count({ where })
    ]);

    // Transform games to include gameType in response
    const transformedGames = games.map((game) => ({
      ...game,
      gameType: game.gameType || "FreeToPlay"
    }));

    return c.json({
      games: transformedGames,
      pagination: {
        limit: limitNum,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        total
      }
    });
  } catch (error) {
    logger.error("Error fetching managed games:", error);
    return c.json(
      {
        error: "Failed to fetch games",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      },
      500
    );
  }
};

// Create a new game
export const createGame = async (c: Context) => {
  try {
    const body = await c.req.json();
    const validatedData = createGameSchema.parse(body);

    // Check if game with slug already exists
    const existingGame = await prisma.game.findUnique({
      where: { slug: validatedData.slug }
    });

    if (existingGame) {
      return c.json({ error: "Game with this slug already exists" }, 400);
    }

    // Create game with categories and tags
    const game = await prisma.game.create({
      data: {
        categories: validatedData.categoryIds
          ? {
              connect: validatedData.categoryIds.map((id) => ({ id }))
            }
          : undefined,
        coverImageUrl: validatedData.coverImageUrl,
        description: validatedData.description,
        developerName: validatedData.developerName,
        entryFilePath: validatedData.entryFilePath,
        GameScreenshot: validatedData.screenshotUrls
          ? {
              create: validatedData.screenshotUrls.map((url, index) => ({
                imageUrl: url,
                order: index
              }))
            }
          : undefined,
        GameTag: validatedData.tagNames
          ? {
              connectOrCreate: validatedData.tagNames.map((name) => ({
                create: { name },
                where: { name }
              }))
            }
          : undefined,
        gameType: validatedData.gameType,
        height: validatedData.height,
        iconUrl: validatedData.iconUrl,
        instructions: validatedData.instructions,
        orientation: validatedData.orientation,
        packageUrl: validatedData.packageUrl,
        slug: validatedData.slug,
        status: validatedData.status,
        title: validatedData.title,
        version: validatedData.version,
        width: validatedData.width
      },
      include: {
        categories: true,
        GameScreenshot: true,
        GameTag: true
      }
    });

    logger.info(`Game created: ${game.id} - ${game.title}`);

    // Invalidate games cache when a new game is created
    await cacheService.invalidateByTags(["games"]);

    return c.json({ game, message: "Game created successfully" }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ details: error.errors, error: "Validation error" }, 400);
    }
    logger.error("Error creating game:", error);
    return c.json({ error: "Failed to create game" }, 500);
  }
};

// Update an existing game
export const updateGame = async (c: Context) => {
  try {
    const gameId = c.req.param("id");
    const body = await c.req.json();
    const validatedData = updateGameSchema.parse({ ...body, id: gameId });

    // Check if game exists
    const existingGame = await prisma.game.findUnique({
      where: { id: gameId }
    });

    if (!existingGame) {
      return c.json({ error: "Game not found" }, 404);
    }

    // Check if slug is being changed and if it conflicts
    if (validatedData.slug && validatedData.slug !== existingGame.slug) {
      const slugConflict = await prisma.game.findUnique({
        where: { slug: validatedData.slug }
      });

      if (slugConflict) {
        return c.json({ error: "Game with this slug already exists" }, 400);
      }
    }

    // Update game
    const updatedGame = await prisma.game.update({
      data: {
        categories: validatedData.categoryIds
          ? {
              set: validatedData.categoryIds.map((id) => ({ id }))
            }
          : undefined,
        coverImageUrl: validatedData.coverImageUrl,
        description: validatedData.description,
        developerName: validatedData.developerName,
        entryFilePath: validatedData.entryFilePath,
        GameTag: validatedData.tagNames
          ? {
              set: validatedData.tagNames.map((name) => ({ name }))
            }
          : undefined,
        gameType: validatedData.gameType,
        height: validatedData.height,
        iconUrl: validatedData.iconUrl,
        instructions: validatedData.instructions,
        orientation: validatedData.orientation,
        packageUrl: validatedData.packageUrl,
        slug: validatedData.slug,
        status: validatedData.status,
        title: validatedData.title,
        version: validatedData.version,
        width: validatedData.width
      },
      include: {
        categories: true,
        GameScreenshot: true,
        GameTag: true
      },
      where: { id: gameId }
    });

    logger.info(`Game updated: ${updatedGame.id} - ${updatedGame.title}`);

    // Invalidate games cache when a game is updated
    await cacheService.invalidateByTags(["games"]);

    return c.json({ game: updatedGame, message: "Game updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ details: error.errors, error: "Validation error" }, 400);
    }
    logger.error("Error updating game:", error);
    return c.json({ error: "Failed to update game" }, 500);
  }
};

// Delete a game
export const deleteGame = async (c: Context) => {
  try {
    const gameId = c.req.param("id");

    // Check if game exists
    const existingGame = await prisma.game.findUnique({
      where: { id: gameId }
    });

    if (!existingGame) {
      return c.json({ error: "Game not found" }, 404);
    }

    // Delete game (cascade will handle related records)
    await prisma.game.delete({
      where: { id: gameId }
    });

    logger.info(`Game deleted: ${gameId} - ${existingGame.title}`);

    // Invalidate games cache when a game is deleted
    await cacheService.invalidateByTags(["games"]);

    return c.json({ message: "Game deleted successfully" });
  } catch (error) {
    logger.error("Error deleting game:", error);
    return c.json({ error: "Failed to delete game" }, 500);
  }
};

// Get game statistics
export const getGameStats = async (c: Context) => {
  try {
    const [totalGames, publishedGames, draftGames, totalCategories, totalTags] =
      await Promise.all([
        prisma.game.count(),
        prisma.game.count({ where: { status: "Published" } }),
        prisma.game.count({ where: { status: "Draft" } }),
        prisma.gameCategory.count(),
        prisma.gameTag.count()
      ]);

    return c.json({
      stats: {
        draftGames,
        publishedGames,
        totalCategories,
        totalGames,
        totalTags
      }
    });
  } catch (error) {
    logger.error("Error fetching game stats:", error);
    return c.json({ error: "Failed to fetch game statistics" }, 500);
  }
};
