"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const logger_1 = __importDefault(require("@hey/helpers/logger"));
const node_server_1 = require("@hono/node-server");
const serve_static_1 = require("@hono/node-server/serve-static");
const hono_1 = require("hono");
const authContext_1 = __importDefault(require("./context/authContext"));
const cors_1 = __importDefault(require("./middlewares/cors"));
const errorHandler_1 = require("./middlewares/errorHandler");
const infoLogger_1 = __importDefault(require("./middlewares/infoLogger"));
const requestId_1 = __importDefault(require("./middlewares/requestId"));
const security_1 = require("./middlewares/security");
const admin_1 = __importDefault(require("./routes/admin"));
const coins_1 = __importDefault(require("./routes/admin/coins"));
const jobs_1 = __importDefault(require("./routes/admin/jobs"));
const tournaments_1 = __importDefault(require("./routes/admin/tournaments"));
const admin_panel_enhanced_1 = __importDefault(require("./routes/admin-panel-enhanced"));
const admin_system_1 = __importDefault(require("./routes/admin-system"));
const analytics_reporting_1 = __importDefault(require("./routes/analytics-reporting"));
const auth_1 = __importDefault(require("./routes/auth"));
const backup_system_1 = __importDefault(require("./routes/backup-system"));
const blockchain_integration_1 = __importDefault(require("./routes/blockchain-integration"));
const captcha_system_1 = __importDefault(require("./routes/captcha-system"));
const coin_system_1 = __importDefault(require("./routes/coin-system"));
const coin_system_enhanced_1 = __importDefault(require("./routes/coin-system-enhanced"));
const coins_2 = __importDefault(require("./routes/coins"));
const cron_1 = __importDefault(require("./routes/cron"));
const csv_generator_1 = __importDefault(require("./routes/csv-generator"));
const d3_visualization_1 = __importDefault(require("./routes/d3-visualization"));
const docs_1 = require("./routes/docs");
const dual_auth_1 = __importDefault(require("./routes/dual-auth"));
const eq_levels_system_1 = __importDefault(require("./routes/eq-levels-system"));
const file_upload_system_1 = __importDefault(require("./routes/file-upload-system"));
const games_1 = __importDefault(require("./routes/games"));
const health_1 = require("./routes/health");
const html_interfaces_1 = __importDefault(require("./routes/html-interfaces"));
const leaderboard_1 = __importDefault(require("./routes/leaderboard"));
const lens_1 = __importDefault(require("./routes/lens"));
const live_1 = __importDefault(require("./routes/live"));
const lootbox_1 = __importDefault(require("./routes/lootbox"));
const metadata_1 = __importDefault(require("./routes/metadata"));
const metrics_1 = __importDefault(require("./routes/metrics"));
const notification_system_1 = __importDefault(require("./routes/notification-system"));
const notification_system_enhanced_1 = __importDefault(require("./routes/notification-system-enhanced"));
const oembed_1 = __importDefault(require("./routes/oembed"));
const og_1 = __importDefault(require("./routes/og"));
const ping_1 = __importDefault(require("./routes/ping"));
const preferences_1 = __importDefault(require("./routes/preferences"));
const v2_1 = __importDefault(require("./routes/premium/v2"));
const python_testing_1 = __importDefault(require("./routes/python-testing"));
const refresh_1 = __importDefault(require("./routes/referral/refresh"));
const tree_1 = __importDefault(require("./routes/referral/tree"));
const rpc_1 = __importDefault(require("./routes/rpc"));
const security_features_1 = __importDefault(require("./routes/security-features"));
const simple_auth_1 = __importDefault(require("./routes/simple-auth"));
const sitemap_1 = __importDefault(require("./routes/sitemap"));
const smart_premium_1 = __importDefault(require("./routes/smart-premium"));
const test_jwt_1 = __importDefault(require("./routes/test-jwt"));
const tournament_system_1 = __importDefault(require("./routes/tournament-system"));
const tournament_system_enhanced_1 = __importDefault(require("./routes/tournament-system-enhanced"));
const tournaments_2 = __importDefault(require("./routes/tournaments"));
const transaction_system_1 = __importDefault(require("./routes/transaction-system"));
// Enhanced routes from PHP backend integration
const user_log_system_1 = __importDefault(require("./routes/user-log-system"));
const user_management_1 = __importDefault(require("./routes/user-management"));
const users_1 = __importDefault(require("./routes/users"));
const vis_network_1 = __importDefault(require("./routes/vis-network"));
const MetricsService_1 = __importDefault(require("./services/MetricsService"));
const app = new hono_1.Hono();
// Global middleware stack
app.use(cors_1.default);
app.use(requestId_1.default);
app.use(security_1.securityHeaders);
app.use(security_1.sanitizeRequest);
app.use((0, security_1.requestSizeLimit)(10 * 1024 * 1024)); // 10MB limit
app.use(security_1.sqlInjectionProtection);
app.use(security_1.xssProtection);
app.use(security_1.gameIframeErrorHandler);
app.use(authContext_1.default);
app.use(infoLogger_1.default);
// Request metrics middleware
app.use(async (c, next) => {
    const start = Date.now();
    const requestId = c.get("requestId");
    await next();
    const duration = Date.now() - start;
    const walletAddress = c.get("walletAddress");
    MetricsService_1.default.recordRequest({
        duration,
        ip: c.req.header("cf-connecting-ip") ||
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
app.use("/uploads/*", (0, serve_static_1.serveStatic)({ root: "." }));
// Health and monitoring routes
app.get("/ping", ping_1.default);
app.get("/health", health_1.healthCheck);
app.get("/health/ready", health_1.readinessCheck);
app.get("/health/live", health_1.livenessCheck);
app.get("/docs", docs_1.apiDocs);
// API routes
app.route("/auth", auth_1.default);
app.route("/simple-auth", simple_auth_1.default);
app.route("/dual-auth", dual_auth_1.default);
app.route("/smart-premium", smart_premium_1.default);
app.route("/admin", admin_1.default);
app.route("/admin/coins", coins_1.default);
app.route("/admin/tournaments", tournaments_1.default);
app.route("/admin/jobs", jobs_1.default);
app.route("/coins", coins_2.default);
app.route("/leaderboard", leaderboard_1.default);
app.route("/lens", lens_1.default);
app.route("/lootbox", lootbox_1.default);
app.route("/cron", cron_1.default);
app.route("/games", games_1.default);
app.route("/live", live_1.default);
app.route("/metadata", metadata_1.default);
app.route("/oembed", oembed_1.default);
app.route("/preferences", preferences_1.default);
app.route("/premium/v2", v2_1.default);
app.route("/referral", tree_1.default);
app.route("/referral/refresh", refresh_1.default);
app.route("/tournaments", tournaments_2.default);
app.route("/users", users_1.default);
app.route("/coin-system", coin_system_1.default);
app.route("/tournament-system", tournament_system_1.default);
app.route("/notification-system", notification_system_1.default);
app.route("/transaction-system", transaction_system_1.default);
app.route("/captcha-system", captcha_system_1.default);
app.route("/admin-system", admin_system_1.default);
// Enhanced routes from PHP backend integration
app.route("/user-management", user_management_1.default);
app.route("/coin-system-enhanced", coin_system_enhanced_1.default);
app.route("/tournament-system-enhanced", tournament_system_enhanced_1.default);
app.route("/notification-system-enhanced", notification_system_enhanced_1.default);
app.route("/admin-panel", admin_panel_enhanced_1.default);
app.route("/security", security_features_1.default);
app.route("/file-upload", file_upload_system_1.default);
app.route("/blockchain", blockchain_integration_1.default);
app.route("/analytics", analytics_reporting_1.default);
// Additional systems from PHP backend
app.route("/eq-levels", eq_levels_system_1.default);
app.route("/user-log", user_log_system_1.default);
app.route("/backup", backup_system_1.default);
app.route("/csv-generator", csv_generator_1.default);
app.route("/d3-visualization", d3_visualization_1.default);
app.route("/vis-network", vis_network_1.default);
app.route("/html-interfaces", html_interfaces_1.default);
app.route("/python-testing", python_testing_1.default);
app.route("/rewards/balance", (await Promise.resolve().then(() => __importStar(require("./routes/rewards/balance")))).default);
app.route("/rpc", rpc_1.default);
app.route("/sitemap", sitemap_1.default);
app.route("/metrics", metrics_1.default);
app.route("/og", og_1.default);
// Test endpoint for generating JWT tokens
app.post("/test-jwt", test_jwt_1.default);
// Serve static files from games-main directory
app.use("/games-main/*", (0, serve_static_1.serveStatic)({ root: "../../" }));
// Error handling
app.onError((err, c) => (0, errorHandler_1.errorHandler)(err, c));
app.notFound((c) => (0, errorHandler_1.notFoundHandler)(c));
const port = Number.parseInt(process.env.PORT || "8080", 10);
// Start server with WebSocket support
(0, node_server_1.serve)({ fetch: app.fetch, hostname: "0.0.0.0", port }, (info) => {
    logger_1.default.info(`Server running on port ${info.port}`);
    logger_1.default.info("WebSocket service initialized");
    logger_1.default.info("Admin service initialized");
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
    logger_1.default.info("SIGTERM received, shutting down gracefully");
    process.exit(0);
});
process.on("SIGINT", () => {
    logger_1.default.info("SIGINT received, shutting down gracefully");
    process.exit(0);
});
