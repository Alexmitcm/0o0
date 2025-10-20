"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchGames = void 0;
const zod_1 = require("zod");
const fetchGamesSchema = zod_1.z.object({
    category: zod_1.z.string().optional(),
    collection: zod_1.z.string().optional(),
    distributor: zod_1.z.enum(["GameDistribution", "GamePix"]),
    limit: zod_1.z.number().min(1).max(100).default(10),
    offset: zod_1.z.number().min(1).default(1),
    sort: zod_1.z.string().optional()
});
const fetchGames = async (c) => {
    try {
        const user = c.get("user");
        if (!user) {
            return c.json({ error: "Unauthorized" }, 401);
        }
        const body = await c.req.json();
        const validatedData = fetchGamesSchema.parse(body);
        // Call real distributors
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000);
        try {
            let url = "";
            const params = new URLSearchParams();
            if (validatedData.limit)
                params.set("limit", String(validatedData.limit));
            if (validatedData.offset)
                params.set("offset", String(validatedData.offset));
            if (validatedData.category)
                params.set("category", validatedData.category);
            if (validatedData.collection)
                params.set("collection", validatedData.collection);
            if (validatedData.sort)
                params.set("sort", validatedData.sort);
            if (validatedData.distributor === "GameDistribution") {
                // Example public feed (replace with authenticated endpoint if available)
                url = `https://api.gamedistribution.com/game/feed?${params.toString()}`;
            }
            else {
                url = `https://api.gamepix.com/v3/games?${params.toString()}`;
            }
            const resp = await fetch(url, { signal: controller.signal });
            if (!resp.ok) {
                return c.json({ error: `Upstream error: ${resp.status}` }, 502);
            }
            const data = await resp.json();
            // Normalize a minimal shape
            const items = Array.isArray(data?.games)
                ? data.games
                : Array.isArray(data?.data)
                    ? data.data
                    : [];
            const games = items.map((g) => ({
                category: g.category || g.genre || "",
                description: g.description || g.summary || "",
                gameUrl: g.url || g.gameUrl || g.playUrl || "",
                height: Number(g.height || 720),
                thumb1Url: g.thumb1 || g.thumbnail || g.image || "",
                thumb2Url: g.thumb2 || g.thumbnail_square || g.image_square || "",
                title: g.title || g.name || "",
                width: Number(g.width || 1280)
            }));
            return c.json({
                distributor: validatedData.distributor,
                games,
                success: true,
                total: games.length
            });
        }
        finally {
            clearTimeout(timeout);
        }
    }
    catch (error) {
        console.error("Fetch games error:", error);
        if (error instanceof zod_1.z.ZodError) {
            return c.json({ details: error.errors, error: "Validation error" }, 400);
        }
        return c.json({ error: "Internal server error" }, 500);
    }
};
exports.fetchGames = fetchGames;
