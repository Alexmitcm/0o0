import { useCallback, useEffect, useRef, useState } from "react";

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentCount: number;
  reRenderCount: number;
}

interface PerformanceOptimizerOptions {
  enableMemoryTracking?: boolean;
  enableRenderTracking?: boolean;
  enableReRenderTracking?: boolean;
  maxMetrics?: number;
  reportInterval?: number;
}

export const usePerformanceOptimizer = (
  componentName: string,
  options: PerformanceOptimizerOptions = {}
) => {
  const {
    enableMemoryTracking = true,
    enableRenderTracking = true,
    enableReRenderTracking = true,
    maxMetrics = 50,
    reportInterval = 5000
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const renderStartTime = useRef<number>(0);
  const reRenderCount = useRef<number>(0);
  const componentCount = useRef<number>(0);
  const lastReportTime = useRef<number>(0);

  // Track render performance
  const startRender = useCallback(() => {
    if (enableRenderTracking) {
      renderStartTime.current = performance.now();
    }
  }, [enableRenderTracking]);

  const endRender = useCallback(() => {
    if (!enableRenderTracking || renderStartTime.current === 0) return;

    const renderTime = performance.now() - renderStartTime.current;
    const timestamp = Date.now();

    const newMetric: PerformanceMetrics = {
      componentCount: componentCount.current,
      memoryUsage: 0,
      renderTime,
      reRenderCount: reRenderCount.current
    };

    if (enableMemoryTracking && "memory" in performance) {
      const memory = (performance as any).memory;
      newMetric.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
    }

    setMetrics((prev) => {
      const updated = [...prev, newMetric];
      return updated.length > maxMetrics ? updated.slice(-maxMetrics) : updated;
    });

    renderStartTime.current = 0;
  }, [enableRenderTracking, enableMemoryTracking, maxMetrics]);

  // Track re-renders
  const trackReRender = useCallback(() => {
    if (enableReRenderTracking) {
      reRenderCount.current += 1;
    }
  }, [enableReRenderTracking]);

  // Track component count
  const trackComponent = useCallback(() => {
    componentCount.current += 1;
  }, []);

  // Performance reporting
  const reportPerformance = useCallback(() => {
    if (metrics.length === 0) return;

    const avgRenderTime =
      metrics.reduce((sum, m) => sum + m.renderTime, 0) / metrics.length;
    const avgMemoryUsage =
      metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length;
    const totalReRenders = metrics[metrics.length - 1]?.reRenderCount || 0;

    if (process.env.NODE_ENV === "development") {
      console.group(`🚀 Performance Report - ${componentName}`);
      console.log(`Average Render Time: ${avgRenderTime.toFixed(2)}ms`);
      console.log(`Average Memory Usage: ${avgMemoryUsage.toFixed(2)}MB`);
      console.log(`Total Re-renders: ${totalReRenders}`);
      console.log(`Component Count: ${componentCount.current}`);
      console.groupEnd();
    }

    // Report to analytics in production
    if (process.env.NODE_ENV === "production") {
      // analytics.track('performance_metrics', {
      //   component: componentName,
      //   avgRenderTime,
      //   avgMemoryUsage,
      //   totalReRenders,
      //   componentCount: componentCount.current,
      // });
    }
  }, [componentName, metrics]);

  // Auto-report performance
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastReportTime.current >= reportInterval) {
        reportPerformance();
        lastReportTime.current = now;
      }
    }, reportInterval);

    return () => clearInterval(interval);
  }, [reportPerformance, reportInterval]);

  // Performance warnings
  const checkPerformanceWarnings = useCallback(() => {
    if (metrics.length < 5) return; // Need at least 5 samples

    const recentMetrics = metrics.slice(-5);
    const avgRenderTime =
      recentMetrics.reduce((sum, m) => sum + m.renderTime, 0) / 5;
    const avgMemoryUsage =
      recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / 5;

    if (avgRenderTime > 16) {
      // More than 16ms (60fps threshold)
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `⚠️ ${componentName}: Slow render time detected (${avgRenderTime.toFixed(2)}ms)`
        );
      }
    }

    if (avgMemoryUsage > 100) {
      // More than 100MB
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `⚠️ ${componentName}: High memory usage detected (${avgMemoryUsage.toFixed(2)}MB)`
        );
      }
    }

    if (reRenderCount.current > 10) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `⚠️ ${componentName}: Excessive re-renders detected (${reRenderCount.current})`
        );
      }
    }
  }, [componentName, metrics, reRenderCount]);

  // Check warnings when metrics update
  useEffect(() => {
    checkPerformanceWarnings();
  }, [checkPerformanceWarnings]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      reportPerformance();
    };
  }, [reportPerformance]);

  return {
    endRender,
    metrics,
    performanceScore: calculatePerformanceScore(metrics),
    reportPerformance,
    startRender,
    trackComponent,
    trackReRender
  };
};

// Calculate performance score (0-100)
const calculatePerformanceScore = (metrics: PerformanceMetrics[]): number => {
  if (metrics.length === 0) return 100;

  const avgRenderTime =
    metrics.reduce((sum, m) => sum + m.renderTime, 0) / metrics.length;
  const avgMemoryUsage =
    metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length;
  const totalReRenders = metrics[metrics.length - 1]?.reRenderCount || 0;

  let score = 100;

  // Deduct points for slow renders
  if (avgRenderTime > 16) {
    score -= Math.min(30, (avgRenderTime - 16) * 2);
  }

  // Deduct points for high memory usage
  if (avgMemoryUsage > 50) {
    score -= Math.min(20, (avgMemoryUsage - 50) * 0.4);
  }

  // Deduct points for excessive re-renders
  if (totalReRenders > 5) {
    score -= Math.min(20, (totalReRenders - 5) * 2);
  }

  return Math.max(0, Math.round(score));
};
