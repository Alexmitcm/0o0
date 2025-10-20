"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.livenessCheck = exports.readinessCheck = exports.healthCheck = void 0;
const enums_1 = require("@hey/data/enums");
const client_1 = __importDefault(require("../prisma/client"));
const CacheService_1 = __importDefault(require("../services/CacheService"));
const MetricsService_1 = __importDefault(require("../services/MetricsService"));
const logger_1 = __importDefault(require("../utils/logger"));
const healthCheck = async (c) => {
    const start = Date.now();
    const checks = {};
    // Database health check
    const dbStart = Date.now();
    try {
        await client_1.default.$queryRaw `SELECT 1`;
        checks.database = {
            duration: Date.now() - dbStart,
            status: "healthy"
        };
    }
    catch (error) {
        checks.database = {
            duration: Date.now() - dbStart,
            error: error instanceof Error ? error.message : "Unknown error",
            status: "unhealthy"
        };
    }
    // Redis health check
    const redisStart = Date.now();
    try {
        await CacheService_1.default.set("health-check", "ok", { ttl: 10 });
        const value = await CacheService_1.default.get("health-check");
        checks.redis = {
            duration: Date.now() - redisStart,
            status: value === "ok" ? "healthy" : "unhealthy"
        };
    }
    catch (error) {
        checks.redis = {
            duration: Date.now() - redisStart,
            error: error instanceof Error ? error.message : "Unknown error",
            status: "unhealthy"
        };
    }
    // System metrics
    const systemHealth = MetricsService_1.default.getSystemHealth();
    const requestStats = MetricsService_1.default.getRequestStats(5);
    const databaseStats = MetricsService_1.default.getDatabaseStats(5);
    const cacheStats = MetricsService_1.default.getCacheStats(5);
    const totalDuration = Date.now() - start;
    const overallStatus = Object.values(checks).every((check) => check.status === "healthy")
        ? "healthy"
        : "unhealthy";
    const response = {
        data: {
            checks,
            duration: totalDuration,
            environment: process.env.NODE_ENV || "development",
            metrics: {
                cache: cacheStats,
                database: databaseStats,
                requests: requestStats,
                system: systemHealth
            },
            status: overallStatus,
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || "1.0.0"
        },
        status: enums_1.Status.Success,
        success: true
    };
    logger_1.default.info(`Health check completed: ${overallStatus} (${totalDuration}ms)`);
    return c.json(response, overallStatus === "healthy" ? 200 : 503);
};
exports.healthCheck = healthCheck;
const readinessCheck = async (c) => {
    try {
        // Check if the service is ready to accept requests
        const dbReady = await client_1.default.$queryRaw `SELECT 1`
            .then(() => true)
            .catch(() => false);
        const redisReady = await CacheService_1.default.exists("health-check")
            .then(() => true)
            .catch(() => false);
        const isReady = dbReady && redisReady;
        return c.json({
            data: {
                checks: {
                    database: dbReady,
                    redis: redisReady
                },
                ready: isReady,
                timestamp: new Date().toISOString()
            },
            status: enums_1.Status.Success,
            success: true
        }, isReady ? 200 : 503);
    }
    catch (error) {
        logger_1.default.error("Readiness check failed:", error);
        return c.json({
            error: {
                code: "READINESS_CHECK_FAILED",
                message: "Service not ready",
                timestamp: new Date().toISOString()
            },
            status: enums_1.Status.Error,
            success: false
        }, 503);
    }
};
exports.readinessCheck = readinessCheck;
const livenessCheck = async (c) => {
    // Simple liveness check - just return OK if the service is running
    return c.json({
        data: {
            alive: true,
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        },
        status: enums_1.Status.Success,
        success: true
    });
};
exports.livenessCheck = livenessCheck;
