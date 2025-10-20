"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dislikeGame = void 0;
const authContext_1 = require("../../context/authContext");
const client_1 = __importDefault(require("../../prisma/client"));
const logger_1 = __importDefault(require("../../utils/logger"));
const dislikeGame = async (c) => {
    try {
        const gameSlug = c.req.param("slug");
        // Get user address from authentication context
        const { walletAddress } = (0, authContext_1.getAuthContext)(c);
        const userAddress = walletAddress;
        // For demo purposes, allow guest interactions with a default user
        const effectiveUserAddress = userAddress || "0x0000000000000000000000000000000000000000";
        // Find the game by slug to get the actual ID
        const game = await client_1.default.game.findUnique({
            select: { id: true, title: true },
            where: { slug: gameSlug }
        });
        if (!game) {
            logger_1.default.error(`Game with slug ${gameSlug} does not exist`);
            return c.json({
                error: "Game not found",
                success: false
            }, 404);
        }
        const gameId = game.id;
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
        // Check if user already disliked the game
        const existingDislike = await client_1.default.gameDislike.findUnique({
            where: {
                gameId_userAddress: {
                    gameId,
                    userAddress: effectiveUserAddress
                }
            }
        });
        if (existingDislike) {
            // Remove dislike
            await client_1.default.$transaction(async (tx) => {
                await tx.gameDislike.delete({
                    where: {
                        gameId_userAddress: {
                            gameId,
                            userAddress: effectiveUserAddress
                        }
                    }
                });
                await tx.game.update({
                    data: {
                        dislikeCount: {
                            decrement: 1
                        }
                    },
                    where: { id: gameId }
                });
            });
            return c.json({
                disliked: false,
                message: "Game undisliked successfully",
                success: true
            });
        }
        // Add dislike
        await client_1.default.$transaction(async (tx) => {
            await tx.gameDislike.create({
                data: {
                    gameId,
                    userAddress: effectiveUserAddress
                }
            });
            await tx.game.update({
                data: {
                    dislikeCount: {
                        increment: 1
                    }
                },
                where: { id: gameId }
            });
        });
        return c.json({
            disliked: true,
            message: "Game disliked successfully",
            success: true
        });
    }
    catch (error) {
        console.error("Dislike error:", error);
        return c.json({ error: "Failed to process dislike request" }, 500);
    }
};
exports.dislikeGame = dislikeGame;
