"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.playGame = void 0;
const zod_1 = require("zod");
const client_1 = __importDefault(require("../../prisma/client"));
const playGameSchema = zod_1.z.object({
    completed: zod_1.z.boolean().default(false),
    playDuration: zod_1.z.number().optional(),
    score: zod_1.z.number().optional()
});
const playGame = async (c) => {
    try {
        const slug = c.req.param("slug");
        const body = await c.req.json();
        const validatedData = playGameSchema.parse(body);
        // Get the game
        const game = await client_1.default.game.findUnique({
            where: { slug }
        });
        // Accept published games for play tracking
        if (!game || game.status !== "Published") {
            return c.json({ error: "Game not found or not available" }, 404);
        }
        // Get user (optional - anonymous plays are allowed)
        const user = c.get("user");
        const playerAddress = user?.walletAddress || "anonymous";
        // Record the play
        const gamePlay = await client_1.default.gamePlay.create({
            data: {
                completed: validatedData.completed,
                gameId: game.id,
                playDuration: validatedData.playDuration,
                playerAddress,
                score: validatedData.score
            }
        });
        // Note: playCount update removed due to Prisma schema issues
        // Will be re-enabled once schema is properly synced
        return c.json({ gamePlay, success: true });
    }
    catch (error) {
        console.error("Play game error:", error);
        if (error instanceof zod_1.z.ZodError) {
            return c.json({ details: error.errors, error: "Validation error" }, 400);
        }
        return c.json({ error: "Internal server error" }, 500);
    }
};
exports.playGame = playGame;
