"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importGames = void 0;
const zod_1 = require("zod");
const client_1 = __importDefault(require("../../prisma/client"));
const gameImportSchema = zod_1.z.object({
    category: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    gameUrl: zod_1.z.string().url(),
    height: zod_1.z.number().default(720),
    instructions: zod_1.z.string().optional(),
    slug: zod_1.z.string(),
    source: zod_1.z.string().default("JSON"),
    thumb1Url: zod_1.z.string().url(),
    thumb2Url: zod_1.z.string().url(),
    title: zod_1.z.string(),
    width: zod_1.z.number().default(1280)
});
const importGamesSchema = zod_1.z.object({
    games: zod_1.z.array(gameImportSchema)
});
const importGames = async (c) => {
    try {
        const user = c.get("user");
        if (!user) {
            return c.json({ error: "Unauthorized" }, 401);
        }
        const body = await c.req.json();
        const validatedData = importGamesSchema.parse(body);
        const results = [];
        let successCount = 0;
        let errorCount = 0;
        for (const gameData of validatedData.games) {
            try {
                // Check if game with slug already exists
                const existingGame = await client_1.default.game.findUnique({
                    where: { slug: gameData.slug }
                });
                if (existingGame) {
                    results.push({
                        error: "Game with this slug already exists",
                        slug: gameData.slug,
                        status: "exists",
                        title: gameData.title
                    });
                    errorCount++;
                    continue;
                }
                // Get or create category
                let category = await client_1.default.gameCategory.findUnique({
                    where: { name: gameData.category }
                });
                if (!category) {
                    category = await client_1.default.gameCategory.create({
                        data: {
                            name: gameData.category,
                            slug: gameData.category.toLowerCase().replace(/\s+/g, "-")
                        }
                    });
                }
                // Create the game
                const game = await client_1.default.game.create({
                    data: {
                        categories: {
                            connect: [{ id: category.id }]
                        },
                        description: gameData.description,
                        externalUrl: gameData.gameUrl,
                        gameFileUrl: gameData.gameUrl,
                        height: gameData.height,
                        instructions: gameData.instructions,
                        slug: gameData.slug,
                        source: "JSON",
                        thumb1Url: gameData.thumb1Url,
                        thumb2Url: gameData.thumb2Url,
                        title: gameData.title,
                        uploadedBy: user.walletAddress,
                        width: gameData.width
                    }
                });
                results.push({
                    gameId: game.id,
                    slug: gameData.slug,
                    status: "success",
                    title: gameData.title
                });
                successCount++;
            }
            catch (error) {
                results.push({
                    error: error instanceof Error ? error.message : "Unknown error",
                    slug: gameData.slug,
                    status: "error",
                    title: gameData.title
                });
                errorCount++;
            }
        }
        return c.json({
            results,
            success: true,
            summary: {
                errors: errorCount,
                success: successCount,
                total: validatedData.games.length
            }
        });
    }
    catch (error) {
        console.error("Import games error:", error);
        if (error instanceof zod_1.z.ZodError) {
            return c.json({ details: error.errors, error: "Validation error" }, 400);
        }
        return c.json({ error: "Internal server error" }, 500);
    }
};
exports.importGames = importGames;
