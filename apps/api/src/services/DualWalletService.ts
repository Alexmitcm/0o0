import logger from "@hey/helpers/logger";
import { createPublicClient, http } from "viem";
import { arbitrum } from "viem/chains";
import prisma from "../prisma/client";
import { normalizeAddress } from "../utils/address";
import BlockchainService from "./BlockchainService";
import JwtService from "./JwtService";
import { profileService } from "./ProfileService";

export interface DualWalletLinkRequest {
  metaMaskAddress: string;
  familyWalletAddress: string;
  lensProfileId: string;
}

export interface DualWalletLinkResponse {
  success: boolean;
  user: {
    metaMaskAddress: string;
    familyWalletAddress: string;
    lensProfileId: string;
    isPremium: boolean;
    displayName?: string;
    avatarUrl?: string;
  };
  token: string;
  isNewUser: boolean;
}

export interface PremiumStatusResponse {
  isPremium: boolean;
  isRegistered: boolean;
  nodeData?: {
    startTime: bigint;
    balance: bigint;
    point: number;
    depth: number;
    parent: string;
    leftChild: string;
    rightChild: string;
  };
}

export class DualWalletService {
  private readonly blockchainService: typeof BlockchainService;
  private readonly profileService: typeof profileService;
  private readonly jwtService: typeof JwtService;

  constructor() {
    this.blockchainService = BlockchainService;
    this.profileService = profileService;
    this.jwtService = JwtService;
  }

  private normalizeAddress(address: string): string {
    return normalizeAddress(address);
  }

  /**
   * بررسی وضعیت پرمیوم از قرارداد NodeSet
   */
  async checkPremiumStatus(
    metaMaskAddress: string
  ): Promise<PremiumStatusResponse> {
    try {
      const normalizedAddress = this.normalizeAddress(metaMaskAddress);

      logger.info(`Checking premium status for MetaMask: ${normalizedAddress}`);

      // بررسی قرارداد NodeSet
      const isPremium =
        await this.blockchainService.isWalletPremium(normalizedAddress);

      if (!isPremium) {
        return {
          isPremium: false,
          isRegistered: false
        };
      }

      // دریافت اطلاعات کامل از قرارداد
      const nodeData = await this.getNodeData(normalizedAddress);

      return {
        isPremium: true,
        isRegistered: true,
        nodeData: nodeData || undefined
      };
    } catch (error) {
      logger.error("Error checking premium status:", error);
      return {
        isPremium: false,
        isRegistered: false
      };
    }
  }

  /**
   * دریافت اطلاعات کامل از قرارداد NodeSet
   */
  private async getNodeData(walletAddress: string) {
    try {
      const publicClient = createPublicClient({
        chain: arbitrum,
        transport: http("https://arb1.arbitrum.io/rpc")
      });

      const nodeData = await publicClient.readContract({
        abi: [
          {
            inputs: [{ name: "player", type: "address" }],
            name: "NodeSet",
            outputs: [
              { name: "startTime", type: "uint256" },
              { name: "balance", type: "uint256" },
              { name: "point", type: "uint24" },
              { name: "depthLeftBranch", type: "uint24" },
              { name: "depthRightBranch", type: "uint24" },
              { name: "depth", type: "uint24" },
              { name: "player", type: "address" },
              { name: "parent", type: "address" },
              { name: "leftChild", type: "address" },
              { name: "rightChild", type: "address" },
              { name: "isPointChanged", type: "bool" },
              { name: "unbalancedAllowance", type: "bool" }
            ],
            stateMutability: "view",
            type: "function"
          }
        ],
        address: "0x3bC03e9793d2E67298fb30871a08050414757Ca7" as `0x${string}`,
        args: [walletAddress as `0x${string}`],
        functionName: "NodeSet"
      });

      const [
        startTime,
        balance,
        point,
        _depthLeftBranch,
        _depthRightBranch,
        depth,
        _player,
        parent,
        leftChild,
        rightChild,
        _isPointChanged,
        _unbalancedAllowance
      ] = nodeData as unknown as any[];

      return {
        balance,
        depth,
        leftChild,
        parent,
        point,
        rightChild,
        startTime
      };
    } catch (error) {
      logger.error("Error getting node data:", error);
      return null;
    }
  }

  /**
   * دریافت پروفایل‌های Lens از Family Wallet
   */
  async getLensProfiles(familyWalletAddress: string): Promise<any[]> {
    try {
      const normalizedAddress = this.normalizeAddress(familyWalletAddress);

      logger.info(
        `Getting Lens profiles for Family Wallet: ${normalizedAddress}`
      );

      const profiles =
        await this.profileService.getProfilesByWallet(normalizedAddress);

      return profiles.map((profile) => ({
        handle: profile.handle,
        id: profile.id,
        isDefault: profile.isDefault,
        ownedBy: profile.ownedBy
      }));
    } catch (error) {
      logger.error("Error getting Lens profiles:", error);
      return [];
    }
  }

  /**
   * اتصال MetaMask به پروفایل Lens
   */
  async linkWallets(
    request: DualWalletLinkRequest
  ): Promise<DualWalletLinkResponse> {
    try {
      const { metaMaskAddress, familyWalletAddress, lensProfileId } = request;

      const normalizedMetaMask = this.normalizeAddress(metaMaskAddress);
      const normalizedFamily = this.normalizeAddress(familyWalletAddress);

      logger.info(
        `Linking wallets: MetaMask=${normalizedMetaMask}, Family=${normalizedFamily}, Profile=${lensProfileId}`
      );

      // بررسی وضعیت پرمیوم
      const premiumStatus = await this.checkPremiumStatus(normalizedMetaMask);
      if (!premiumStatus.isPremium) {
        throw new Error("MetaMask wallet is not premium registered");
      }

      // بررسی وجود پروفایل Lens
      const profiles = await this.getLensProfiles(normalizedFamily);
      const selectedProfile = profiles.find((p) => p.id === lensProfileId);

      if (!selectedProfile) {
        throw new Error("Lens profile not found or not owned by Family Wallet");
      }

      // بررسی وجود کاربر در دیتابیس
      const existingUser = await prisma.user.findUnique({
        include: { premiumProfile: true },
        where: { walletAddress: normalizedMetaMask }
      });

      if (existingUser) {
        // کاربر موجود - به‌روزرسانی
        await prisma.user.update({
          data: {
            lastActiveAt: new Date(),
            linkedProfileId: lensProfileId,
            totalLogins: existingUser.totalLogins + 1,
            walletAddress: normalizedFamily
          },
          where: { walletAddress: normalizedMetaMask }
        });

        // به‌روزرسانی یا ایجاد پروفایل پرمیوم
        await prisma.premiumProfile.upsert({
          create: {
            isActive: true,
            linkedAt: new Date(),
            profileId: lensProfileId,
            walletAddress: normalizedMetaMask
          },
          update: {
            isActive: true,
            linkedAt: new Date(),
            profileId: lensProfileId
          },
          where: { walletAddress: normalizedMetaMask }
        });

        const token = this.jwtService.generateToken({
          linkedProfileId: lensProfileId,
          status: "Premium",
          walletAddress: normalizedMetaMask
        });

        return {
          isNewUser: false,
          success: true,
          token,
          user: {
            avatarUrl: existingUser.avatarUrl || undefined,
            displayName: existingUser.displayName || undefined,
            isPremium: true,
            lensProfileId,
            metaMaskAddress: normalizedMetaMask,
            walletAddress: normalizedFamily
          }
        };
      }
      // کاربر جدید - ایجاد
      const _newUser = await prisma.user.create({
        data: {
          lastActiveAt: new Date(),
          linkedProfileId: lensProfileId,
          status: "Premium",
          totalLogins: 1,
          walletAddress: normalizedMetaMask
        }
      });

      // ایجاد پروفایل پرمیوم
      await prisma.premiumProfile.create({
        data: {
          isActive: true,
          linkedAt: new Date(),
          profileId: lensProfileId,
          walletAddress: normalizedMetaMask
        }
      });

      const token = this.jwtService.generateToken({
        familyWalletAddress: normalizedFamily,
        linkedProfileId: lensProfileId,
        status: "Premium",
        walletAddress: normalizedMetaMask
      });

      return {
        isNewUser: true,
        success: true,
        token,
        user: {
          avatarUrl: undefined,
          displayName: undefined,
          isPremium: true,
          lensProfileId,
          metaMaskAddress: normalizedMetaMask,
          walletAddress: normalizedFamily
        }
      };
    } catch (error) {
      logger.error("Error linking wallets:", error);
      throw error;
    }
  }

  /**
   * دریافت وضعیت کاربر
   */
  async getUserStatus(metaMaskAddress: string): Promise<any> {
    try {
      const normalizedAddress = this.normalizeAddress(metaMaskAddress);

      const user = await prisma.user.findUnique({
        include: { premiumProfile: true },
        where: { walletAddress: normalizedAddress }
      });

      if (!user) {
        return {
          isLinked: false,
          isPremium: false
        };
      }

      return {
        avatarUrl: user.avatarUrl,
        displayName: user.displayName,
        familyWalletAddress: user.familyWalletAddress,
        isLinked: true,
        isPremium: user.status === "Premium",
        lensProfileId: user.linkedProfileId
      };
    } catch (error) {
      logger.error("Error getting user status:", error);
      throw error;
    }
  }

  /**
   * اعتبارسنجی توکن
   */
  async validateToken(token: string): Promise<any> {
    return this.jwtService.verifyToken(token);
  }
}

export default new DualWalletService();
