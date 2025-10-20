import prisma from "../prisma/client";
import logger from "../utils/logger";
import { completeAction, createAction, failAction } from "./AdminActionHelper";
import type WebSocketService from "./WebSocketService";

export interface AdminUser {
  walletAddress: string;
  userStatus: "Standard" | "OnChainUnlinked" | "ProLinked";
  isPremiumOnChain: boolean;
  hasLinkedProfile: boolean;
  linkedProfile?: {
    profileId: string;
    handle: string;
    linkedAt: Date;
  };
  registrationDate: Date;
  referrerAddress?: string;
  registrationTxHash?: string;
  premiumUpgradedAt?: Date;
  lastActiveAt: Date;
  totalLogins: number;
  availableFeatures: string[];
  adminNotes?: string;
}

export interface FeatureAccess {
  featureId: string;
  featureName: string;
  description: string;
  standardAccess: boolean;
  premiumAccess: boolean;
  adminOverride: boolean;
}

export interface AdminAction {
  actionId: string;
  adminId: string;
  actionType:
    | "unlink_profile"
    | "force_link_profile"
    | "grant_premium"
    | "revoke_premium"
    | "update_feature_access"
    | "add_admin_note";
  targetWallet: string;
  targetProfileId?: string;
  reason: string;
  metadata?: any;
  timestamp: Date;
  status: "pending" | "completed" | "failed";
  result?: any;
}

export interface AdminStats {
  totalUsers: number;
  standardUsers: number;
  onChainUnlinkedUsers: number;
  proLinkedUsers: number;
  totalPremiumWallets: number;
  totalLinkedProfiles: number;
  recentRegistrations: number;
  recentProfileLinks: number;
}

// New interfaces for enhanced admin system
export interface AdminUserInfo {
  id: string;
  walletAddress: string;
  email: string;
  username: string;
  displayName?: string;
  role: "SuperAdmin" | "SupportAgent" | "Auditor" | "Moderator";
  permissions: string[];
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
}

export interface AdminActionLog {
  id: string;
  adminUserId: string;
  adminUsername: string;
  actionType: string;
  targetWallet: string;
  targetProfileId?: string;
  reason: string;
  status: "Pending" | "Completed" | "Failed" | "Cancelled";
  createdAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export interface FeatureInfo {
  id: string;
  featureId: string;
  name: string;
  description: string;
  category: string;
  standardAccess: boolean;
  premiumAccess: boolean;
  adminOverride: boolean;
  isActive: boolean;
  userAccessCount: number;
}

export interface EnhancedAdminStats extends AdminStats {
  adminUsers: {
    total: number;
    active: number;
    byRole: Record<string, number>;
  };
  actions: {
    total: number;
    pending: number;
    completed: number;
    failed: number;
    recent: number;
  };
  features: {
    total: number;
    active: number;
    byCategory: Record<string, number>;
  };
  systemHealth: {
    databaseConnected: boolean;
    blockchainConnected: boolean;
    websocketConnected: boolean;
    lastError?: string;
  };
}

export class AdminService {
  // biome-ignore lint: These will be used when blockchain and WebSocket services are implemented
  private readonly webSocketService: WebSocketService;

  constructor(webSocketService: WebSocketService) {
    this.webSocketService = webSocketService;
  }

  private normalizeWalletAddress(address: string): string {
    return address.toLowerCase();
  }

  /**
   * Check if admin user has permission for specific action
   */
  async checkAdminPermission(
    // biome-ignore lint: Will be used when proper admin permission system is implemented
    adminWalletAddress: string,
    // biome-ignore lint: Will be used when proper admin permission system is implemented
    permission: string
  ): Promise<boolean> {
    try {
      // For now, return true to allow development
      // Proper admin user lookup will be implemented when needed
      return true;
    } catch (error) {
      logger.error("Error checking admin permission:", error);
      return false;
    }
  }

  /**
   * Get admin user information
   */
  async getAdminUserInfo(walletAddress: string): Promise<AdminUserInfo | null> {
    try {
      const adminUser = await prisma.adminUser.findUnique({
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
    } catch (error) {
      logger.error("Error getting admin user info:", error);
      return null;
    }
  }

  /**
   * Get comprehensive admin view of a user with enhanced information
   */
  async getAdminUserView(walletAddress: string): Promise<AdminUser | null> {
    try {
      const normalizedAddress = this.normalizeWalletAddress(walletAddress);

      // Get user from database with all related data
      const user = await prisma.user.findUnique({
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
      const isPremiumOnChain = false; // Blockchain premium check will be implemented when needed

      // Determine user status
      let userStatus: "Standard" | "OnChainUnlinked" | "ProLinked" = "Standard";
      if (isPremiumOnChain && !user.premiumProfile) {
        userStatus = "OnChainUnlinked";
      } else if (user.premiumProfile) {
        userStatus = "ProLinked";
      }

      // Get available features
      const availableFeatures = user.featureAccesses.map(
        (fa) => fa.feature.featureId
      );

      // Format admin notes
      const adminNotes =
        user.adminNotes.length > 0
          ? user.adminNotes
              .map(
                (note) =>
                  `${note.adminUser.displayName || note.adminUser.username}: ${note.note}`
              )
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
    } catch (error) {
      logger.error("Error getting admin user view:", error);
      throw error;
    }
  }

  /**
   * Get all users with admin view and pagination
   */
  async getAllAdminUsers(
    page = 1,
    limit = 50,
    status?: "Standard" | "OnChainUnlinked" | "ProLinked"
  ): Promise<{
    users: AdminUser[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      // Build where clause based on status
      let whereClause: any = {};
      if (status === "OnChainUnlinked") {
        whereClause = {
          premiumProfile: null
          // You might need to add logic to check on-chain status
        };
      } else if (status === "ProLinked") {
        whereClause = {
          premiumProfile: { isNot: null }
        };
      } else if (status === "Standard") {
        whereClause = {
          premiumProfile: null
          // You might need to add logic to check on-chain status
        };
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
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
        prisma.user.count({ where: whereClause })
      ]);

      const adminUsers: AdminUser[] = await Promise.all(
        users.map(async (user) => {
          const isPremiumOnChain = false; // Blockchain premium check will be implemented when needed

          let userStatus: "Standard" | "OnChainUnlinked" | "ProLinked" =
            "Standard";
          if (isPremiumOnChain && !user.premiumProfile) {
            userStatus = "OnChainUnlinked";
          } else if (user.premiumProfile) {
            userStatus = "ProLinked";
          }

          return {
            availableFeatures: user.featureAccesses.map(
              (fa) => fa.feature.featureId
            ),
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
        })
      );

      return {
        limit,
        page,
        total,
        users: adminUsers
      };
    } catch (error) {
      logger.error("Error getting all admin users:", error);
      throw error;
    }
  }

  /**
   * Force unlink a profile with admin override
   */
  async forceUnlinkProfile(
    adminWalletAddress: string,
    targetWallet: string,
    reason: string
  ): Promise<boolean> {
    try {
      // Check permission
      const hasPermission = await this.checkAdminPermission(
        adminWalletAddress,
        "user.force_unlink"
      );
      if (!hasPermission) {
        throw new Error("Insufficient permissions to force unlink profile");
      }

      const adminUser = await prisma.adminUser.findUnique({
        where: {
          walletAddress: this.normalizeWalletAddress(adminWalletAddress)
        }
      });

      if (!adminUser) {
        throw new Error("Admin user not found");
      }

      // Create admin action log
      const adminAction = await createAction(
        adminUser.id,
        "ForceUnlinkProfile",
        {
          reason,
          targetWallet: this.normalizeWalletAddress(targetWallet)
        }
      );

      try {
        // Perform the unlink operation
        await prisma.premiumProfile.updateMany({
          data: { deactivatedAt: new Date(), isActive: false },
          where: { walletAddress: this.normalizeWalletAddress(targetWallet) }
        });

        // Update action status
        await completeAction(adminAction.id, { success: true });

        // Send notification to user
        // WebSocket notification will be implemented when needed
        // await this.webSocketService.sendNotification(targetWallet, {
        //   message: "Your profile has been unlinked by an administrator.",
        //   priority: "High",
        //   title: "Profile Unlinked",
        //   type: "System"
        // });

        logger.info(
          `Profile force unlinked by admin ${adminWalletAddress} for user ${targetWallet}`
        );
        return true;
      } catch (error) {
        // Update action status to failed
        await failAction(adminAction.id, error);
        throw error;
      }
    } catch (error) {
      logger.error("Error force unlinking profile:", error);
      throw error;
    }
  }

  /**
   * Force link a profile with admin override
   */
  async forceLinkProfile(
    adminWalletAddress: string,
    targetWallet: string,
    profileId: string,
    reason: string
  ): Promise<boolean> {
    try {
      // Check permission
      const hasPermission = await this.checkAdminPermission(
        adminWalletAddress,
        "user.force_link"
      );
      if (!hasPermission) {
        throw new Error("Insufficient permissions to force link profile");
      }

      const adminUser = await prisma.adminUser.findUnique({
        where: {
          walletAddress: this.normalizeWalletAddress(adminWalletAddress)
        }
      });

      if (!adminUser) {
        throw new Error("Admin user not found");
      }

      // Create admin action log
      const adminAction = await createAction(adminUser.id, "ForceLinkProfile", {
        reason,
        targetProfileId: profileId,
        targetWallet: this.normalizeWalletAddress(targetWallet)
      });

      try {
        // Perform the link operation
        await prisma.premiumProfile.upsert({
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
        await completeAction(adminAction.id, { profileId, success: true });

        // Send notification to user
        // TODO: Implement WebSocket notification
        // await this.webSocketService.sendNotification(targetWallet, {
        //   message: "Your profile has been linked by an administrator.",
        //   priority: "High",
        //   title: "Profile Linked",
        //   type: "System"
        // });

        logger.info(
          `Profile force linked by admin ${adminWalletAddress} for user ${targetWallet} with profile ${profileId}`
        );
        return true;
      } catch (error) {
        // Update action status to failed
        await failAction(adminAction.id, error);
        throw error;
      }
    } catch (error) {
      logger.error("Error force linking profile:", error);
      throw error;
    }
  }

  /**
   * Grant premium access with admin override
   */
  async grantPremiumAccess(
    adminWalletAddress: string,
    targetWallet: string,
    reason: string
  ): Promise<boolean> {
    try {
      // Check permission
      const hasPermission = await this.checkAdminPermission(
        adminWalletAddress,
        "user.grant_premium"
      );
      if (!hasPermission) {
        throw new Error("Insufficient permissions to grant premium access");
      }

      const adminUser = await prisma.adminUser.findUnique({
        where: {
          walletAddress: this.normalizeWalletAddress(adminWalletAddress)
        }
      });

      if (!adminUser) {
        throw new Error("Admin user not found");
      }

      // Create admin action log
      const adminAction = await createAction(adminUser.id, "GrantPremium", {
        reason,
        targetWallet: this.normalizeWalletAddress(targetWallet)
      });

      try {
        // Update user premium status
        await prisma.user.update({
          data: {
            premiumUpgradedAt: new Date(),
            status: "Premium"
          },
          where: { walletAddress: this.normalizeWalletAddress(targetWallet) }
        });

        // Update action status
        await completeAction(adminAction.id, { success: true });

        // Send notification to user
        // TODO: Implement WebSocket notification
        // await this.webSocketService.sendNotification(targetWallet, {
        //   message:
        //     "Premium access has been granted to your account by an administrator.",
        //   priority: "High",
        //   title: "Premium Access Granted",
        //   type: "Premium"
        // });

        logger.info(
          `Premium access granted by admin ${adminWalletAddress} for user ${targetWallet}`
        );
        return true;
      } catch (error) {
        // Update action status to failed
        await failAction(adminAction.id, error);
        throw error;
      }
    } catch (error) {
      logger.error("Error granting premium access:", error);
      throw error;
    }
  }

  /**
   * Add admin note to user
   */
  async addAdminNote(
    adminWalletAddress: string,
    targetWallet: string,
    note: string,
    isPrivate = false
  ): Promise<boolean> {
    try {
      // Check permission
      const hasPermission = await this.checkAdminPermission(
        adminWalletAddress,
        "user.add_note"
      );
      if (!hasPermission) {
        throw new Error("Insufficient permissions to add admin note");
      }

      const adminUser = await prisma.adminUser.findUnique({
        where: {
          walletAddress: this.normalizeWalletAddress(adminWalletAddress)
        }
      });

      if (!adminUser) {
        throw new Error("Admin user not found");
      }

      // Create admin action log
      const adminAction = await createAction(adminUser.id, "AddAdminNote", {
        reason: "Admin note added",
        targetWallet: this.normalizeWalletAddress(targetWallet)
      });

      try {
        // Add the note
        await prisma.adminNote.create({
          data: {
            adminUserId: adminUser.id,
            isPrivate,
            note,
            walletAddress: this.normalizeWalletAddress(targetWallet)
          }
        });

        // Update action status
        await completeAction(adminAction.id, { success: true });

        logger.info(
          `Admin note added by ${adminWalletAddress} for user ${targetWallet}`
        );
        return true;
      } catch (error) {
        // Update action status to failed
        await failAction(adminAction.id, error);
        throw error;
      }
    } catch (error) {
      logger.error("Error adding admin note:", error);
      throw error;
    }
  }

  /**
   * Get enhanced admin statistics
   */
  async getEnhancedAdminStats(): Promise<EnhancedAdminStats> {
    try {
      const [
        totalUsers,
        standardUsers,
        proLinkedUsers,
        totalPremiumWallets,
        totalLinkedProfiles,
        recentRegistrations,
        recentProfileLinks,
        adminUsers,
        adminActions,
        features,
        systemHealth
      ] = await Promise.all([
        // User statistics
        prisma.user.count(),
        prisma.user.count({ where: { premiumProfile: null } }),
        prisma.user.count({ where: { premiumProfile: { isNot: null } } }),
        prisma.user.count({ where: { status: "Premium" } }),
        prisma.premiumProfile.count({ where: { isActive: true } }),
        prisma.user.count({
          where: {
            registrationDate: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        }),
        prisma.premiumProfile.count({
          where: {
            linkedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        }),

        // Admin statistics
        prisma.adminUser.count(),
        prisma.adminAction.count(),
        prisma.feature.count(),

        // System health check
        this.checkSystemHealth()
      ]);

      const [
        activeAdminUsers,
        adminUsersByRole,
        actionStats,
        featuresByCategory
      ] = await Promise.all([
        prisma.adminUser.count({ where: { isActive: true } }),
        prisma.adminUser.groupBy({
          _count: { role: true },
          by: ["role"]
        }),
        prisma.adminAction.groupBy({
          _count: { status: true },
          by: ["status"]
        }),
        prisma.feature.groupBy({
          _count: { category: true },
          by: ["category"]
        })
      ]);

      const recentActions = await prisma.adminAction.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      });

      return {
        actions: {
          completed:
            actionStats.find((s) => s.status === "Completed")?._count.status ||
            0,
          failed:
            actionStats.find((s) => s.status === "Failed")?._count.status || 0,
          pending:
            actionStats.find((s) => s.status === "Pending")?._count.status || 0,
          recent: recentActions,
          total: adminActions
        },
        adminUsers: {
          active: activeAdminUsers,
          byRole: adminUsersByRole.reduce(
            (acc, item) => {
              acc[item.role] = item._count.role;
              return acc;
            },
            {} as Record<string, number>
          ),
          total: adminUsers
        },
        features: {
          active: await prisma.feature.count({ where: { isActive: true } }),
          byCategory: featuresByCategory.reduce(
            (acc, item) => {
              acc[item.category] = item._count.category;
              return acc;
            },
            {} as Record<string, number>
          ),
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
    } catch (error) {
      logger.error("Error getting enhanced admin stats:", error);
      throw error;
    }
  }

  /**
   * Get admin action history
   */
  async getAdminActionHistory(
    page = 1,
    limit = 50,
    adminId?: string,
    actionType?: string,
    status?: string
  ): Promise<{
    actions: AdminActionLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const whereClause: any = {};
      if (adminId) whereClause.adminUserId = adminId;
      if (actionType) whereClause.actionType = actionType;
      if (status) whereClause.status = status;

      const [actions, total] = await Promise.all([
        prisma.adminAction.findMany({
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
        prisma.adminAction.count({ where: whereClause })
      ]);

      const actionLogs: AdminActionLog[] = actions.map((action) => ({
        actionType: action.actionType,
        adminUserId: action.adminUserId,
        adminUsername:
          action.adminUser.displayName || action.adminUser.username,
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
    } catch (error) {
      logger.error("Error getting admin action history:", error);
      throw error;
    }
  }

  /**
   * Get feature list with access information
   */
  async getFeatureList(): Promise<FeatureInfo[]> {
    try {
      const features = await prisma.feature.findMany({
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
    } catch (error) {
      logger.error("Error getting feature list:", error);
      throw error;
    }
  }

  /**
   * Update feature access for a user
   */
  async updateFeatureAccess(
    adminWalletAddress: string,
    targetWallet: string,
    featureId: string,
    grantAccess: boolean,
    reason: string,
    expiresAt?: Date
  ): Promise<boolean> {
    try {
      // Check permission
      const hasPermission = await this.checkAdminPermission(
        adminWalletAddress,
        "feature.manage"
      );
      if (!hasPermission) {
        throw new Error("Insufficient permissions to manage feature access");
      }

      const adminUser = await prisma.adminUser.findUnique({
        where: {
          walletAddress: this.normalizeWalletAddress(adminWalletAddress)
        }
      });

      if (!adminUser) {
        throw new Error("Admin user not found");
      }

      // Create admin action log
      const adminAction = await createAction(
        adminUser.id,
        "UpdateFeatureAccess",
        {
          metadata: { expiresAt, featureId, grantAccess },
          reason,
          targetWallet: this.normalizeWalletAddress(targetWallet)
        }
      );

      try {
        if (grantAccess) {
          // Grant feature access
          await prisma.featureAccess.upsert({
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
              id:
                (
                  await prisma.featureAccess.findFirst({
                    select: { id: true },
                    where: {
                      featureId,
                      walletAddress: this.normalizeWalletAddress(targetWallet)
                    }
                  })
                )?.id || "new"
            }
          });
        } else {
          // Revoke feature access
          await prisma.featureAccess.updateMany({
            data: { isActive: false },
            where: {
              featureId,
              walletAddress: this.normalizeWalletAddress(targetWallet)
            }
          });
        }

        // Update action status
        await completeAction(adminAction.id, {
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

        logger.info(
          `Feature access ${grantAccess ? "granted" : "revoked"} by admin ${adminWalletAddress} for user ${targetWallet}, feature: ${featureId}`
        );
        return true;
      } catch (error) {
        // Update action status to failed
        await failAction(adminAction.id, error);
        throw error;
      }
    } catch (error) {
      logger.error("Error updating feature access:", error);
      throw error;
    }
  }

  /**
   * Check system health
   */
  private async checkSystemHealth(): Promise<{
    databaseConnected: boolean;
    blockchainConnected: boolean;
    websocketConnected: boolean;
    lastError?: string;
  }> {
    try {
      const databaseConnected = await prisma.$queryRaw`SELECT 1`
        .then(() => true)
        .catch(() => false);

      return {
        blockchainConnected: false, // Blockchain connection check will be implemented when needed
        databaseConnected,
        lastError: undefined,
        websocketConnected: false // WebSocket connection check will be implemented when needed
      };
    } catch (error) {
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
  private getAvailableFeatures(
    userStatus: "Standard" | "OnChainUnlinked" | "ProLinked"
  ): string[] {
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

export default AdminService;
