"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = __importDefault(require("../prisma/client"));
const logger_1 = __importDefault(require("../utils/logger"));
async function seedSampleGames() {
    try {
        logger_1.default.info("Starting to seed sample games...");
        // Create categories first
        const actionCategory = await client_1.default.gameCategory.upsert({
            create: {
                color: "#ff6b6b",
                description: "Action games",
                icon: "🎮",
                id: "fallback-cat-1",
                name: "Action",
                slug: "action"
            },
            update: {},
            where: { slug: "action" }
        });
        const puzzleCategory = await client_1.default.gameCategory.upsert({
            create: {
                color: "#4ecdc4",
                description: "Puzzle games",
                icon: "🧩",
                id: "fallback-cat-2",
                name: "Puzzle",
                slug: "puzzle"
            },
            update: {},
            where: { slug: "puzzle" }
        });
        // Create sample games
        const game1 = await client_1.default.game.upsert({
            create: {
                categories: {
                    connect: { id: actionCategory.id }
                },
                coverImageUrl: "https://picsum.photos/512/384?random=1",
                description: "A fun sample game to test the Game Hub",
                developerName: "Game Developer",
                dislikeCount: 0,
                entryFilePath: "index.html",
                height: 720,
                iconUrl: "https://picsum.photos/512/512?random=1",
                id: "fallback-1",
                instructions: "Use arrow keys to move",
                likeCount: 0,
                orientation: "Landscape",
                packageUrl: "https://example.com/game1.html",
                playCount: 0,
                rating: 0,
                ratingCount: 0,
                slug: "fallback-1",
                status: "Published",
                title: "Sample Game 1",
                version: "1.0.0",
                width: 1280
            },
            update: {},
            where: { slug: "fallback-1" }
        });
        const game2 = await client_1.default.game.upsert({
            create: {
                categories: {
                    connect: { id: puzzleCategory.id }
                },
                coverImageUrl: "https://picsum.photos/512/384?random=2",
                description: "Another exciting sample game",
                developerName: "Puzzle Master",
                dislikeCount: 0,
                entryFilePath: "index.html",
                height: 720,
                iconUrl: "https://picsum.photos/512/512?random=2",
                id: "fallback-2",
                instructions: "Click to play",
                likeCount: 0,
                orientation: "Landscape",
                packageUrl: "https://example.com/game2.html",
                playCount: 0,
                rating: 0,
                ratingCount: 0,
                slug: "fallback-2",
                status: "Published",
                title: "Sample Game 2",
                version: "1.0.0",
                width: 1280
            },
            update: {},
            where: { slug: "fallback-2" }
        });
        logger_1.default.info("Sample games seeded successfully!");
        logger_1.default.info(`Created games: ${game1.title}, ${game2.title}`);
        return { games: [game1, game2], success: true };
    }
    catch (error) {
        logger_1.default.error("Error seeding sample games:", error);
        throw error;
    }
}
// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    seedSampleGames()
        .then(() => {
        logger_1.default.info("Seeding completed successfully!");
        process.exit(0);
    })
        .catch((error) => {
        logger_1.default.error("Seeding failed:", error);
        process.exit(1);
    });
}
exports.default = seedSampleGames;
