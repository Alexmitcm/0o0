"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkGameFavoriteStatus = exports.getUserFavorites = exports.removeGameFromFavorites = exports.addGameToFavorites = void 0;
const zod_1 = require("zod");
const client_1 = __importDefault(require("../../prisma/client"));
const favoriteGameSchema = zod_1.z.object({
    gameId: zod_1.z.string()
});
const addGameToFavorites = async (c) => {
    try {
        const body = await c.req.json();
        const { gameId } = favoriteGameSchema.parse(body);
        const userAddress = c.get("userAddress");
        if (!userAddress) {
            return c.json({ error: "Authentication required", success: false }, 401);
        }
        // Check if game exists
        const game = await client_1.default.game.findUnique({
            select: { id: true },
            where: { id: gameId }
        });
        if (!game) {
            return c.json({ error: "Game not found", success: false }, 404);
        }
        // Check if already favorited
        const existingFavorite = await client_1.default.gameFavorite.findUnique({
            where: {
                gameId_userAddress: {
                    gameId,
                    userAddress
                }
            }
        });
        if (existingFavorite) {
            return c.json({
                error: "Game already in favorites",
                success: false
            }, 400);
        }
        // Add to favorites
        const favorite = await client_1.default.gameFavorite.create({
            data: {
                gameId,
                userAddress
            },
            include: {
                game: {
                    select: {
                        id: true,
                        slug: true,
                        thumb1Url: true,
                        title: true
                    }
                }
            }
        });
        return c.json({
            favorite,
            message: "Game added to favorites",
            success: true
        });
    }
    catch (error) {
        console.error("Error adding game to favorites:", error);
        return c.json({
            error: "Failed to add game to favorites",
            success: false
        }, 500);
    }
};
exports.addGameToFavorites = addGameToFavorites;
const removeGameFromFavorites = async (c) => {
    try {
        const { gameId } = c.req.param();
        const userAddress = c.get("userAddress");
        if (!userAddress) {
            return c.json({ error: "Authentication required", success: false }, 401);
        }
        const favorite = await client_1.default.gameFavorite.findUnique({
            where: {
                gameId_userAddress: {
                    gameId,
                    userAddress
                }
            }
        });
        if (!favorite) {
            return c.json({
                error: "Game not in favorites",
                success: false
            }, 404);
        }
        await client_1.default.gameFavorite.delete({
            where: { id: favorite.id }
        });
        return c.json({
            message: "Game removed from favorites",
            success: true
        });
    }
    catch (error) {
        console.error("Error removing game from favorites:", error);
        return c.json({
            error: "Failed to remove game from favorites",
            success: false
        }, 500);
    }
};
exports.removeGameFromFavorites = removeGameFromFavorites;
const getUserFavorites = async (c) => {
    try {
        const userAddress = c.get("userAddress");
        if (!userAddress) {
            return c.json({ error: "Authentication required", success: false }, 401);
        }
        const query = c.req.query();
        const page = Number.parseInt(query.page || "1", 10);
        const limit = Number.parseInt(query.limit || "20", 10);
        const skip = (page - 1) * limit;
        const [favorites, total] = await Promise.all([
            client_1.default.gameFavorite.findMany({
                include: {
                    game: {
                        include: {
                            _count: {
                                select: {
                                    gameLikes: true,
                                    gamePlays: true,
                                    gameRatings: true
                                }
                            },
                            categories: true
                        }
                    }
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                where: { userAddress }
            }),
            client_1.default.gameFavorite.count({
                where: { userAddress }
            })
        ]);
        return c.json({
            favorites: favorites.map((fav) => ({
                favoritedAt: fav.createdAt,
                game: {
                    ...fav.game,
                    likeCount: fav.game._count.gameLikes,
                    playCount: fav.game._count.gamePlays,
                    ratingCount: fav.game._count.gameRatings
                },
                id: fav.id
            })),
            pagination: {
                hasNextPage: skip + limit < total,
                hasPrevPage: page > 1,
                limit,
                page,
                total,
                totalPages: Math.ceil(total / limit)
            },
            success: true
        });
    }
    catch (error) {
        console.error("Error fetching user favorites:", error);
        return c.json({
            error: "Failed to fetch favorites",
            success: false
        }, 500);
    }
};
exports.getUserFavorites = getUserFavorites;
const checkGameFavoriteStatus = async (c) => {
    try {
        const { gameId } = c.req.param();
        const userAddress = c.get("userAddress");
        if (!userAddress) {
            return c.json({ isFavorited: false, success: true });
        }
        const favorite = await client_1.default.gameFavorite.findUnique({
            where: {
                gameId_userAddress: {
                    gameId,
                    userAddress
                }
            }
        });
        return c.json({
            isFavorited: !!favorite,
            success: true
        });
    }
    catch (error) {
        console.error("Error checking favorite status:", error);
        return c.json({
            error: "Failed to check favorite status",
            success: false
        }, 500);
    }
};
exports.checkGameFavoriteStatus = checkGameFavoriteStatus;
