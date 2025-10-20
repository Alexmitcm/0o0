import { useCallback, useRef, useEffect, useState } from 'react';

/**
 * Optimized timeout hook with automatic cleanup
 */
export const useOptimizedTimeout = () => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setOptimizedTimeout = useCallback((callback: () => void, delay: number) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout
    timeoutRef.current = setTimeout(callback, delay);
  }, []);

  const clearOptimizedTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    setOptimizedTimeout,
    clearOptimizedTimeout
  };
};

/**
 * Optimized interval hook with automatic cleanup
 */
export const useOptimizedInterval = () => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const setOptimizedInterval = useCallback((callback: () => void, delay: number) => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Set new interval
    intervalRef.current = setInterval(callback, delay);
  }, []);

  const clearOptimizedInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    setOptimizedInterval,
    clearOptimizedInterval
  };
};

/**
 * Debounced value hook for performance optimization
 */
export const useDebouncedValue = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const { setOptimizedTimeout } = useOptimizedTimeout();

  useEffect(() => {
    setOptimizedTimeout(() => {
      setDebouncedValue(value);
    }, delay);
  }, [value, delay, setOptimizedTimeout]);

  return debouncedValue;
};

/**
 * Throttled callback hook for performance optimization
 */
export const useThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef<number>(0);
  const { setOptimizedTimeout } = useOptimizedTimeout();

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastRun.current >= delay) {
        lastRun.current = now;
        return callback(...args);
      } else {
        setOptimizedTimeout(() => {
          lastRun.current = Date.now();
          callback(...args);
        }, delay - (now - lastRun.current));
      }
    }) as T,
    [callback, delay, setOptimizedTimeout]
  );
};
