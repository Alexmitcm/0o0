import logger from "@hey/helpers/logger";
import prisma from "../prisma/client";
import { normalizeAddress } from "../utils/address";
import BlockchainService from "./BlockchainService";
import JwtService from "./JwtService";

export interface SimpleLoginRequest {
  walletAddress: string;
  profileId: string;
}

export interface SimpleLoginResponse {
  success: boolean;
  user: {
    walletAddress: string;
    isPremium: boolean;
    profileId?: string;
    email?: string;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
  };
  token: string;
  isNewUser: boolean;
}

export class SimpleAuthService {
  private readonly blockchainService: typeof BlockchainService;
  private readonly jwtService: typeof JwtService;

  constructor() {
    this.blockchainService = BlockchainService;
    this.jwtService = JwtService;
  }

  private normalizeWalletAddress(address: string): string {
    return normalizeAddress(address);
  }

  /**
   * Ultra-simple login/registration
   * Only 2 states: Standard or Premium
   */
  async login(request: SimpleLoginRequest): Promise<SimpleLoginResponse> {
    try {
      const { walletAddress, profileId } = request;
      const normalizedAddress = this.normalizeWalletAddress(walletAddress);

      logger.info(
        `Simple login for wallet: ${normalizedAddress}, profile: ${profileId}`
      );

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { walletAddress: normalizedAddress }
      });

      // Check premium status on-chain
      const isPremiumOnChain =
        await this.blockchainService.isWalletPremium(normalizedAddress);

      if (existingUser) {
        // Existing user login
        return await this.handleExistingUser(
          existingUser,
          profileId,
          isPremiumOnChain
        );
      }
      // New user registration
      return await this.handleNewUser(
        normalizedAddress,
        profileId,
        isPremiumOnChain
      );
    } catch (error) {
      logger.error("Error in simple login:", error);
      throw new Error("Login failed");
    }
  }

  private async handleNewUser(
    walletAddress: string,
    profileId: string,
    isPremiumOnChain: boolean
  ): Promise<SimpleLoginResponse> {
    // Create user with premium status if on-chain
    const newUser = await prisma.user.create({
      data: {
        lastActiveAt: new Date(),
        linkedProfileId: isPremiumOnChain ? profileId : null,
        status: isPremiumOnChain ? "Premium" : "Standard",
        totalLogins: 1,
        walletAddress
      }
    });

    // Create premium profile link if premium
    if (isPremiumOnChain) {
      await prisma.premiumProfile.create({
        data: {
          isActive: true,
          linkedAt: new Date(),
          profileId,
          walletAddress
        }
      });
    }

    const token = this.jwtService.generateToken({
      linkedProfileId: newUser.linkedProfileId || undefined,
      status: newUser.status,
      walletAddress
    });

    return {
      isNewUser: true,
      success: true,
      token,
      user: {
        avatarUrl: newUser.avatarUrl || undefined,
        displayName: newUser.displayName || undefined,
        email: newUser.email || undefined,
        isPremium: newUser.status === "Premium",
        profileId: newUser.linkedProfileId || undefined,
        username: newUser.username || undefined,
        walletAddress: newUser.walletAddress
      }
    };
  }

  private async handleExistingUser(
    user: any,
    profileId: string,
    isPremiumOnChain: boolean
  ): Promise<SimpleLoginResponse> {
    // Update activity
    await prisma.user.update({
      data: {
        lastActiveAt: new Date(),
        totalLogins: user.totalLogins + 1
      },
      where: { walletAddress: user.walletAddress }
    });

    // Handle premium upgrade
    if (!user.linkedProfileId && isPremiumOnChain) {
      await prisma.user.update({
        data: {
          linkedProfileId: profileId,
          status: "Premium"
        },
        where: { walletAddress: user.walletAddress }
      });

      await prisma.premiumProfile.create({
        data: {
          isActive: true,
          linkedAt: new Date(),
          profileId,
          walletAddress: user.walletAddress
        }
      });
    }

    const token = this.jwtService.generateToken({
      linkedProfileId:
        user.linkedProfileId || (isPremiumOnChain ? profileId : undefined),
      status: isPremiumOnChain ? "Premium" : user.status,
      walletAddress: user.walletAddress
    });

    return {
      isNewUser: false,
      success: true,
      token,
      user: {
        avatarUrl: user.avatarUrl || undefined,
        displayName: user.displayName || undefined,
        email: user.email || undefined,
        isPremium: isPremiumOnChain || user.status === "Premium",
        profileId:
          user.linkedProfileId || (isPremiumOnChain ? profileId : undefined),
        username: user.username || undefined,
        walletAddress: user.walletAddress
      }
    };
  }

  /**
   * Get user status - ultra simple
   */
  async getUserStatus(
    walletAddress: string
  ): Promise<{ isPremium: boolean; profileId?: string }> {
    const user = await prisma.user.findUnique({
      where: { walletAddress: this.normalizeWalletAddress(walletAddress) }
    });

    if (!user) {
      return { isPremium: false };
    }

    return {
      isPremium: user.status === "Premium",
      profileId: user.linkedProfileId || undefined
    };
  }

  /**
   * Validate JWT token
   */
  async validateToken(token: string): Promise<any> {
    return this.jwtService.verifyToken(token);
  }
}

export default new SimpleAuthService();
