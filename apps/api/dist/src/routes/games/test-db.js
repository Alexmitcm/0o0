"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testDb = void 0;
const client_1 = __importDefault(require("../../prisma/client"));
const testDb = async (c) => {
    try {
        // Simple query to test database connection
        const gameCount = await client_1.default.game.count();
        // Try to get all games with minimal includes
        const games = await client_1.default.game.findMany({
            include: {
                categories: true
            },
            take: 5
        });
        return c.json({
            gameCount,
            games: games.map((game) => ({
                categories: game.categories.map((cat) => cat.name),
                createdAt: game.createdAt,
                id: game.id,
                slug: game.slug,
                status: game.status,
                title: game.title
            })),
            success: true
        });
    }
    catch (error) {
        console.error("Database test error:", error);
        return c.json({
            details: JSON.stringify(error, null, 2),
            error: error instanceof Error ? error.message : "Unknown error",
            success: false
        }, 500);
    }
};
exports.testDb = testDb;
