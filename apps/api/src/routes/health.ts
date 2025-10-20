import { Status } from "@hey/data/enums";
import type { Context } from "hono";
import prisma from "../prisma/client";
import CacheService from "../services/CacheService";
import MetricsService from "../services/MetricsService";
import logger from "../utils/logger";

export const healthCheck = async (c: Context) => {
  const start = Date.now();
  const checks: Record<
    string,
    { status: "healthy" | "unhealthy"; duration: number; error?: string }
  > = {};

  // Database health check
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      duration: Date.now() - dbStart,
      status: "healthy"
    };
  } catch (error) {
    checks.database = {
      duration: Date.now() - dbStart,
      error: error instanceof Error ? error.message : "Unknown error",
      status: "unhealthy"
    };
  }

  // Redis health check
  const redisStart = Date.now();
  try {
    await CacheService.set("health-check", "ok", { ttl: 10 });
    const value = await CacheService.get("health-check");
    checks.redis = {
      duration: Date.now() - redisStart,
      status: value === "ok" ? "healthy" : "unhealthy"
    };
  } catch (error) {
    checks.redis = {
      duration: Date.now() - redisStart,
      error: error instanceof Error ? error.message : "Unknown error",
      status: "unhealthy"
    };
  }

  // System metrics
  const systemHealth = MetricsService.getSystemHealth();
  const requestStats = MetricsService.getRequestStats(5);
  const databaseStats = MetricsService.getDatabaseStats(5);
  const cacheStats = MetricsService.getCacheStats(5);

  const totalDuration = Date.now() - start;
  const overallStatus = Object.values(checks).every(
    (check) => check.status === "healthy"
  )
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
    status: Status.Success,
    success: true
  };

  logger.info(`Health check completed: ${overallStatus} (${totalDuration}ms)`);

  return c.json(response, overallStatus === "healthy" ? 200 : 503);
};

export const readinessCheck = async (c: Context) => {
  try {
    // Check if the service is ready to accept requests
    const dbReady = await prisma.$queryRaw`SELECT 1`
      .then(() => true)
      .catch(() => false);
    const redisReady = await CacheService.exists("health-check")
      .then(() => true)
      .catch(() => false);

    const isReady = dbReady && redisReady;

    return c.json(
      {
        data: {
          checks: {
            database: dbReady,
            redis: redisReady
          },
          ready: isReady,
          timestamp: new Date().toISOString()
        },
        status: Status.Success,
        success: true
      },
      isReady ? 200 : 503
    );
  } catch (error) {
    logger.error("Readiness check failed:", error);
    return c.json(
      {
        error: {
          code: "READINESS_CHECK_FAILED",
          message: "Service not ready",
          timestamp: new Date().toISOString()
        },
        status: Status.Error,
        success: false
      },
      503
    );
  }
};

export const livenessCheck = async (c: Context) => {
  // Simple liveness check - just return OK if the service is running
  return c.json({
    data: {
      alive: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    },
    status: Status.Success,
    success: true
  });
};
