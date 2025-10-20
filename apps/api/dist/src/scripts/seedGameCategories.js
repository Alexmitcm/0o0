"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = __importDefault(require("../prisma/client"));
const logger_1 = __importDefault(require("../utils/logger"));
async function seedGameCategories() {
    try {
        logger_1.default.info("Starting to seed game categories...");
        // Create Play to Earn Games category
        const playToEarnCategory = await client_1.default.gameCategory.upsert({
            create: {
                color: "#f59e0b",
                description: "Play to earn games - requires premium subscription",
                icon: "💰",
                id: "play-to-earn",
                name: "Play to Earn Games",
                slug: "play-to-earn-games"
            },
            update: {},
            where: { slug: "play-to-earn-games" }
        });
        // Create Free to Play Games category
        const freeToPlayCategory = await client_1.default.gameCategory.upsert({
            create: {
                color: "#10b981",
                description: "Free to play games - available to all users",
                icon: "🎮",
                id: "free-to-play",
                name: "Free to Play Games",
                slug: "free-to-play-games"
            },
            update: {},
            where: { slug: "free-to-play-games" }
        });
        logger_1.default.info("Game categories seeded successfully!");
        logger_1.default.info(`Created categories: ${playToEarnCategory.name}, ${freeToPlayCategory.name}`);
        return {
            categories: [playToEarnCategory, freeToPlayCategory],
            success: true
        };
    }
    catch (error) {
        logger_1.default.error("Error seeding game categories:", error);
        throw error;
    }
}
// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    seedGameCategories()
        .then(() => {
        logger_1.default.info("Category seeding completed successfully!");
        process.exit(0);
    })
        .catch((error) => {
        logger_1.default.error("Category seeding failed:", error);
        process.exit(1);
    });
}
exports.default = seedGameCategories;
