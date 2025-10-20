"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartPremiumService = void 0;
const logger_1 = __importDefault(require("@hey/helpers/logger"));
const viem_1 = require("viem");
const chains_1 = require("viem/chains");
const client_1 = __importDefault(require("../prisma/client"));
const address_1 = require("../utils/address");
const BlockchainService_1 = __importDefault(require("./BlockchainService"));
const JwtService_1 = require("./JwtService");
const ProfileService_1 = require("./ProfileService");
class SmartPremiumService {
    blockchainService;
    profileService;
    jwtService;
    constructor() {
        this.blockchainService = BlockchainService_1.default;
        this.profileService = ProfileService_1.profileService;
        this.jwtService = new JwtService_1.JwtService();
    }
    normalizeAddress(address) {
        return (0, address_1.normalizeAddress)(address);
    }
    /**
     * بررسی هوشمند وضعیت پرمیوم
     * این تابع تشخیص می‌دهد که کاربر قبلاً پرمیوم بوده یا نه
     */
    async checkSmartPremiumStatus(metaMaskAddress) {
        try {
            const normalizedAddress = this.normalizeAddress(metaMaskAddress);
            logger_1.default.info(`Smart premium check for MetaMask: ${normalizedAddress}`);
            // بررسی قرارداد NodeSet
            const isPremiumOnChain = await this.blockchainService.isWalletPremium(normalizedAddress);
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
            const existingUser = await client_1.default.user.findUnique({
                where: { walletAddress: normalizedAddress }
            });
            const wasAlreadyPremium = !!existingUser && existingUser.status === "Premium";
            return {
                isPremium: true,
                message: wasAlreadyPremium
                    ? "User was already premium, just needs to link profile"
                    : "User is premium on-chain but not in our database",
                nodeData,
                wasAlreadyPremium
            };
        }
        catch (error) {
            logger_1.default.error("Error in smart premium check:", error);
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
    async getNodeData(walletAddress) {
        try {
            const publicClient = (0, viem_1.createPublicClient)({
                chain: chains_1.arbitrum,
                transport: (0, viem_1.http)("https://arb1.arbitrum.io/rpc")
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
                address: "0x3bC03e9793d2E67298fb30871a08050414757Ca7",
                args: [walletAddress],
                functionName: "NodeSet"
            });
            const [startTime, balance, point, _depthLeftBranch, _depthRightBranch, depth, _player, parent, leftChild, rightChild, isPointChanged, unbalancedAllowance] = nodeData;
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
        }
        catch (error) {
            logger_1.default.error("Error getting node data:", error);
            return null;
        }
    }
    /**
     * اتصال هوشمند کیف پول‌ها
     * این تابع خودکار تشخیص می‌دهد که کاربر قبلاً پرمیوم بوده یا نه
     */
    async smartLinkWallets(metaMaskAddress, familyWalletAddress, lensProfileId) {
        try {
            const normalizedMetaMask = this.normalizeAddress(metaMaskAddress);
            const normalizedFamily = this.normalizeAddress(familyWalletAddress);
            logger_1.default.info(`Smart linking: MetaMask=${normalizedMetaMask}, Family=${normalizedFamily}, Profile=${lensProfileId}`);
            // بررسی هوشمند وضعیت پرمیوم
            const premiumStatus = await this.checkSmartPremiumStatus(normalizedMetaMask);
            if (!premiumStatus.isPremium) {
                throw new Error("MetaMask wallet is not premium registered in the contract");
            }
            // بررسی وجود پروفایل Lens
            const profiles = await this.profileService.getProfilesByWallet(normalizedFamily);
            const selectedProfile = profiles.find((p) => p.id === lensProfileId);
            if (!selectedProfile) {
                throw new Error("Lens profile not found or not owned by Family Wallet");
            }
            // بررسی وجود کاربر در دیتابیس
            const existingUser = await client_1.default.user.findUnique({
                include: { premiumProfile: true },
                where: { walletAddress: normalizedMetaMask }
            });
            let user;
            let isNewUser = false;
            let message = "";
            if (existingUser) {
                // کاربر موجود - به‌روزرسانی
                user = await client_1.default.user.update({
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
                await client_1.default.premiumProfile.upsert({
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
            }
            else {
                // کاربر جدید - ایجاد
                user = await client_1.default.user.create({
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
                await client_1.default.premiumProfile.create({
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
        }
        catch (error) {
            logger_1.default.error("Error in smart wallet linking:", error);
            throw error;
        }
    }
    /**
     * دریافت وضعیت کامل کاربر
     */
    async getUserSmartStatus(metaMaskAddress) {
        try {
            const normalizedAddress = this.normalizeAddress(metaMaskAddress);
            // بررسی وضعیت پرمیوم
            const premiumStatus = await this.checkSmartPremiumStatus(normalizedAddress);
            // بررسی وجود کاربر در دیتابیس
            const user = await client_1.default.user.findUnique({
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
        }
        catch (error) {
            logger_1.default.error("Error getting user smart status:", error);
            throw error;
        }
    }
}
exports.SmartPremiumService = SmartPremiumService;
exports.default = new SmartPremiumService();
