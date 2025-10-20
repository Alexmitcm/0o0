"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const authMiddleware_1 = __importDefault(require("../../middlewares/authMiddleware"));
const rateLimiter_1 = require("../../middlewares/rateLimiter");
const analytics_1 = require("./analytics");
const comments_1 = require("./comments");
const createCategory_1 = require("./createCategory");
const deleteGame_1 = require("./deleteGame");
const dislikeGame_1 = require("./dislikeGame");
const favorites_1 = require("./favorites");
const fetchGames_1 = require("./fetchGames");
const getCategories_1 = require("./getCategories");
const getGame_1 = require("./getGame");
const getGames_1 = require("./getGames");
const importGames_1 = require("./importGames");
const liked_1 = require("./liked");
const likeGame_1 = require("./likeGame");
const manageCategories_1 = require("./manageCategories");
const manageGames_1 = require("./manageGames");
const manageReports_1 = require("./manageReports");
const playGame_1 = require("./playGame");
const popular_1 = require("./popular");
const rateGame_1 = require("./rateGame");
const reportGame_1 = require("./reportGame");
const serveGameFile_1 = require("./serveGameFile");
const similar_1 = require("./similar");
const tags_1 = require("./tags");
const test_db_1 = require("./test-db");
const trending_1 = require("./trending");
const unlikeGame_1 = require("./unlikeGame");
const update_game_status_1 = require("./update-game-status");
const updateGame_1 = require("./updateGame");
const uploadGame_1 = require("./uploadGame");
const games = new hono_1.Hono();
// Apply rate limiting to all routes
games.use("*", rateLimiter_1.moderateRateLimit);
// Public routes
games.get("/", getGames_1.getGames);
games.get("/test-db", test_db_1.testDb);
games.get("/update-status", update_game_status_1.updateGameStatus);
games.get("/categories", getCategories_1.getCategories);
games.get("/tags", tags_1.getTags);
games.get("/trending", trending_1.getTrendingGames);
games.get("/popular", popular_1.getPopularGames);
games.get("/liked", liked_1.getLikedGames);
// Management routes (temporarily public for development)
games.get("/manage", manageGames_1.getManagedGames);
games.post("/manage", manageGames_1.createGame);
games.put("/manage/:id", manageGames_1.updateGame);
games.delete("/manage/:id", manageGames_1.deleteGame);
games.get("/manage/stats", manageGames_1.getGameStats);
games.get("/manage/reports", manageReports_1.getGameReports);
games.delete("/manage/reports/:id", manageReports_1.deleteGameReport);
// Category management routes (temporarily public for development)
games.get("/manage/categories", manageCategories_1.getManagedCategories);
games.post("/manage/categories", manageCategories_1.createCategory);
games.put("/manage/categories/:id", manageCategories_1.updateCategory);
games.delete("/manage/categories/:id", manageCategories_1.deleteCategory);
games.get("/manage/categories/stats", manageCategories_1.getCategoryStats);
// Analytics and stats (static routes first)
games.get("/analytics", analytics_1.getGameAnalytics);
// Favorites (static routes first)
games.get("/favorites", favorites_1.getUserFavorites);
// Comments and social features (static routes first)
games.post("/comments/:commentId/like", comments_1.likeComment);
// Game-specific action routes (must come before general slug route)
games.post("/:slug/like", likeGame_1.likeGame);
games.post("/:slug/unlike", unlikeGame_1.unlikeGame); // Use separate unlike handler
games.post("/:slug/dislike", dislikeGame_1.dislikeGame);
games.post("/:slug/rate", rateGame_1.rateGame);
// Favorites for specific games
games.post("/:gameId/favorite", favorites_1.addGameToFavorites);
games.delete("/:gameId/favorite", favorites_1.removeGameFromFavorites);
games.get("/:gameId/favorite/status", favorites_1.checkGameFavoriteStatus);
// Game-specific routes (dynamic routes last)
games.get("/:slug", getGame_1.getGame);
games.post("/:slug/play", playGame_1.playGame);
games.get("/:slug/play/*", serveGameFile_1.serveGameFile);
games.get("/:slug/similar", similar_1.getSimilarGames);
games.post("/:slug/report", reportGame_1.reportGame);
games.get("/:slug/stats", manageGames_1.getGameStats);
games.get("/:slug/leaderboard", analytics_1.getGameLeaderboard);
// Comments and social features for specific games
games.get("/:slug/comments", comments_1.getGameComments);
games.post("/:slug/comments", comments_1.createGameComment);
// Protected routes (require authentication)
games.use("*", authMiddleware_1.default);
games.post("/upload", uploadGame_1.uploadGame);
games.put("/:id", updateGame_1.updateGame);
games.delete("/:id", deleteGame_1.deleteGame);
games.post("/categories", createCategory_1.createCategory);
games.post("/fetch", fetchGames_1.fetchGames);
games.post("/import", importGames_1.importGames);
exports.default = games;
