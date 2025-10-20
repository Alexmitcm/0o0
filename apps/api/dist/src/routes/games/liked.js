"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLikedGames = void 0;
const _toAbsoluteUrl = (origin, u) => {
    if (!u)
        return u;
    if (/^https?:\/\//i.test(u))
        return u;
    return `${origin}${u}`;
};
const getLikedGames = async (c) => {
    try {
        const _origin = new URL(c.req.url).origin;
        const _limit = Number.parseInt(c.req.query("limit") || "20", 10);
        // For now, return an empty array since we don't have like functionality in the database yet
        // TODO: Implement proper like tracking when GameLike model is added
        return c.json({ games: [] });
    }
    catch (error) {
        console.error("Liked games error:", error);
        return c.json({ error: "Failed to fetch liked games" }, 500);
    }
};
exports.getLikedGames = getLikedGames;
