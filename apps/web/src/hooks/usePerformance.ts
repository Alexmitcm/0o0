import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Debounce hook
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttle hook
export const useThrottle = <T>(value: T, limit: number): T => {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(
      () => {
        if (Date.now() - lastRan.current >= limit) {
          setThrottledValue(value);
          lastRan.current = Date.now();
        }
      },
      limit - (Date.now() - lastRan.current)
    );

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        rootMargin: "50px",
        threshold: 0.1,
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options, hasIntersected]);

  return { hasIntersected, isIntersecting, ref };
};

// Virtual scrolling hook
export const useVirtualScroll = (
  itemCount: number,
  itemHeight: number,
  containerHeight: number,
  overscan = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / itemHeight) - overscan
    );
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return { endIndex, startIndex };
  }, [scrollTop, itemHeight, containerHeight, itemCount, overscan]);

  const totalHeight = itemCount * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    handleScroll,
    offsetY,
    totalHeight,
    visibleItems: visibleRange.endIndex - visibleRange.startIndex + 1,
    visibleRange
  };
};

// Memory usage monitoring
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = useState<{
    used: number;
    total: number;
    limit: number;
  } | null>(null);

  useEffect(() => {
    if (!("memory" in performance)) return;

    const updateMemoryInfo = () => {
      const memory = (performance as any).memory;
      setMemoryInfo({
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024)
      });
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000);

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
};

// Image lazy loading hook
export const useLazyImage = (src: string, placeholder?: string) => {
  const [imageSrc, setImageSrc] = useState(placeholder || "");
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { ref, hasIntersected } = useIntersectionObserver();

  useEffect(() => {
    if (!hasIntersected || !src) return;

    const img = new Image();

    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
      setHasError(false);
    };

    img.onerror = () => {
      setHasError(true);
      setIsLoaded(false);
    };

    img.src = src;
  }, [src, hasIntersected]);

  return {
    hasError,
    hasIntersected,
    isLoaded,
    ref,
    src: imageSrc
  };
};

// Component performance monitoring
export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;

    return () => {
      const renderTime = performance.now() - renderStartTime.current;

      if (process.env.NODE_ENV === "development" && renderTime > 16) {
        console.warn(
          `⚠️ ${componentName} render took ${renderTime.toFixed(2)}ms (${renderCount.current} renders)`
        );
      }
    };
  });

  return {
    renderCount: renderCount.current
  };
};

// Bundle size optimization - dynamic imports
export const useDynamicImport = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) => {
  const [Component, setComponent] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    importFunc()
      .then((module) => {
        setComponent(() => module.default);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, [importFunc]);

  if (error) {
    return { Component: fallback || null, error, isLoading: false };
  }

  return { Component, error: null, isLoading };
};

// Web Vitals monitoring
export const useWebVitals = () => {
  const [vitals, setVitals] = useState<{
    CLS?: number;
    FID?: number;
    FCP?: number;
    LCP?: number;
    TTFB?: number;
  }>({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reportVital = (name: string, value: number) => {
      setVitals((prev) => ({ ...prev, [name]: value }));

      // Send to analytics in production
      if (process.env.NODE_ENV === "production") {
        // Example: gtag('event', name, { value: Math.round(value) });
      }
    };

    // Monitor Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "largest-contentful-paint") {
          reportVital("LCP", entry.startTime);
        }
        if (entry.entryType === "first-input") {
          reportVital("FID", (entry as any).processingStart - entry.startTime);
        }
        if (entry.entryType === "layout-shift") {
          if (!(entry as any).hadRecentInput) {
            reportVital("CLS", (entry as any).value);
          }
        }
      }
    });

    observer.observe({
      entryTypes: ["largest-contentful-paint", "first-input", "layout-shift"]
    });

    return () => observer.disconnect();
  }, []);

  return vitals;
};

export default {
  useDebounce,
  useDynamicImport,
  useIntersectionObserver,
  useLazyImage,
  useMemoryMonitor,
  usePerformanceMonitor,
  useThrottle,
  useVirtualScroll,
  useWebVitals
};
