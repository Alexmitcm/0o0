"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.likeGame = void 0;
const authContext_1 = require("../../context/authContext");
const client_1 = __importDefault(require("../../prisma/client"));
const logger_1 = __importDefault(require("../../utils/logger"));
const likeGame = async (c) => {
    try {
        const gameSlug = c.req.param("slug");
        const isUnlike = c.req.path.includes("/unlike");
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
        // Check if user already liked the game
        const existingLike = await client_1.default.gameLike.findUnique({
            where: {
                gameId_userAddress: {
                    gameId: gameId,
                    userAddress: effectiveUserAddress
                }
            }
        });
        if (isUnlike) {
            // Remove like
            if (existingLike) {
                // Use transaction to ensure atomicity
                await client_1.default.$transaction(async (tx) => {
                    await tx.gameLike.delete({
                        where: {
                            gameId_userAddress: {
                                gameId,
                                userAddress: effectiveUserAddress
                            }
                        }
                    });
                    await tx.game.update({
                        data: {
                            likeCount: {
                                decrement: 1
                            }
                        },
                        where: { id: gameId }
                    });
                });
            }
            return c.json({
                liked: false,
                message: "Game unliked successfully",
                success: true
            });
        }
        // Add like
        if (existingLike) {
            // User has already liked the game, so unlike it
            await client_1.default.$transaction(async (tx) => {
                await tx.gameLike.delete({
                    where: {
                        gameId_userAddress: {
                            gameId,
                            userAddress: effectiveUserAddress
                        }
                    }
                });
                await tx.game.update({
                    data: {
                        likeCount: {
                            decrement: 1
                        }
                    },
                    where: { id: gameId }
                });
            });
            return c.json({
                liked: false,
                message: "Game unliked successfully",
                success: true
            });
        }
        // Use transaction to ensure atomicity
        await client_1.default.$transaction(async (tx) => {
            await tx.gameLike.create({
                data: {
                    gameId,
                    userAddress: effectiveUserAddress
                }
            });
            await tx.game.update({
                data: {
                    likeCount: {
                        increment: 1
                    }
                },
                where: { id: gameId }
            });
        });
        return c.json({
            liked: true,
            message: "Game liked successfully",
            success: true
        });
    }
    catch (error) {
        console.error("Like/Unlike error:", error);
        return c.json({ error: "Failed to process like/unlike request" }, 500);
    }
};
exports.likeGame = likeGame;
