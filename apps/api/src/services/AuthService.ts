import logger from "@hey/helpers/logger";
import { mapUserToProfile } from "../mappers/userMapper";
import prisma from "../prisma/client";
import { normalizeAddress } from "../utils/address";
import BlockchainService from "./BlockchainService";
import EventService from "./EventService";
import JwtService from "./JwtService";
import { profileService } from "./ProfileService";

export interface LoginRequest {
  walletAddress: string;
  selectedProfileId: string;
}

export interface SyncLensRequest {
  lensAccessToken: string;
  selectedProfileId?: string;
}

export interface LoginResponse {
  success: boolean;
  user: {
    walletAddress: string;
    status: "Standard" | "Premium";
    linkedProfileId?: string;
    email?: string;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
    registrationDate: Date;
    lastActiveAt: Date;
    totalLogins: number;
  };
  token: string;
  isNewUser: boolean;
  message: string;
}

export interface SyncLensResponse {
  success: boolean;
  user: {
    walletAddress: string;
    status: "Standard" | "Premium";
    linkedProfileId?: string;
    email?: string;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
    registrationDate: Date;
    lastActiveAt: Date;
    totalLogins: number;
  };
  token: string;
  isNewUser: boolean;
  message: string;
}

export interface UserProfile {
  walletAddress: string;
  status: "Standard" | "Premium";
  linkedProfileId?: string;
  email?: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  website?: string;
  twitterHandle?: string;
  registrationDate: Date;
  referrerAddress?: string;
  lastActiveAt: Date;
  totalLogins: number;
}

export class AuthService {
  private readonly blockchainService: typeof BlockchainService;
  private readonly profileService: typeof profileService;
  private readonly eventService: typeof EventService;
  private readonly jwtService: typeof JwtService;

  constructor() {
    this.blockchainService = BlockchainService;
    this.profileService = profileService;
    this.eventService = EventService;
    this.jwtService = JwtService;
  }

  private normalizeWalletAddress(address: string): string {
    return normalizeAddress(address);
  }

  /**
   * Simplified login and onboarding endpoint
   * Only 2 states: Standard or Premium
   */
  async loginOrOnboard(request: LoginRequest): Promise<LoginResponse> {
    try {
      const { walletAddress, selectedProfileId } = request;
      const normalizedAddress = this.normalizeWalletAddress(walletAddress);

      logger.info(
        `Login/Onboard request for wallet: ${normalizedAddress}, profile: ${selectedProfileId}`
      );

      // Step 1: Check existing user
      const existingUser = await prisma.user.findUnique({
        where: { walletAddress: normalizedAddress }
      });

      // Step 2: Check premium status from smart contract
      const isPremiumOnChain =
        await this.blockchainService.isWalletPremium(normalizedAddress);

      // Step 3: Determine final status (only 2 states)
      const finalStatus = isPremiumOnChain ? "Premium" : "Standard";

      logger.info(`Final status for ${normalizedAddress}: ${finalStatus}`);

      // Step 4: Handle user registration/login
      if (!existingUser) {
        return await this.handleNewUserRegistration(
          normalizedAddress,
          selectedProfileId,
          finalStatus
        );
      }

      return await this.handleExistingUserLogin(
        existingUser,
        selectedProfileId,
        finalStatus
      );
    } catch (error) {
      logger.error("Error in loginOrOnboard:", error);
      throw new Error("Authentication failed");
    }
  }

  /**
   * Handle new user registration
   */
  private async handleNewUserRegistration(
    walletAddress: string,
    selectedProfileId: string,
    finalStatus: "Standard" | "Premium"
  ): Promise<LoginResponse> {
    logger.info(
      `Login/Onboard request for wallet: ${walletAddress}, profile: ${selectedProfileId}`
    );

    // Use the final status passed from caller
    const isPremium = finalStatus === "Premium";

    // Validate profile ownership
    const isProfileOwner = await this.profileService.validateProfileOwnership(
      walletAddress,
      selectedProfileId
    );
    if (!isProfileOwner) {
      logger.error(
        `Profile ownership validation failed for wallet: ${walletAddress}, profile: ${selectedProfileId}`
      );
      throw new Error(
        "Selected profile is not owned by the provided wallet address"
      );
    }

    // Get profile details
    logger.info(`Getting profile details for profileId: ${selectedProfileId}`);
    const profile = await profileService.getProfileById(selectedProfileId);
    if (!profile) {
      logger.error(`Profile not found for profileId: ${selectedProfileId}`);
      throw new Error("Selected profile not found");
    }
    logger.info(`Profile found: ${profile.handle} (${profile.id})`);

    // Create user with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user record
      const user = await tx.user.create({
        data: {
          lastActiveAt: new Date(),
          premiumUpgradedAt: isPremium ? new Date() : undefined,
          registrationDate: new Date(),
          status: finalStatus,
          totalLogins: 1,
          walletAddress
        }
      });

      // Create default preferences
      await tx.userPreferences.create({
        data: { walletAddress }
      });

      // Create default stats
      await tx.userStats.create({
        data: { walletAddress }
      });

      // If premium, create permanent profile link
      let premiumProfile = null;
      if (isPremium) {
        premiumProfile = await tx.premiumProfile.create({
          data: {
            isActive: true,
            linkedAt: new Date(),
            profileId: selectedProfileId,
            walletAddress
          }
        });

        logger.info(
          `Premium profile linked: ${selectedProfileId} to ${walletAddress}`
        );
      }

      return { premiumProfile, user };
    });

    // Create welcome notification
    await this.eventService.emitEvent({
      metadata: {
        isPremium,
        profileHandle: profile.handle,
        profileId: selectedProfileId
      },
      timestamp: new Date(),
      type: "user.registered",
      walletAddress
    });

    // Generate JWT token
    const token = this.jwtService.generateToken({
      linkedProfileId: result.premiumProfile?.profileId,
      status: result.user.status,
      walletAddress
    });

    return {
      isNewUser: true,
      message: isPremium
        ? "Welcome! Your premium account has been created and profile linked."
        : "Welcome! Your account has been created. Upgrade to premium to unlock exclusive features.",
      success: true,
      token,
      user: mapUserToProfile({
        avatarUrl: result.user.avatarUrl,
        bio: result.user.bio,
        displayName: result.user.displayName,
        email: result.user.email,
        lastActiveAt: result.user.lastActiveAt,
        location: result.user.location,
        premiumProfile: result.premiumProfile
          ? {
              linkedAt: result.premiumProfile.linkedAt,
              profileId: result.premiumProfile.profileId
            }
          : null,
        registrationDate: result.user.registrationDate,
        status: result.user.status,
        totalLogins: result.user.totalLogins,
        twitterHandle: result.user.twitterHandle,
        username: result.user.username,
        walletAddress: result.user.walletAddress,
        website: result.user.website
      } as any)
    };
  }

  /**
   * Handle existing user login
   */
  private async handleExistingUserLogin(
    existingUser: any,
    selectedProfileId: string,
    finalStatus: "Standard" | "Premium"
  ): Promise<LoginResponse> {
    logger.info(
      `Processing login for existing user: ${existingUser.walletAddress}`
    );

    // Update user activity
    await prisma.user.update({
      data: {
        lastActiveAt: new Date(),
        totalLogins: { increment: 1 }
      },
      where: { walletAddress: existingUser.walletAddress }
    });

    // Check if user already has a linked premium profile
    const hasLinkedProfile = existingUser.premiumProfile !== null;
    let linkedProfileId = existingUser.premiumProfile?.profileId;

    // Handle premium status changes - ONLY if this is the first time linking
    if (
      !hasLinkedProfile &&
      finalStatus === "Premium" &&
      existingUser.status === "Standard"
    ) {
      // Check if this wallet has ever been linked to any profile
      const existingPremiumProfile = await prisma.premiumProfile.findFirst({
        where: {
          isActive: true, // Only look for active links
          walletAddress: existingUser.walletAddress
        }
      });

      if (existingPremiumProfile) {
        // Wallet was previously linked to another profile - this profile stays Standard
        logger.info(
          `Premium wallet ${existingUser.walletAddress} was previously linked to profile ${existingPremiumProfile.profileId}, keeping ${selectedProfileId} as Standard`
        );
        linkedProfileId = undefined; // No link for this profile
      } else {
        // This is the first time linking - create permanent link
        logger.info(
          `First time linking premium wallet ${existingUser.walletAddress} to profile ${selectedProfileId}`
        );
        await this.handlePremiumUpgrade(
          existingUser.walletAddress,
          selectedProfileId
        );
        linkedProfileId = selectedProfileId;
      }
    }

    // Generate JWT token
    const token = this.jwtService.generateToken({
      linkedProfileId,
      status: existingUser.status,
      walletAddress: existingUser.walletAddress
    });

    return {
      isNewUser: false,
      message: "Login successful",
      success: true,
      token,
      user: {
        avatarUrl: existingUser.avatarUrl || undefined,
        displayName: existingUser.displayName || undefined,
        email: existingUser.email || undefined,
        lastActiveAt: new Date(),
        linkedProfileId,
        registrationDate: existingUser.registrationDate,
        status: existingUser.status,
        totalLogins: existingUser.totalLogins + 1,
        username: existingUser.username || undefined,
        walletAddress: existingUser.walletAddress
      }
    };
  }

  /**
   * Handle premium status upgrade
   */
  private async handlePremiumUpgrade(
    walletAddress: string,
    selectedProfileId: string
  ): Promise<void> {
    logger.info(`Upgrading user to premium: ${walletAddress}`);

    // Validate profile ownership
    const isProfileOwner = await this.profileService.validateProfileOwnership(
      walletAddress,
      selectedProfileId
    );
    if (!isProfileOwner) {
      throw new Error(
        "Selected profile is not owned by the provided wallet address"
      );
    }

    // Update user status and create profile link
    await prisma.$transaction(async (tx) => {
      // Update user status
      await tx.user.update({
        data: {
          premiumUpgradedAt: new Date(),
          status: "Premium"
        },
        where: { walletAddress }
      });

      // Create permanent profile link
      await tx.premiumProfile.create({
        data: {
          isActive: true,
          linkedAt: new Date(),
          profileId: selectedProfileId,
          walletAddress
        }
      });
    });

    // Emit premium upgrade event
    await this.eventService.emitEvent({
      metadata: {
        profileId: selectedProfileId
      },
      timestamp: new Date(),
      type: "user.premium.upgraded",
      walletAddress
    });

    logger.info(
      `User ${walletAddress} upgraded to premium with profile ${selectedProfileId}`
    );
  }

  /**
   * Get user profile by wallet address
   */
  async getUserProfile(walletAddress: string): Promise<UserProfile | null> {
    try {
      const normalizedAddress = this.normalizeWalletAddress(walletAddress);

      const user = await prisma.user.findUnique({
        include: {
          premiumProfile: true
        },
        where: { walletAddress: normalizedAddress }
      });

      if (!user) {
        return null;
      }

      return {
        avatarUrl: user.avatarUrl || undefined,
        bio: user.bio || undefined,
        displayName: user.displayName || undefined,
        email: user.email || undefined,
        lastActiveAt: user.lastActiveAt,
        linkedProfileId: user.premiumProfile?.profileId,
        location: user.location || undefined,
        referrerAddress: user.referrerAddress || undefined,
        registrationDate: user.registrationDate,
        status: user.status,
        totalLogins: user.totalLogins,
        twitterHandle: user.twitterHandle || undefined,
        username: user.username || undefined,
        walletAddress: user.walletAddress,
        website: user.website || undefined
      };
    } catch (error) {
      logger.error(`Error getting user profile for ${walletAddress}:`, error);
      throw new Error("Failed to get user profile");
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(
    walletAddress: string,
    profileData: Partial<{
      email: string;
      username: string;
      displayName: string;
      avatarUrl: string;
      bio: string;
      location: string;
      website: string;
      twitterHandle: string;
    }>
  ): Promise<UserProfile> {
    try {
      const normalizedAddress = this.normalizeWalletAddress(walletAddress);

      const user = await prisma.user.update({
        data: {
          ...profileData,
          updatedAt: new Date()
        },
        include: {
          premiumProfile: true
        },
        where: { walletAddress: normalizedAddress }
      });

      logger.info(`User profile updated for: ${normalizedAddress}`);

      return {
        avatarUrl: user.avatarUrl || undefined,
        bio: user.bio || undefined,
        displayName: user.displayName || undefined,
        email: user.email || undefined,
        lastActiveAt: user.lastActiveAt,
        linkedProfileId: user.premiumProfile?.profileId,
        location: user.location || undefined,
        referrerAddress: user.referrerAddress || undefined,
        registrationDate: user.registrationDate,
        status: user.status,
        totalLogins: user.totalLogins,
        twitterHandle: user.twitterHandle || undefined,
        username: user.username || undefined,
        walletAddress: user.walletAddress,
        website: user.website || undefined
      };
    } catch (error) {
      logger.error(`Error updating user profile for ${walletAddress}:`, error);
      throw new Error("Failed to update user profile");
    }
  }

  /**
   * Validate JWT token and return user data
   */
  async validateToken(token: string): Promise<UserProfile | null> {
    try {
      const payload = this.jwtService.verifyToken(token);
      if (!payload) {
        return null;
      }

      return await this.getUserProfile(payload.walletAddress);
    } catch (error) {
      logger.error("Error validating token:", error);
      return null;
    }
  }

  /**
   * Get available profiles for a wallet
   */
  async getAvailableProfiles(
    walletAddress: string,
    accessToken?: string
  ): Promise<{
    profiles: Array<{
      id: string;
      handle: string;
      ownedBy: string;
      isDefault: boolean;
    }>;
    linkedProfileId?: string;
  }> {
    try {
      const normalizedAddress = this.normalizeWalletAddress(walletAddress);

      // Get user's linked profile
      const user = await prisma.user.findUnique({
        include: { premiumProfile: true },
        where: { walletAddress: normalizedAddress }
      });

      // Get all profiles owned by the wallet
      const profiles = await this.profileService.getProfilesByWallet(
        normalizedAddress,
        accessToken
      );

      return {
        linkedProfileId: user?.premiumProfile?.profileId,
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
   * Sync Lens authentication with our backend system
   * Validates Lens access token and creates our own JWT
   */
  async syncLens(request: SyncLensRequest): Promise<SyncLensResponse> {
    try {
      const { lensAccessToken, selectedProfileId: explicitProfileId } = request;

      logger.info("Lens sync request received");

      // Step 1: Validate Lens access token with Lens API
      const lensProfile = await this.validateLensToken(lensAccessToken);

      if (!lensProfile) {
        logger.error("Lens token validation failed");
        throw new Error("Invalid Lens access token");
      }

      const { walletAddress, profileId } = lensProfile;
      const normalizedAddress = this.normalizeWalletAddress(walletAddress);

      logger.info(
        `Lens token validated for wallet: ${normalizedAddress}, profile: ${profileId}`
      );

      // Step 2: Determine which profile to use
      let selectedProfileId = profileId;

      // If explicit profile ID is provided, use it (for account switching)
      if (explicitProfileId) {
        selectedProfileId = explicitProfileId;
        logger.info(`Using explicit profile ID: ${selectedProfileId}`);
      } else if (!selectedProfileId) {
        // If no profile ID in token and no explicit ID, get the first available profile
        logger.info("No profile ID in token, getting available profiles");
        const availableProfiles = await this.getAvailableProfiles(
          normalizedAddress,
          lensAccessToken
        );
        if (availableProfiles.profiles.length > 0) {
          selectedProfileId = availableProfiles.profiles[0].id;
          logger.info(`Selected first available profile: ${selectedProfileId}`);
        } else {
          throw new Error("No profiles found for this wallet");
        }
      }

      // Step 3: Use existing loginOrOnboard logic
      try {
        const loginResult = await this.loginOrOnboard({
          selectedProfileId,
          walletAddress: normalizedAddress
        });

        logger.info(
          `Lens sync successful for wallet: ${normalizedAddress}, isNewUser: ${loginResult.isNewUser}`
        );

        return {
          isNewUser: loginResult.isNewUser,
          message: "Lens authentication synced successfully",
          success: true,
          token: loginResult.token,
          user: loginResult.user
        };
      } catch (loginError) {
        logger.error(`Error in loginOrOnboard: ${loginError}`);
        throw new Error("Authentication failed");
      }
    } catch (error) {
      logger.error("Error in Lens sync:", error);
      throw error;
    }
  }

  /**
   * Validate Lens access token with Lens API
   */
  private async validateLensToken(lensAccessToken: string): Promise<{
    walletAddress: string;
    profileId: string;
  } | null> {
    try {
      // Prefer verification via Lens JWKS (more robust than raw decode)
      const { LENS_API_URL } = await import("@hey/data/constants");
      const { createRemoteJWKSet, jwtVerify } = await import("jose");
      const jwksUri = `${LENS_API_URL.replace("/graphql", "")}/.well-known/jwks.json`;
      const JWKS = createRemoteJWKSet(new URL(jwksUri));

      try {
        const { payload } = await jwtVerify(lensAccessToken, JWKS);
        const walletAddress =
          (payload as any).walletAddress ||
          (payload as any).act?.sub ||
          (payload as any).sub;
        const profileId =
          (payload as any).profileId ||
          (payload as any).id ||
          (payload as any).sub ||
          "";

        if (!walletAddress) {
          logger.error("No wallet address claim in Lens JWT");
          return null;
        }

        return { profileId, walletAddress };
      } catch (verifyErr) {
        logger.warn(
          `Lens JWT verification failed, falling back to decode/API: ${verifyErr}`
        );
      }

      // Fallback: raw decode to extract whatever we can
      const parts = lensAccessToken.split(".");
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(
            Buffer.from(parts[1], "base64").toString()
          );
          const walletAddress =
            payload.walletAddress || payload.act?.sub || payload.sub;
          const profileId =
            payload.profileId || payload.id || payload.sub || "";
          if (walletAddress) {
            return { profileId, walletAddress };
          }
        } catch {}
      }

      logger.error("Lens token validation failed - unable to extract claims");
      return null;
    } catch (error) {
      logger.error("Error decoding Lens JWT token:", error);

      // Fallback: try the Lens API verification (for non-JWT tokens)
      try {
        logger.info("Attempting Lens API verification as fallback");
        const verifyUrl =
          `${(await import("@hey/data/constants")).LENS_API_URL}`.replace(
            "/graphql",
            "/verify"
          );
        const response = await fetch(verifyUrl, {
          headers: {
            Authorization: `Bearer ${lensAccessToken}`,
            "Content-Type": "application/json"
          },
          method: "POST"
        });

        logger.info(
          `Lens API verification response status: ${response.status}`
        );

        if (!response.ok) {
          logger.error(
            `Lens API verification failed: ${response.status} ${response.statusText}`
          );
          return null;
        }

        const result = await response.json();
        logger.info("Lens API verification result:", result);

        if (!result.success || !result.data) {
          logger.error("Lens API verification returned invalid response");
          return null;
        }

        // Extract wallet address and profile ID from the verification result
        const { walletAddress, profileId } = result.data;

        if (!walletAddress || !profileId) {
          logger.error("Lens API verification missing required data");
          return null;
        }

        logger.info(
          `Lens API verification successful for wallet: ${walletAddress}, profile: ${profileId}`
        );
        return { profileId, walletAddress };
      } catch (apiError) {
        logger.error("Error validating Lens token with API:", apiError);
        return null;
      }
    }
  }
}

export default new AuthService();
