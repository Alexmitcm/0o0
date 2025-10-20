import { useCallback, useEffect, useRef, useState } from "react";

export interface PerformanceMetrics {
  renderTime: number;
  interactionTime: number;
  memoryUsage?: number;
  timestamp: number;
}

export interface PerformanceTrackerOptions {
  enableLogging?: boolean;
  enableMemoryTracking?: boolean;
  maxMetrics?: number;
}

export const usePerformanceMonitoring = (options: PerformanceTrackerOptions = {}) => {
  const {
    enableLogging = process.env.NODE_ENV === "development",
    enableMemoryTracking = false,
    maxMetrics = 100
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const renderStartTime = useRef<number>(0);
  const interactionStartTime = useRef<number>(0);

  const startRender = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  const endRender = useCallback(() => {
    if (renderStartTime.current === 0) return;

    const renderTime = performance.now() - renderStartTime.current;
    const timestamp = Date.now();
    
    const newMetric: PerformanceMetrics = {
      renderTime,
      interactionTime: 0,
      timestamp
    };

    if (enableMemoryTracking && 'memory' in performance) {
      const memory = (performance as any).memory;
      newMetric.memoryUsage = memory.usedJSHeapSize;
    }

    setMetrics(prev => {
      const updated = [...prev, newMetric];
      return updated.length > maxMetrics ? updated.slice(-maxMetrics) : updated;
    });

    if (enableLogging) {
      console.log(`Render completed in ${renderTime.toFixed(2)}ms`);
    }

    renderStartTime.current = 0;
  }, [enableLogging, enableMemoryTracking, maxMetrics]);

  const startInteraction = useCallback(() => {
    interactionStartTime.current = performance.now();
  }, []);

  const endInteraction = useCallback((interactionType: string) => {
    if (interactionStartTime.current === 0) return;

    const interactionTime = performance.now() - interactionStartTime.current;
    const timestamp = Date.now();
    
    const newMetric: PerformanceMetrics = {
      renderTime: 0,
      interactionTime,
      timestamp
    };

    if (enableMemoryTracking && 'memory' in performance) {
      const memory = (performance as any).memory;
      newMetric.memoryUsage = memory.usedJSHeapSize;
    }

    setMetrics(prev => {
      const updated = [...prev, newMetric];
      return updated.length > maxMetrics ? updated.slice(-maxMetrics) : updated;
    });

    if (enableLogging) {
      console.log(`${interactionType} interaction completed in ${interactionTime.toFixed(2)}ms`);
    }

    interactionStartTime.current = 0;
  }, [enableLogging, enableMemoryTracking, maxMetrics]);

  const getAverageRenderTime = useCallback(() => {
    const renderMetrics = metrics.filter(m => m.renderTime > 0);
    if (renderMetrics.length === 0) return 0;
    
    const total = renderMetrics.reduce((sum, m) => sum + m.renderTime, 0);
    return total / renderMetrics.length;
  }, [metrics]);

  const getAverageInteractionTime = useCallback(() => {
    const interactionMetrics = metrics.filter(m => m.interactionTime > 0);
    if (interactionMetrics.length === 0) return 0;
    
    const total = interactionMetrics.reduce((sum, m) => sum + m.interactionTime, 0);
    return total / interactionMetrics.length;
  }, [metrics]);

  const getMemoryUsage = useCallback(() => {
    if (!enableMemoryTracking || !('memory' in performance)) return null;
    
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit
    };
  }, [enableMemoryTracking]);

  const clearMetrics = useCallback(() => {
    setMetrics([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      renderStartTime.current = 0;
      interactionStartTime.current = 0;
    };
  }, []);

  return {
    metrics,
    startRender,
    endRender,
    startInteraction,
    endInteraction,
    getAverageRenderTime,
    getAverageInteractionTime,
    getMemoryUsage,
    clearMetrics
  };
};

export default usePerformanceMonitoring;
