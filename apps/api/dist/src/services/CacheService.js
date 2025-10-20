"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const redis_1 = require("../utils/redis");
class CacheService {
    defaultTTL = 300; // 5 minutes
    keyPrefix = "hey:api:";
    /**
     * Generate cache key with prefix
     */
    generateKey(key) {
        return `${this.keyPrefix}${key}`;
    }
    /**
     * Get value from cache
     */
    async get(key, options = {}) {
        try {
            const cacheKey = this.generateKey(key);
            const value = await (0, redis_1.getRedis)(cacheKey);
            if (!value) {
                return null;
            }
            if (options.serialize !== false) {
                return JSON.parse(value);
            }
            return value;
        }
        catch (error) {
            logger_1.default.error(`Cache get error for key ${key}:`, error);
            return null;
        }
    }
    /**
     * Set value in cache
     */
    async set(key, value, options = {}) {
        try {
            const cacheKey = this.generateKey(key);
            const ttl = options.ttl || this.defaultTTL;
            let serializedValue;
            if (options.serialize !== false) {
                serializedValue = JSON.stringify(value);
            }
            else {
                serializedValue = value;
            }
            await (0, redis_1.setRedis)(cacheKey, serializedValue, ttl);
            // Store cache tags for invalidation
            if (options.tags && options.tags.length > 0) {
                await this.addTagsToKey(cacheKey, options.tags);
            }
            return true;
        }
        catch (error) {
            logger_1.default.error(`Cache set error for key ${key}:`, error);
            return false;
        }
    }
    /**
     * Delete value from cache
     */
    async del(key) {
        try {
            const cacheKey = this.generateKey(key);
            await (0, redis_1.delRedis)(cacheKey);
            // Clean up tags
            await this.removeKeyFromTags(cacheKey);
            return true;
        }
        catch (error) {
            logger_1.default.error(`Cache delete error for key ${key}:`, error);
            return false;
        }
    }
    /**
     * Check if key exists in cache
     */
    async exists(key) {
        try {
            const cacheKey = this.generateKey(key);
            const value = await (0, redis_1.getRedis)(cacheKey);
            return value !== null;
        }
        catch (error) {
            logger_1.default.error(`Cache exists error for key ${key}:`, error);
            return false;
        }
    }
    /**
     * Get multiple values from cache
     */
    async mget(keys) {
        try {
            const cacheKeys = keys.map((key) => this.generateKey(key));
            const values = await Promise.all(cacheKeys.map(async (key) => {
                const value = await (0, redis_1.getRedis)(key);
                return value ? JSON.parse(value) : null;
            }));
            return values;
        }
        catch (error) {
            logger_1.default.error(`Cache mget error for keys ${keys.join(", ")}:`, error);
            return keys.map(() => null);
        }
    }
    /**
     * Set multiple values in cache
     */
    async mset(keyValuePairs) {
        try {
            const promises = keyValuePairs.map(({ key, value, ttl }) => this.set(key, value, { ttl }));
            const results = await Promise.all(promises);
            return results.every((result) => result);
        }
        catch (error) {
            logger_1.default.error("Cache mset error:", error);
            return false;
        }
    }
    /**
     * Invalidate cache by tags
     */
    async invalidateByTags(tags) {
        try {
            let invalidatedCount = 0;
            const invalidatedKeys = new Set();
            for (const tag of tags) {
                const tagKey = this.generateKey(`tag:${tag}`);
                const keys = await (0, redis_1.getRedis)(tagKey);
                if (keys) {
                    const keyList = JSON.parse(keys);
                    for (const key of keyList) {
                        if (!invalidatedKeys.has(key)) {
                            await (0, redis_1.delRedis)(key);
                            invalidatedKeys.add(key);
                            invalidatedCount++;
                        }
                    }
                    await (0, redis_1.delRedis)(tagKey);
                }
            }
            logger_1.default.info(`Invalidated ${invalidatedCount} cache entries for tags: ${tags.join(", ")}`);
            return invalidatedCount;
        }
        catch (error) {
            logger_1.default.error(`Cache invalidation error for tags ${tags.join(", ")}:`, error);
            return 0;
        }
    }
    /**
     * Invalidate cache by pattern
     */
    async invalidateByPattern(pattern) {
        try {
            // This would need Redis SCAN command implementation
            // For now, we'll use a simple approach with known patterns
            const commonPatterns = {
                "admin:*": ["admin"],
                "categories:*": ["categories"],
                "games:*": ["games", "categories"],
                "user:*": ["users"]
            };
            const tags = commonPatterns[pattern] || [];
            return await this.invalidateByTags(tags);
        }
        catch (error) {
            logger_1.default.error(`Cache invalidation error for pattern ${pattern}:`, error);
            return 0;
        }
    }
    /**
     * Invalidate cache by key prefix
     */
    async invalidateByPrefix(prefix) {
        try {
            const _fullPrefix = this.generateKey(prefix);
            // This would need Redis SCAN command implementation
            // For now, we'll use tag-based invalidation
            const tags = [prefix.replace(":", "")];
            return await this.invalidateByTags(tags);
        }
        catch (error) {
            logger_1.default.error(`Cache invalidation error for prefix ${prefix}:`, error);
            return 0;
        }
    }
    /**
     * Clear all cache entries
     */
    async clear() {
        try {
            // This would need to be implemented based on your Redis setup
            // For now, we'll just log a warning
            logger_1.default.warn("Cache clear not implemented - would clear all cache entries");
            return true;
        }
        catch (error) {
            logger_1.default.error("Cache clear error:", error);
            return false;
        }
    }
    /**
     * Get cache statistics
     */
    async getStats() {
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
    async addTagsToKey(key, tags) {
        try {
            for (const tag of tags) {
                const tagKey = this.generateKey(`tag:${tag}`);
                const existingKeys = await (0, redis_1.getRedis)(tagKey);
                const keyList = existingKeys ? JSON.parse(existingKeys) : [];
                if (!keyList.includes(key)) {
                    keyList.push(key);
                    await (0, redis_1.setRedis)(tagKey, JSON.stringify(keyList), 86400); // 24 hours
                }
            }
        }
        catch (error) {
            logger_1.default.error(`Error adding tags to key ${key}:`, error);
        }
    }
    /**
     * Remove key from all tags
     */
    async removeKeyFromTags(key) {
        try {
            // This would need to track which tags a key belongs to
            // For now, we'll just log a warning
            logger_1.default.debug(`Removing key ${key} from tags (not implemented)`);
        }
        catch (error) {
            logger_1.default.error(`Error removing key ${key} from tags:`, error);
        }
    }
    /**
     * Cache wrapper for async functions
     */
    async wrap(key, fn, options = {}) {
        try {
            // Try to get from cache first
            const cached = await this.get(key, options);
            if (cached !== null) {
                logger_1.default.debug(`Cache hit for key: ${key}`);
                return cached;
            }
            // Execute function and cache result
            logger_1.default.debug(`Cache miss for key: ${key}`);
            const result = await fn();
            await this.set(key, result, options);
            return result;
        }
        catch (error) {
            logger_1.default.error(`Cache wrap error for key ${key}:`, error);
            // If caching fails, still execute the function
            return await fn();
        }
    }
}
exports.CacheService = CacheService;
exports.default = new CacheService();
