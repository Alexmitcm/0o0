"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGameStatus = void 0;
const client_1 = __importDefault(require("../../prisma/client"));
const updateGameStatus = async (c) => {
    try {
        // Update the existing game to Published status
        const updatedGame = await client_1.default.game.update({
            data: {
                status: "Published"
            },
            include: {
                categories: true
            },
            where: {
                id: "cme32v2790000wjx4fzhjxhv3" // Your uploaded game ID
            }
        });
        return c.json({
            game: {
                categories: updatedGame.categories.map((cat) => cat.name),
                createdAt: updatedGame.createdAt,
                id: updatedGame.id,
                slug: updatedGame.slug,
                status: updatedGame.status,
                title: updatedGame.title
            },
            message: "Game status updated to Published",
            success: true
        });
    }
    catch (error) {
        console.error("Update game status error:", error);
        return c.json({
            error: error instanceof Error ? error.message : "Unknown error",
            success: false
        }, 500);
    }
};
exports.updateGameStatus = updateGameStatus;
