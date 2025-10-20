import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { moderateRateLimit } from "../middlewares/rateLimiter";
import { adminOnly } from "../middlewares/security";
import prisma from "../prisma/client";
import DatabaseOptimizationService from "../services/DatabaseOptimizationService";

const app = new Hono();

// Apply admin authentication to all routes
app.use("*", adminOnly);

// Validation schemas
const optimizationOptionsSchema = z.object({
  includeCleanup: z.boolean().default(true),
  includeIndexes: z.boolean().default(true),
  includeStatistics: z.boolean().default(true)
});

// GET /database-optimization/status - Get database optimization status
app.get("/status", moderateRateLimit, async (c) => {
  try {
    const optimizationService = new DatabaseOptimizationService(prisma);

    const [metrics, health] = await Promise.all([
      optimizationService.getPerformanceMetrics(),
      optimizationService.checkDatabaseHealth()
    ]);

    return c.json({
      data: {
        health,
        lastChecked: new Date().toISOString(),
        metrics
      },
      success: true
    });
  } catch (error) {
    return c.json(
      {
        error: "Failed to get database status",
        message: error instanceof Error ? error.message : "Unknown error",
        success: false
      },
      500
    );
  }
});

// POST /database-optimization/optimize - Run database optimization
app.post(
  "/optimize",
  moderateRateLimit,
  zValidator("json", optimizationOptionsSchema),
  async (c) => {
    try {
      const options = c.req.valid("json");
      const optimizationService = new DatabaseOptimizationService(prisma);

      const result = await optimizationService.optimizeDatabase();

      return c.json({
        data: {
          message: result.message,
          optimizationsApplied: result.optimizationsApplied,
          options,
          timestamp: new Date().toISOString()
        },
        success: result.success
      });
    } catch (error) {
      return c.json(
        {
          error: "Database optimization failed",
          message: error instanceof Error ? error.message : "Unknown error",
          success: false
        },
        500
      );
    }
  }
);

// GET /database-optimization/metrics - Get database performance metrics
app.get("/metrics", moderateRateLimit, async (c) => {
  try {
    const optimizationService = new DatabaseOptimizationService(prisma);
    const metrics = await optimizationService.getPerformanceMetrics();

    return c.json({
      data: metrics,
      success: true
    });
  } catch (error) {
    return c.json(
      {
        error: "Failed to get database metrics",
        message: error instanceof Error ? error.message : "Unknown error",
        success: false
      },
      500
    );
  }
});

// GET /database-optimization/health - Check database health
app.get("/health", moderateRateLimit, async (c) => {
  try {
    const optimizationService = new DatabaseOptimizationService(prisma);
    const health = await optimizationService.checkDatabaseHealth();

    return c.json({
      data: health,
      success: true
    });
  } catch (error) {
    return c.json(
      {
        error: "Failed to check database health",
        message: error instanceof Error ? error.message : "Unknown error",
        success: false
      },
      500
    );
  }
});

// POST /database-optimization/analyze-queries - Analyze slow queries
app.post("/analyze-queries", moderateRateLimit, async (c) => {
  try {
    const optimizationService = new DatabaseOptimizationService(prisma);

    // This would typically analyze pg_stat_statements in a real implementation
    const analysis = await optimizationService.analyzeQueryPerformance();

    return c.json({
      data: {
        analysis,
        timestamp: new Date().toISOString()
      },
      success: true
    });
  } catch (error) {
    return c.json(
      {
        error: "Failed to analyze queries",
        message: error instanceof Error ? error.message : "Unknown error",
        success: false
      },
      500
    );
  }
});

// GET /database-optimization/recommendations - Get optimization recommendations
app.get("/recommendations", moderateRateLimit, async (c) => {
  try {
    const optimizationService = new DatabaseOptimizationService(prisma);

    const [health, missingIndexes] = await Promise.all([
      optimizationService.checkDatabaseHealth(),
      optimizationService.checkMissingIndexes()
    ]);

    const recommendations = [...health.recommendations, ...missingIndexes];

    return c.json({
      data: {
        recommendations,
        timestamp: new Date().toISOString(),
        totalRecommendations: recommendations.length
      },
      success: true
    });
  } catch (error) {
    return c.json(
      {
        error: "Failed to get recommendations",
        message: error instanceof Error ? error.message : "Unknown error",
        success: false
      },
      500
    );
  }
});

// GET /database-optimization/ - Root endpoint with service information
app.get("/", async (c) => {
  return c.json({
    description: "Database optimization and performance monitoring",
    endpoints: {
      "GET /health": "Check database health",
      "GET /metrics": "Get database performance metrics",
      "GET /recommendations": "Get optimization recommendations",
      "GET /status": "Get database optimization status",
      "POST /analyze-queries": "Analyze slow queries",
      "POST /optimize": "Run database optimization"
    },
    features: {
      "Automated Optimization": "Run automated database optimizations",
      "Health Checks": "Monitor database health and identify issues",
      "Index Management":
        "Check for missing indexes and optimization opportunities",
      "Performance Monitoring": "Monitor database performance metrics",
      "Query Analysis": "Analyze slow queries and optimization opportunities"
    },
    service: "Database Optimization Service"
  });
});

export default app;
