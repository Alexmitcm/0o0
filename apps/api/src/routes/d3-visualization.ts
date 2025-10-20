import { PrismaClient } from "@prisma/client";
import { Hono } from "hono";
import authMiddleware from "../middlewares/authMiddleware";
import handleApiError from "../utils/handleApiError";

const prisma = new PrismaClient();
const d3Visualization = new Hono();

// Validation schemas
// const userTreeSchema = z.object({
//   walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
//   token: z.string().optional(),
//   depth: z.number().int().positive().max(10).default(5)
// });

// GET /tree - Get complete user tree for D3.js
d3Visualization.get("/tree", authMiddleware, async (c) => {
  try {
    // Get all users with their referral relationships
    const users = await prisma.user.findMany({
      select: {
        banned: true,
        coins: true,
        createdAt: true,
        referer: true,
        status: true,
        totalEq: true,
        username: true,
        walletAddress: true
      }
    });

    // Build tree structure
    const userMap = new Map();
    const rootUsers: any[] = [];

    // Create user nodes
    users.forEach((user) => {
      const node = {
        banned: user.banned,
        children: [],
        coins: user.coins,
        createdAt: user.createdAt,
        id: user.walletAddress,
        level: 0,
        referer: user.referer,
        status: user.status,
        totalEq: user.totalEq,
        username: user.username
      };
      userMap.set(user.walletAddress, node);
    });

    // Build parent-child relationships
    users.forEach((user) => {
      const node = userMap.get(user.walletAddress);
      if (user.referer && userMap.has(user.referer)) {
        const parent = userMap.get(user.referer);
        parent.children.push(node);
        node.level = parent.level + 1;
      } else {
        rootUsers.push(node);
      }
    });

    // Calculate statistics for each node
    const calculateStats = (node: any) => {
      let totalChildren = 0;
      let totalEq = node.totalEq;
      let totalCoins = node.coins;
      let activeChildren = 0;

      node.children.forEach((child: any) => {
        const childStats = calculateStats(child);
        totalChildren += childStats.totalChildren + 1;
        totalEq += childStats.totalEq;
        totalCoins += childStats.totalCoins;
        activeChildren += childStats.activeChildren + (child.banned ? 0 : 1);
      });

      node.stats = {
        activeChildren,
        conversionRate:
          totalChildren > 0 ? (activeChildren / totalChildren) * 100 : 0,
        totalChildren,
        totalCoins,
        totalEq
      };

      return node.stats;
    };

    // Calculate stats for all root nodes
    rootUsers.forEach((root) => calculateStats(root));

    return c.json({
      nodes: rootUsers,
      rootUsers: rootUsers.length,
      success: true,
      totalUsers: users.length
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /tree/:walletAddress - Get user's referral tree
d3Visualization.get("/tree/:walletAddress", async (c) => {
  try {
    const walletAddress = c.req.param("walletAddress");
    const depth = Number.parseInt(c.req.query("depth") || "5");

    // Get user and their referral tree
    const user = await prisma.user.findUnique({
      select: {
        banned: true,
        coins: true,
        createdAt: true,
        referer: true,
        status: true,
        totalEq: true,
        username: true,
        walletAddress: true
      },
      where: { walletAddress }
    });

    if (!user) {
      return c.json(
        {
          error: "User not found",
          success: false
        },
        404
      );
    }

    // Recursive function to get referral tree
    const getReferralTree = async (
      userWallet: string,
      currentDepth: number
    ): Promise<any> => {
      if (currentDepth <= 0) return null;

      const userData = await prisma.user.findUnique({
        select: {
          banned: true,
          coins: true,
          createdAt: true,
          referer: true,
          status: true,
          totalEq: true,
          username: true,
          walletAddress: true
        },
        where: { walletAddress: userWallet }
      });

      if (!userData) return null;

      // Get direct referrals
      const referrals = await prisma.user.findMany({
        select: {
          banned: true,
          coins: true,
          createdAt: true,
          referer: true,
          status: true,
          totalEq: true,
          username: true,
          walletAddress: true
        },
        where: { referer: userWallet }
      });

      const node = {
        banned: userData.banned,
        children: [],
        coins: userData.coins,
        createdAt: userData.createdAt,
        id: userData.walletAddress,
        level: 5 - currentDepth,
        referer: userData.referer,
        status: userData.status,
        totalEq: userData.totalEq,
        username: userData.username
      };

      // Recursively get children
      for (const referral of referrals) {
        const childTree = await getReferralTree(
          referral.walletAddress,
          currentDepth - 1
        );
        if (childTree) {
          node.children.push(childTree);
        }
      }

      return node;
    };

    const tree = await getReferralTree(walletAddress, depth);

    if (!tree) {
      return c.json(
        {
          error: "Failed to build referral tree",
          success: false
        },
        500
      );
    }

    // Calculate statistics
    const calculateStats = (node: any) => {
      let totalChildren = 0;
      let totalEq = node.totalEq;
      let totalCoins = node.coins;
      let activeChildren = 0;

      node.children.forEach((child: any) => {
        const childStats = calculateStats(child);
        totalChildren += childStats.totalChildren + 1;
        totalEq += childStats.totalEq;
        totalCoins += childStats.totalCoins;
        activeChildren += childStats.activeChildren + (child.banned ? 0 : 1);
      });

      node.stats = {
        activeChildren,
        conversionRate:
          totalChildren > 0 ? (activeChildren / totalChildren) * 100 : 0,
        totalChildren,
        totalCoins,
        totalEq
      };

      return node.stats;
    };

    calculateStats(tree);

    return c.json({
      success: true,
      tree,
      user: {
        banned: user.banned,
        coins: user.coins,
        status: user.status,
        totalEq: user.totalEq,
        username: user.username,
        walletAddress: user.walletAddress
      }
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /network - Get network data for D3.js force simulation
d3Visualization.get("/network", authMiddleware, async (c) => {
  try {
    const limit = Number.parseInt(c.req.query("limit") || "100");

    // Get users with their relationships
    const users = await prisma.user.findMany({
      select: {
        banned: true,
        coins: true,
        createdAt: true,
        referer: true,
        status: true,
        totalEq: true,
        username: true,
        walletAddress: true
      },
      take: limit
    });

    // Create nodes and links
    const nodes = users.map((user) => ({
      banned: user.banned,
      coins: user.coins,
      createdAt: user.createdAt,
      group: user.status === "Premium" ? 1 : 0,
      id: user.walletAddress,
      size: Math.min(Math.max(user.totalEq * 10, 5), 50),
      status: user.status,
      totalEq: user.totalEq,
      username: user.username
    }));

    const links = users
      .filter((user) => user.referer)
      .map((user) => ({
        source: user.referer,
        target: user.walletAddress,
        value: 1
      }));

    return c.json({
      links,
      nodes,
      success: true,
      totalLinks: links.length,
      totalNodes: nodes.length
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /stats - Get visualization statistics
d3Visualization.get("/stats", authMiddleware, async (c) => {
  try {
    const [
      totalUsers,
      premiumUsers,
      bannedUsers,
      totalReferrals,
      avgReferralsPerUser,
      topReferrers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "Premium" } }),
      prisma.user.count({ where: { banned: true } }),
      prisma.user.count({ where: { referer: { not: null } } }),
      prisma.user.aggregate({
        _avg: {
          leftNode: true,
          rightNode: true
        }
      }),
      prisma.user.findMany({
        orderBy: {
          totalEq: "desc"
        },
        select: {
          leftNode: true,
          rightNode: true,
          totalEq: true,
          username: true,
          walletAddress: true
        },
        take: 10,
        where: {
          OR: [{ leftNode: { gt: 0 } }, { rightNode: { gt: 0 } }]
        }
      })
    ]);

    return c.json({
      stats: {
        avgReferralsPerUser: Math.round(
          ((avgReferralsPerUser._avg.leftNode || 0) +
            (avgReferralsPerUser._avg.rightNode || 0)) /
            2
        ),
        bannedUsers,
        premiumUsers,
        topReferrers: topReferrers.map((user) => ({
          leftNode: user.leftNode,
          rightNode: user.rightNode,
          totalEq: user.totalEq,
          totalReferrals: user.leftNode + user.rightNode,
          username: user.username,
          walletAddress: user.walletAddress
        })),
        totalReferrals,
        totalUsers
      },
      success: true
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /export/:walletAddress - Export user tree as JSON
d3Visualization.get("/export/:walletAddress", async (c) => {
  try {
    const walletAddress = c.req.param("walletAddress");
    const depth = Number.parseInt(c.req.query("depth") || "5");

    // Get user's tree (reuse existing logic)
    const response = await d3Visualization.fetch(
      `/tree/${walletAddress}?depth=${depth}`
    );
    const data = await response.json();

    if (!data.success) {
      return c.json(data, 404);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `user_tree_${walletAddress}_${timestamp}.json`;

    c.header("Content-Type", "application/json");
    c.header("Content-Disposition", `attachment; filename="${filename}"`);
    return c.json(data);
  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /heatmap - Get user activity heatmap data
d3Visualization.get("/heatmap", authMiddleware, async (c) => {
  try {
    const days = Number.parseInt(c.req.query("days") || "30");
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get user activity data
    const activities = await prisma.userLog.findMany({
      select: {
        action: true,
        timestamp: true,
        walletAddress: true
      },
      where: {
        timestamp: { gte: startDate }
      }
    });

    // Group by date and user
    const heatmapData: Record<string, Record<string, number>> = {};

    activities.forEach((activity) => {
      const date = activity.timestamp.toISOString().split("T")[0];
      if (!heatmapData[date]) {
        heatmapData[date] = {};
      }
      heatmapData[date][activity.walletAddress] =
        (heatmapData[date][activity.walletAddress] || 0) + 1;
    });

    // Convert to array format for D3.js
    const heatmapArray = Object.entries(heatmapData).map(([date, users]) => ({
      date,
      users: Object.entries(users).map(([walletAddress, count]) => ({
        count,
        walletAddress
      }))
    }));

    return c.json({
      heatmap: heatmapArray,
      success: true,
      totalActivities: activities.length,
      totalDays: days
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

export default d3Visualization;
