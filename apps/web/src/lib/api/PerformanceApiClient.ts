/**
 * Performance-optimized API client with caching and request deduplication
 */

import { performanceService } from "../../services/PerformanceService";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface RequestOptions {
  cache?: boolean;
  cacheTTL?: number; // milliseconds
  timeout?: number; // milliseconds
  retries?: number;
  deduplicate?: boolean;
}

class PerformanceApiClient {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, Promise<any>>();
  private defaultTimeout = 10000; // 10 seconds
  private defaultRetries = 2;

  /**
   * Make a GET request with performance tracking and caching
   */
  public async get<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const {
      cache = true,
      cacheTTL = 300000, // 5 minutes
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      deduplicate = true
    } = options;

    const cacheKey = `GET:${url}`;
    const startTime = performance.now();

    // Check cache first
    if (cache && this.isCacheValid(cacheKey, cacheTTL)) {
      const cached = this.cache.get(cacheKey)!;
      performanceService.trackApiCall(url, startTime, performance.now(), {
        cached: true,
        hit: true
      });
      return cached.data;
    }

    // Check for pending request (deduplication)
    if (deduplicate && this.pendingRequests.has(cacheKey)) {
      const result = await this.pendingRequests.get(cacheKey);
      performanceService.trackApiCall(url, startTime, performance.now(), {
        deduplicated: true
      });
      return result;
    }

    // Make the request
    const requestPromise = this.makeRequest<T>(url, {
      method: "GET",
      retries,
      timeout
    });

    if (deduplicate) {
      this.pendingRequests.set(cacheKey, requestPromise);
    }

    try {
      const result = await requestPromise;

      // Cache the result
      if (cache) {
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
          ttl: cacheTTL
        });
      }

      performanceService.trackApiCall(url, startTime, performance.now(), {
        cached: false,
        hit: false
      });

      return result;
    } finally {
      if (deduplicate) {
        this.pendingRequests.delete(cacheKey);
      }
    }
  }

  /**
   * Make a POST request with performance tracking
   */
  public async post<T>(
    url: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    const { timeout = this.defaultTimeout, retries = this.defaultRetries } =
      options;

    const startTime = performance.now();

    try {
      const result = await this.makeRequest<T>(url, {
        body: data ? JSON.stringify(data) : undefined,
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST",
        retries,
        timeout
      });

      performanceService.trackApiCall(url, startTime, performance.now(), {
        method: "POST"
      });

      return result;
    } catch (error) {
      performanceService.trackApiCall(url, startTime, performance.now(), {
        error: true,
        method: "POST"
      });
      throw error;
    }
  }

  /**
   * Make a PUT request with performance tracking
   */
  public async put<T>(
    url: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    const { timeout = this.defaultTimeout, retries = this.defaultRetries } =
      options;

    const startTime = performance.now();

    try {
      const result = await this.makeRequest<T>(url, {
        body: data ? JSON.stringify(data) : undefined,
        headers: {
          "Content-Type": "application/json"
        },
        method: "PUT",
        retries,
        timeout
      });

      performanceService.trackApiCall(url, startTime, performance.now(), {
        method: "PUT"
      });

      return result;
    } catch (error) {
      performanceService.trackApiCall(url, startTime, performance.now(), {
        error: true,
        method: "PUT"
      });
      throw error;
    }
  }

  /**
   * Make a DELETE request with performance tracking
   */
  public async delete<T>(
    url: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { timeout = this.defaultTimeout, retries = this.defaultRetries } =
      options;

    const startTime = performance.now();

    try {
      const result = await this.makeRequest<T>(url, {
        method: "DELETE",
        retries,
        timeout
      });

      performanceService.trackApiCall(url, startTime, performance.now(), {
        method: "DELETE"
      });

      return result;
    } catch (error) {
      performanceService.trackApiCall(url, startTime, performance.now(), {
        error: true,
        method: "DELETE"
      });
      throw error;
    }
  }

  /**
   * Clear cache
   */
  public clearCache(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    size: number;
    hitRate: number;
    entries: Array<{ key: string; age: number; ttl: number }>;
  } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      age: Date.now() - entry.timestamp,
      key,
      ttl: entry.ttl
    }));

    return {
      entries,
      hitRate: 0, // Would need to track hits/misses
      size: this.cache.size
    };
  }

  private async makeRequest<T>(
    url: string,
    options: {
      method: string;
      body?: string;
      headers?: Record<string, string>;
      timeout: number;
      retries: number;
    }
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);

    try {
      const response = await fetch(url, {
        body: options.body,
        headers: options.headers,
        method: options.method,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Request timeout after ${options.timeout}ms`);
      }

      if (options.retries > 0) {
        // Exponential backoff
        const delay = 2 ** (this.defaultRetries - options.retries) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));

        return this.makeRequest(url, {
          ...options,
          retries: options.retries - 1
        });
      }

      throw error;
    }
  }

  private isCacheValid(key: string, ttl: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    return Date.now() - entry.timestamp < ttl;
  }
}

export const performanceApiClient = new PerformanceApiClient();
export default performanceApiClient;
