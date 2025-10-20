import logger from "../utils/logger";

export interface MetricData {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface RequestMetrics {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  requestId: string;
  userId?: string;
  userAgent?: string;
  ip?: string;
  timestamp: Date;
}

export interface DatabaseMetrics {
  operation: string;
  table: string;
  duration: number;
  success: boolean;
  error?: string;
  timestamp: Date;
}

export interface CacheMetrics {
  operation: "hit" | "miss" | "set" | "del";
  key: string;
  duration: number;
  success: boolean;
  timestamp: Date;
}

export class MetricsService {
  private metrics: MetricData[] = [];
  private requestMetrics: RequestMetrics[] = [];
  private databaseMetrics: DatabaseMetrics[] = [];
  private cacheMetrics: CacheMetrics[] = [];
  private readonly maxMetrics = 10000; // Keep last 10k metrics in memory

  /**
   * Record a custom metric
   */
  recordMetric(
    name: string,
    value: number,
    tags?: Record<string, string>
  ): void {
    const metric: MetricData = {
      name,
      tags,
      timestamp: new Date(),
      value
    };

    this.metrics.push(metric);

    // Keep only the last maxMetrics entries
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    logger.debug(`Metric recorded: ${name} = ${value}`, { tags });
  }

  /**
   * Record request metrics
   */
  recordRequest(metrics: RequestMetrics): void {
    this.requestMetrics.push(metrics);

    // Keep only the last maxMetrics entries
    if (this.requestMetrics.length > this.maxMetrics) {
      this.requestMetrics = this.requestMetrics.slice(-this.maxMetrics);
    }

    logger.debug(
      `Request metrics recorded: ${metrics.method} ${metrics.path} - ${metrics.statusCode} (${metrics.duration}ms)`
    );
  }

  /**
   * Record database operation metrics
   */
  recordDatabase(metrics: DatabaseMetrics): void {
    this.databaseMetrics.push(metrics);

    // Keep only the last maxMetrics entries
    if (this.databaseMetrics.length > this.maxMetrics) {
      this.databaseMetrics = this.databaseMetrics.slice(-this.maxMetrics);
    }

    logger.debug(
      `Database metrics recorded: ${metrics.operation} on ${metrics.table} - ${metrics.success ? "success" : "failed"} (${metrics.duration}ms)`
    );
  }

  /**
   * Record cache operation metrics
   */
  recordCache(metrics: CacheMetrics): void {
    this.cacheMetrics.push(metrics);

    // Keep only the last maxMetrics entries
    if (this.cacheMetrics.length > this.maxMetrics) {
      this.cacheMetrics = this.cacheMetrics.slice(-this.maxMetrics);
    }

    logger.debug(
      `Cache metrics recorded: ${metrics.operation} on ${metrics.key} - ${metrics.success ? "success" : "failed"} (${metrics.duration}ms)`
    );
  }

  /**
   * Get request statistics
   */
  getRequestStats(timeWindowMinutes = 60): {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    requestsByMethod: Record<string, number>;
    requestsByStatus: Record<string, number>;
    topEndpoints: Array<{ path: string; count: number; avgDuration: number }>;
  } {
    const cutoff = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    const recentRequests = this.requestMetrics.filter(
      (r) => r.timestamp > cutoff
    );

    const totalRequests = recentRequests.length;
    const averageResponseTime =
      totalRequests > 0
        ? recentRequests.reduce((sum, r) => sum + r.duration, 0) / totalRequests
        : 0;

    const errorRequests = recentRequests.filter(
      (r) => r.statusCode >= 400
    ).length;
    const errorRate =
      totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;

    const requestsByMethod = recentRequests.reduce(
      (acc, r) => {
        acc[r.method] = (acc[r.method] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const requestsByStatus = recentRequests.reduce(
      (acc, r) => {
        const status = Math.floor(r.statusCode / 100) * 100;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const endpointStats = recentRequests.reduce(
      (acc, r) => {
        if (!acc[r.path]) {
          acc[r.path] = { count: 0, totalDuration: 0 };
        }
        acc[r.path].count++;
        acc[r.path].totalDuration += r.duration;
        return acc;
      },
      {} as Record<string, { count: number; totalDuration: number }>
    );

    const topEndpoints = Object.entries(endpointStats)
      .map(([path, stats]) => ({
        avgDuration: stats.totalDuration / stats.count,
        count: stats.count,
        path
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      averageResponseTime,
      errorRate,
      requestsByMethod,
      requestsByStatus,
      topEndpoints,
      totalRequests
    };
  }

  /**
   * Get database statistics
   */
  getDatabaseStats(timeWindowMinutes = 60): {
    totalOperations: number;
    averageDuration: number;
    successRate: number;
    operationsByTable: Record<string, number>;
    slowestOperations: Array<{
      operation: string;
      table: string;
      duration: number;
    }>;
  } {
    const cutoff = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    const recentOps = this.databaseMetrics.filter((m) => m.timestamp > cutoff);

    const totalOperations = recentOps.length;
    const averageDuration =
      totalOperations > 0
        ? recentOps.reduce((sum, op) => sum + op.duration, 0) / totalOperations
        : 0;

    const successfulOps = recentOps.filter((op) => op.success).length;
    const successRate =
      totalOperations > 0 ? (successfulOps / totalOperations) * 100 : 0;

    const operationsByTable = recentOps.reduce(
      (acc, op) => {
        acc[op.table] = (acc[op.table] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const slowestOperations = recentOps
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)
      .map((op) => ({
        duration: op.duration,
        operation: op.operation,
        table: op.table
      }));

    return {
      averageDuration,
      operationsByTable,
      slowestOperations,
      successRate,
      totalOperations
    };
  }

  /**
   * Get cache statistics
   */
  getCacheStats(timeWindowMinutes = 60): {
    totalOperations: number;
    hitRate: number;
    missRate: number;
    averageDuration: number;
    operationsByType: Record<string, number>;
  } {
    const cutoff = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    const recentOps = this.cacheMetrics.filter((m) => m.timestamp > cutoff);

    const totalOperations = recentOps.length;
    const hits = recentOps.filter((op) => op.operation === "hit").length;
    const misses = recentOps.filter((op) => op.operation === "miss").length;
    const totalReads = hits + misses;

    const hitRate = totalReads > 0 ? (hits / totalReads) * 100 : 0;
    const missRate = totalReads > 0 ? (misses / totalReads) * 100 : 0;

    const averageDuration =
      totalOperations > 0
        ? recentOps.reduce((sum, op) => sum + op.duration, 0) / totalOperations
        : 0;

    const operationsByType = recentOps.reduce(
      (acc, op) => {
        acc[op.operation] = (acc[op.operation] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      averageDuration,
      hitRate,
      missRate,
      operationsByType,
      totalOperations
    };
  }

  /**
   * Get system health metrics
   */
  getSystemHealth(): {
    status: "healthy" | "degraded" | "unhealthy";
    metrics: {
      requestErrorRate: number;
      databaseErrorRate: number;
      averageResponseTime: number;
      cacheHitRate: number;
    };
    alerts: string[];
  } {
    const requestStats = this.getRequestStats(5); // Last 5 minutes
    const databaseStats = this.getDatabaseStats(5);
    const cacheStats = this.getCacheStats(5);

    const alerts: string[] = [];
    let status: "healthy" | "degraded" | "unhealthy" = "healthy";

    // Check request error rate
    if (requestStats.errorRate > 10) {
      alerts.push(`High error rate: ${requestStats.errorRate.toFixed(2)}%`);
      status = "unhealthy";
    } else if (requestStats.errorRate > 5) {
      alerts.push(`Elevated error rate: ${requestStats.errorRate.toFixed(2)}%`);
      status = "degraded";
    }

    // Check database error rate
    if (databaseStats.successRate < 90) {
      alerts.push(
        `Low database success rate: ${databaseStats.successRate.toFixed(2)}%`
      );
      status = "unhealthy";
    } else if (databaseStats.successRate < 95) {
      alerts.push(
        `Degraded database success rate: ${databaseStats.successRate.toFixed(2)}%`
      );
      status = status === "healthy" ? "degraded" : status;
    }

    // Check response time
    if (requestStats.averageResponseTime > 5000) {
      alerts.push(
        `High average response time: ${requestStats.averageResponseTime.toFixed(2)}ms`
      );
      status = "unhealthy";
    } else if (requestStats.averageResponseTime > 2000) {
      alerts.push(
        `Elevated average response time: ${requestStats.averageResponseTime.toFixed(2)}ms`
      );
      status = status === "healthy" ? "degraded" : status;
    }

    // Check cache hit rate
    if (cacheStats.hitRate < 50 && cacheStats.totalOperations > 100) {
      alerts.push(`Low cache hit rate: ${cacheStats.hitRate.toFixed(2)}%`);
      status = status === "healthy" ? "degraded" : status;
    }

    return {
      alerts,
      metrics: {
        averageResponseTime: requestStats.averageResponseTime,
        cacheHitRate: cacheStats.hitRate,
        databaseErrorRate: 100 - databaseStats.successRate,
        requestErrorRate: requestStats.errorRate
      },
      status
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.requestMetrics = [];
    this.databaseMetrics = [];
    this.cacheMetrics = [];
    logger.info("All metrics cleared");
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics(): {
    custom: MetricData[];
    requests: RequestMetrics[];
    database: DatabaseMetrics[];
    cache: CacheMetrics[];
  } {
    return {
      cache: [...this.cacheMetrics],
      custom: [...this.metrics],
      database: [...this.databaseMetrics],
      requests: [...this.requestMetrics]
    };
  }
}

export default new MetricsService();
