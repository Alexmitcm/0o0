"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminUserView = getAdminUserView;
exports.getAdminUserViewPost = getAdminUserViewPost;
exports.getAllAdminUsers = getAllAdminUsers;
exports.getAllAdminUsersPost = getAllAdminUsersPost;
exports.forceUnlinkProfile = forceUnlinkProfile;
exports.forceLinkProfile = forceLinkProfile;
exports.grantPremiumAccess = grantPremiumAccess;
exports.addAdminNote = addAdminNote;
exports.getAdminStats = getAdminStats;
exports.getAdminActionHistory = getAdminActionHistory;
exports.getAdminActionHistoryPost = getAdminActionHistoryPost;
exports.getFeatureList = getFeatureList;
exports.updateFeatureAccess = updateFeatureAccess;
exports.getAdminUserInfo = getAdminUserInfo;
exports.getAdminUserInfoPost = getAdminUserInfoPost;
const enums_1 = require("@hey/data/enums");
const zod_1 = require("zod");
const AdminService_1 = __importDefault(require("../services/AdminService"));
const handleApiError_1 = __importDefault(require("../utils/handleApiError"));
// Create mock WebSocketService for AdminService
const mockWebSocketService = {
    broadcastPremiumStatusUpdate: () => { },
    broadcastProfileLinkedUpdate: () => { },
    broadcastRegistrationUpdate: () => { },
    broadcastTransactionUpdate: () => { },
    getStats: () => ({ connectedClients: 0 }),
    sendNotification: () => { }
};
// Create AdminService instance
const adminService = new AdminService_1.default(mockWebSocketService);
// Validation schemas
const walletAddressSchema = zod_1.z.object({
    walletAddress: zod_1.z.string().min(1, "Wallet address is required")
});
const paginationSchema = zod_1.z.object({
    limit: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? Number.parseInt(val, 10) : undefined)),
    page: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? Number.parseInt(val, 10) : undefined))
});
const adminActionSchema = zod_1.z.object({
    adminWalletAddress: zod_1.z.string().min(1, "Admin wallet address is required"),
    reason: zod_1.z.string().min(1, "Reason is required"),
    targetWallet: zod_1.z.string().min(1, "Target wallet address is required")
});
const forceLinkProfileSchema = zod_1.z.object({
    adminWalletAddress: zod_1.z.string().min(1, "Admin wallet address is required"),
    profileId: zod_1.z.string().min(1, "Profile ID is required"),
    reason: zod_1.z.string().min(1, "Reason is required"),
    targetWallet: zod_1.z.string().min(1, "Target wallet address is required")
});
const adminNoteSchema = zod_1.z.object({
    adminWalletAddress: zod_1.z.string().min(1, "Admin wallet address is required"),
    isPrivate: zod_1.z.boolean().optional().default(false),
    note: zod_1.z.string().min(1, "Note is required"),
    targetWallet: zod_1.z.string().min(1, "Target wallet address is required")
});
const featureAccessSchema = zod_1.z.object({
    adminWalletAddress: zod_1.z.string().min(1, "Admin wallet address is required"),
    expiresAt: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
    featureId: zod_1.z.string().min(1, "Feature ID is required"),
    grantAccess: zod_1.z.boolean(),
    reason: zod_1.z.string().min(1, "Reason is required"),
    targetWallet: zod_1.z.string().min(1, "Target wallet address is required")
});
/**
 * Get admin user view
 */
async function getAdminUserView(ctx) {
    try {
        const { walletAddress } = walletAddressSchema.parse(ctx.req.query());
        const result = await adminService.getAdminUserView(walletAddress);
        return ctx.json({
            data: result,
            status: enums_1.Status.Success
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(ctx, error);
    }
}
/**
 * POST endpoint for getting admin user view
 */
async function getAdminUserViewPost(ctx) {
    try {
        const body = await ctx.req.json();
        const { walletAddress } = walletAddressSchema.parse(body);
        const result = await adminService.getAdminUserView(walletAddress);
        return ctx.json({
            data: result,
            status: enums_1.Status.Success
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(ctx, error);
    }
}
/**
 * Get all admin users
 */
async function getAllAdminUsers(ctx) {
    try {
        const { page, limit } = paginationSchema.parse(ctx.req.query());
        const status = ctx.req.query("status");
        const result = await adminService.getAllAdminUsers(page, limit, status);
        return ctx.json({
            data: result,
            status: enums_1.Status.Success
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(ctx, error);
    }
}
/**
 * POST endpoint for getting all admin users
 */
async function getAllAdminUsersPost(ctx) {
    try {
        const body = await ctx.req.json();
        const { page = 1, limit = 50, status } = body;
        const result = await adminService.getAllAdminUsers(page, limit, status);
        return ctx.json({
            data: result,
            status: enums_1.Status.Success
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(ctx, error);
    }
}
/**
 * Force unlink a profile (admin override)
 */
async function forceUnlinkProfile(ctx) {
    try {
        const body = await ctx.req.json();
        const { adminWalletAddress, targetWallet, reason } = adminActionSchema.parse(body);
        const result = await adminService.forceUnlinkProfile(adminWalletAddress, targetWallet, reason);
        return ctx.json({
            data: { success: result },
            status: enums_1.Status.Success
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(ctx, error);
    }
}
/**
 * Force link a profile (admin override)
 */
async function forceLinkProfile(ctx) {
    try {
        const body = await ctx.req.json();
        const { adminWalletAddress, targetWallet, profileId, reason } = forceLinkProfileSchema.parse(body);
        const result = await adminService.forceLinkProfile(adminWalletAddress, targetWallet, profileId, reason);
        return ctx.json({
            data: { success: result },
            status: enums_1.Status.Success
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(ctx, error);
    }
}
/**
 * Grant premium access (admin override)
 */
async function grantPremiumAccess(ctx) {
    try {
        const body = await ctx.req.json();
        const { adminWalletAddress, targetWallet, reason } = adminActionSchema.parse(body);
        const result = await adminService.grantPremiumAccess(adminWalletAddress, targetWallet, reason);
        return ctx.json({
            data: { success: result },
            status: enums_1.Status.Success
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(ctx, error);
    }
}
/**
 * Add admin note to user
 */
async function addAdminNote(ctx) {
    try {
        const body = await ctx.req.json();
        const { adminWalletAddress, targetWallet, note, isPrivate } = adminNoteSchema.parse(body);
        const result = await adminService.addAdminNote(adminWalletAddress, targetWallet, note, isPrivate);
        return ctx.json({
            data: { success: result },
            status: enums_1.Status.Success
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(ctx, error);
    }
}
/**
 * Get enhanced admin statistics
 */
async function getAdminStats(ctx) {
    try {
        const result = await adminService.getEnhancedAdminStats();
        return ctx.json({
            data: result,
            status: enums_1.Status.Success
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(ctx, error);
    }
}
/**
 * Get admin action history
 */
async function getAdminActionHistory(ctx) {
    try {
        const { page, limit } = paginationSchema.parse(ctx.req.query());
        const adminId = ctx.req.query("adminId");
        const actionType = ctx.req.query("actionType");
        const status = ctx.req.query("status");
        const result = await adminService.getAdminActionHistory(page, limit, adminId, actionType, status);
        return ctx.json({
            data: result,
            status: enums_1.Status.Success
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(ctx, error);
    }
}
/**
 * POST endpoint for getting admin action history
 */
async function getAdminActionHistoryPost(ctx) {
    try {
        const body = await ctx.req.json();
        const { page = 1, limit = 50, adminId, actionType, status } = body;
        const result = await adminService.getAdminActionHistory(page, limit, adminId, actionType, status);
        return ctx.json({
            data: result,
            status: enums_1.Status.Success
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(ctx, error);
    }
}
/**
 * Get feature list
 */
async function getFeatureList(ctx) {
    try {
        const result = await adminService.getFeatureList();
        return ctx.json({
            data: result,
            status: enums_1.Status.Success
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(ctx, error);
    }
}
/**
 * Update feature access for a user
 */
async function updateFeatureAccess(ctx) {
    try {
        const body = await ctx.req.json();
        const { adminWalletAddress, targetWallet, featureId, grantAccess, reason, expiresAt } = featureAccessSchema.parse(body);
        const result = await adminService.updateFeatureAccess(adminWalletAddress, targetWallet, featureId, grantAccess, reason, expiresAt);
        return ctx.json({
            data: { success: result },
            status: enums_1.Status.Success
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(ctx, error);
    }
}
/**
 * Get admin user information
 */
async function getAdminUserInfo(ctx) {
    try {
        const { walletAddress } = walletAddressSchema.parse(ctx.req.query());
        const result = await adminService.getAdminUserInfo(walletAddress);
        return ctx.json({
            data: result,
            status: enums_1.Status.Success
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(ctx, error);
    }
}
/**
 * POST endpoint for getting admin user info
 */
async function getAdminUserInfoPost(ctx) {
    try {
        const body = await ctx.req.json();
        const { walletAddress } = walletAddressSchema.parse(body);
        const result = await adminService.getAdminUserInfo(walletAddress);
        return ctx.json({
            data: result,
            status: enums_1.Status.Success
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(ctx, error);
    }
}
