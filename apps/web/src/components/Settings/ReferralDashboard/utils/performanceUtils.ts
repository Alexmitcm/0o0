// Debounce function to prevent excessive function calls
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function to limit function execution frequency
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Memoization helper for expensive calculations
export const memoize = <T extends (...args: any[]) => any>(
  func: T,
  getKey?: (...args: Parameters<T>) => string
): T => {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

// Virtual scrolling utilities
export interface VirtualScrollConfig {
  itemHeight: number;
  containerHeight: number;
  totalItems: number;
  scrollTop: number;
}

export interface VirtualScrollResult {
  startIndex: number;
  endIndex: number;
  visibleItems: number;
  totalHeight: number;
  offsetY: number;
}

export const calculateVirtualScroll = (
  config: VirtualScrollConfig
): VirtualScrollResult => {
  const { itemHeight, containerHeight, totalItems, scrollTop } = config;

  const startIndex = Math.floor(scrollTop / itemHeight);
  const visibleItems = Math.ceil(containerHeight / itemHeight) + 1;
  const endIndex = Math.min(startIndex + visibleItems, totalItems);

  return {
    endIndex,
    offsetY: startIndex * itemHeight,
    startIndex,
    totalHeight: totalItems * itemHeight,
    visibleItems
  };
};

// Performance monitoring utilities
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number> = new Map();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark: string): number {
    const start = this.marks.get(startMark);
    const end = this.marks.get(endMark);

    if (start && end) {
      const duration = end - start;
      this.measures.set(name, duration);
      return duration;
    }

    return 0;
  }

  getMeasure(name: string): number | undefined {
    return this.measures.get(name);
  }

  clear(): void {
    this.marks.clear();
    this.measures.clear();
  }
}

// Batch processing utility
export const batchProcess = <T>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<void>
): Promise<void> => {
  return new Promise((resolve, reject) => {
    let currentIndex = 0;

    const processNextBatch = async () => {
      if (currentIndex >= items.length) {
        resolve();
        return;
      }

      const batch = items.slice(currentIndex, currentIndex + batchSize);
      currentIndex += batchSize;

      try {
        await processor(batch);
        // Use setTimeout to prevent blocking the UI
        setTimeout(processNextBatch, 0);
      } catch (error) {
        reject(error);
      }
    };

    processNextBatch();
  });
};

// Intersection Observer utility for lazy loading
export const createIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver => {
  return new IntersectionObserver(callback, {
    root: null,
    rootMargin: "50px",
    threshold: 0.1,
    ...options
  });
};

// RAF (RequestAnimationFrame) utility for smooth animations
export const rafThrottle = <T extends (...args: any[]) => any>(
  func: T
): ((...args: Parameters<T>) => void) => {
  let ticking = false;

  return (...args: Parameters<T>) => {
    if (!ticking) {
      requestAnimationFrame(() => {
        func(...args);
        ticking = false;
      });
      ticking = true;
    }
  };
};

// Memory management utilities
export const createWeakCache = <K extends object, V>() => {
  return new WeakMap<K, V>();
};

export const createLRUCache = <K, V>(maxSize = 100) => {
  const cache = new Map<K, V>();

  return {
    clear(): void {
      cache.clear();
    },
    get(key: K): V | undefined {
      if (cache.has(key)) {
        const value = cache.get(key)!;
        cache.delete(key);
        cache.set(key, value);
        return value;
      }
      return undefined;
    },

    set(key: K, value: V): void {
      if (cache.has(key)) {
        cache.delete(key);
      } else if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value;
        if (firstKey !== undefined) {
          cache.delete(firstKey);
        }
      }
      cache.set(key, value);
    },

    size(): number {
      return cache.size;
    }
  };
};
