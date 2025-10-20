"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSimilarGames = void 0;
const client_1 = __importDefault(require("../../prisma/client"));
const getSimilarGames = async (c) => {
    try {
        const slug = c.req.param("slug");
        const game = await client_1.default.game.findUnique({
            include: { categories: true, GameTag: true },
            where: { slug }
        });
        if (!game)
            return c.json({ games: [] });
        // Match by shared tags and categories, exclude self
        const tagNames = game.GameTag?.map((t) => t.name) || [];
        const categoryNames = game.categories?.map((c) => c.name) || [];
        const games = await client_1.default.game.findMany({
            include: { categories: true, GameTag: true },
            take: 12,
            where: {
                OR: [
                    tagNames.length
                        ? {
                            GameTag: {
                                some: { name: { in: tagNames } }
                            }
                        }
                        : undefined,
                    categoryNames.length
                        ? {
                            categories: {
                                some: { name: { in: categoryNames } }
                            }
                        }
                        : undefined
                ].filter(Boolean),
                slug: { not: slug },
                status: "Published"
            }
        });
        const origin = new URL(c.req.url).origin;
        const toAbsolute = (u) => {
            if (!u)
                return u;
            if (/^https?:\/\//i.test(u))
                return u;
            return `${origin}${u}`;
        };
        const normalized = games.map((g) => ({
            categories: g.categories?.map((c) => ({
                description: "",
                icon: "🎮",
                id: c.id,
                name: c.name,
                slug: c.name.toLowerCase().replace(/\s+/g, "-")
            })),
            description: g.description,
            entryFilePath: g.entryFilePath ?? "index.html",
            gameFileUrl: g.packageUrl,
            height: g.height,
            id: g.id,
            isFeatured: false,
            likeCount: 0,
            playCount: 0,
            rating: 0,
            ratingCount: 0,
            slug: g.slug,
            source: "Self",
            status: g.status,
            tags: g.GameTag?.map((t) => t.name) || [],
            thumb1Url: toAbsolute(g.coverImageUrl || g.iconUrl),
            thumb2Url: toAbsolute(g.iconUrl || g.coverImageUrl),
            title: g.title,
            width: g.width
        }));
        return c.json({ games: normalized });
    }
    catch (_error) {
        return c.json({ games: [] });
    }
};
exports.getSimilarGames = getSimilarGames;
