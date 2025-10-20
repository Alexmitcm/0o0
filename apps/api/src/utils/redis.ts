import IORedis from "ioredis";

let redisClient: IORedis | null = null;

export const DISCORD_QUEUE_POSTS = "hey:discord:webhooks:posts";
export const DISCORD_QUEUE_LIKES = "hey:discord:webhooks:likes";
export const DISCORD_QUEUE_COLLECTS = "hey:discord:webhooks:collects";

const getRedisClient = (): IORedis | null => {
  // Allow forcibly disabling Redis via env flag
  if (process.env.DISABLE_REDIS === "true") {
    if (!redisClient) {
      console.warn("Redis disabled via DISABLE_REDIS=true");
    }
    return null;
  }
  if (redisClient) return redisClient;

  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn("Redis not configured. Set REDIS_URL environment variable");
    return null;
  }

  try {
    redisClient = new IORedis(url, {
      commandTimeout: 5000,
      connectTimeout: 10000,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100
    });

    redisClient.on("error", (error) => {
      console.warn("Redis connection error:", error.message);
    });

    redisClient.on("connect", () => {
      console.log("Redis connected successfully");
    });

    return redisClient;
  } catch (error) {
    console.warn("Failed to create Redis client:", error);
    return null;
  }
};

export const getRedis = async (key: string): Promise<string | null> => {
  const client = getRedisClient();
  if (!client) return null;

  try {
    return await client.get(key);
  } catch (error) {
    console.warn("Redis get error:", error);
    return null;
  }
};

export const setRedis = async (
  key: string,
  value: string,
  ttl?: number
): Promise<boolean> => {
  const client = getRedisClient();
  if (!client) return false;

  try {
    if (ttl) {
      await client.setex(key, ttl, value);
    } else {
      await client.set(key, value);
    }
    return true;
  } catch (error) {
    console.warn("Redis set error:", error);
    return false;
  }
};

export const delRedis = async (key: string): Promise<boolean> => {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.del(key);
    return true;
  } catch (error) {
    console.warn("Redis del error:", error);
    return false;
  }
};
