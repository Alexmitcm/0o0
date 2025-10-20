import { Status } from "@hey/data/enums";
import type { Context } from "hono";
import { z } from "zod";
import AdminService from "../services/AdminService";
import handleApiError from "../utils/handleApiError";

// Create mock WebSocketService for AdminService
const mockWebSocketService = {
  broadcastPremiumStatusUpdate: () => {},
  broadcastProfileLinkedUpdate: () => {},
  broadcastRegistrationUpdate: () => {},
  broadcastTransactionUpdate: () => {},
  getStats: () => ({ connectedClients: 0 }),
  sendNotification: () => {}
};

// Create AdminService instance
const adminService = new AdminService(mockWebSocketService as any);

// Validation schemas
const walletAddressSchema = z.object({
  walletAddress: z.string().min(1, "Wallet address is required")
});

const paginationSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : undefined)),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : undefined))
});

const adminActionSchema = z.object({
  adminWalletAddress: z.string().min(1, "Admin wallet address is required"),
  reason: z.string().min(1, "Reason is required"),
  targetWallet: z.string().min(1, "Target wallet address is required")
});

const forceLinkProfileSchema = z.object({
  adminWalletAddress: z.string().min(1, "Admin wallet address is required"),
  profileId: z.string().min(1, "Profile ID is required"),
  reason: z.string().min(1, "Reason is required"),
  targetWallet: z.string().min(1, "Target wallet address is required")
});

const adminNoteSchema = z.object({
  adminWalletAddress: z.string().min(1, "Admin wallet address is required"),
  isPrivate: z.boolean().optional().default(false),
  note: z.string().min(1, "Note is required"),
  targetWallet: z.string().min(1, "Target wallet address is required")
});

const featureAccessSchema = z.object({
  adminWalletAddress: z.string().min(1, "Admin wallet address is required"),
  expiresAt: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  featureId: z.string().min(1, "Feature ID is required"),
  grantAccess: z.boolean(),
  reason: z.string().min(1, "Reason is required"),
  targetWallet: z.string().min(1, "Target wallet address is required")
});

/**
 * Get admin user view
 */
export async function getAdminUserView(ctx: Context) {
  try {
    const { walletAddress } = walletAddressSchema.parse(ctx.req.query());

    const result = await adminService.getAdminUserView(walletAddress);

    return ctx.json({
      data: result,
      status: Status.Success
    });
  } catch (error) {
    return handleApiError(ctx, error);
  }
}

/**
 * POST endpoint for getting admin user view
 */
export async function getAdminUserViewPost(ctx: Context) {
  try {
    const body = await ctx.req.json();
    const { walletAddress } = walletAddressSchema.parse(body);

    const result = await adminService.getAdminUserView(walletAddress);

    return ctx.json({
      data: result,
      status: Status.Success
    });
  } catch (error) {
    return handleApiError(ctx, error);
  }
}

/**
 * Get all admin users
 */
export async function getAllAdminUsers(ctx: Context) {
  try {
    const { page, limit } = paginationSchema.parse(ctx.req.query());
    const status = ctx.req.query("status") as
      | "Standard"
      | "OnChainUnlinked"
      | "ProLinked"
      | undefined;

    const result = await adminService.getAllAdminUsers(page, limit, status);

    return ctx.json({
      data: result,
      status: Status.Success
    });
  } catch (error) {
    return handleApiError(ctx, error);
  }
}

/**
 * POST endpoint for getting all admin users
 */
export async function getAllAdminUsersPost(ctx: Context) {
  try {
    const body = await ctx.req.json();
    const { page = 1, limit = 50, status } = body;

    const result = await adminService.getAllAdminUsers(page, limit, status);

    return ctx.json({
      data: result,
      status: Status.Success
    });
  } catch (error) {
    return handleApiError(ctx, error);
  }
}

/**
 * Force unlink a profile (admin override)
 */
export async function forceUnlinkProfile(ctx: Context) {
  try {
    const body = await ctx.req.json();
    const { adminWalletAddress, targetWallet, reason } =
      adminActionSchema.parse(body);

    const result = await adminService.forceUnlinkProfile(
      adminWalletAddress,
      targetWallet,
      reason
    );

    return ctx.json({
      data: { success: result },
      status: Status.Success
    });
  } catch (error) {
    return handleApiError(ctx, error);
  }
}

/**
 * Force link a profile (admin override)
 */
export async function forceLinkProfile(ctx: Context) {
  try {
    const body = await ctx.req.json();
    const { adminWalletAddress, targetWallet, profileId, reason } =
      forceLinkProfileSchema.parse(body);

    const result = await adminService.forceLinkProfile(
      adminWalletAddress,
      targetWallet,
      profileId,
      reason
    );

    return ctx.json({
      data: { success: result },
      status: Status.Success
    });
  } catch (error) {
    return handleApiError(ctx, error);
  }
}

/**
 * Grant premium access (admin override)
 */
export async function grantPremiumAccess(ctx: Context) {
  try {
    const body = await ctx.req.json();
    const { adminWalletAddress, targetWallet, reason } =
      adminActionSchema.parse(body);

    const result = await adminService.grantPremiumAccess(
      adminWalletAddress,
      targetWallet,
      reason
    );

    return ctx.json({
      data: { success: result },
      status: Status.Success
    });
  } catch (error) {
    return handleApiError(ctx, error);
  }
}

/**
 * Add admin note to user
 */
export async function addAdminNote(ctx: Context) {
  try {
    const body = await ctx.req.json();
    const { adminWalletAddress, targetWallet, note, isPrivate } =
      adminNoteSchema.parse(body);

    const result = await adminService.addAdminNote(
      adminWalletAddress,
      targetWallet,
      note,
      isPrivate
    );

    return ctx.json({
      data: { success: result },
      status: Status.Success
    });
  } catch (error) {
    return handleApiError(ctx, error);
  }
}

/**
 * Get enhanced admin statistics
 */
export async function getAdminStats(ctx: Context) {
  try {
    const result = await adminService.getEnhancedAdminStats();

    return ctx.json({
      data: result,
      status: Status.Success
    });
  } catch (error) {
    return handleApiError(ctx, error);
  }
}

/**
 * Get admin action history
 */
export async function getAdminActionHistory(ctx: Context) {
  try {
    const { page, limit } = paginationSchema.parse(ctx.req.query());
    const adminId = ctx.req.query("adminId") as string | undefined;
    const actionType = ctx.req.query("actionType") as string | undefined;
    const status = ctx.req.query("status") as string | undefined;

    const result = await adminService.getAdminActionHistory(
      page,
      limit,
      adminId,
      actionType,
      status
    );

    return ctx.json({
      data: result,
      status: Status.Success
    });
  } catch (error) {
    return handleApiError(ctx, error);
  }
}

/**
 * POST endpoint for getting admin action history
 */
export async function getAdminActionHistoryPost(ctx: Context) {
  try {
    const body = await ctx.req.json();
    const { page = 1, limit = 50, adminId, actionType, status } = body;

    const result = await adminService.getAdminActionHistory(
      page,
      limit,
      adminId,
      actionType,
      status
    );

    return ctx.json({
      data: result,
      status: Status.Success
    });
  } catch (error) {
    return handleApiError(ctx, error);
  }
}

/**
 * Get feature list
 */
export async function getFeatureList(ctx: Context) {
  try {
    const result = await adminService.getFeatureList();

    return ctx.json({
      data: result,
      status: Status.Success
    });
  } catch (error) {
    return handleApiError(ctx, error);
  }
}

/**
 * Update feature access for a user
 */
export async function updateFeatureAccess(ctx: Context) {
  try {
    const body = await ctx.req.json();
    const {
      adminWalletAddress,
      targetWallet,
      featureId,
      grantAccess,
      reason,
      expiresAt
    } = featureAccessSchema.parse(body);

    const result = await adminService.updateFeatureAccess(
      adminWalletAddress,
      targetWallet,
      featureId,
      grantAccess,
      reason,
      expiresAt
    );

    return ctx.json({
      data: { success: result },
      status: Status.Success
    });
  } catch (error) {
    return handleApiError(ctx, error);
  }
}

/**
 * Get admin user information
 */
export async function getAdminUserInfo(ctx: Context) {
  try {
    const { walletAddress } = walletAddressSchema.parse(ctx.req.query());

    const result = await adminService.getAdminUserInfo(walletAddress);

    return ctx.json({
      data: result,
      status: Status.Success
    });
  } catch (error) {
    return handleApiError(ctx, error);
  }
}

/**
 * POST endpoint for getting admin user info
 */
export async function getAdminUserInfoPost(ctx: Context) {
  try {
    const body = await ctx.req.json();
    const { walletAddress } = walletAddressSchema.parse(body);

    const result = await adminService.getAdminUserInfo(walletAddress);

    return ctx.json({
      data: result,
      status: Status.Success
    });
  } catch (error) {
    return handleApiError(ctx, error);
  }
}
