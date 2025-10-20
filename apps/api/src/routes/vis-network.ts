import { PrismaClient } from "@prisma/client";
import { Hono } from "hono";
import { z } from "zod";
import authMiddleware from "../middlewares/authMiddleware";
import handleApiError from "../utils/handleApiError";

const prisma = new PrismaClient();
const visNetwork = new Hono();

// Validation schemas
const networkFilterSchema = z.object({
  banned: z.boolean().optional(),
  limit: z.number().int().positive().max(1000).default(500),
  maxEq: z.number().int().min(0).optional(),
  minEq: z.number().int().min(0).optional(),
  status: z.enum(["Premium", "Standard"]).optional()
});

// GET /network - Get network data for Vis.js
visNetwork.get("/network", authMiddleware, async (c) => {
  try {
    const query = c.req.query();
    const { minEq, maxEq, status, banned, limit } =
      networkFilterSchema.parse(query);

    // Build where clause
    const where: any = {};
    if (minEq !== undefined) where.totalEq = { gte: minEq };
    if (maxEq !== undefined) where.totalEq = { ...where.totalEq, lte: maxEq };
    if (status !== undefined) where.status = status;
    if (banned !== undefined) where.banned = banned;

    // Get users with their relationships
    const users = await prisma.user.findMany({
      select: {
        banned: true,
        coins: true,
        createdAt: true,
        leftNode: true,
        referer: true,
        rightNode: true,
        status: true,
        totalEq: true,
        username: true,
        walletAddress: true
      },
      take: limit,
      where
    });

    // Create nodes
    const nodes = users.map((user) => ({
      borderWidth: 2,
      borderWidthSelected: 4,
      chosen: true,
      color: {
        background: user.banned
          ? "#ff6b6b"
          : user.status === "Premium"
            ? "#4ecdc4"
            : "#95a5a6",
        border: user.banned
          ? "#e74c3c"
          : user.status === "Premium"
            ? "#16a085"
            : "#7f8c8d",
        highlight: {
          background: user.banned
            ? "#ff5252"
            : user.status === "Premium"
              ? "#26a69a"
              : "#bdc3c7",
          border: user.banned
            ? "#d32f2f"
            : user.status === "Premium"
              ? "#00695c"
              : "#95a5a6"
        }
      },
      font: {
        color: user.banned ? "#ffffff" : "#2c3e50",
        face: "Arial",
        size: 14
      },
      group: user.status === "Premium" ? "premium" : "standard",
      id: user.walletAddress,
      label: user.username || user.walletAddress.slice(0, 8) + "...",
      physics: true,
      size: Math.min(Math.max(user.totalEq * 5, 10), 100),
      title: `
        <div style="padding: 10px;">
          <strong>${user.username || "Unknown"}</strong><br/>
          <small>${user.walletAddress}</small><br/>
          <br/>
          <strong>Status:</strong> ${user.status}<br/>
          <strong>EQ:</strong> ${user.totalEq}<br/>
          <strong>Coins:</strong> ${user.coins}<br/>
          <strong>Referrals:</strong> ${user.leftNode + user.rightNode}<br/>
          <strong>Created:</strong> ${user.createdAt.toLocaleDateString()}<br/>
          <strong>Banned:</strong> ${user.banned ? "Yes" : "No"}
        </div>
      `
    }));

    // Create edges (referral relationships)
    const edges = users
      .filter((user) => user.referer)
      .map((user) => ({
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 0.8,
            type: "arrow"
          }
        },
        color: {
          color: user.status === "Premium" ? "#4ecdc4" : "#95a5a6",
          highlight: user.status === "Premium" ? "#26a69a" : "#bdc3c7",
          hover: user.status === "Premium" ? "#16a085" : "#7f8c8d"
        },
        from: user.referer,
        id: `${user.referer}-${user.walletAddress}`,
        label: "",
        smooth: {
          roundness: 0.2,
          type: "continuous"
        },
        to: user.walletAddress,
        width: user.status === "Premium" ? 3 : 2
      }));

    // Calculate network statistics
    const stats = {
      avgConnections: edges.length / Math.max(nodes.length, 1),
      bannedNodes: nodes.filter((n) => n.color.background === "#ff6b6b").length,
      premiumNodes: nodes.filter((n) => n.group === "premium").length,
      standardNodes: nodes.filter((n) => n.group === "standard").length,
      totalEdges: edges.length,
      totalNodes: nodes.length
    };

    return c.json({
      network: {
        edges,
        nodes
      },
      options: {
        edges: {
          smooth: {
            roundness: 0.2,
            type: "continuous"
          }
        },
        interaction: {
          hover: true,
          hoverConnectedEdges: true,
          selectConnectedEdges: false
        },
        nodes: {
          scaling: {
            label: {
              drawThreshold: 5,
              enabled: true,
              max: 20,
              maxVisible: 20,
              min: 12
            },
            max: 100,
            min: 10
          },
          shape: "dot"
        },
        physics: {
          barnesHut: {
            centralGravity: 0.1,
            damping: 0.09,
            gravitationalConstant: -2000,
            springConstant: 0.04,
            springLength: 95
          },
          enabled: true,
          stabilization: {
            enabled: true,
            iterations: 100,
            updateInterval: 50
          }
        }
      },
      stats,
      success: true
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /network/user/:walletAddress - Get user's network
visNetwork.get("/network/user/:walletAddress", async (c) => {
  try {
    const walletAddress = c.req.param("walletAddress");
    const depth = Number.parseInt(c.req.query("depth") || "3");

    // Get user
    const user = await prisma.user.findUnique({
      select: {
        banned: true,
        coins: true,
        createdAt: true,
        leftNode: true,
        referer: true,
        rightNode: true,
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

    // Get referral tree
    const getReferralTree = async (
      userWallet: string,
      currentDepth: number
    ): Promise<any[]> => {
      if (currentDepth <= 0) return [];

      const referrals = await prisma.user.findMany({
        select: {
          banned: true,
          coins: true,
          createdAt: true,
          leftNode: true,
          referer: true,
          rightNode: true,
          status: true,
          totalEq: true,
          username: true,
          walletAddress: true
        },
        where: { referer: userWallet }
      });

      const children = [];
      for (const referral of referrals) {
        const childTree = await getReferralTree(
          referral.walletAddress,
          currentDepth - 1
        );
        children.push({
          ...referral,
          children: childTree
        });
      }

      return children;
    };

    const referrals = await getReferralTree(walletAddress, depth);

    // Build nodes and edges
    const nodes = [user, ...referrals.flatMap((r) => [r, ...r.children])].map(
      (user) => ({
        color: {
          background: user.banned
            ? "#ff6b6b"
            : user.status === "Premium"
              ? "#4ecdc4"
              : "#95a5a6",
          border: user.banned
            ? "#e74c3c"
            : user.status === "Premium"
              ? "#16a085"
              : "#7f8c8d"
        },
        group: user.status === "Premium" ? "premium" : "standard",
        id: user.walletAddress,
        label: user.username || user.walletAddress.slice(0, 8) + "...",
        size: Math.min(Math.max(user.totalEq * 5, 10), 100),
        title: `
        <div style="padding: 10px;">
          <strong>${user.username || "Unknown"}</strong><br/>
          <small>${user.walletAddress}</small><br/>
          <br/>
          <strong>Status:</strong> ${user.status}<br/>
          <strong>EQ:</strong> ${user.totalEq}<br/>
          <strong>Coins:</strong> ${user.coins}<br/>
          <strong>Referrals:</strong> ${user.leftNode + user.rightNode}<br/>
          <strong>Created:</strong> ${user.createdAt.toLocaleDateString()}<br/>
          <strong>Banned:</strong> ${user.banned ? "Yes" : "No"}
        </div>
      `
      })
    );

    const edges = referrals.flatMap((r) => [
      {
        color: { color: "#4ecdc4" },
        from: user.walletAddress,
        id: `${user.walletAddress}-${r.walletAddress}`,
        to: r.walletAddress,
        width: 3
      },
      ...r.children.map((child) => ({
        color: { color: "#95a5a6" },
        from: r.walletAddress,
        id: `${r.walletAddress}-${child.walletAddress}`,
        to: child.walletAddress,
        width: 2
      }))
    ]);

    return c.json({
      network: {
        edges,
        nodes
      },
      success: true,
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

// GET /network/stats - Get network statistics
visNetwork.get("/network/stats", authMiddleware, async (c) => {
  try {
    const [
      totalUsers,
      totalReferrals,
      premiumUsers,
      bannedUsers,
      avgReferralsPerUser,
      topReferrers,
      networkDensity
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { referer: { not: null } } }),
      prisma.user.count({ where: { status: "Premium" } }),
      prisma.user.count({ where: { banned: true } }),
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
      }),
      prisma.user.count({
        where: { referer: { not: null } }
      })
    ]);

    const density = totalUsers > 0 ? (networkDensity / totalUsers) * 100 : 0;

    return c.json({
      stats: {
        avgReferralsPerUser: Math.round(
          ((avgReferralsPerUser._avg.leftNode || 0) +
            (avgReferralsPerUser._avg.rightNode || 0)) /
            2
        ),
        bannedUsers,
        networkDensity: Math.round(density * 100) / 100,
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

// GET /network/export - Export network data
visNetwork.get("/network/export", authMiddleware, async (c) => {
  try {
    const format = c.req.query("format") || "json";
    const limit = Number.parseInt(c.req.query("limit") || "500");

    // Get network data
    const response = await visNetwork.fetch(`/network?limit=${limit}`);
    const data = await response.json();

    if (!data.success) {
      return c.json(data, 500);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `network_${timestamp}.${format}`;

    if (format === "csv") {
      // Convert to CSV format
      const csvHeaders = [
        "id",
        "label",
        "group",
        "size",
        "status",
        "totalEq",
        "coins"
      ];
      const csvRows = data.network.nodes.map((node: any) => [
        node.id,
        node.label,
        node.group,
        node.size,
        node.group === "premium" ? "Premium" : "Standard",
        node.totalEq || 0,
        node.coins || 0
      ]);

      const csv = [
        csvHeaders.join(","),
        ...csvRows.map((row: any) => row.join(","))
      ].join("\n");

      c.header("Content-Type", "text/csv");
      c.header("Content-Disposition", `attachment; filename="${filename}"`);
      return c.text(csv);
    }

    c.header("Content-Type", "application/json");
    c.header("Content-Disposition", `attachment; filename="${filename}"`);
    return c.json(data);
  } catch (error) {
    return handleApiError(c, error);
  }
});

export default visNetwork;
