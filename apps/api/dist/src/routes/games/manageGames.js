"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGameStats = exports.deleteGame = exports.updateGame = exports.createGame = exports.getManagedGames = void 0;
const zod_1 = require("zod");
const client_1 = __importDefault(require("../../prisma/client"));
const gameValidation_1 = require("../../schemas/gameValidation");
const CacheService_1 = __importDefault(require("../../services/CacheService"));
const logger_1 = __importDefault(require("../../utils/logger"));
// Extended validation schema for game creation with additional fields
const createGameSchema = gameValidation_1.gameValidationSchema.extend({
    categoryIds: zod_1.z.array(zod_1.z.string()).optional(),
    screenshotUrls: zod_1.z.array(zod_1.z.string().url()).optional(),
    tagNames: zod_1.z.array(zod_1.z.string()).optional()
});
const updateGameSchema = createGameSchema.partial().extend({
    id: zod_1.z.string()
});
const gameListSchema = zod_1.z.object({
    category: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    page: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
    sortBy: zod_1.z.enum(["createdAt", "title", "status"]).optional(),
    sortOrder: zod_1.z.enum(["asc", "desc"]).optional(),
    status: zod_1.z.enum(["Draft", "Published", "All"]).optional()
});
// Get all games with filtering and pagination
const getManagedGames = async (c) => {
    try {
        const query = c.req.query();
        const { page, limit, status, category, search, sortBy, sortOrder } = gameListSchema.parse(query);
        const pageNum = page ? Number.parseInt(page, 10) : 1;
        const limitNum = limit ? Number.parseInt(limit, 10) : 20;
        const skip = (pageNum - 1) * limitNum;
        // Build where clause
        const where = {};
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
        const orderBy = {};
        if (sortBy) {
            orderBy[sortBy] = sortOrder || "desc";
        }
        else {
            orderBy.createdAt = "desc";
        }
        // Get games with related data
        const [games, total] = await Promise.all([
            client_1.default.game.findMany({
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
            client_1.default.game.count({ where })
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
    }
    catch (error) {
        logger_1.default.error("Error fetching managed games:", error);
        return c.json({
            error: "Failed to fetch games",
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined
        }, 500);
    }
};
exports.getManagedGames = getManagedGames;
// Create a new game
const createGame = async (c) => {
    try {
        const body = await c.req.json();
        const validatedData = createGameSchema.parse(body);
        // Check if game with slug already exists
        const existingGame = await client_1.default.game.findUnique({
            where: { slug: validatedData.slug }
        });
        if (existingGame) {
            return c.json({ error: "Game with this slug already exists" }, 400);
        }
        // Create game with categories and tags
        const game = await client_1.default.game.create({
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
        logger_1.default.info(`Game created: ${game.id} - ${game.title}`);
        // Invalidate games cache when a new game is created
        await CacheService_1.default.invalidateByTags(["games"]);
        return c.json({ game, message: "Game created successfully" }, 201);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return c.json({ details: error.errors, error: "Validation error" }, 400);
        }
        logger_1.default.error("Error creating game:", error);
        return c.json({ error: "Failed to create game" }, 500);
    }
};
exports.createGame = createGame;
// Update an existing game
const updateGame = async (c) => {
    try {
        const gameId = c.req.param("id");
        const body = await c.req.json();
        const validatedData = updateGameSchema.parse({ ...body, id: gameId });
        // Check if game exists
        const existingGame = await client_1.default.game.findUnique({
            where: { id: gameId }
        });
        if (!existingGame) {
            return c.json({ error: "Game not found" }, 404);
        }
        // Check if slug is being changed and if it conflicts
        if (validatedData.slug && validatedData.slug !== existingGame.slug) {
            const slugConflict = await client_1.default.game.findUnique({
                where: { slug: validatedData.slug }
            });
            if (slugConflict) {
                return c.json({ error: "Game with this slug already exists" }, 400);
            }
        }
        // Update game
        const updatedGame = await client_1.default.game.update({
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
        logger_1.default.info(`Game updated: ${updatedGame.id} - ${updatedGame.title}`);
        // Invalidate games cache when a game is updated
        await CacheService_1.default.invalidateByTags(["games"]);
        return c.json({ game: updatedGame, message: "Game updated successfully" });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return c.json({ details: error.errors, error: "Validation error" }, 400);
        }
        logger_1.default.error("Error updating game:", error);
        return c.json({ error: "Failed to update game" }, 500);
    }
};
exports.updateGame = updateGame;
// Delete a game
const deleteGame = async (c) => {
    try {
        const gameId = c.req.param("id");
        // Check if game exists
        const existingGame = await client_1.default.game.findUnique({
            where: { id: gameId }
        });
        if (!existingGame) {
            return c.json({ error: "Game not found" }, 404);
        }
        // Delete game (cascade will handle related records)
        await client_1.default.game.delete({
            where: { id: gameId }
        });
        logger_1.default.info(`Game deleted: ${gameId} - ${existingGame.title}`);
        // Invalidate games cache when a game is deleted
        await CacheService_1.default.invalidateByTags(["games"]);
        return c.json({ message: "Game deleted successfully" });
    }
    catch (error) {
        logger_1.default.error("Error deleting game:", error);
        return c.json({ error: "Failed to delete game" }, 500);
    }
};
exports.deleteGame = deleteGame;
// Get game statistics
const getGameStats = async (c) => {
    try {
        const [totalGames, publishedGames, draftGames, totalCategories, totalTags] = await Promise.all([
            client_1.default.game.count(),
            client_1.default.game.count({ where: { status: "Published" } }),
            client_1.default.game.count({ where: { status: "Draft" } }),
            client_1.default.gameCategory.count(),
            client_1.default.gameTag.count()
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
    }
    catch (error) {
        logger_1.default.error("Error fetching game stats:", error);
        return c.json({ error: "Failed to fetch game statistics" }, 500);
    }
};
exports.getGameStats = getGameStats;
