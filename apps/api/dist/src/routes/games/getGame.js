"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGame = void 0;
const authContext_1 = require("../../context/authContext");
const client_1 = __importDefault(require("../../prisma/client"));
const getGame = async (c) => {
    try {
        const slug = c.req.param("slug");
        // Get user address from authentication context
        const { walletAddress } = (0, authContext_1.getAuthContext)(c);
        const userAddress = walletAddress || null; // Use null if not authenticated
        const game = await client_1.default.game.findUnique({
            include: {
                categories: true,
                GameScreenshot: true,
                GameTag: true
            },
            where: { slug }
        });
        if (!game) {
            // Fallback: return a placeholder game for sample/fallback slugs or games from games-main directory
            if (slug.startsWith("sample-game-") ||
                slug.startsWith("fallback-") ||
                [
                    "air-command",
                    "backgammon",
                    "chess",
                    "downhills",
                    "goldminer",
                    "golkeeper",
                    "gunfight",
                    "liquidsort",
                    "stackbuilder",
                    "sudoku",
                    "tennis",
                    "top-jump",
                    "treasurehunt"
                ].includes(slug)) {
                const now = new Date();
                return c.json({
                    game: {
                        categories: [],
                        createdAt: now.toISOString(),
                        description: "Sample game placeholder",
                        gameFileUrl: slug === "air-command" ? "/games-main/AirCommand/index.html" : "",
                        height: 720,
                        id: slug.startsWith("fallback-") ? slug : `fallback-${slug}`,
                        instructions: "Use arrow keys to move",
                        isFeatured: false,
                        likeCount: 0,
                        playCount: 0,
                        rating: 0,
                        ratingCount: 0,
                        slug,
                        source: "Self",
                        status: "Published",
                        tags: [],
                        thumb1Url: "https://picsum.photos/512/384?random=10",
                        thumb2Url: "https://picsum.photos/512/512?random=10",
                        title: slug
                            .replace(/-/g, " ")
                            .replace(/^\w/, (c) => c.toUpperCase()),
                        updatedAt: now.toISOString(),
                        user: {
                            avatarUrl: "https://via.placeholder.com/40x40/4F46E5/FFFFFF?text=G",
                            displayName: "Unknown Developer",
                            username: "Unknown",
                            walletAddress: "0x000..."
                        },
                        userLike: false,
                        userRating: null,
                        width: 1280
                    }
                });
            }
            return c.json({ error: "Game not found" }, 404);
        }
        if (game.status !== "Published") {
            return c.json({ error: "Game is not available" }, 404);
        }
        // Get user's like, dislike, and rating status (only if user is authenticated)
        let userLike = null;
        let userDislike = null;
        let userRating = null;
        if (userAddress) {
            [userLike, userDislike, userRating] = await Promise.all([
                client_1.default.gameLike.findUnique({
                    where: {
                        gameId_userAddress: {
                            gameId: game.id,
                            userAddress
                        }
                    }
                }),
                client_1.default.gameDislike.findUnique({
                    where: {
                        gameId_userAddress: {
                            gameId: game.id,
                            userAddress
                        }
                    }
                }),
                client_1.default.gameRating.findUnique({
                    where: {
                        gameId_userAddress: {
                            gameId: game.id,
                            userAddress
                        }
                    }
                })
            ]);
        }
        // Transform game to match expected frontend format
        const transformedGame = {
            categories: Array.isArray(game.categories)
                ? game.categories.map((cat) => ({
                    description: "",
                    icon: "🎮",
                    id: cat.id,
                    name: cat.name,
                    slug: cat.name.toLowerCase().replace(/\s+/g, "-")
                }))
                : [],
            createdAt: game.createdAt.toISOString(),
            description: game.description,
            dislikeCount: game.dislikeCount || 0,
            entryFilePath: game.entryFilePath ?? "index.html",
            gameFileUrl: game.packageUrl,
            height: game.height,
            id: game.id,
            instructions: game.instructions,
            isFeatured: false,
            likeCount: game.likeCount || 0,
            playCount: game.playCount || 0,
            rating: game.rating || 0,
            ratingCount: game.ratingCount || 0,
            slug: game.slug,
            source: "Self",
            status: game.status,
            tags: Array.isArray(game.GameTag)
                ? game.GameTag.map((tag) => tag.name)
                : [],
            thumb1Url: game.coverImageUrl,
            thumb2Url: game.iconUrl,
            title: game.title,
            updatedAt: game.updatedAt.toISOString(),
            user: {
                avatarUrl: "https://via.placeholder.com/40x40/4F46E5/FFFFFF?text=G",
                displayName: "Unknown Developer",
                username: "Unknown",
                walletAddress: "0x000..."
            },
            userDislike: !!userDislike,
            userLike: !!userLike,
            userRating: userRating?.rating || null,
            width: game.width
        };
        return c.json({ game: transformedGame });
    }
    catch (error) {
        console.error("Get game error:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
};
exports.getGame = getGame;
