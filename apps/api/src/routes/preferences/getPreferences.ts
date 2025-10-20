import type { Context } from "hono";
import prisma from "../../prisma/client";
import handleApiError from "../../utils/handleApiError";
import { getRedis, setRedis } from "../../utils/redis";

const getPreferences = async (ctx: Context) => {
  try {
    const account = ctx.get("account");

    // If user is not authenticated, return default preferences
    if (!account) {
      const data = {
        appIcon: 0,
        includeLowScore: false
      };

      return ctx.json({ data, success: true });
    }

    const cacheKey = `preferences:${account}`;
    const cachedValue = await getRedis(cacheKey);

    if (cachedValue) {
      return ctx.json({ data: JSON.parse(cachedValue), success: true });
    }

    const preference = await prisma.preference.findUnique({
      where: { accountAddress: account as string }
    });

    const data = {
      appIcon: preference?.appIcon || 0,
      includeLowScore: Boolean(preference?.includeLowScore)
    };

    await setRedis(cacheKey, data);

    return ctx.json({ data, success: true });
  } catch (error) {
    return handleApiError(ctx, error);
  }
};

export default getPreferences;
