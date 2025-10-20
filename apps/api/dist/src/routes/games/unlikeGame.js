"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unlikeGame = void 0;
const authContext_1 = require("../../context/authContext");
const client_1 = __importDefault(require("../../prisma/client"));
const logger_1 = __importDefault(require("../../utils/logger"));
const unlikeGame = async (c) => {
    try {
        // Accept either numeric/id or slug from route params
        const paramId = c.req.param("id");
        const slugParam = c.req.param("slug");
        let gameId = paramId;
        // Get user address from authentication context
        const { walletAddress } = (0, authContext_1.getAuthContext)(c);
        const userAddress = walletAddress;
        // For demo purposes, allow guest interactions with a default user
        const effectiveUserAddress = userAddress || "0x0000000000000000000000000000000000000000";
        // First, resolve game by id or slug and verify existence
        if (!gameId && slugParam) {
            const bySlug = await client_1.default.game.findUnique({
                select: { id: true },
                where: { slug: slugParam }
            });
            gameId = bySlug?.id || "";
        }
        const gameExists = gameId
            ? await client_1.default.game.findUnique({
                select: { id: true },
                where: { id: gameId }
            })
            : null;
        if (!gameExists) {
            logger_1.default.error(`Game not found for ${paramId ? `id=${paramId}` : `slug=${slugParam}`}`);
            return c.json({
                error: "Game not found",
                success: false
            }, 404);
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
        // Check if user already liked the game
        const existingLike = await client_1.default.gameLike.findUnique({
            where: {
                gameId_userAddress: {
                    gameId,
                    userAddress: effectiveUserAddress
                }
            }
        });
        if (!existingLike) {
            return c.json({
                liked: false,
                message: "Game was not liked",
                success: true
            });
        }
        // Remove like
        await client_1.default.gameLike.delete({
            where: {
                gameId_userAddress: {
                    gameId,
                    userAddress: effectiveUserAddress
                }
            }
        });
        // Decrease like count
        await client_1.default.game.update({
            data: {
                likeCount: {
                    decrement: 1
                }
            },
            where: { id: gameId }
        });
        return c.json({
            liked: false,
            message: "Game unliked successfully",
            success: true
        });
    }
    catch (error) {
        logger_1.default.error("Unlike error:", error);
        return c.json({ error: "Failed to process unlike request" }, 500);
    }
};
exports.unlikeGame = unlikeGame;
