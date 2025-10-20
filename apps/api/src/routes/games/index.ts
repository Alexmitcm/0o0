import { Hono } from "hono";
import authMiddleware from "../../middlewares/authMiddleware";
import { moderateRateLimit } from "../../middlewares/rateLimiter";
import { getGameAnalytics, getGameLeaderboard } from "./analytics";
import { createGameComment, getGameComments, likeComment } from "./comments";
import { createCategory as createCategoryLegacy } from "./createCategory";
import { deleteGame as deleteGameLegacy } from "./deleteGame";
import { dislikeGame } from "./dislikeGame";
import {
  addGameToFavorites,
  checkGameFavoriteStatus,
  getUserFavorites,
  removeGameFromFavorites
} from "./favorites";
import { fetchGames } from "./fetchGames";
import { getCategories } from "./getCategories";
import { getGame } from "./getGame";
import { getGames } from "./getGames";
import { importGames } from "./importGames";
import { getLikedGames } from "./liked";
import { likeGame } from "./likeGame";
import {
  createCategory as createCategoryManaged,
  deleteCategory,
  getCategoryStats,
  getManagedCategories,
  updateCategory
} from "./manageCategories";
import {
  createGame,
  deleteGame as deleteManagedGame,
  getGameStats,
  getManagedGames,
  updateGame as updateManagedGame
} from "./manageGames";
import { deleteGameReport, getGameReports } from "./manageReports";
import { playGame } from "./playGame";
import { getPopularGames } from "./popular";
import { rateGame } from "./rateGame";
import { reportGame } from "./reportGame";
import { serveGameFile } from "./serveGameFile";
import { getSimilarGames } from "./similar";
import { getTags } from "./tags";
import { testDb } from "./test-db";
import { getTrendingGames } from "./trending";
import { unlikeGame } from "./unlikeGame";
import { updateGameStatus } from "./update-game-status";
import { updateGame as updateGameLegacy } from "./updateGame";
import { uploadGame } from "./uploadGame";

const games = new Hono();

// Apply rate limiting to all routes
games.use("*", moderateRateLimit);

// Public routes
games.get("/", getGames);
games.get("/test-db", testDb);

games.get("/update-status", updateGameStatus);
games.get("/categories", getCategories);
games.get("/tags", getTags);
games.get("/trending", getTrendingGames);
games.get("/popular", getPopularGames);
games.get("/liked", getLikedGames);

// Management routes (temporarily public for development)
games.get("/manage", getManagedGames);
games.post("/manage", createGame);
games.put("/manage/:id", updateManagedGame);
games.delete("/manage/:id", deleteManagedGame);
games.get("/manage/stats", getGameStats);

games.get("/manage/reports", getGameReports);
games.delete("/manage/reports/:id", deleteGameReport);

// Category management routes (temporarily public for development)
games.get("/manage/categories", getManagedCategories);
games.post("/manage/categories", createCategoryManaged);
games.put("/manage/categories/:id", updateCategory);
games.delete("/manage/categories/:id", deleteCategory);
games.get("/manage/categories/stats", getCategoryStats);

// Analytics and stats (static routes first)
games.get("/analytics", getGameAnalytics);

// Favorites (static routes first)
games.get("/favorites", getUserFavorites);

// Comments and social features (static routes first)
games.post("/comments/:commentId/like", likeComment);

// Game-specific action routes (must come before general slug route)
games.post("/:slug/like", likeGame);
games.post("/:slug/unlike", unlikeGame); // Use separate unlike handler
games.post("/:slug/dislike", dislikeGame);
games.post("/:slug/rate", rateGame);

// Favorites for specific games
games.post("/:gameId/favorite", addGameToFavorites);
games.delete("/:gameId/favorite", removeGameFromFavorites);
games.get("/:gameId/favorite/status", checkGameFavoriteStatus);

// Game-specific routes (dynamic routes last)
games.get("/:slug", getGame);
games.post("/:slug/play", playGame);
games.get("/:slug/play/*", serveGameFile);

games.get("/:slug/similar", getSimilarGames);
games.post("/:slug/report", reportGame);

games.get("/:slug/stats", getGameStats);
games.get("/:slug/leaderboard", getGameLeaderboard);

// Comments and social features for specific games
games.get("/:slug/comments", getGameComments);
games.post("/:slug/comments", createGameComment);

// Protected routes (require authentication)
games.post("/upload", authMiddleware, uploadGame);
games.put("/:id", authMiddleware, updateGameLegacy);
games.delete("/:id", authMiddleware, deleteGameLegacy);
games.post("/categories", authMiddleware, createCategoryLegacy);
games.post("/fetch", authMiddleware, fetchGames);
games.post("/import", authMiddleware, importGames);

export default games;
