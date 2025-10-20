/**
 * Performance monitoring and optimization service
 */

interface PerformanceMetric {
  id: string;
  component: string;
  type: "render" | "api" | "navigation" | "user-interaction";
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PerformanceThresholds {
  render: number; // ms
  api: number; // ms
  navigation: number; // ms
  memory: number; // MB
}

class PerformanceService {
  private static instance: PerformanceService;
  private metrics: PerformanceMetric[] = [];
  private thresholds: PerformanceThresholds = {
    api: 1000, // 1s
    memory: 100, // 100MB
    navigation: 500, // 500ms
    render: 16 // 60fps
  };

  private constructor() {
    this.setupPerformanceObserver();
  }

  public static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  /**
   * Track component render performance
   */
  public trackRender(
    component: string,
    startTime: number,
    endTime: number,
    metadata?: Record<string, any>
  ): void {
    const duration = endTime - startTime;
    this.addMetric({
      component,
      duration,
      id: this.generateId(),
      metadata,
      timestamp: Date.now(),
      type: "render"
    });

    if (duration > this.thresholds.render) {
      this.reportSlowRender(component, duration);
    }
  }

  /**
   * Track API call performance
   */
  public trackApiCall(
    endpoint: string,
    startTime: number,
    endTime: number,
    metadata?: Record<string, any>
  ): void {
    const duration = endTime - startTime;
    this.addMetric({
      component: endpoint,
      duration,
      id: this.generateId(),
      metadata,
      timestamp: Date.now(),
      type: "api"
    });

    if (duration > this.thresholds.api) {
      this.reportSlowApi(endpoint, duration);
    }
  }

  /**
   * Track navigation performance
   */
  public trackNavigation(
    route: string,
    startTime: number,
    endTime: number,
    metadata?: Record<string, any>
  ): void {
    const duration = endTime - startTime;
    this.addMetric({
      component: route,
      duration,
      id: this.generateId(),
      metadata,
      timestamp: Date.now(),
      type: "navigation"
    });

    if (duration > this.thresholds.navigation) {
      this.reportSlowNavigation(route, duration);
    }
  }

  /**
   * Track user interaction performance
   */
  public trackUserInteraction(
    action: string,
    startTime: number,
    endTime: number,
    metadata?: Record<string, any>
  ): void {
    const duration = endTime - startTime;
    this.addMetric({
      component: action,
      duration,
      id: this.generateId(),
      metadata,
      timestamp: Date.now(),
      type: "user-interaction"
    });
  }

  /**
   * Get performance metrics for a component
   */
  public getComponentMetrics(component: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.component === component);
  }

  /**
   * Get performance summary
   */
  public getPerformanceSummary(): {
    totalMetrics: number;
    averageRenderTime: number;
    averageApiTime: number;
    slowComponents: string[];
    recommendations: string[];
  } {
    const renderMetrics = this.metrics.filter((m) => m.type === "render");
    const apiMetrics = this.metrics.filter((m) => m.type === "api");

    const averageRenderTime =
      renderMetrics.length > 0
        ? renderMetrics.reduce((sum, m) => sum + m.duration, 0) /
          renderMetrics.length
        : 0;

    const averageApiTime =
      apiMetrics.length > 0
        ? apiMetrics.reduce((sum, m) => sum + m.duration, 0) / apiMetrics.length
        : 0;

    const slowComponents = this.metrics
      .filter((m) => m.duration > this.thresholds.render)
      .map((m) => m.component);

    const recommendations = this.generateRecommendations();

    return {
      averageApiTime,
      averageRenderTime,
      recommendations,
      slowComponents: [...new Set(slowComponents)],
      totalMetrics: this.metrics.length
    };
  }

  /**
   * Clear old metrics
   */
  public clearOldMetrics(olderThanMs = 300000): void {
    // 5 minutes
    const cutoff = Date.now() - olderThanMs;
    this.metrics = this.metrics.filter((m) => m.timestamp > cutoff);
  }

  /**
   * Set custom thresholds
   */
  public setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  private generateId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupPerformanceObserver(): void {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
      return;
    }

    // Observe long tasks
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            // Tasks longer than 50ms
            console.warn(`Long task detected: ${entry.duration}ms`);
          }
        }
      });
      longTaskObserver.observe({ entryTypes: ["longtask"] });
    } catch (error) {
      // Long task observer not supported
    }

    // Observe memory usage
    if ("memory" in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;

        if (usedMB > this.thresholds.memory) {
          console.warn(`High memory usage detected: ${usedMB.toFixed(2)}MB`);
        }
      }, 10000); // Check every 10 seconds
    }
  }

  private reportSlowRender(component: string, duration: number): void {
    if (process.env.NODE_ENV === "development") {
      console.warn(`🐌 Slow render in ${component}: ${duration.toFixed(2)}ms`);
    }
  }

  private reportSlowApi(endpoint: string, duration: number): void {
    if (process.env.NODE_ENV === "development") {
      console.warn(`🐌 Slow API call to ${endpoint}: ${duration.toFixed(2)}ms`);
    }
  }

  private reportSlowNavigation(route: string, duration: number): void {
    if (process.env.NODE_ENV === "development") {
      console.warn(`🐌 Slow navigation to ${route}: ${duration.toFixed(2)}ms`);
    }
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Calculate metrics directly to avoid recursion
    const renderMetrics = this.metrics.filter(m => m.type === 'render');
    const apiMetrics = this.metrics.filter(m => m.type === 'api');
    
    const averageRenderTime = renderMetrics.length > 0 
      ? renderMetrics.reduce((sum, m) => sum + m.duration, 0) / renderMetrics.length 
      : 0;
    
    const averageApiTime = apiMetrics.length > 0 
      ? apiMetrics.reduce((sum, m) => sum + m.duration, 0) / apiMetrics.length 
      : 0;

    const slowComponents = this.metrics
      .filter(m => m.duration > this.thresholds.render)
      .map(m => m.component);

    if (averageRenderTime > this.thresholds.render) {
      recommendations.push(
        "Consider using React.memo() for expensive components"
      );
      recommendations.push("Implement useMemo() for expensive calculations");
      recommendations.push("Use useCallback() for event handlers");
    }

    if (averageApiTime > this.thresholds.api) {
      recommendations.push("Implement API response caching");
      recommendations.push("Add loading states for better UX");
      recommendations.push("Consider pagination for large datasets");
    }

    if (slowComponents.length > 0) {
      recommendations.push(
        `Optimize these components: ${slowComponents.join(", ")}`
      );
    }

    return recommendations;
  }
}

export const performanceService = PerformanceService.getInstance();
export default performanceService;
