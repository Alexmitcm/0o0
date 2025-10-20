import type { Context, Next } from "hono";

const requirePremium = async (c: Context, next: Next) => {
  const isPremium = c.get("isPremium") as boolean | undefined;
  const wallet = c.get("walletAddress") as string | null | undefined;
  if (!wallet) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  if (!isPremium) {
    return c.json({ error: "Forbidden - Premium required" }, 403);
  }
  return next();
};

export default requirePremium;
