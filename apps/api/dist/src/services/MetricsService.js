"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
class MetricsService {
    metrics = [];
    requestMetrics = [];
    databaseMetrics = [];
    cacheMetrics = [];
    maxMetrics = 10000; // Keep last 10k metrics in memory
    /**
     * Record a custom metric
     */
    recordMetric(name, value, tags) {
        const metric = {
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
        logger_1.default.debug(`Metric recorded: ${name} = ${value}`, { tags });
    }
    /**
     * Record request metrics
     */
    recordRequest(metrics) {
        this.requestMetrics.push(metrics);
        // Keep only the last maxMetrics entries
        if (this.requestMetrics.length > this.maxMetrics) {
            this.requestMetrics = this.requestMetrics.slice(-this.maxMetrics);
        }
        logger_1.default.debug(`Request metrics recorded: ${metrics.method} ${metrics.path} - ${metrics.statusCode} (${metrics.duration}ms)`);
    }
    /**
     * Record database operation metrics
     */
    recordDatabase(metrics) {
        this.databaseMetrics.push(metrics);
        // Keep only the last maxMetrics entries
        if (this.databaseMetrics.length > this.maxMetrics) {
            this.databaseMetrics = this.databaseMetrics.slice(-this.maxMetrics);
        }
        logger_1.default.debug(`Database metrics recorded: ${metrics.operation} on ${metrics.table} - ${metrics.success ? "success" : "failed"} (${metrics.duration}ms)`);
    }
    /**
     * Record cache operation metrics
     */
    recordCache(metrics) {
        this.cacheMetrics.push(metrics);
        // Keep only the last maxMetrics entries
        if (this.cacheMetrics.length > this.maxMetrics) {
            this.cacheMetrics = this.cacheMetrics.slice(-this.maxMetrics);
        }
        logger_1.default.debug(`Cache metrics recorded: ${metrics.operation} on ${metrics.key} - ${metrics.success ? "success" : "failed"} (${metrics.duration}ms)`);
    }
    /**
     * Get request statistics
     */
    getRequestStats(timeWindowMinutes = 60) {
        const cutoff = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
        const recentRequests = this.requestMetrics.filter((r) => r.timestamp > cutoff);
        const totalRequests = recentRequests.length;
        const averageResponseTime = totalRequests > 0
            ? recentRequests.reduce((sum, r) => sum + r.duration, 0) / totalRequests
            : 0;
        const errorRequests = recentRequests.filter((r) => r.statusCode >= 400).length;
        const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;
        const requestsByMethod = recentRequests.reduce((acc, r) => {
            acc[r.method] = (acc[r.method] || 0) + 1;
            return acc;
        }, {});
        const requestsByStatus = recentRequests.reduce((acc, r) => {
            const status = Math.floor(r.statusCode / 100) * 100;
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        const endpointStats = recentRequests.reduce((acc, r) => {
            if (!acc[r.path]) {
                acc[r.path] = { count: 0, totalDuration: 0 };
            }
            acc[r.path].count++;
            acc[r.path].totalDuration += r.duration;
            return acc;
        }, {});
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
    getDatabaseStats(timeWindowMinutes = 60) {
        const cutoff = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
        const recentOps = this.databaseMetrics.filter((m) => m.timestamp > cutoff);
        const totalOperations = recentOps.length;
        const averageDuration = totalOperations > 0
            ? recentOps.reduce((sum, op) => sum + op.duration, 0) / totalOperations
            : 0;
        const successfulOps = recentOps.filter((op) => op.success).length;
        const successRate = totalOperations > 0 ? (successfulOps / totalOperations) * 100 : 0;
        const operationsByTable = recentOps.reduce((acc, op) => {
            acc[op.table] = (acc[op.table] || 0) + 1;
            return acc;
        }, {});
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
    getCacheStats(timeWindowMinutes = 60) {
        const cutoff = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
        const recentOps = this.cacheMetrics.filter((m) => m.timestamp > cutoff);
        const totalOperations = recentOps.length;
        const hits = recentOps.filter((op) => op.operation === "hit").length;
        const misses = recentOps.filter((op) => op.operation === "miss").length;
        const totalReads = hits + misses;
        const hitRate = totalReads > 0 ? (hits / totalReads) * 100 : 0;
        const missRate = totalReads > 0 ? (misses / totalReads) * 100 : 0;
        const averageDuration = totalOperations > 0
            ? recentOps.reduce((sum, op) => sum + op.duration, 0) / totalOperations
            : 0;
        const operationsByType = recentOps.reduce((acc, op) => {
            acc[op.operation] = (acc[op.operation] || 0) + 1;
            return acc;
        }, {});
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
    getSystemHealth() {
        const requestStats = this.getRequestStats(5); // Last 5 minutes
        const databaseStats = this.getDatabaseStats(5);
        const cacheStats = this.getCacheStats(5);
        const alerts = [];
        let status = "healthy";
        // Check request error rate
        if (requestStats.errorRate > 10) {
            alerts.push(`High error rate: ${requestStats.errorRate.toFixed(2)}%`);
            status = "unhealthy";
        }
        else if (requestStats.errorRate > 5) {
            alerts.push(`Elevated error rate: ${requestStats.errorRate.toFixed(2)}%`);
            status = "degraded";
        }
        // Check database error rate
        if (databaseStats.successRate < 90) {
            alerts.push(`Low database success rate: ${databaseStats.successRate.toFixed(2)}%`);
            status = "unhealthy";
        }
        else if (databaseStats.successRate < 95) {
            alerts.push(`Degraded database success rate: ${databaseStats.successRate.toFixed(2)}%`);
            status = status === "healthy" ? "degraded" : status;
        }
        // Check response time
        if (requestStats.averageResponseTime > 5000) {
            alerts.push(`High average response time: ${requestStats.averageResponseTime.toFixed(2)}ms`);
            status = "unhealthy";
        }
        else if (requestStats.averageResponseTime > 2000) {
            alerts.push(`Elevated average response time: ${requestStats.averageResponseTime.toFixed(2)}ms`);
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
    clearMetrics() {
        this.metrics = [];
        this.requestMetrics = [];
        this.databaseMetrics = [];
        this.cacheMetrics = [];
        logger_1.default.info("All metrics cleared");
    }
    /**
     * Export metrics for external monitoring
     */
    exportMetrics() {
        return {
            cache: [...this.cacheMetrics],
            custom: [...this.metrics],
            database: [...this.databaseMetrics],
            requests: [...this.requestMetrics]
        };
    }
}
exports.MetricsService = MetricsService;
exports.default = new MetricsService();
