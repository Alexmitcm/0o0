import prisma from "../prisma/client";
import logger from "../utils/logger";
import ProfileService from "./ProfileService";

export interface LinkedProfile {
  profileId: string;
  handle: string;
  linkedAt: Date;
}

export interface AvailableProfilesResult {
  profiles: Array<{
    id: string;
    handle: string;
    ownedBy: string;
    isDefault: boolean;
  }>;
  canLink: boolean;
  linkedProfile?: LinkedProfile | null;
}

export interface UserPremiumStatus {
  userStatus: "Standard" | "OnChainUnlinked" | "ProLinked";
  linkedProfile?: LinkedProfile | null;
}

export interface UserProfile {
  walletAddress: string;
  email?: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  website?: string;
  twitterHandle?: string;
  premiumStatus: "Standard" | "OnChainUnlinked" | "ProLinked";
  registrationDate: Date;
  referrerAddress?: string;
  lastActiveAt: Date;
  totalLogins: number;
}

export interface UserStats {
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  totalFollowers: number;
  totalFollowing: number;
  daysAsPremium: number;
  referralCount: number;
  totalEarnings: number;
  questsCompleted: number;
  questsInProgress: number;
}

export interface UserReward {
  id: string;
  type: "Referral" | "Quest" | "Activity" | "Bonus" | "Welcome";
  amount: number;
  currency: string;
  status: "Pending" | "Claimed" | "Failed" | "Expired";
  sourceType: "Registration" | "Referral" | "Quest" | "Activity" | "Admin";
  createdAt: Date;
  claimedAt?: Date;
}

export interface UserQuest {
  id: string;
  questId: string;
  title: string;
  description: string;
  type: "Welcome" | "Referral" | "Activity" | "Social" | "Premium";
  status: "Active" | "Completed" | "Expired" | "Failed";
  currentProgress: number;
  targetProgress: number;
  rewardAmount?: number;
  createdAt: Date;
  completedAt?: Date;
}

export class UserService {
  private readonly profileService: typeof ProfileService;

  constructor() {
    this.profileService = ProfileService;
  }

  private normalizeWalletAddress(address: string): string {
    return address.toLowerCase();
  }

  /**
   * Create or update user profile during registration
   */
  async createOrUpdateUser(
    walletAddress: string,
    userData: Partial<UserProfile>
  ): Promise<UserProfile> {
    try {
      const normalizedAddress = this.normalizeWalletAddress(walletAddress);

      const user = await prisma.user.upsert({
        create: {
          walletAddress: normalizedAddress,
          ...userData,
          lastActiveAt: new Date(),
          registrationDate: new Date(),
          totalLogins: 1
        },
        include: {
          preferences: true,
          userStats: true
        },
        update: {
          ...userData,
          updatedAt: new Date()
        },
        where: { walletAddress: normalizedAddress }
      });

      // Create default preferences if they don't exist
      if (!user.preferences) {
        await prisma.userPreferences.create({
          data: { walletAddress: normalizedAddress }
        });
      }

      // Create default stats if they don't exist
      if (!user.userStats) {
        await prisma.userStats.create({
          data: { walletAddress: normalizedAddress }
        });
      }

      logger.info(
        `User profile created/updated for wallet: ${normalizedAddress}`
      );
      return this.mapUserToProfile(user);
    } catch (error) {
      logger.error(`Error creating/updating user ${walletAddress}:`, error);
      throw new Error("Failed to create/update user profile");
    }
  }

  /**
   * Get complete user profile
   */
  async getUserProfile(walletAddress: string): Promise<UserProfile | null> {
    try {
      const normalizedAddress = this.normalizeWalletAddress(walletAddress);

      const user = await prisma.user.findUnique({
        include: {
          preferences: true,
          premiumProfile: true,
          userStats: true
        },
        where: { walletAddress: normalizedAddress }
      });

      if (!user) {
        return null;
      }

      return this.mapUserToProfile(user);
    } catch (error) {
      logger.error(`Error getting user profile for ${walletAddress}:`, error);
      throw new Error("Failed to get user profile");
    }
  }

  /**
   * Update user activity (login, last active, etc.)
   */
  async updateUserActivity(walletAddress: string): Promise<void> {
    try {
      const normalizedAddress = this.normalizeWalletAddress(walletAddress);

      await prisma.user.update({
        data: {
          lastActiveAt: new Date(),
          totalLogins: {
            increment: 1
          }
        },
        where: { walletAddress: normalizedAddress }
      });

      logger.debug(`User activity updated for wallet: ${normalizedAddress}`);
    } catch (error) {
      logger.error(`Error updating user activity for ${walletAddress}:`, error);
      // Don't throw error for activity updates
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    walletAddress: string,
    preferences: Partial<{
      emailNotifications: boolean;
      pushNotifications: boolean;
      marketingEmails: boolean;
      privacyLevel: "Public" | "Private" | "FriendsOnly";
      language: string;
      timezone: string;
      autoLinkProfile: boolean;
      showPremiumBadge: boolean;
    }>
  ): Promise<void> {
    try {
      const normalizedAddress = this.normalizeWalletAddress(walletAddress);

      await prisma.userPreferences.upsert({
        create: {
          walletAddress: normalizedAddress,
          ...preferences
        },
        update: preferences,
        where: { walletAddress: normalizedAddress }
      });

      logger.info(`User preferences updated for wallet: ${normalizedAddress}`);
    } catch (error) {
      logger.error(
        `Error updating user preferences for ${walletAddress}:`,
        error
      );
      throw new Error("Failed to update user preferences");
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(walletAddress: string): Promise<UserStats | null> {
    try {
      const normalizedAddress = this.normalizeWalletAddress(walletAddress);

      const stats = await prisma.userStats.findUnique({
        where: { walletAddress: normalizedAddress }
      });

      if (!stats) {
        return null;
      }

      return {
        daysAsPremium: stats.daysAsPremium,
        questsCompleted: stats.questsCompleted,
        questsInProgress: stats.questsInProgress,
        referralCount: stats.referralCount,
        totalComments: stats.totalComments,
        totalEarnings: Number(stats.totalEarnings),
        totalFollowers: stats.totalFollowers,
        totalFollowing: stats.totalFollowing,
        totalLikes: stats.totalLikes,
        totalPosts: stats.totalPosts
      };
    } catch (error) {
      logger.error(`Error getting user stats for ${walletAddress}:`, error);
      throw new Error("Failed to get user statistics");
    }
  }

  /**
   * Update user statistics
   */
  async updateUserStats(
    walletAddress: string,
    statsUpdate: Partial<UserStats>
  ): Promise<void> {
    try {
      const normalizedAddress = this.normalizeWalletAddress(walletAddress);

      await prisma.userStats.upsert({
        create: {
          walletAddress: normalizedAddress,
          ...statsUpdate
        },
        update: statsUpdate,
        where: { walletAddress: normalizedAddress }
      });

      logger.debug(`User stats updated for wallet: ${normalizedAddress}`);
    } catch (error) {
      logger.error(`Error updating user stats for ${walletAddress}:`, error);
      throw new Error("Failed to update user statistics");
    }
  }

  /**
   * Create user reward
   */
  async createUserReward(
    walletAddress: string,
    rewardData: {
      type: "Referral" | "Quest" | "Activity" | "Bonus" | "Welcome";
      amount: number;
      currency?: string;
      sourceType: "Registration" | "Referral" | "Quest" | "Activity" | "Admin";
      sourceId?: string;
      sourceMetadata?: any;
    }
  ): Promise<UserReward> {
    try {
      const normalizedAddress = this.normalizeWalletAddress(walletAddress);

      const reward = await prisma.userReward.create({
        data: {
          amount: rewardData.amount,
          currency: rewardData.currency || "USDT",
          sourceId: rewardData.sourceId,
          sourceMetadata: rewardData.sourceMetadata,
          sourceType: rewardData.sourceType,
          type: rewardData.type,
          walletAddress: normalizedAddress
        }
      });

      logger.info(
        `User reward created for wallet: ${normalizedAddress}, amount: ${rewardData.amount}`
      );

      return {
        amount: Number(reward.amount),
        claimedAt: reward.claimedAt || undefined,
        createdAt: reward.createdAt,
        currency: reward.currency,
        id: reward.id,
        sourceType: reward.sourceType,
        status: reward.status,
        type: reward.type
      };
    } catch (error) {
      logger.error(`Error creating user reward for ${walletAddress}:`, error);
      throw new Error("Failed to create user reward");
    }
  }

  /**
   * Get user rewards
   */
  async getUserRewards(
    walletAddress: string,
    status?: "Pending" | "Claimed" | "Failed" | "Expired"
  ): Promise<UserReward[]> {
    try {
      const normalizedAddress = this.normalizeWalletAddress(walletAddress);

      const rewards = await prisma.userReward.findMany({
        orderBy: { createdAt: "desc" },
        where: {
          walletAddress: normalizedAddress,
          ...(status && { status })
        }
      });

      return rewards.map((reward) => ({
        amount: Number(reward.amount),
        claimedAt: reward.claimedAt || undefined,
        createdAt: reward.createdAt,
        currency: reward.currency,
        id: reward.id,
        sourceType: reward.sourceType,
        status: reward.status,
        type: reward.type
      }));
    } catch (error) {
      logger.error(`Error getting user rewards for ${walletAddress}:`, error);
      throw new Error("Failed to get user rewards");
    }
  }

  /**
   * Create user quest
   */
  async createUserQuest(
    walletAddress: string,
    questData: {
      questId: string;
      title: string;
      description: string;
      type: "Welcome" | "Referral" | "Activity" | "Social" | "Premium";
      targetProgress: number;
      rewardAmount?: number;
    }
  ): Promise<UserQuest> {
    try {
      const normalizedAddress = this.normalizeWalletAddress(walletAddress);

      const quest = await prisma.userQuest.create({
        data: {
          description: questData.description,
          questId: questData.questId,
          rewardAmount: questData.rewardAmount,
          targetProgress: questData.targetProgress,
          title: questData.title,
          type: questData.type,
          walletAddress: normalizedAddress
        }
      });

      logger.info(
        `User quest created for wallet: ${normalizedAddress}, quest: ${questData.title}`
      );

      return {
        completedAt: quest.completedAt || undefined,
        createdAt: quest.createdAt,
        currentProgress: quest.currentProgress,
        description: quest.description,
        id: quest.id,
        questId: quest.questId,
        rewardAmount: quest.rewardAmount
          ? Number(quest.rewardAmount)
          : undefined,
        status: quest.status,
        targetProgress: quest.targetProgress,
        title: quest.title,
        type: quest.type
      };
    } catch (error) {
      logger.error(`Error creating user quest for ${walletAddress}:`, error);
      throw new Error("Failed to create user quest");
    }
  }

  /**
   * Update quest progress
   */
  async updateQuestProgress(
    walletAddress: string,
    questId: string,
    progress: number
  ): Promise<UserQuest | null> {
    try {
      const normalizedAddress = this.normalizeWalletAddress(walletAddress);

      const quest = await prisma.userQuest.findFirst({
        where: {
          questId: questId,
          status: "Active",
          walletAddress: normalizedAddress
        }
      });

      if (!quest) {
        return null;
      }

      const newProgress = Math.min(progress, quest.targetProgress);
      const isCompleted = newProgress >= quest.targetProgress;

      const updatedQuest = await prisma.userQuest.update({
        data: {
          completedAt: isCompleted ? new Date() : undefined,
          currentProgress: newProgress,
          status: isCompleted ? "Completed" : "Active"
        },
        where: { id: quest.id }
      });

      logger.info(
        `Quest progress updated for wallet: ${normalizedAddress}, quest: ${questId}, progress: ${newProgress}/${quest.targetProgress}`
      );

      return {
        completedAt: updatedQuest.completedAt || undefined,
        createdAt: updatedQuest.createdAt,
        currentProgress: updatedQuest.currentProgress,
        description: updatedQuest.description,
        id: updatedQuest.id,
        questId: updatedQuest.questId,
        rewardAmount: updatedQuest.rewardAmount
          ? Number(updatedQuest.rewardAmount)
          : undefined,
        status: updatedQuest.status,
        targetProgress: updatedQuest.targetProgress,
        title: updatedQuest.title,
        type: updatedQuest.type
      };
    } catch (error) {
      logger.error(
        `Error updating quest progress for ${walletAddress}:`,
        error
      );
      throw new Error("Failed to update quest progress");
    }
  }

  /**
   * Get user quests
   */
  async getUserQuests(
    walletAddress: string,
    status?: "Active" | "Completed" | "Expired" | "Failed"
  ): Promise<UserQuest[]> {
    try {
      const normalizedAddress = this.normalizeWalletAddress(walletAddress);

      const quests = await prisma.userQuest.findMany({
        orderBy: { createdAt: "desc" },
        where: {
          walletAddress: normalizedAddress,
          ...(status && { status })
        }
      });

      return quests.map((quest) => ({
        completedAt: quest.completedAt || undefined,
        createdAt: quest.createdAt,
        currentProgress: quest.currentProgress,
        description: quest.description,
        id: quest.id,
        questId: quest.questId,
        rewardAmount: quest.rewardAmount
          ? Number(quest.rewardAmount)
          : undefined,
        status: quest.status,
        targetProgress: quest.targetProgress,
        title: quest.title,
        type: quest.type
      }));
    } catch (error) {
      logger.error(`Error getting user quests for ${walletAddress}:`, error);
      throw new Error("Failed to get user quests");
    }
  }

  /**
   * Create user notification
   */
  async createUserNotification(
    walletAddress: string,
    notificationData: {
      type:
        | "Welcome"
        | "Premium"
        | "Quest"
        | "Reward"
        | "Referral"
        | "System"
        | "Marketing";
      title: string;
      message: string;
      priority?: "Low" | "Normal" | "High" | "Urgent";
      actionUrl?: string;
      actionMetadata?: any;
    }
  ): Promise<void> {
    try {
      const normalizedAddress = this.normalizeWalletAddress(walletAddress);

      await prisma.userNotification.create({
        data: {
          actionMetadata: notificationData.actionMetadata,
          actionUrl: notificationData.actionUrl,
          message: notificationData.message,
          priority: notificationData.priority || "Normal",
          title: notificationData.title,
          type: notificationData.type,
          walletAddress: normalizedAddress
        }
      });

      logger.info(
        `User notification created for wallet: ${normalizedAddress}, type: ${notificationData.type}`
      );
    } catch (error) {
      logger.error(
        `Error creating user notification for ${walletAddress}:`,
        error
      );
      throw new Error("Failed to create user notification");
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    walletAddress: string,
    isRead?: boolean,
    limit = 50
  ): Promise<
    Array<{
      id: string;
      type: string;
      title: string;
      message: string;
      priority: string;
      isRead: boolean;
      actionUrl?: string;
      createdAt: Date;
    }>
  > {
    try {
      const normalizedAddress = this.normalizeWalletAddress(walletAddress);

      const notifications = await prisma.userNotification.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        where: {
          walletAddress: normalizedAddress,
          ...(isRead !== undefined && { isRead })
        }
      });

      return notifications.map((notification) => ({
        actionUrl: notification.actionUrl || undefined,
        createdAt: notification.createdAt,
        id: notification.id,
        isRead: notification.isRead,
        message: notification.message,
        priority: notification.priority,
        title: notification.title,
        type: notification.type
      }));
    } catch (error) {
      logger.error(
        `Error getting user notifications for ${walletAddress}:`,
        error
      );
      throw new Error("Failed to get user notifications");
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(
    walletAddress: string,
    notificationId: string
  ): Promise<void> {
    try {
      const normalizedAddress = this.normalizeWalletAddress(walletAddress);

      await prisma.userNotification.updateMany({
        data: {
          isRead: true,
          readAt: new Date()
        },
        where: {
          id: notificationId,
          walletAddress: normalizedAddress
        }
      });

      logger.debug(`Notification marked as read: ${notificationId}`);
    } catch (error) {
      logger.error(
        `Error marking notification as read for ${walletAddress}:`,
        error
      );
      throw new Error("Failed to mark notification as read");
    }
  }

  /**
   * Get user's premium status with enhanced linking logic
   * Returns: 'Standard' | 'OnChainUnlinked' | 'ProLinked'
   */
  async getUserPremiumStatus(
    walletAddress: string
  ): Promise<UserPremiumStatus> {
    try {
      const normalizedAddress = this.normalizeWalletAddress(walletAddress);
      logger.info(`Getting premium status for wallet: ${normalizedAddress}`);

      // Check if wallet has a linked profile in our database
      const existingLink = await prisma.premiumProfile.findUnique({
        where: { walletAddress: normalizedAddress }
      });

      if (existingLink) {
        // Profile is already linked - get profile details
        const profile = await this.profileService.getProfileById(
          existingLink.profileId
        );
        if (!profile) {
          logger.error(
            `Linked profile ${existingLink.profileId} not found in Lens`
          );
          return { userStatus: "OnChainUnlinked" };
        }

        logger.info(
          `Wallet ${normalizedAddress} has linked profile: ${profile.handle}`
        );
        return {
          linkedProfile: {
            handle: profile.handle,
            linkedAt: existingLink.linkedAt,
            profileId: existingLink.profileId
          },
          userStatus: "ProLinked"
        };
      }

      // Wallet is premium but no profile linked yet
      logger.info(
        `Wallet ${normalizedAddress} is premium but no profile linked`
      );
      return { userStatus: "OnChainUnlinked" };
    } catch (error) {
      logger.error(`Error getting premium status for ${walletAddress}:`, error);
      throw new Error("Failed to get premium status");
    }
  }

  /**
   * Link a profile to a wallet permanently
   * This enforces the business rule: first selected profile becomes permanent
   */
  async linkProfileToWallet(
    walletAddress: string,
    profileId: string
  ): Promise<LinkedProfile> {
    const normalizedAddress = this.normalizeWalletAddress(walletAddress);

    try {
      logger.info(
        `Attempting to link profile ${profileId} to wallet ${normalizedAddress}`
      );

      // Wrap all operations in a transaction to prevent race conditions
      const result = await prisma.$transaction(async (tx) => {
        // Step 1: Check if wallet already has a linked profile (BLOCK any changes)
        const existingLink = await tx.premiumProfile.findUnique({
          where: { walletAddress: normalizedAddress }
        });

        if (existingLink) {
          logger.error(
            `Wallet ${normalizedAddress} already has linked profile: ${existingLink.profileId}`
          );
          throw new Error(
            "Wallet already has a linked premium profile. Profile linking is permanent and cannot be changed."
          );
        }

        // Step 2: Validate profile ownership
        const isOwner = await this.profileService.validateProfileOwnership(
          normalizedAddress,
          profileId
        );
        if (!isOwner) {
          throw new Error(
            "Profile is not owned by the provided wallet address"
          );
        }

        // Step 3: Check if profile is already linked to another wallet
        const profileAlreadyLinked = await tx.premiumProfile.findUnique({
          where: { profileId }
        });

        if (profileAlreadyLinked) {
          throw new Error("Profile is already linked to another wallet");
        }

        // Step 4: Create the permanent link (FIRST and ONLY link for this wallet)
        const premiumProfile = await tx.premiumProfile.create({
          data: {
            isActive: true,
            linkedAt: new Date(),
            profileId,
            walletAddress: normalizedAddress
          }
        });

        return premiumProfile;
      });

      logger.info(
        `Successfully linked profile ${profileId} to wallet ${normalizedAddress}`
      );

      // Get profile details for return
      const profile = await this.profileService.getProfileById(profileId);
      if (!profile) {
        throw new Error("Failed to retrieve linked profile details");
      }

      return {
        handle: profile.handle,
        linkedAt: result.linkedAt,
        profileId: result.profileId
      };
    } catch (error) {
      logger.error(
        `Error linking profile ${profileId} to wallet ${normalizedAddress}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Auto-link the first profile for premium wallets that are not linked
   * This enforces the business rule: first selected profile becomes permanent
   */
  async autoLinkFirstProfile(
    walletAddress: string
  ): Promise<LinkedProfile | null> {
    try {
      const normalizedAddress = this.normalizeWalletAddress(walletAddress);

      logger.info(
        `Attempting to auto-link first profile for wallet: ${normalizedAddress}`
      );

      // Check if wallet already has a linked profile (prevent double-linking)
      const existingLink = await prisma.premiumProfile.findUnique({
        where: { walletAddress: normalizedAddress }
      });

      if (existingLink) {
        logger.info(
          `Wallet ${normalizedAddress} already has a linked profile: ${existingLink.profileId}`
        );
        throw new Error("Wallet already has a linked premium profile");
      }

      // Get user's profiles from Lens
      const profiles =
        await this.profileService.getProfilesByWallet(normalizedAddress);

      if (!profiles || profiles.length === 0) {
        logger.info(`No profiles found for wallet: ${normalizedAddress}`);
        throw new Error("No Lens profiles found for this wallet");
      }

      // Auto-link the FIRST profile (business rule enforcement)
      const firstProfile = profiles[0];
      logger.info(
        `Auto-linking first profile: ${firstProfile.handle} (${firstProfile.id})`
      );

      return await this.linkProfileToWallet(normalizedAddress, firstProfile.id);
    } catch (error) {
      logger.error(
        `Error auto-linking first profile for ${walletAddress}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get linked profile for a wallet
   */
  async getLinkedProfile(walletAddress: string): Promise<LinkedProfile | null> {
    try {
      const normalizedAddress = this.normalizeWalletAddress(walletAddress);

      const premiumProfile = await prisma.premiumProfile.findUnique({
        where: { walletAddress: normalizedAddress }
      });

      if (!premiumProfile) {
        return null;
      }

      const profile = await this.profileService.getProfileById(
        premiumProfile.profileId
      );
      if (!profile) {
        return null;
      }

      return {
        handle: profile.handle,
        linkedAt: premiumProfile.linkedAt,
        profileId: premiumProfile.profileId
      };
    } catch (error) {
      logger.error(`Error getting linked profile for ${walletAddress}:`, error);
      return null;
    }
  }

  /**
   * Get premium status for a specific profile (legacy method for backward compatibility)
   */
  async getPremiumStatus(
    walletAddress: string,
    profileId: string
  ): Promise<boolean> {
    try {
      const normalizedAddress = this.normalizeWalletAddress(walletAddress);

      const premiumProfile = await prisma.premiumProfile.findFirst({
        where: {
          isActive: true,
          profileId,
          walletAddress: normalizedAddress
        }
      });

      return Boolean(premiumProfile);
    } catch (error) {
      logger.error(
        `Error getting premium status for ${walletAddress}:${profileId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Get profiles for a wallet with business logic enforcement
   * Returns only unlinked profiles for premium wallets that haven't linked yet
   */
  async getAvailableProfiles(
    walletAddress: string
  ): Promise<AvailableProfilesResult> {
    try {
      const normalizedAddress = this.normalizeWalletAddress(walletAddress);
      logger.info(
        `Getting available profiles for wallet: ${normalizedAddress}`
      );

      // Check if wallet already has a linked profile
      const existingLink = await prisma.premiumProfile.findUnique({
        where: { walletAddress: normalizedAddress }
      });

      if (existingLink) {
        // Wallet already has a linked profile - return it only
        const profile = await this.profileService.getProfileById(
          existingLink.profileId
        );
        if (!profile) {
          logger.error(`Linked profile ${existingLink.profileId} not found`);
          return { canLink: false, profiles: [] };
        }

        logger.info(
          `Wallet ${normalizedAddress} already has linked profile: ${profile.handle}`
        );
        return {
          canLink: false,
          linkedProfile: {
            handle: profile.handle,
            linkedAt: existingLink.linkedAt,
            profileId: existingLink.profileId
          },
          profiles: []
        };
      }

      // Wallet is premium but not linked - return all profiles for selection
      const profiles =
        await this.profileService.getProfilesByWallet(normalizedAddress);

      logger.info(
        `Wallet ${normalizedAddress} can link profiles. Found ${profiles?.length || 0} profiles`
      );

      return {
        canLink: true,
        profiles: profiles || []
      };
    } catch (error) {
      logger.error(
        `Error getting available profiles for ${walletAddress}:`,
        error
      );
      throw new Error("Failed to get available profiles");
    }
  }

  /**
   * Check if a wallet has a linked profile
   */
  async hasLinkedProfile(walletAddress: string): Promise<boolean> {
    try {
      const normalizedAddress = this.normalizeWalletAddress(walletAddress);

      const premiumProfile = await prisma.premiumProfile.findUnique({
        where: { walletAddress: normalizedAddress }
      });

      return Boolean(premiumProfile);
    } catch (error) {
      logger.error(
        `Error checking linked profile for ${walletAddress}:`,
        error
      );
      return false;
    }
  }

  /**
   * Get all premium profiles (for admin/debug purposes)
   */
  async getAllPremiumProfiles(): Promise<
    Array<{
      walletAddress: string;
      profileId: string;
      linkedAt: Date;
      isActive: boolean;
    }>
  > {
    try {
      const profiles = await prisma.premiumProfile.findMany({
        orderBy: { linkedAt: "desc" },
        select: {
          isActive: true,
          linkedAt: true,
          profileId: true,
          walletAddress: true
        },
        where: { isActive: true }
      });

      return profiles;
    } catch (error) {
      logger.error("Error getting all premium profiles:", error);
      throw new Error("Failed to fetch premium profiles");
    }
  }

  /**
   * Deactivate a premium profile (admin function)
   */
  async deactivateProfile(walletAddress: string): Promise<void> {
    try {
      const normalizedAddress = this.normalizeWalletAddress(walletAddress);

      await prisma.premiumProfile.update({
        data: {
          deactivatedAt: new Date(),
          isActive: false
        },
        where: { walletAddress: normalizedAddress }
      });

      logger.info(
        `Deactivated premium profile for wallet: ${normalizedAddress}`
      );
    } catch (error) {
      logger.error(`Error deactivating profile for ${walletAddress}:`, error);
      throw new Error("Failed to deactivate premium profile");
    }
  }

  /**
   * BLOCKED: Profile unlinking is not allowed per business rules
   */
  async unlinkProfile(): Promise<void> {
    throw new Error(
      "Profile unlinking is not allowed. This action is irreversible and permanent."
    );
  }

  // Helper method to map database user to UserProfile interface
  private mapUserToProfile(user: any): UserProfile {
    return {
      avatarUrl: user.avatarUrl || undefined,
      bio: user.bio || undefined,
      displayName: user.displayName || undefined,
      email: user.email || undefined,
      lastActiveAt: user.lastActiveAt,
      location: user.location || undefined,
      premiumStatus: user.premiumStatus,
      referrerAddress: user.referrerAddress || undefined,
      registrationDate: user.registrationDate,
      totalLogins: user.totalLogins,
      twitterHandle: user.twitterHandle || undefined,
      username: user.username || undefined,
      walletAddress: user.walletAddress,
      website: user.website || undefined
    };
  }
}

export default new UserService();
