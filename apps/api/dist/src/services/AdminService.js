"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const logger_1 = __importDefault(require("../utils/logger"));
const AdminActionHelper_1 = require("./AdminActionHelper");
class AdminService {
    // biome-ignore lint: These will be used when blockchain and WebSocket services are implemented
    webSocketService;
    constructor(webSocketService) {
        this.webSocketService = webSocketService;
    }
    normalizeWalletAddress(address) {
        return address.toLowerCase();
    }
    /**
     * Check if admin user has permission for specific action
     */
    async checkAdminPermission(
    // biome-ignore lint: Will be used when proper admin permission system is implemented
    adminWalletAddress, 
    // biome-ignore lint: Will be used when proper admin permission system is implemented
    permission) {
        try {
            // For now, return true to allow development
            // TODO: Implement proper admin user lookup once schema is migrated
            return true;
        }
        catch (error) {
            logger_1.default.error("Error checking admin permission:", error);
            return false;
        }
    }
    /**
     * Get admin user information
     */
    async getAdminUserInfo(walletAddress) {
        try {
            const adminUser = await client_1.default.adminUser.findUnique({
                include: { permissions: true },
                where: { walletAddress: this.normalizeWalletAddress(walletAddress) }
            });
            if (!adminUser) {
                return null;
            }
            return {
                createdAt: adminUser.createdAt,
                displayName: adminUser.displayName || undefined,
                email: adminUser.email,
                id: adminUser.id,
                isActive: adminUser.isActive,
                lastLoginAt: adminUser.lastLoginAt || undefined,
                permissions: adminUser.permissions.map((p) => p.permission),
                role: adminUser.role,
                username: adminUser.username,
                walletAddress: adminUser.walletAddress
            };
        }
        catch (error) {
            logger_1.default.error("Error getting admin user info:", error);
            return null;
        }
    }
    /**
     * Get comprehensive admin view of a user with enhanced information
     */
    async getAdminUserView(walletAddress) {
        try {
            const normalizedAddress = this.normalizeWalletAddress(walletAddress);
            // Get user from database with all related data
            const user = await client_1.default.user.findUnique({
                include: {
                    adminNotes: {
                        include: {
                            adminUser: {
                                select: {
                                    displayName: true,
                                    username: true
                                }
                            }
                        },
                        orderBy: { createdAt: "desc" }
                    },
                    featureAccesses: {
                        include: {
                            feature: true
                        },
                        where: { isActive: true }
                    },
                    premiumProfile: true
                },
                where: { walletAddress: normalizedAddress }
            });
            if (!user) {
                return null;
            }
            // Check on-chain premium status
            const isPremiumOnChain = false; // TODO: Implement blockchain premium check
            // Determine user status
            let userStatus = "Standard";
            if (isPremiumOnChain && !user.premiumProfile) {
                userStatus = "OnChainUnlinked";
            }
            else if (user.premiumProfile) {
                userStatus = "ProLinked";
            }
            // Get available features
            const availableFeatures = user.featureAccesses.map((fa) => fa.feature.featureId);
            // Format admin notes
            const adminNotes = user.adminNotes.length > 0
                ? user.adminNotes
                    .map((note) => `${note.adminUser.displayName || note.adminUser.username}: ${note.note}`)
                    .join("\n")
                : undefined;
            return {
                adminNotes,
                availableFeatures,
                hasLinkedProfile: !!user.premiumProfile,
                isPremiumOnChain,
                lastActiveAt: user.lastActiveAt,
                linkedProfile: user.premiumProfile
                    ? {
                        handle: user.premiumProfile.profileId, // You might want to fetch the actual handle
                        linkedAt: user.premiumProfile.linkedAt,
                        profileId: user.premiumProfile.profileId
                    }
                    : undefined,
                premiumUpgradedAt: user.premiumUpgradedAt || undefined,
                referrerAddress: user.referrerAddress || undefined,
                registrationDate: user.registrationDate,
                registrationTxHash: user.registrationTxHash || undefined,
                totalLogins: user.totalLogins,
                userStatus,
                walletAddress: user.walletAddress
            };
        }
        catch (error) {
            logger_1.default.error("Error getting admin user view:", error);
            throw error;
        }
    }
    /**
     * Get all users with admin view and pagination
     */
    async getAllAdminUsers(page = 1, limit = 50, status) {
        try {
            const skip = (page - 1) * limit;
            // Build where clause based on status
            let whereClause = {};
            if (status === "OnChainUnlinked") {
                whereClause = {
                    premiumProfile: null
                    // You might need to add logic to check on-chain status
                };
            }
            else if (status === "ProLinked") {
                whereClause = {
                    premiumProfile: { isNot: null }
                };
            }
            else if (status === "Standard") {
                whereClause = {
                    premiumProfile: null
                    // You might need to add logic to check on-chain status
                };
            }
            const [users, total] = await Promise.all([
                client_1.default.user.findMany({
                    include: {
                        featureAccesses: {
                            include: { feature: true },
                            where: { isActive: true }
                        },
                        premiumProfile: true
                    },
                    orderBy: { registrationDate: "desc" },
                    skip,
                    take: limit,
                    where: whereClause
                }),
                client_1.default.user.count({ where: whereClause })
            ]);
            const adminUsers = await Promise.all(users.map(async (user) => {
                const isPremiumOnChain = false; // TODO: Implement blockchain premium check
                let userStatus = "Standard";
                if (isPremiumOnChain && !user.premiumProfile) {
                    userStatus = "OnChainUnlinked";
                }
                else if (user.premiumProfile) {
                    userStatus = "ProLinked";
                }
                return {
                    availableFeatures: user.featureAccesses.map((fa) => fa.feature.featureId),
                    hasLinkedProfile: !!user.premiumProfile,
                    isPremiumOnChain,
                    lastActiveAt: user.lastActiveAt,
                    linkedProfile: user.premiumProfile
                        ? {
                            handle: user.premiumProfile.profileId,
                            linkedAt: user.premiumProfile.linkedAt,
                            profileId: user.premiumProfile.profileId
                        }
                        : undefined,
                    premiumUpgradedAt: user.premiumUpgradedAt || undefined,
                    referrerAddress: user.referrerAddress || undefined,
                    registrationDate: user.registrationDate,
                    registrationTxHash: user.registrationTxHash || undefined,
                    totalLogins: user.totalLogins,
                    userStatus,
                    walletAddress: user.walletAddress
                };
            }));
            return {
                limit,
                page,
                total,
                users: adminUsers
            };
        }
        catch (error) {
            logger_1.default.error("Error getting all admin users:", error);
            throw error;
        }
    }
    /**
     * Force unlink a profile with admin override
     */
    async forceUnlinkProfile(adminWalletAddress, targetWallet, reason) {
        try {
            // Check permission
            const hasPermission = await this.checkAdminPermission(adminWalletAddress, "user.force_unlink");
            if (!hasPermission) {
                throw new Error("Insufficient permissions to force unlink profile");
            }
            const adminUser = await client_1.default.adminUser.findUnique({
                where: {
                    walletAddress: this.normalizeWalletAddress(adminWalletAddress)
                }
            });
            if (!adminUser) {
                throw new Error("Admin user not found");
            }
            // Create admin action log
            const adminAction = await (0, AdminActionHelper_1.createAction)(adminUser.id, "ForceUnlinkProfile", {
                reason,
                targetWallet: this.normalizeWalletAddress(targetWallet)
            });
            try {
                // Perform the unlink operation
                await client_1.default.premiumProfile.updateMany({
                    data: { deactivatedAt: new Date(), isActive: false },
                    where: { walletAddress: this.normalizeWalletAddress(targetWallet) }
                });
                // Update action status
                await (0, AdminActionHelper_1.completeAction)(adminAction.id, { success: true });
                // Send notification to user
                // TODO: Implement WebSocket notification
                // await this.webSocketService.sendNotification(targetWallet, {
                //   message: "Your profile has been unlinked by an administrator.",
                //   priority: "High",
                //   title: "Profile Unlinked",
                //   type: "System"
                // });
                logger_1.default.info(`Profile force unlinked by admin ${adminWalletAddress} for user ${targetWallet}`);
                return true;
            }
            catch (error) {
                // Update action status to failed
                await (0, AdminActionHelper_1.failAction)(adminAction.id, error);
                throw error;
            }
        }
        catch (error) {
            logger_1.default.error("Error force unlinking profile:", error);
            throw error;
        }
    }
    /**
     * Force link a profile with admin override
     */
    async forceLinkProfile(adminWalletAddress, targetWallet, profileId, reason) {
        try {
            // Check permission
            const hasPermission = await this.checkAdminPermission(adminWalletAddress, "user.force_link");
            if (!hasPermission) {
                throw new Error("Insufficient permissions to force link profile");
            }
            const adminUser = await client_1.default.adminUser.findUnique({
                where: {
                    walletAddress: this.normalizeWalletAddress(adminWalletAddress)
                }
            });
            if (!adminUser) {
                throw new Error("Admin user not found");
            }
            // Create admin action log
            const adminAction = await (0, AdminActionHelper_1.createAction)(adminUser.id, "ForceLinkProfile", {
                reason,
                targetProfileId: profileId,
                targetWallet: this.normalizeWalletAddress(targetWallet)
            });
            try {
                // Perform the link operation
                await client_1.default.premiumProfile.upsert({
                    create: {
                        isActive: true,
                        profileId,
                        walletAddress: this.normalizeWalletAddress(targetWallet)
                    },
                    update: {
                        deactivatedAt: null,
                        isActive: true,
                        profileId
                    },
                    where: { walletAddress: this.normalizeWalletAddress(targetWallet) }
                });
                // Update action status
                await (0, AdminActionHelper_1.completeAction)(adminAction.id, { profileId, success: true });
                // Send notification to user
                // TODO: Implement WebSocket notification
                // await this.webSocketService.sendNotification(targetWallet, {
                //   message: "Your profile has been linked by an administrator.",
                //   priority: "High",
                //   title: "Profile Linked",
                //   type: "System"
                // });
                logger_1.default.info(`Profile force linked by admin ${adminWalletAddress} for user ${targetWallet} with profile ${profileId}`);
                return true;
            }
            catch (error) {
                // Update action status to failed
                await (0, AdminActionHelper_1.failAction)(adminAction.id, error);
                throw error;
            }
        }
        catch (error) {
            logger_1.default.error("Error force linking profile:", error);
            throw error;
        }
    }
    /**
     * Grant premium access with admin override
     */
    async grantPremiumAccess(adminWalletAddress, targetWallet, reason) {
        try {
            // Check permission
            const hasPermission = await this.checkAdminPermission(adminWalletAddress, "user.grant_premium");
            if (!hasPermission) {
                throw new Error("Insufficient permissions to grant premium access");
            }
            const adminUser = await client_1.default.adminUser.findUnique({
                where: {
                    walletAddress: this.normalizeWalletAddress(adminWalletAddress)
                }
            });
            if (!adminUser) {
                throw new Error("Admin user not found");
            }
            // Create admin action log
            const adminAction = await (0, AdminActionHelper_1.createAction)(adminUser.id, "GrantPremium", {
                reason,
                targetWallet: this.normalizeWalletAddress(targetWallet)
            });
            try {
                // Update user premium status
                await client_1.default.user.update({
                    data: {
                        premiumUpgradedAt: new Date(),
                        status: "Premium"
                    },
                    where: { walletAddress: this.normalizeWalletAddress(targetWallet) }
                });
                // Update action status
                await (0, AdminActionHelper_1.completeAction)(adminAction.id, { success: true });
                // Send notification to user
                // TODO: Implement WebSocket notification
                // await this.webSocketService.sendNotification(targetWallet, {
                //   message:
                //     "Premium access has been granted to your account by an administrator.",
                //   priority: "High",
                //   title: "Premium Access Granted",
                //   type: "Premium"
                // });
                logger_1.default.info(`Premium access granted by admin ${adminWalletAddress} for user ${targetWallet}`);
                return true;
            }
            catch (error) {
                // Update action status to failed
                await (0, AdminActionHelper_1.failAction)(adminAction.id, error);
                throw error;
            }
        }
        catch (error) {
            logger_1.default.error("Error granting premium access:", error);
            throw error;
        }
    }
    /**
     * Add admin note to user
     */
    async addAdminNote(adminWalletAddress, targetWallet, note, isPrivate = false) {
        try {
            // Check permission
            const hasPermission = await this.checkAdminPermission(adminWalletAddress, "user.add_note");
            if (!hasPermission) {
                throw new Error("Insufficient permissions to add admin note");
            }
            const adminUser = await client_1.default.adminUser.findUnique({
                where: {
                    walletAddress: this.normalizeWalletAddress(adminWalletAddress)
                }
            });
            if (!adminUser) {
                throw new Error("Admin user not found");
            }
            // Create admin action log
            const adminAction = await (0, AdminActionHelper_1.createAction)(adminUser.id, "AddAdminNote", {
                reason: "Admin note added",
                targetWallet: this.normalizeWalletAddress(targetWallet)
            });
            try {
                // Add the note
                await client_1.default.adminNote.create({
                    data: {
                        adminUserId: adminUser.id,
                        isPrivate,
                        note,
                        walletAddress: this.normalizeWalletAddress(targetWallet)
                    }
                });
                // Update action status
                await (0, AdminActionHelper_1.completeAction)(adminAction.id, { success: true });
                logger_1.default.info(`Admin note added by ${adminWalletAddress} for user ${targetWallet}`);
                return true;
            }
            catch (error) {
                // Update action status to failed
                await (0, AdminActionHelper_1.failAction)(adminAction.id, error);
                throw error;
            }
        }
        catch (error) {
            logger_1.default.error("Error adding admin note:", error);
            throw error;
        }
    }
    /**
     * Get enhanced admin statistics
     */
    async getEnhancedAdminStats() {
        try {
            const [totalUsers, standardUsers, proLinkedUsers, totalPremiumWallets, totalLinkedProfiles, recentRegistrations, recentProfileLinks, adminUsers, adminActions, features, systemHealth] = await Promise.all([
                // User statistics
                client_1.default.user.count(),
                client_1.default.user.count({ where: { premiumProfile: null } }),
                client_1.default.user.count({ where: { premiumProfile: { isNot: null } } }),
                client_1.default.user.count({ where: { status: "Premium" } }),
                client_1.default.premiumProfile.count({ where: { isActive: true } }),
                client_1.default.user.count({
                    where: {
                        registrationDate: {
                            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        }
                    }
                }),
                client_1.default.premiumProfile.count({
                    where: {
                        linkedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                    }
                }),
                // Admin statistics
                client_1.default.adminUser.count(),
                client_1.default.adminAction.count(),
                client_1.default.feature.count(),
                // System health check
                this.checkSystemHealth()
            ]);
            const [activeAdminUsers, adminUsersByRole, actionStats, featuresByCategory] = await Promise.all([
                client_1.default.adminUser.count({ where: { isActive: true } }),
                client_1.default.adminUser.groupBy({
                    _count: { role: true },
                    by: ["role"]
                }),
                client_1.default.adminAction.groupBy({
                    _count: { status: true },
                    by: ["status"]
                }),
                client_1.default.feature.groupBy({
                    _count: { category: true },
                    by: ["category"]
                })
            ]);
            const recentActions = await client_1.default.adminAction.count({
                where: {
                    createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                }
            });
            return {
                actions: {
                    completed: actionStats.find((s) => s.status === "Completed")?._count.status ||
                        0,
                    failed: actionStats.find((s) => s.status === "Failed")?._count.status || 0,
                    pending: actionStats.find((s) => s.status === "Pending")?._count.status || 0,
                    recent: recentActions,
                    total: adminActions
                },
                adminUsers: {
                    active: activeAdminUsers,
                    byRole: adminUsersByRole.reduce((acc, item) => {
                        acc[item.role] = item._count.role;
                        return acc;
                    }, {}),
                    total: adminUsers
                },
                features: {
                    active: await client_1.default.feature.count({ where: { isActive: true } }),
                    byCategory: featuresByCategory.reduce((acc, item) => {
                        acc[item.category] = item._count.category;
                        return acc;
                    }, {}),
                    total: features
                },
                onChainUnlinkedUsers: 0, // This would need blockchain query
                proLinkedUsers,
                recentProfileLinks,
                recentRegistrations,
                standardUsers,
                systemHealth,
                totalLinkedProfiles,
                totalPremiumWallets,
                totalUsers
            };
        }
        catch (error) {
            logger_1.default.error("Error getting enhanced admin stats:", error);
            throw error;
        }
    }
    /**
     * Get admin action history
     */
    async getAdminActionHistory(page = 1, limit = 50, adminId, actionType, status) {
        try {
            const skip = (page - 1) * limit;
            const whereClause = {};
            if (adminId)
                whereClause.adminUserId = adminId;
            if (actionType)
                whereClause.actionType = actionType;
            if (status)
                whereClause.status = status;
            const [actions, total] = await Promise.all([
                client_1.default.adminAction.findMany({
                    include: {
                        adminUser: {
                            select: { displayName: true, username: true }
                        }
                    },
                    orderBy: { createdAt: "desc" },
                    skip,
                    take: limit,
                    where: whereClause
                }),
                client_1.default.adminAction.count({ where: whereClause })
            ]);
            const actionLogs = actions.map((action) => ({
                actionType: action.actionType,
                adminUserId: action.adminUserId,
                adminUsername: action.adminUser.displayName || action.adminUser.username,
                completedAt: action.completedAt || undefined,
                createdAt: action.createdAt,
                errorMessage: action.errorMessage || undefined,
                id: action.id,
                reason: action.reason,
                status: action.status,
                targetProfileId: action.targetProfileId || undefined,
                targetWallet: action.targetWallet
            }));
            return {
                actions: actionLogs,
                limit,
                page,
                total
            };
        }
        catch (error) {
            logger_1.default.error("Error getting admin action history:", error);
            throw error;
        }
    }
    /**
     * Get feature list with access information
     */
    async getFeatureList() {
        try {
            const features = await client_1.default.feature.findMany({
                include: {
                    _count: {
                        select: { featureAccesses: true }
                    }
                },
                orderBy: { category: "asc" }
            });
            return features.map((feature) => ({
                adminOverride: feature.adminOverride,
                category: feature.category,
                description: feature.description,
                featureId: feature.featureId,
                id: feature.id,
                isActive: feature.isActive,
                name: feature.name,
                premiumAccess: feature.premiumAccess,
                standardAccess: feature.standardAccess,
                userAccessCount: feature._count.featureAccesses
            }));
        }
        catch (error) {
            logger_1.default.error("Error getting feature list:", error);
            throw error;
        }
    }
    /**
     * Update feature access for a user
     */
    async updateFeatureAccess(adminWalletAddress, targetWallet, featureId, grantAccess, reason, expiresAt) {
        try {
            // Check permission
            const hasPermission = await this.checkAdminPermission(adminWalletAddress, "feature.manage");
            if (!hasPermission) {
                throw new Error("Insufficient permissions to manage feature access");
            }
            const adminUser = await client_1.default.adminUser.findUnique({
                where: {
                    walletAddress: this.normalizeWalletAddress(adminWalletAddress)
                }
            });
            if (!adminUser) {
                throw new Error("Admin user not found");
            }
            // Create admin action log
            const adminAction = await (0, AdminActionHelper_1.createAction)(adminUser.id, "UpdateFeatureAccess", {
                metadata: { expiresAt, featureId, grantAccess },
                reason,
                targetWallet: this.normalizeWalletAddress(targetWallet)
            });
            try {
                if (grantAccess) {
                    // Grant feature access
                    await client_1.default.featureAccess.upsert({
                        create: {
                            expiresAt,
                            featureId,
                            grantedBy: adminWalletAddress,
                            isActive: true,
                            walletAddress: this.normalizeWalletAddress(targetWallet)
                        },
                        update: {
                            expiresAt,
                            grantedBy: adminWalletAddress,
                            isActive: true
                        },
                        where: {
                            id: (await client_1.default.featureAccess.findFirst({
                                select: { id: true },
                                where: {
                                    featureId,
                                    walletAddress: this.normalizeWalletAddress(targetWallet)
                                }
                            }))?.id || "new"
                        }
                    });
                }
                else {
                    // Revoke feature access
                    await client_1.default.featureAccess.updateMany({
                        data: { isActive: false },
                        where: {
                            featureId,
                            walletAddress: this.normalizeWalletAddress(targetWallet)
                        }
                    });
                }
                // Update action status
                await (0, AdminActionHelper_1.completeAction)(adminAction.id, {
                    featureId,
                    grantAccess,
                    success: true
                });
                // Send notification to user
                // TODO: Implement WebSocket notification
                // await this.webSocketService.sendNotification(targetWallet, {
                //   message: `${grantAccess ? "Access to" : "Access to"} ${featureId} has been ${grantAccess ? "granted" : "revoked"} by an administrator.`,
                //   priority: "Normal",
                //   title: grantAccess
                //     ? "Feature Access Granted"
                //     : "Feature Access Revoked",
                //   type: "System"
                // });
                logger_1.default.info(`Feature access ${grantAccess ? "granted" : "revoked"} by admin ${adminWalletAddress} for user ${targetWallet}, feature: ${featureId}`);
                return true;
            }
            catch (error) {
                // Update action status to failed
                await (0, AdminActionHelper_1.failAction)(adminAction.id, error);
                throw error;
            }
        }
        catch (error) {
            logger_1.default.error("Error updating feature access:", error);
            throw error;
        }
    }
    /**
     * Check system health
     */
    async checkSystemHealth() {
        try {
            const databaseConnected = await client_1.default.$queryRaw `SELECT 1`
                .then(() => true)
                .catch(() => false);
            return {
                blockchainConnected: false, // TODO: Implement blockchain connection check
                databaseConnected,
                lastError: undefined,
                websocketConnected: false // TODO: Implement WebSocket connection check
            };
        }
        catch (error) {
            return {
                blockchainConnected: false,
                databaseConnected: false,
                lastError: error instanceof Error ? error.message : "Unknown error",
                websocketConnected: false
            };
        }
    }
    /**
     * Get available features for a user status
     */
    // biome-ignore lint: Will be used when feature system is fully implemented
    getAvailableFeatures(userStatus) {
        const baseFeatures = [
            "lens_profile_access",
            "basic_posting",
            "basic_commenting",
            "basic_liking",
            "basic_following"
        ];
        const premiumFeatures = [
            "premium_badge",
            "referral_dashboard",
            "claim_rewards",
            "advanced_analytics",
            "priority_support",
            "exclusive_content",
            "early_access_features",
            "custom_themes",
            "advanced_search",
            "bulk_operations"
        ];
        switch (userStatus) {
            case "Standard":
                return baseFeatures;
            case "OnChainUnlinked":
                return [...baseFeatures, ...premiumFeatures];
            case "ProLinked":
                return [...baseFeatures, ...premiumFeatures];
            default:
                return baseFeatures;
        }
    }
}
exports.AdminService = AdminService;
exports.default = AdminService;
