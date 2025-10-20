import type { Context } from "hono";
import prisma from "../../prisma/client";

export const getTags = async (c: Context) => {
  try {
    const tags = await prisma.gameTag.findMany({ orderBy: { name: "asc" } });
    return c.json({ tags });
  } catch {
    return c.json({ error: "Failed to fetch tags" }, 500);
  }
};
