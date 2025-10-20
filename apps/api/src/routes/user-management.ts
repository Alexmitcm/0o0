import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { createHash } from "crypto";
import { Hono } from "hono";
import { z } from "zod";
import { ApiError } from "../errors/ApiError";
import authMiddleware from "../middlewares/authMiddleware";
import handleApiError from "../utils/handleApiError";

const prisma = new PrismaClient();
const userManagement = new Hono();

// Health check endpoint
userManagement.get("/health", async (c) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    return c.json({
      database: "connected",
      service: "user-management",
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    });
  } catch (error) {
    return c.json(
      {
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        service: "user-management",
        status: "unhealthy",
        timestamp: new Date().toISOString()
      },
      503
    );
  }
});

// Validation schemas
const signupSchema = z.object({
  email: z.string().email().optional(),
  isEmailVerified: z.boolean().default(false),
  referer: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  username: z.string().min(3).max(50),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/)
});

const signinSchema = z.object({
  password: z.string().min(6),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/)
});

const updatePasswordSchema = z.object({
  newPassword: z.string().min(6),
  token: z.string(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/)
});

const premiumUpgradeSchema = z.object({
  referer: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/)
});

const validateTokenSchema = z.object({
  token: z.string(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/)
});

// Helper function to generate user token
function generateUserToken(walletAddress: string): string {
  return createHash("sha256").update(walletAddress.slice(-15)).digest("hex");
}

// Helper function to check if user is banned
async function checkUserBan(
  walletAddress: string
): Promise<{ banned: boolean; remainingTime?: number }> {
  const user = await prisma.user.findUnique({
    select: {
      banned: true,
      playHistory: { orderBy: { banDate: "desc" }, take: 1 }
    },
    where: { walletAddress }
  });

  if (!user || !user.banned) {
    return { banned: false };
  }

  const latestBan = user.playHistory[0];
  if (!latestBan?.banDate) {
    return { banned: false };
  }

  const now = new Date();
  const banEndTime = new Date(
    latestBan.banDate.getTime() + 24 * 60 * 60 * 1000
  ); // 24 hours

  if (now > banEndTime) {
    // Auto-unban user
    await prisma.user.update({
      data: { banned: false, cheatCount: 0 },
      where: { walletAddress }
    });
    return { banned: false };
  }

  const remainingTime = Math.max(0, banEndTime.getTime() - now.getTime());
  return { banned: true, remainingTime };
}

// POST /signup - User registration
userManagement.post("/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { username, walletAddress, email, isEmailVerified, referer } =
      signupSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress }
    });

    if (existingUser) {
      // Return existing user token and referer
      return c.json({
        message: "User already exists",
        referer: existingUser.referrerAddress,
        success: true,
        token: existingUser.token
      });
    }

    // Check if username is taken
    const usernameExists = await prisma.user.findUnique({
      where: { username }
    });

    if (usernameExists) {
      throw new ApiError("Username already taken", 400);
    }

    // Generate user token
    const token = generateUserToken(walletAddress);

    // Determine role based on referer
    const rolePermission = referer ? "Premium" : "Standard";

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        isEmailVerified,
        referrerAddress: referer,
        rolePermission,
        status: referer ? "Premium" : "Standard",
        token,
        username,
        walletAddress
      }
    });

    // Update referrer's referral counts if referer exists
    if (referer) {
      await prisma.user.update({
        data: {
          leftNode: { increment: 1 }
        },
        where: { walletAddress: referer }
      });
    }

    return c.json({
      message: "User created successfully",
      referer: user.referrerAddress,
      success: true,
      token: user.token
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

// POST /signin - User authentication
userManagement.post("/signin", async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress, password } = signinSchema.parse(body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { walletAddress }
    });

    if (!user) {
      throw new ApiError("User not found", 404);
    }

    // Check if user is banned
    const banStatus = await checkUserBan(walletAddress);
    if (banStatus.banned) {
      return c.json(
        {
          message: "You are banned",
          remainingTime: banStatus.remainingTime,
          success: false
        },
        403
      );
    }

    // Check password if it exists
    if (user.password) {
      const isValidPassword = await argon2.verify(user.password, password);
      if (!isValidPassword) {
        throw new ApiError("Invalid credentials", 401);
      }
    }

    // Generate new token
    const newToken = generateUserToken(walletAddress);

    // Update user token and login count
    await prisma.user.update({
      data: {
        lastActiveAt: new Date(),
        token: newToken,
        totalLogins: { increment: 1 }
      },
      where: { walletAddress }
    });

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    return c.json({
      message: "Login successful",
      success: true,
      user: {
        ...userWithoutPassword,
        token: newToken
      }
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

// POST /is-registered - Check if user is registered
userManagement.post("/is-registered", async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress } = z
      .object({ walletAddress: z.string() })
      .parse(body);

    const user = await prisma.user.findUnique({
      select: { referrerAddress: true, token: true },
      where: { walletAddress }
    });

    if (!user) {
      throw new ApiError("User not found", 404);
    }

    return c.json({
      referer: user.referrerAddress,
      success: true,
      token: user.token
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

// POST /get-user-data - Get comprehensive user data
userManagement.post("/get-user-data", async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress } = z
      .object({ walletAddress: z.string() })
      .parse(body);

    const user = await prisma.user.findUnique({
      include: {
        playHistory: {
          orderBy: { banDate: "desc" },
          take: 1
        },
        tournamentParticipants: {
          include: { tournament: true }
        },
        userCoinBalance: true,
        userStats: true
      },
      where: { walletAddress }
    });

    if (!user) {
      throw new ApiError("User not found", 404);
    }

    // Check ban status
    const banStatus = await checkUserBan(walletAddress);

    // Get tournament IDs
    const tournamentIds = user.tournamentParticipants.map(
      (p) => p.tournament.id
    );

    // Calculate stamina level based on totalEq
    let staminaLevel = 0;
    if (user.totalEq >= 2) {
      staminaLevel = 2500;
    } else if (user.totalEq === 1) {
      // Check if account is less than 3 months old
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      staminaLevel = user.createdAt > threeMonthsAgo ? 1500 : 500;
    } else if (user.totalEq === 0) {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      staminaLevel = user.createdAt > threeMonthsAgo ? 1600 : 500;
    }

    return c.json({
      hasTournaments: tournamentIds.length > 0,
      success: true,
      tournamentIds,
      user: {
        ...user,
        banned: banStatus.banned,
        hasPass: !!user.password,
        staminaLevel
      }
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

// POST /get-user-token - Get user token
userManagement.post("/get-user-token", async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress } = z
      .object({ walletAddress: z.string() })
      .parse(body);

    const user = await prisma.user.findUnique({
      select: { token: true },
      where: { walletAddress }
    });

    if (!user) {
      throw new ApiError("User not found", 404);
    }

    return c.json({
      success: true,
      token: user.token,
      walletAddress
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

// POST /premium - Upgrade user to premium
userManagement.post("/premium", async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress, referer } = premiumUpgradeSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { walletAddress }
    });

    if (!user) {
      throw new ApiError("User not found", 404);
    }

    // Update user to premium
    await prisma.user.update({
      data: {
        premiumUpgradedAt: new Date(),
        referrerAddress: referer,
        rolePermission: "Premium",
        status: "Premium"
      },
      where: { walletAddress }
    });

    // Update referrer's counts if referer exists
    if (referer) {
      await prisma.user.update({
        data: {
          leftNode: { increment: 1 }
        },
        where: { walletAddress: referer }
      });
    }

    return c.json({
      message: "User upgraded to premium successfully",
      status: "Premium",
      success: true
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

// POST /validate - Validate user token
userManagement.post("/validate", async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress, token } = validateTokenSchema.parse(body);

    const user = await prisma.user.findUnique({
      select: { token: true },
      where: { walletAddress }
    });

    if (!user || user.token !== token) {
      return c.json({
        status: "invalid",
        success: true
      });
    }

    return c.json({
      status: "valid",
      success: true
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

// POST /update-password - Update user password
userManagement.post("/update-password", async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress, token, newPassword } =
      updatePasswordSchema.parse(body);

    // Validate token first
    const user = await prisma.user.findUnique({
      select: { token: true },
      where: { walletAddress }
    });

    if (!user || user.token !== token) {
      throw new ApiError("Invalid token", 401);
    }

    // Hash new password
    const hashedPassword = await argon2.hash(newPassword);

    // Update password
    await prisma.user.update({
      data: { password: hashedPassword },
      where: { walletAddress }
    });

    return c.json({
      message: "Password updated successfully",
      success: true
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

// POST /ban-check - Check user ban status
userManagement.post("/ban-check", async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress } = z
      .object({ walletAddress: z.string() })
      .parse(body);

    const banStatus = await checkUserBan(walletAddress);

    return c.json({
      banned: banStatus.banned,
      remainingTime: banStatus.remainingTime,
      success: true
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /tree - Get referral tree structure
userManagement.get("/tree", async (c) => {
  try {
    // Get all users with their referral relationships
    const users = await prisma.user.findMany({
      select: {
        leftNode: true,
        referrerAddress: true,
        rightNode: true,
        status: true,
        username: true,
        walletAddress: true
      }
    });

    // Build tree structure
    const buildTree = (referrerAddress: string | null = null): any[] => {
      return users
        .filter((user) => user.referrerAddress === referrerAddress)
        .map((user) => ({
          children: buildTree(user.walletAddress),
          count: user.leftNode + user.rightNode,
          leftNode: user.leftNode,
          rightNode: user.rightNode,
          status: user.status,
          username: user.username,
          walletAddress: user.walletAddress
        }));
    };

    const tree = buildTree();

    return c.json({
      success: true,
      tree
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /all-users - Get all users data (admin only)
userManagement.get("/all-users", authMiddleware, async (c) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        playHistory: {
          orderBy: { banDate: "desc" },
          take: 1
        },
        userCoinBalance: true,
        userStats: true
      },
      orderBy: { createdAt: "desc" }
    });

    return c.json({
      success: true,
      users
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

export default userManagement;
