"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateGame = void 0;
const zod_1 = require("zod");
const authContext_1 = require("../../context/authContext");
const client_1 = __importDefault(require("../../prisma/client"));
const rateGameSchema = zod_1.z.object({
    rating: zod_1.z.number().min(1).max(5)
});
const rateGame = async (c) => {
    try {
        // Temporarily removed authentication check for functional refactoring phase
        // TODO: Re-enable authentication when security is implemented
        const gameSlug = c.req.param("slug");
        const body = await c.req.json();
        const validatedData = rateGameSchema.parse(body);
        // Get user address from authentication context
        const { walletAddress } = (0, authContext_1.getAuthContext)(c);
        const userAddress = walletAddress;
        // For demo purposes, allow guest interactions with a default user
        const effectiveUserAddress = userAddress || "0x0000000000000000000000000000000000000000";
        // Check if game exists
        const game = await client_1.default.game.findUnique({
            select: { id: true, title: true },
            where: { slug: gameSlug }
        });
        if (!game) {
            return c.json({ error: "Game not found" }, 404);
        }
        // Ensure user exists in User table (create if not exists)
        await client_1.default.user.upsert({
            create: {
                displayName: effectiveUserAddress === "0x0000000000000000000000000000000000000000"
                    ? "Guest User"
                    : "Unknown User",
                lastActiveAt: new Date(),
                registrationDate: new Date(),
                username: effectiveUserAddress === "0x0000000000000000000000000000000000000000"
                    ? "guest"
                    : `user_${effectiveUserAddress.slice(2, 8)}`,
                walletAddress: effectiveUserAddress
            },
            update: {},
            where: { walletAddress: effectiveUserAddress }
        });
        const gameId = game.id;
        // Check if user already rated the game
        const existingRating = await client_1.default.gameRating.findUnique({
            where: {
                gameId_userAddress: {
                    gameId,
                    userAddress: effectiveUserAddress
                }
            }
        });
        if (existingRating) {
            // Update existing rating - no need to change ratingCount
            await client_1.default.gameRating.update({
                data: {
                    rating: validatedData.rating,
                    updatedAt: new Date()
                },
                where: {
                    gameId_userAddress: {
                        gameId,
                        userAddress: effectiveUserAddress
                    }
                }
            });
        }
        else {
            // Create new rating
            await client_1.default.gameRating.create({
                data: {
                    gameId,
                    rating: validatedData.rating,
                    userAddress: effectiveUserAddress
                }
            });
            // Increase rating count
            await client_1.default.game.update({
                data: {
                    ratingCount: {
                        increment: 1
                    }
                },
                where: { id: gameId }
            });
        }
        // Recalculate average rating
        const allRatings = await client_1.default.gameRating.findMany({
            select: { rating: true },
            where: { gameId }
        });
        const totalRating = allRatings.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = allRatings.length > 0 ? totalRating / allRatings.length : 0;
        // Update game's average rating
        await client_1.default.game.update({
            data: {
                rating: averageRating
            },
            where: { id: gameId }
        });
        return c.json({
            message: "Rating updated successfully",
            rating: validatedData.rating,
            success: true
        });
    }
    catch (error) {
        console.error("Rate game error:", error);
        if (error instanceof zod_1.z.ZodError) {
            return c.json({ details: error.errors, error: "Validation error" }, 400);
        }
        return c.json({ error: "Internal server error" }, 500);
    }
};
exports.rateGame = rateGame;
