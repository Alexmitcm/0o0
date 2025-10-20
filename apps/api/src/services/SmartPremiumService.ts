import logger from "@hey/helpers/logger";
import { createPublicClient, http } from "viem";
import { arbitrum } from "viem/chains";
import prisma from "../prisma/client";
import { normalizeAddress } from "../utils/address";
import BlockchainService from "./BlockchainService";
import { JwtService } from "./JwtService";
import { profileService } from "./ProfileService";

export interface SmartPremiumResponse {
  success: boolean;
  user: {
    metaMaskAddress: string;
    familyWalletAddress: string;
    lensProfileId: string;
    isPremium: boolean;
    wasAlreadyPremium: boolean;
    displayName?: string;
    avatarUrl?: string;
  };
  token: string;
  isNewUser: boolean;
  message: string;
}

export class SmartPremiumService {
  private readonly blockchainService: typeof BlockchainService;
  private readonly profileService: typeof profileService;
  private readonly jwtService: JwtService;

  constructor() {
    this.blockchainService = BlockchainService;
    this.profileService = profileService;
    this.jwtService = new JwtService();
  }

  private normalizeAddress(address: string): string {
    return normalizeAddress(address);
  }

  /**
   * بررسی هوشمند وضعیت پرمیوم
   * این تابع تشخیص می‌دهد که کاربر قبلاً پرمیوم بوده یا نه
   */
  async checkSmartPremiumStatus(metaMaskAddress: string): Promise<{
    isPremium: boolean;
    wasAlreadyPremium: boolean;
    nodeData?: any;
    message: string;
  }> {
    try {
      const normalizedAddress = this.normalizeAddress(metaMaskAddress);

      logger.info(`Smart premium check for MetaMask: ${normalizedAddress}`);

      // بررسی قرارداد NodeSet
      const isPremiumOnChain =
        await this.blockchainService.isWalletPremium(normalizedAddress);

      if (!isPremiumOnChain) {
        return {
          isPremium: false,
          message: "Wallet is not registered in the referral contract",
          wasAlreadyPremium: false
        };
      }

      // دریافت اطلاعات کامل از قرارداد
      const nodeData = await this.getNodeData(normalizedAddress);

      // بررسی وجود کاربر در دیتابیس
      const existingUser = await prisma.user.findUnique({
        where: { walletAddress: normalizedAddress }
      });

      const wasAlreadyPremium =
        !!existingUser && existingUser.status === "Premium";

      return {
        isPremium: true,
        message: wasAlreadyPremium
          ? "User was already premium, just needs to link profile"
          : "User is premium on-chain but not in our database",
        nodeData,
        wasAlreadyPremium
      };
    } catch (error) {
      logger.error("Error in smart premium check:", error);
      return {
        isPremium: false,
        message: "Error checking premium status",
        wasAlreadyPremium: false
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
        isPointChanged,
        unbalancedAllowance
      ] = nodeData as unknown as any[];

      return {
        balance,
        depth,
        isPointChanged,
        leftChild,
        parent,
        point,
        rightChild,
        startTime,
        unbalancedAllowance
      };
    } catch (error) {
      logger.error("Error getting node data:", error);
      return null;
    }
  }

  /**
   * اتصال هوشمند کیف پول‌ها
   * این تابع خودکار تشخیص می‌دهد که کاربر قبلاً پرمیوم بوده یا نه
   */
  async smartLinkWallets(
    metaMaskAddress: string,
    familyWalletAddress: string,
    lensProfileId: string
  ): Promise<SmartPremiumResponse> {
    try {
      const normalizedMetaMask = this.normalizeAddress(metaMaskAddress);
      const normalizedFamily = this.normalizeAddress(familyWalletAddress);

      logger.info(
        `Smart linking: MetaMask=${normalizedMetaMask}, Family=${normalizedFamily}, Profile=${lensProfileId}`
      );

      // بررسی هوشمند وضعیت پرمیوم
      const premiumStatus =
        await this.checkSmartPremiumStatus(normalizedMetaMask);

      if (!premiumStatus.isPremium) {
        throw new Error(
          "MetaMask wallet is not premium registered in the contract"
        );
      }

      // بررسی وجود پروفایل Lens
      const profiles =
        await this.profileService.getProfilesByWallet(normalizedFamily);
      const selectedProfile = profiles.find((p) => p.id === lensProfileId);

      if (!selectedProfile) {
        throw new Error("Lens profile not found or not owned by Family Wallet");
      }

      // بررسی وجود کاربر در دیتابیس
      const existingUser = await prisma.user.findUnique({
        include: { premiumProfile: true },
        where: { walletAddress: normalizedMetaMask }
      });

      let user: any;
      let isNewUser = false;
      let message = "";

      if (existingUser) {
        // کاربر موجود - به‌روزرسانی
        user = await prisma.user.update({
          data: {
            familyWalletAddress: normalizedFamily,
            lastActiveAt: new Date(),
            linkedProfileId: lensProfileId,
            // اگر قبلاً پرمیوم نبوده، حالا پرمیوم می‌شه
            status: existingUser.status === "Premium" ? "Premium" : "Premium",
            totalLogins: existingUser.totalLogins + 1
          },
          where: { walletAddress: normalizedMetaMask }
        });

        message = premiumStatus.wasAlreadyPremium
          ? "Welcome back! Your premium account has been updated with your new profile"
          : "Congratulations! Your wallet was already premium on-chain, now it's linked to your profile";

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
      } else {
        // کاربر جدید - ایجاد
        user = await prisma.user.create({
          data: {
            familyWalletAddress: normalizedFamily,
            lastActiveAt: new Date(),
            linkedProfileId: lensProfileId,
            status: "Premium",
            totalLogins: 1,
            walletAddress: normalizedMetaMask
          }
        });

        isNewUser = true;
        message =
          "Welcome! Your premium wallet has been linked to your Lens profile";

        // ایجاد پروفایل پرمیوم
        await prisma.premiumProfile.create({
          data: {
            isActive: true,
            linkedAt: new Date(),
            profileId: lensProfileId,
            walletAddress: normalizedMetaMask
          }
        });
      }

      const token = this.jwtService.generateToken({
        linkedProfileId: lensProfileId,
        status: "Premium",
        walletAddress: normalizedMetaMask
      });

      return {
        isNewUser,
        message,
        success: true,
        token,
        user: {
          avatarUrl: user.avatarUrl || undefined,
          displayName: user.displayName || undefined,
          familyWalletAddress: normalizedFamily,
          isPremium: true,
          lensProfileId,
          metaMaskAddress: normalizedMetaMask,
          wasAlreadyPremium: premiumStatus.wasAlreadyPremium
        }
      };
    } catch (error) {
      logger.error("Error in smart wallet linking:", error);
      throw error;
    }
  }

  /**
   * دریافت وضعیت کامل کاربر
   */
  async getUserSmartStatus(metaMaskAddress: string): Promise<any> {
    try {
      const normalizedAddress = this.normalizeAddress(metaMaskAddress);

      // بررسی وضعیت پرمیوم
      const premiumStatus =
        await this.checkSmartPremiumStatus(normalizedAddress);

      // بررسی وجود کاربر در دیتابیس
      const user = await prisma.user.findUnique({
        include: { premiumProfile: true },
        where: { walletAddress: normalizedAddress }
      });

      return {
        avatarUrl: user?.avatarUrl,
        displayName: user?.displayName,
        familyWalletAddress: user?.familyWalletAddress,
        isLinked: !!user?.familyWalletAddress,
        isPremium: premiumStatus.isPremium,
        lensProfileId: user?.linkedProfileId,
        message: premiumStatus.message,
        wasAlreadyPremium: premiumStatus.wasAlreadyPremium
      };
    } catch (error) {
      logger.error("Error getting user smart status:", error);
      throw error;
    }
  }
}

export default new SmartPremiumService();
