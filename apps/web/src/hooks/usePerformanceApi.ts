/**
 * Performance-optimized API hook with caching and request deduplication
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { performanceApiClient } from "../lib/api/PerformanceApiClient";
import { performanceService } from "../services/PerformanceService";

interface UsePerformanceApiOptions {
  cache?: boolean;
  cacheTTL?: number;
  timeout?: number;
  retries?: number;
  deduplicate?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
}

interface UsePerformanceApiResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  clearCache: () => void;
  performanceMetrics: {
    lastRequestTime: number;
    averageRequestTime: number;
    cacheHitRate: number;
  };
}

export function usePerformanceApi<T = any>(
  url: string | null,
  options: UsePerformanceApiOptions = {}
): UsePerformanceApiResult<T> {
  const {
    cache = true,
    cacheTTL = 300000, // 5 minutes
    timeout = 10000,
    retries = 2,
    deduplicate = true,
    onError,
    onSuccess
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    averageRequestTime: 0,
    cacheHitRate: 0,
    lastRequestTime: 0
  });

  const requestCount = useRef(0);
  const totalRequestTime = useRef(0);
  const cacheHits = useRef(0);
  const lastRequestTime = useRef(0);

  const fetchData = useCallback(async () => {
    if (!url) return;

    setLoading(true);
    setError(null);

    const startTime = performance.now();
    requestCount.current += 1;

    try {
      const result = await performanceApiClient.get<T>(url, {
        cache,
        cacheTTL,
        deduplicate,
        retries,
        timeout
      });

      setData(result);
      onSuccess?.(result);

      // Track cache hit
      if (cache) {
        cacheHits.current += 1;
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      onError?.(error);
    } finally {
      const endTime = performance.now();
      const requestTime = endTime - startTime;

      lastRequestTime.current = requestTime;
      totalRequestTime.current += requestTime;

      setLoading(false);

      // Update performance metrics
      setPerformanceMetrics({
        averageRequestTime: totalRequestTime.current / requestCount.current,
        cacheHitRate:
          requestCount.current > 0
            ? (cacheHits.current / requestCount.current) * 100
            : 0,
        lastRequestTime: requestTime
      });
    }
  }, [url, cache, cacheTTL, timeout, retries, deduplicate, onError, onSuccess]);

  const refetch = useCallback(async () => {
    // Clear cache for this specific URL
    if (url) {
      performanceApiClient.clearCache(`GET:${url}`);
    }
    await fetchData();
  }, [fetchData, url]);

  const clearCache = useCallback(() => {
    performanceApiClient.clearCache();
    setPerformanceMetrics((prev) => ({
      ...prev,
      cacheHitRate: 0
    }));
  }, []);

  // Auto-fetch when URL changes
  useEffect(() => {
    if (url) {
      fetchData();
    }
  }, [fetchData, url]);

  return {
    clearCache,
    data,
    error,
    loading,
    performanceMetrics,
    refetch
  };
}

/**
 * Hook for POST requests with performance tracking
 */
export function usePerformanceMutation<T = any, D = any>(
  options: UsePerformanceApiOptions = {}
) {
  const { timeout = 10000, retries = 2, onError, onSuccess } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const mutate = useCallback(
    async (url: string, payload?: D) => {
      setLoading(true);
      setError(null);

      const startTime = performance.now();

      try {
        const result = await performanceApiClient.post<T>(url, payload, {
          retries,
          timeout
        });

        setData(result);
        onSuccess?.(result);

        performanceService.trackApiCall(url, startTime, performance.now(), {
          method: "POST",
          success: true
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        onError?.(error);

        performanceService.trackApiCall(url, startTime, performance.now(), {
          error: error.message,
          method: "POST",
          success: false
        });
      } finally {
        setLoading(false);
      }
    },
    [timeout, retries, onError, onSuccess]
  );

  return {
    data,
    error,
    loading,
    mutate
  };
}

/**
 * Hook for tracking component performance
 */
export function useComponentPerformance(componentName: string) {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  const startRender = useCallback(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;
  }, []);

  const endRender = useCallback(() => {
    if (renderStartTime.current > 0) {
      const renderTime = performance.now() - renderStartTime.current;
      performanceService.trackRender(
        componentName,
        renderStartTime.current,
        performance.now(),
        {
          renderCount: renderCount.current
        }
      );
      renderStartTime.current = 0;
    }
  }, [componentName]);

  // Track render on every render
  useEffect(() => {
    startRender();
    return () => endRender();
  });

  return {
    endRender,
    renderCount: renderCount.current,
    startRender
  };
}

