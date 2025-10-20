"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrendingGames = void 0;
const client_1 = __importDefault(require("../../prisma/client"));
const toAbsoluteUrl = (origin, u) => {
    if (!u)
        return u;
    if (/^https?:\/\//i.test(u))
        return u;
    return `${origin}${u}`;
};
const getTrendingGames = async (c) => {
    try {
        const origin = new URL(c.req.url).origin;
        const limit = Number.parseInt(c.req.query("limit") || "20", 10);
        const games = await client_1.default.game.findMany({
            include: {
                categories: true,
                GameScreenshot: true,
                GameTag: true
            },
            orderBy: { createdAt: "desc" },
            take: Math.max(1, Math.min(100, limit)),
            where: { status: "Published" }
        });
        const transformed = games.map((game) => ({
            categories: Array.isArray(game.categories)
                ? game.categories.map((cat) => ({
                    description: "",
                    icon: "🎮",
                    id: cat.id,
                    name: cat.name,
                    slug: cat.slug ||
                        cat.name.toLowerCase().replace(/\s+/g, "-")
                }))
                : [],
            createdAt: game.createdAt?.toISOString?.() || new Date().toISOString(),
            description: game.description,
            entryFilePath: game.entryFilePath ?? "index.html",
            gameFileUrl: toAbsoluteUrl(origin, game.packageUrl),
            height: game.height,
            iconUrl: toAbsoluteUrl(origin, game.iconUrl),
            id: game.id,
            instructions: game.instructions,
            slug: game.slug,
            source: "Self",
            status: game.status,
            tags: Array.isArray(game.GameTag)
                ? game.GameTag.map((t) => t.name)
                : [],
            thumb1Url: toAbsoluteUrl(origin, game.coverImageUrl || game.iconUrl || game.GameScreenshot?.[0]?.imageUrl),
            thumb2Url: toAbsoluteUrl(origin, game.iconUrl || game.coverImageUrl || game.GameScreenshot?.[1]?.imageUrl),
            title: game.title,
            updatedAt: game.updatedAt?.toISOString?.() || new Date().toISOString(),
            width: game.width
        }));
        return c.json({ games: transformed });
    }
    catch (_error) {
        return c.json({ error: "Failed to fetch trending games" }, 500);
    }
};
exports.getTrendingGames = getTrendingGames;
