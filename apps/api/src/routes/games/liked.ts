import type { Context } from "hono";

const _toAbsoluteUrl = (origin: string, u?: string) => {
  if (!u) return u;
  if (/^https?:\/\//i.test(u)) return u;
  return `${origin}${u}`;
};

export const getLikedGames = async (c: Context) => {
  try {
    const _origin = new URL(c.req.url).origin;
    const _limit = Number.parseInt(c.req.query("limit") || "20", 10);

    // For now, return an empty array since we don't have like functionality in the database yet
    // Proper like tracking will be implemented when GameLike model is added

    return c.json({ games: [] });
  } catch (error) {
    console.error("Liked games error:", error);
    return c.json({ error: "Failed to fetch liked games" }, 500);
  }
};
