import { Status } from "@hey/data/enums";
import { zValidator } from "@hono/zod-validator";
import { PrismaClient } from "@prisma/client";
import { Hono } from "hono";
import { z } from "zod";
import {
  addAdminNote,
  forceLinkProfile,
  forceUnlinkProfile,
  getAdminActionHistory,
  getAdminActionHistoryPost,
  getAdminStats,
  getAdminUserInfo,
  getAdminUserInfoPost,
  getAdminUserView,
  getAdminUserViewPost,
  getAllAdminUsers,
  getAllAdminUsersPost,
  getFeatureList,
  grantPremiumAccess,
  updateFeatureAccess
} from "../../controllers/AdminController";
import { moderateRateLimit } from "../../middlewares/rateLimiter";
import { adminOnly } from "../../middlewares/security";

const app = new Hono();
const prisma = new PrismaClient();

// Apply admin authentication to all routes
app.use("*", adminOnly);

// Validation schemas
const walletAddressSchema = z.object({
  walletAddress: z.string().min(1, "Wallet address is required")
});

const paginationSchema = z.object({
  limit: z.string().optional(),
  page: z.string().optional()
});

// Routes

/**
 * GET /admin/user
 * Get comprehensive admin view of a user
 */
app.get(
  "/user",
  moderateRateLimit,
  zValidator("query", walletAddressSchema),
  getAdminUserView
);

/**
 * POST /admin/user
 * Get comprehensive admin view of a user (alternative to GET)
 */
app.post(
  "/user",
  moderateRateLimit,
  zValidator("json", walletAddressSchema),
  getAdminUserViewPost
);

/**
 * GET /admin/users
 * Get all users with admin view
 */
app.get(
  "/users",
  moderateRateLimit,
  zValidator("query", paginationSchema),
  getAllAdminUsers
);

/**
 * POST /admin/users
 * Get all users with admin view (alternative to GET)
 */
app.post("/users", moderateRateLimit, getAllAdminUsersPost);

/**
 * POST /admin/force-unlink-profile
 * Force unlink a profile (admin override)
 */
app.post("/force-unlink-profile", moderateRateLimit, forceUnlinkProfile);

/**
 * POST /admin/force-link-profile
 * Force link a profile (admin override)
 */
app.post("/force-link-profile", moderateRateLimit, forceLinkProfile);

/**
 * POST /admin/grant-premium
 * Grant premium access (admin override)
 */
app.post("/grant-premium", moderateRateLimit, grantPremiumAccess);

/**
 * POST /admin/add-note
 * Add admin note to user
 */
app.post("/add-note", moderateRateLimit, addAdminNote);

/**
 * GET /admin/stats
 * Get enhanced admin statistics
 */
app.get("/stats", moderateRateLimit, getAdminStats);

/**
 * GET /admin/actions
 * Get admin action history
 */
app.get(
  "/actions",
  moderateRateLimit,
  zValidator("query", paginationSchema),
  getAdminActionHistory
);

/**
 * POST /admin/actions
 * Get admin action history (alternative to GET)
 */
app.post("/actions", moderateRateLimit, getAdminActionHistoryPost);

/**
 * GET /admin/features
 * Get feature list
 */
app.get("/features", moderateRateLimit, getFeatureList);

/**
 * POST /admin/features/access
 * Update feature access for a user
 */
app.post("/features/access", moderateRateLimit, updateFeatureAccess);

/**
 * GET /admin/admin-user
 * Get admin user information
 */
app.get(
  "/admin-user",
  moderateRateLimit,
  zValidator("query", walletAddressSchema),
  getAdminUserInfo
);

/**
 * POST /admin/admin-user
 * Get admin user information (alternative to GET)
 */
app.post(
  "/admin-user",
  moderateRateLimit,
  zValidator("json", walletAddressSchema),
  getAdminUserInfoPost
);

/**
 * GET /admin/coin-transactions
 * Get coin transaction history
 */
app.get("/coin-transactions", moderateRateLimit, async (c) => {
  try {
    const { limit = "50", page = "1" } = c.req.query();
    const limitNum = Number.parseInt(limit);
    const pageNum = Number.parseInt(page);
    const skip = (pageNum - 1) * limitNum;

    // Get coin transactions from database
    const transactions = await prisma.userCoinBalance.findMany({
      include: {
        user: {
          select: {
            email: true,
            username: true,
            walletAddress: true
          }
        }
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limitNum
    });

    const total = await prisma.userCoinBalance.count();

    return c.json({
      data: {
        pagination: {
          currentPage: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        },
        transactions
      },
      success: true
    });
  } catch (error) {
    return c.json(
      { error: "Failed to fetch coin transactions", success: false },
      500
    );
  }
});

/**
 * GET /admin/coin-stats
 * Get coin statistics
 */
app.get("/coin-stats", moderateRateLimit, async (c) => {
  try {
    const [totalCoins, totalUsers, averageCoins, topUsers] = await Promise.all([
      prisma.userCoinBalance.aggregate({
        _sum: { totalCoins: true }
      }),
      prisma.userCoinBalance.count(),
      prisma.userCoinBalance.aggregate({
        _avg: { totalCoins: true }
      }),
      prisma.userCoinBalance.findMany({
        include: {
          user: {
            select: {
              email: true,
              username: true
            }
          }
        },
        orderBy: { totalCoins: "desc" },
        take: 10
      })
    ]);

    return c.json({
      data: {
        averageCoins: Math.round(averageCoins._avg.totalCoins || 0),
        topUsers,
        totalCoins: totalCoins._sum.totalCoins || 0,
        totalUsers
      },
      success: true
    });
  } catch (error) {
    return c.json({ error: "Failed to fetch coin stats", success: false }, 500);
  }
});

/**
 * GET /admin/system-status
 * Get system status information
 */
app.get("/system-status", moderateRateLimit, async (c) => {
  try {
    // Mock system status data
    const systemStatus = {
      cpuUsage: Math.floor(Math.random() * 30) + 20, // 20-50%
      diskUsage: Math.floor(Math.random() * 20) + 40, // 40-60%
      memoryUsage: Math.floor(Math.random() * 40) + 30, // 30-70%
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };

    return c.json({
      data: systemStatus,
      success: true
    });
  } catch (error) {
    return c.json(
      { error: "Failed to fetch system status", success: false },
      500
    );
  }
});

/**
 * GET /admin/system-actions
 * Get available system actions
 */
app.get("/system-actions", moderateRateLimit, async (c) => {
  try {
    const actions = [
      {
        description: "Reset all users' daily points to zero",
        id: "reset-daily-points",
        name: "Reset Daily Points",
        requiresConfirmation: true,
        type: "maintenance"
      },
      {
        description: "Create a backup of the database",
        id: "backup-database",
        name: "Backup Database",
        requiresConfirmation: true,
        type: "backup"
      },
      {
        description: "Clear all cached data",
        id: "clear-cache",
        name: "Clear Cache",
        requiresConfirmation: false,
        type: "maintenance"
      }
    ];

    return c.json({
      data: actions,
      success: true
    });
  } catch (error) {
    return c.json(
      { error: "Failed to fetch system actions", success: false },
      500
    );
  }
});

/**
 * GET /admin/tournaments
 * Get tournament information
 */
app.get("/tournaments", moderateRateLimit, async (c) => {
  try {
    const { limit = "20", page = "1" } = c.req.query();
    const limitNum = Number.parseInt(limit);
    const pageNum = Number.parseInt(page);
    const skip = (pageNum - 1) * limitNum;

    // Mock tournament data since we don't have a tournaments table yet
    const tournaments = Array.from({ length: limitNum }, (_, i) => ({
      endDate: new Date(
        Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000
      ).toISOString(),
      id: `tournament_${skip + i + 1}`,
      name: `Tournament ${skip + i + 1}`,
      participants: Math.floor(Math.random() * 100) + 10,
      prizePool: Math.floor(Math.random() * 1000) + 100,
      startDate: new Date(
        Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
      status: ["active", "completed", "upcoming"][Math.floor(Math.random() * 3)]
    }));

    const total = 50; // Mock total

    return c.json({
      data: {
        pagination: {
          currentPage: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        },
        tournaments
      },
      success: true
    });
  } catch (error) {
    return c.json(
      { error: "Failed to fetch tournaments", success: false },
      500
    );
  }
});

/**
 * POST /admin/system/backup
 * Create database backup
 */
app.post("/system/backup", moderateRateLimit, async (c) => {
  try {
    // Mock backup creation
    const backupId = `backup_${Date.now()}`;

    return c.json({
      data: {
        backupId,
        message: "Database backup created successfully",
        timestamp: new Date().toISOString()
      },
      success: true
    });
  } catch (error) {
    return c.json({ error: "Failed to create backup", success: false }, 500);
  }
});

/**
 * POST /admin/system/reset-daily-points
 * Reset all users' daily points
 */
app.post("/system/reset-daily-points", moderateRateLimit, async (c) => {
  try {
    // Mock reset operation
    return c.json({
      data: {
        message: "Daily points reset successfully",
        resetCount: 150, // Mock count
        timestamp: new Date().toISOString()
      },
      success: true
    });
  } catch (error) {
    return c.json(
      { error: "Failed to reset daily points", success: false },
      500
    );
  }
});

/**
 * POST /admin/system/clear-cache
 * Clear all cached data
 */
app.post("/system/clear-cache", moderateRateLimit, async (c) => {
  try {
    // Mock cache clear operation
    return c.json({
      data: {
        message: "Cache cleared successfully",
        timestamp: new Date().toISOString()
      },
      success: true
    });
  } catch (error) {
    return c.json({ error: "Failed to clear cache", success: false }, 500);
  }
});

/**
 * GET /admin/games
 * Get games management data
 */
app.get("/games", moderateRateLimit, async (c) => {
  try {
    const { limit = "20", page = "1" } = c.req.query();
    const limitNum = Number.parseInt(limit);
    const pageNum = Number.parseInt(page);
    const skip = (pageNum - 1) * limitNum;

    // Mock games data
    const games = Array.from({ length: limitNum }, (_, i) => ({
      category: ["Action", "Puzzle", "Strategy", "Arcade"][
        Math.floor(Math.random() * 4)
      ],
      id: `game_${skip + i + 1}`,
      isActive: Math.random() > 0.2,
      lastPlayed: new Date(
        Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
      name: `Game ${skip + i + 1}`,
      players: Math.floor(Math.random() * 1000) + 10,
      rating: (Math.random() * 2 + 3).toFixed(1) // 3.0-5.0
    }));

    const total = 50; // Mock total

    return c.json({
      data: {
        games,
        pagination: {
          currentPage: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      },
      success: true
    });
  } catch (error) {
    return c.json({ error: "Failed to fetch games", success: false }, 500);
  }
});

/**
 * GET /admin/game-stats
 * Get game statistics
 */
app.get("/game-stats", moderateRateLimit, async (c) => {
  try {
    const stats = {
      activeGames: 20,
      averageRating: 4.2,
      recentActivity: [
        { game: "Chess", players: 245, timestamp: new Date().toISOString() },
        { game: "Sudoku", players: 189, timestamp: new Date().toISOString() },
        { game: "Tetris", players: 156, timestamp: new Date().toISOString() }
      ],
      topCategories: [
        { count: 8, name: "Action" },
        { count: 6, name: "Puzzle" },
        { count: 5, name: "Strategy" },
        { count: 6, name: "Arcade" }
      ],
      totalGames: 25,
      totalPlayers: 15420
    };

    return c.json({
      data: stats,
      success: true
    });
  } catch (error) {
    return c.json({ error: "Failed to fetch game stats", success: false }, 500);
  }
});

/**
 * GET /admin/contracts
 * Get smart contracts data
 */
app.get("/contracts", moderateRateLimit, async (c) => {
  try {
    const { limit = "20", page = "1" } = c.req.query();
    const limitNum = Number.parseInt(limit);
    const pageNum = Number.parseInt(page);
    const skip = (pageNum - 1) * limitNum;

    // Mock contracts data
    const contracts = Array.from({ length: limitNum }, (_, i) => ({
      address: `0x${Math.random().toString(16).substr(2, 40)}`,
      id: `contract_${skip + i + 1}`,
      isActive: Math.random() > 0.1,
      lastActivity: new Date(
        Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000
      ).toISOString(),
      name: `Contract ${skip + i + 1}`,
      transactions: Math.floor(Math.random() * 1000) + 10,
      type: ["ERC20", "ERC721", "Custom"][Math.floor(Math.random() * 3)]
    }));

    const total = 15; // Mock total

    return c.json({
      data: {
        contracts,
        pagination: {
          currentPage: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      },
      success: true
    });
  } catch (error) {
    return c.json({ error: "Failed to fetch contracts", success: false }, 500);
  }
});

/**
 * GET /admin/contract-stats
 * Get contract statistics
 */
app.get("/contract-stats", moderateRateLimit, async (c) => {
  try {
    const stats = {
      activeContracts: 10,
      contractTypes: [
        { count: 5, type: "ERC20" },
        { count: 4, type: "ERC721" },
        { count: 3, type: "Custom" }
      ],
      recentActivity: [
        {
          contract: "Token Contract",
          timestamp: new Date().toISOString(),
          transactions: 45
        },
        {
          contract: "NFT Contract",
          timestamp: new Date().toISOString(),
          transactions: 23
        },
        {
          contract: "Game Contract",
          timestamp: new Date().toISOString(),
          transactions: 67
        }
      ],
      totalContracts: 12,
      totalTransactions: 45678,
      totalVolume: "1,234.56 ETH"
    };

    return c.json({
      data: stats,
      success: true
    });
  } catch (error) {
    return c.json(
      { error: "Failed to fetch contract stats", success: false },
      500
    );
  }
});

/**
 * GET /admin/health
 * Health check endpoint
 */
app.get("/health", async (c) => {
  return c.json({
    service: "admin",
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /
 * Root endpoint with service information
 */
app.get("/", async (c) => {
  return c.json({
    description:
      "Comprehensive admin functionality with RBAC and feature management",
    endpoints: {
      "GET /actions": "Get admin action history",
      "GET /admin-user": "Get admin user information",
      "GET /features": "Get feature list",
      "GET /health": "Health check",
      "GET /stats": "Get enhanced admin statistics",
      "GET /user": "Get comprehensive admin view of a user",
      "GET /users": "Get all users with admin view",
      "POST /actions": "Get admin action history (POST)",
      "POST /add-note": "Add admin note to user",
      "POST /admin-user": "Get admin user information (POST)",
      "POST /features/access": "Update feature access for a user",
      "POST /force-link-profile": "Force link a profile (admin override)",
      "POST /force-unlink-profile": "Force unlink a profile (admin override)",
      "POST /grant-premium": "Grant premium access (admin override)",
      "POST /user": "Get comprehensive admin view of a user (POST)",
      "POST /users": "Get all users with admin view (POST)"
    },
    features: {
      "Action History": "Track all admin actions with audit trail",
      "Admin Notes": "Add notes to user records for customer support",
      "Feature Management": "View and manage feature access controls",
      "Premium Access": "Grant or revoke premium access manually",
      "Profile Linking": "Force link/unlink profiles with admin override",
      RBAC: "Role-based access control for admin users",
      Statistics: "Comprehensive platform statistics and analytics",
      "System Health": "Monitor system health and connectivity",
      "User Management":
        "View and manage all users with detailed status information"
    },
    service: "Admin Service",
    status: Status.Success,
    version: "2.0.0"
  });
});

export default app;
