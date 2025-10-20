import "dotenv/config";
import logger from "@hey/helpers/logger";

import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import authContext from "./context/authContext";
import cors from "./middlewares/cors";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import infoLogger from "./middlewares/infoLogger";
import requestId from "./middlewares/requestId";
import {
  gameIframeErrorHandler,
  requestSizeLimit,
  sanitizeRequest,
  securityHeaders,
  sqlInjectionProtection,
  xssProtection
} from "./middlewares/security";
import adminRouter from "./routes/admin";
import adminCoinsRouter from "./routes/admin/coins";
import adminJobsRouter from "./routes/admin/jobs";
import adminTournamentsRouter from "./routes/admin/tournaments";
import adminFeaturesRouter from "./routes/admin-features";
import adminPanelEnhancedRouter from "./routes/admin-panel-enhanced";
import adminSystemRouter from "./routes/admin-system";
import analyticsRouter from "./routes/analytics";
import analyticsReportingRouter from "./routes/analytics-reporting";
import authRouter from "./routes/auth";
import backupSystemRouter from "./routes/backup-system";
import banSecurityRouter from "./routes/ban-security";
import blockchainIntegrationRouter from "./routes/blockchain-integration";
import captchaSystemRouter from "./routes/captcha-system";
import coinSystemRouter from "./routes/coin-system";
import coinSystemEnhancedRouter from "./routes/coin-system-enhanced";
import coinsRouter from "./routes/coins";
import contentManagementRouter from "./routes/content-management";
import cronRouter from "./routes/cron";
import csvGeneratorRouter from "./routes/csv-generator";
import d3VisualizationRouter from "./routes/d3-visualization";
import { apiDocs } from "./routes/docs";
import dualAuthRouter from "./routes/dual-auth";
import eqLevelsRouter from "./routes/eq-levels";
import eqLevelsSystemRouter from "./routes/eq-levels-system";
import fileUploadSystemRouter from "./routes/file-upload-system";
import gamesRouter from "./routes/games";
import { getGames } from "./routes/games/getGames";
import { healthCheck, livenessCheck, readinessCheck } from "./routes/health";
import htmlInterfacesRouter from "./routes/html-interfaces";
import leaderboardRouter from "./routes/leaderboard";
import lensRouter from "./routes/lens";
import liveRouter from "./routes/live";
import lootBoxRouter from "./routes/lootbox";
import metadataRouter from "./routes/metadata";
import metricsRouter from "./routes/metrics";
import notificationSystemRouter from "./routes/notification-system/index";
import notificationSystemEnhancedRouter from "./routes/notification-system-enhanced";
import oembedRouter from "./routes/oembed";
import ogRouter from "./routes/og";
import ping from "./routes/ping";
import preferencesRouter from "./routes/preferences";
import premiumV2Router from "./routes/premium/v2";
import pythonTestingRouter from "./routes/python-testing";
import referralRefreshRouter from "./routes/referral/refresh";
import referralRouter from "./routes/referral/tree";
import rewardsBalanceRouter from "./routes/rewards/balance";
import rpcRouter from "./routes/rpc";
import securityFeaturesRouter from "./routes/security-features";
import simpleAuthRouter from "./routes/simple-auth";
import sitemapRouter from "./routes/sitemap";
import smartPremiumRouter from "./routes/smart-premium";
import generateTestJwt from "./routes/test-jwt";
import tournamentSystemRouter from "./routes/tournament-system";
import tournamentSystemEnhancedRouter from "./routes/tournament-system-enhanced";
import tournamentsRouter from "./routes/tournaments";
import transactionSystemRouter from "./routes/transaction-system";
import transactionsRouter from "./routes/transactions";
import userLogRouter from "./routes/user-log";
// Enhanced routes from PHP backend integration
import userLogSystemRouter from "./routes/user-log-system";
import userManagementRouter from "./routes/user-management";
import usersRouter from "./routes/users";
import visNetworkRouter from "./routes/vis-network";
import MetricsService from "./services/MetricsService";
import type { AppContext } from "./types/context";

const app = new Hono<AppContext>();

// Global middleware stack
app.use(cors);
app.use(requestId);
app.use(securityHeaders);
app.use(sanitizeRequest);
app.use(requestSizeLimit(10 * 1024 * 1024)); // 10MB limit
app.use(sqlInjectionProtection);
app.use(xssProtection);
app.use(gameIframeErrorHandler);
app.use(authContext);
app.use(infoLogger);

// Request metrics middleware
app.use(async (c, next) => {
  const start = Date.now();
  const requestId = c.get("requestId");

  await next();

  const duration = Date.now() - start;
  const walletAddress = c.get("walletAddress");

  MetricsService.recordRequest({
    duration,
    ip:
      c.req.header("cf-connecting-ip") ||
      c.req.header("x-real-ip") ||
      "unknown",
    method: c.req.method,
    path: c.req.path,
    requestId: requestId || "unknown",
    statusCode: c.res.status,
    timestamp: new Date(),
    userAgent: c.req.header("user-agent") || undefined,
    userId: walletAddress || undefined
  });
});

// Static file serving for uploads (serve from apps/api working dir)
app.use("/uploads/*", serveStatic({ root: "." }));

// Health and monitoring routes
app.get("/ping", ping);
app.get("/health", healthCheck);
app.get("/health/ready", readinessCheck);
app.get("/health/live", livenessCheck);
app.get("/docs", apiDocs);

// API routes
app.route("/auth", authRouter);
app.route("/simple-auth", simpleAuthRouter);
app.route("/dual-auth", dualAuthRouter);
app.route("/smart-premium", smartPremiumRouter);
app.route("/admin", adminRouter);
app.route("/admin/coins", adminCoinsRouter);
app.route("/admin/tournaments", adminTournamentsRouter);
app.route("/admin/jobs", adminJobsRouter);
app.route("/coins", coinsRouter);
app.route("/leaderboard", leaderboardRouter);
app.route("/lens", lensRouter);
app.route("/lootbox", lootBoxRouter);
app.route("/cron", cronRouter);
// Ensure root list route resolves even if sub-router mounting differs in some environments
app.get("/games", getGames);
app.route("/games", gamesRouter);
app.route("/live", liveRouter);
app.route("/metadata", metadataRouter);
app.route("/oembed", oembedRouter);
app.route("/preferences", preferencesRouter);
app.route("/premium/v2", premiumV2Router);
app.route("/referral", referralRouter);
app.route("/referral/refresh", referralRefreshRouter);
app.route("/tournaments", tournamentsRouter);
app.route("/users", usersRouter);
app.route("/coin-system", coinSystemRouter);
app.route("/api/coin-system", coinSystemRouter);
app.route("/tournament-system", tournamentSystemRouter);
app.route("/notification-system", notificationSystemRouter);
app.route("/transaction-system", transactionSystemRouter);
app.route("/captcha-system", captchaSystemRouter);
app.route("/admin-system", adminSystemRouter);

// Enhanced routes from PHP backend integration
app.route("/user-management", userManagementRouter);
app.route("/coin-system-enhanced", coinSystemEnhancedRouter);
app.route("/tournament-system-enhanced", tournamentSystemEnhancedRouter);
app.route("/notification-system-enhanced", notificationSystemEnhancedRouter);
app.route("/admin-panel", adminPanelEnhancedRouter);
app.route("/security", securityFeaturesRouter);
app.route("/file-upload", fileUploadSystemRouter);
app.route("/blockchain", blockchainIntegrationRouter);
app.route("/analytics", analyticsReportingRouter);

// Additional systems from PHP backend
app.route("/eq-levels", eqLevelsSystemRouter);
app.route("/eq-levels-new", eqLevelsRouter);
app.route("/user-log", userLogSystemRouter);
app.route("/user-log-new", userLogRouter);
app.route("/ban-security", banSecurityRouter);
app.route("/transactions", transactionsRouter);
app.route("/content-management", contentManagementRouter);
app.route("/analytics-new", analyticsRouter);
app.route("/referral-new", referralRouter);
app.route("/tournament-system-new", tournamentSystemRouter);
app.route("/notification-system-new", notificationSystemRouter);
app.route("/admin-features", adminFeaturesRouter);
app.route("/backup", backupSystemRouter);
app.route("/csv-generator", csvGeneratorRouter);
app.route("/d3-visualization", d3VisualizationRouter);
app.route("/vis-network", visNetworkRouter);
app.route("/html-interfaces", htmlInterfacesRouter);
app.route("/python-testing", pythonTestingRouter);

app.route("/rewards/balance", rewardsBalanceRouter);
app.route("/rpc", rpcRouter);
app.route("/sitemap", sitemapRouter);
app.route("/metrics", metricsRouter);
app.route("/og", ogRouter);

// Test endpoint for generating JWT tokens
app.post("/test-jwt", generateTestJwt);

// Serve static files from games-main directory
app.use("/games-main/*", serveStatic({ root: "../../" }));

// Error handling
app.onError((err: Error, c) => errorHandler(err, c as any));
app.notFound((c) => notFoundHandler(c as any));

const port = Number.parseInt(process.env.PORT || "8080", 10);

// Start server with WebSocket support
serve({ fetch: app.fetch, hostname: "0.0.0.0", port }, (info) => {
  logger.info(`Server running on port ${info.port}`);
  logger.info("WebSocket service initialized");
  logger.info("Admin service initialized");
  // Start blockchain listener (non-fatal if misconfigured)
  // Temporarily disabled for development
  // try {
  //   BlockchainListenerService.start();
  // } catch (error) {
  //   logger.warn("Failed to start BlockchainListenerService:", error);
  // }
});

// Handle server shutdown gracefully
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  process.exit(0);
});
