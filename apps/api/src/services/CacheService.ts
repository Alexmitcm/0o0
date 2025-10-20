import logger from "../utils/logger";
import { delRedis, getRedis, setRedis } from "../utils/redis";

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  serialize?: boolean; // Whether to JSON serialize/deserialize
}

export class CacheService {
  private readonly defaultTTL = 300; // 5 minutes
  private readonly keyPrefix = "hey:api:";

  /**
   * Generate cache key with prefix
   */
  private generateKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    try {
      const cacheKey = this.generateKey(key);
      const value = await getRedis(cacheKey);

      if (!value) {
        return null;
      }

      if (options.serialize !== false) {
        return JSON.parse(value);
      }

      return value as T;
    } catch (error) {
      // Silently ignore cache errors - Redis might not be available
      console.debug("Cache get error:", error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      const cacheKey = this.generateKey(key);
      const ttl = options.ttl || this.defaultTTL;

      let serializedValue: string;
      if (options.serialize !== false) {
        serializedValue = JSON.stringify(value);
      } else {
        serializedValue = value as string;
      }

      await setRedis(cacheKey, serializedValue, ttl);

      // Store cache tags for invalidation
      if (options.tags && options.tags.length > 0) {
        await this.addTagsToKey(cacheKey, options.tags);
      }

      return true;
    } catch (error) {
      // Silently ignore cache errors - Redis might not be available
      console.debug("Cache set error:", error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<boolean> {
    try {
      const cacheKey = this.generateKey(key);
      await delRedis(cacheKey);

      // Clean up tags
      await this.removeKeyFromTags(cacheKey);

      return true;
    } catch (error) {
      // Silently ignore cache errors - Redis might not be available
      console.debug("Cache del error:", error);
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      const cacheKey = this.generateKey(key);
      const value = await getRedis(cacheKey);
      return value !== null;
    } catch (error) {
      // Silently ignore cache errors - Redis might not be available
      console.debug("Cache exists error:", error);
      return false;
    }
  }

  /**
   * Get multiple values from cache
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const cacheKeys = keys.map((key) => this.generateKey(key));
      const values = await Promise.all(
        cacheKeys.map(async (key) => {
          const value = await getRedis(key);
          return value ? JSON.parse(value) : null;
        })
      );
      return values;
    } catch (error) {
      // Silently ignore cache errors - Redis might not be available
      console.debug("Cache mget error:", error);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple values in cache
   */
  async mset<T>(
    keyValuePairs: Array<{ key: string; value: T; ttl?: number }>
  ): Promise<boolean> {
    try {
      const promises = keyValuePairs.map(({ key, value, ttl }) =>
        this.set(key, value, { ttl })
      );

      const results = await Promise.all(promises);
      return results.every((result) => result);
    } catch (error) {
      // Silently ignore cache errors - Redis might not be available
      console.debug("Cache mset error:", error);
      return false;
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    try {
      let invalidatedCount = 0;
      const invalidatedKeys = new Set<string>();

      for (const tag of tags) {
        const tagKey = this.generateKey(`tag:${tag}`);
        const keys = await getRedis(tagKey);

        if (keys) {
          const keyList = JSON.parse(keys);
          for (const key of keyList) {
            if (!invalidatedKeys.has(key)) {
              await delRedis(key);
              invalidatedKeys.add(key);
              invalidatedCount++;
            }
          }
          await delRedis(tagKey);
        }
      }

      logger.info(
        `Invalidated ${invalidatedCount} cache entries for tags: ${tags.join(", ")}`
      );
      return invalidatedCount;
    } catch (error) {
      // Silently ignore cache errors - Redis might not be available
      console.debug("Cache invalidateByTags error:", error);
      return 0;
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    try {
      // This would need Redis SCAN command implementation
      // For now, we'll use a simple approach with known patterns
      const commonPatterns = {
        "admin:*": ["admin"],
        "categories:*": ["categories"],
        "games:*": ["games", "categories"],
        "user:*": ["users"]
      };

      const tags = commonPatterns[pattern as keyof typeof commonPatterns] || [];
      return await this.invalidateByTags(tags);
    } catch (error) {
      // Silently ignore cache errors - Redis might not be available
      console.debug("Cache invalidateByPattern error:", error);
      return 0;
    }
  }

  /**
   * Invalidate cache by key prefix
   */
  async invalidateByPrefix(prefix: string): Promise<number> {
    try {
      const _fullPrefix = this.generateKey(prefix);
      // This would need Redis SCAN command implementation
      // For now, we'll use tag-based invalidation
      const tags = [prefix.replace(":", "")];
      return await this.invalidateByTags(tags);
    } catch (error) {
      // Silently ignore cache errors - Redis might not be available
      console.debug("Cache invalidateByPrefix error:", error);
      return 0;
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<boolean> {
    try {
      // This would need to be implemented based on your Redis setup
      // For now, we'll just log a warning
      logger.warn(
        "Cache clear not implemented - would clear all cache entries"
      );
      return true;
    } catch (error) {
      // Silently ignore cache errors - Redis might not be available
      console.debug("Cache clear error:", error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    hitRate: number;
    missRate: number;
    totalKeys: number;
  }> {
    // This would need to be implemented based on your Redis setup
    return {
      hitRate: 0,
      missRate: 0,
      totalKeys: 0
    };
  }

  /**
   * Add tags to a cache key for invalidation
   */
  private async addTagsToKey(key: string, tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        const tagKey = this.generateKey(`tag:${tag}`);
        const existingKeys = await getRedis(tagKey);
        const keyList = existingKeys ? JSON.parse(existingKeys) : [];

        if (!keyList.includes(key)) {
          keyList.push(key);
          await setRedis(tagKey, JSON.stringify(keyList), 86400); // 24 hours
        }
      }
    } catch (error) {
      logger.error(`Error adding tags to key ${key}:`, error);
    }
  }

  /**
   * Remove key from all tags
   */
  private async removeKeyFromTags(key: string): Promise<void> {
    try {
      // This would need to track which tags a key belongs to
      // For now, we'll just log a warning
      logger.debug(`Removing key ${key} from tags (not implemented)`);
    } catch (error) {
      logger.error(`Error removing key ${key} from tags:`, error);
    }
  }

  /**
   * Cache wrapper for async functions
   */
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key, options);
      if (cached !== null) {
        logger.debug(`Cache hit for key: ${key}`);
        return cached;
      }

      // Execute function and cache result
      logger.debug(`Cache miss for key: ${key}`);
      const result = await fn();
      await this.set(key, result, options);

      return result;
    } catch (error) {
      // Silently ignore cache errors - Redis might not be available
      console.debug("Cache wrap error:", error);
      // If caching fails, still execute the function
      return await fn();
    }
  }
}

export default new CacheService();
