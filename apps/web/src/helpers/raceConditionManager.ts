/**
 * Race Condition Manager
 * Utilities for managing race conditions and async operations
 */

interface RaceConditionOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  onTimeout?: () => void;
  onRetry?: (attempt: number) => void;
}

/**
 * Create a race condition safe async function
 */
export const createRaceConditionSafe = <T extends any[], R>(
  asyncFn: (...args: T) => Promise<R>,
  options: RaceConditionOptions = {}
) => {
  const {
    timeout = 5000,
    retries = 3,
    retryDelay = 1000,
    onTimeout,
    onRetry,
  } = options;

  let currentRequest: AbortController | null = null;
  let retryCount = 0;

  return async (...args: T): Promise<R> => {
    // Cancel previous request if still running
    if (currentRequest) {
      currentRequest.abort();
    }

    // Create new abort controller
    currentRequest = new AbortController();
    const signal = currentRequest.signal;

    const executeWithRetry = async (): Promise<R> => {
      try {
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error(`Operation timed out after ${timeout}ms`));
          }, timeout);

          signal.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            reject(new Error('Operation aborted'));
          });
        });

        // Race between operation and timeout
        const result = await Promise.race([
          asyncFn(...args),
          timeoutPromise,
        ]);

        // Reset retry count on success
        retryCount = 0;
        return result;

      } catch (error) {
        if (signal.aborted) {
          throw new Error('Operation aborted');
        }

        if (retryCount < retries) {
          retryCount++;
          onRetry?.(retryCount);
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
          
          return executeWithRetry();
        } else {
          if (error instanceof Error && error.message.includes('timed out')) {
            onTimeout?.();
          }
          throw error;
        }
      }
    };

    return executeWithRetry();
  };
};

/**
 * Debounce function to prevent rapid successive calls
 */
export const debounce = <T extends any[], R>(
  func: (...args: T) => R,
  delay: number
) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastCallTime = 0;

  return (...args: T): Promise<R> => {
    return new Promise((resolve, reject) => {
      const now = Date.now();
      
      // Clear existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // If called too soon after last call, debounce
      if (now - lastCallTime < delay) {
        timeoutId = setTimeout(() => {
          lastCallTime = Date.now();
          try {
            const result = func(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, delay - (now - lastCallTime));
      } else {
        lastCallTime = now;
        try {
          const result = func(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }
    });
  };
};

/**
 * Throttle function to limit execution frequency
 */
export const throttle = <T extends any[], R>(
  func: (...args: T) => R,
  limit: number
) => {
  let inThrottle = false;
  let lastResult: R;

  return (...args: T): R => {
    if (!inThrottle) {
      inThrottle = true;
      lastResult = func(...args);
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
    
    return lastResult;
  };
};

/**
 * Create a queue for managing async operations
 */
export class AsyncQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = false;
  private concurrency: number;
  private activeCount = 0;

  constructor(concurrency = 1) {
    this.concurrency = concurrency;
  }

  async add<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await operation();
          resolve(result);
          return result;
        } catch (error) {
          reject(error);
          throw error;
        }
      });

      this.process();
    });
  }

  private async process() {
    if (this.running || this.activeCount >= this.concurrency) {
      return;
    }

    this.running = true;

    while (this.queue.length > 0 && this.activeCount < this.concurrency) {
      const operation = this.queue.shift();
      if (operation) {
        this.activeCount++;
        operation()
          .finally(() => {
            this.activeCount--;
            this.process();
          });
      }
    }

    this.running = false;
  }

  clear() {
    this.queue = [];
  }

  get length() {
    return this.queue.length;
  }

  get isRunning() {
    return this.running || this.activeCount > 0;
  }
}

/**
 * Create a semaphore for limiting concurrent operations
 */
export class Semaphore {
  private permits: number;
  private waiting: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (this.permits > 0) {
        this.permits--;
        resolve();
      } else {
        this.waiting.push(resolve);
      }
    });
  }

  release(): void {
    this.permits++;
    if (this.waiting.length > 0) {
      const next = this.waiting.shift();
      if (next) {
        this.permits--;
        next();
      }
    }
  }

  async withPermit<T>(operation: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await operation();
    } finally {
      this.release();
    }
  }
}

/**
 * Create a cache with TTL for preventing duplicate requests
 */
export class RequestCache {
  private cache = new Map<string, { value: any; expiry: number }>();
  private ttl: number;

  constructor(ttl: number = 5000) {
    this.ttl = ttl;
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  set<T>(key: string, value: T): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }
}

/**
 * Create a request deduplicator
 */
export class RequestDeduplicator {
  private pending = new Map<string, Promise<any>>();

  async deduplicate<T>(
    key: string,
    operation: () => Promise<T>
  ): Promise<T> {
    // If request is already pending, return the same promise
    if (this.pending.has(key)) {
      return this.pending.get(key)!;
    }

    // Create new request
    const promise = operation().finally(() => {
      this.pending.delete(key);
    });

    this.pending.set(key, promise);
    return promise;
  }

  clear(): void {
    this.pending.clear();
  }
}
