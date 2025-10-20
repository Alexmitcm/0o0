"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DualWalletService = void 0;
const logger_1 = __importDefault(require("@hey/helpers/logger"));
const viem_1 = require("viem");
const chains_1 = require("viem/chains");
const client_1 = __importDefault(require("../prisma/client"));
const address_1 = require("../utils/address");
const BlockchainService_1 = __importDefault(require("./BlockchainService"));
const JwtService_1 = __importDefault(require("./JwtService"));
const ProfileService_1 = require("./ProfileService");
class DualWalletService {
    blockchainService;
    profileService;
    jwtService;
    constructor() {
        this.blockchainService = BlockchainService_1.default;
        this.profileService = ProfileService_1.profileService;
        this.jwtService = JwtService_1.default;
    }
    normalizeAddress(address) {
        return (0, address_1.normalizeAddress)(address);
    }
    /**
     * بررسی وضعیت پرمیوم از قرارداد NodeSet
     */
    async checkPremiumStatus(metaMaskAddress) {
        try {
            const normalizedAddress = this.normalizeAddress(metaMaskAddress);
            logger_1.default.info(`Checking premium status for MetaMask: ${normalizedAddress}`);
            // بررسی قرارداد NodeSet
            const isPremium = await this.blockchainService.isWalletPremium(normalizedAddress);
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
        }
        catch (error) {
            logger_1.default.error("Error checking premium status:", error);
            return {
                isPremium: false,
                isRegistered: false
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
            const [startTime, balance, point, _depthLeftBranch, _depthRightBranch, depth, _player, parent, leftChild, rightChild, _isPointChanged, _unbalancedAllowance] = nodeData;
            return {
                balance,
                depth,
                leftChild,
                parent,
                point,
                rightChild,
                startTime
            };
        }
        catch (error) {
            logger_1.default.error("Error getting node data:", error);
            return null;
        }
    }
    /**
     * دریافت پروفایل‌های Lens از Family Wallet
     */
    async getLensProfiles(familyWalletAddress) {
        try {
            const normalizedAddress = this.normalizeAddress(familyWalletAddress);
            logger_1.default.info(`Getting Lens profiles for Family Wallet: ${normalizedAddress}`);
            const profiles = await this.profileService.getProfilesByWallet(normalizedAddress);
            return profiles.map((profile) => ({
                handle: profile.handle,
                id: profile.id,
                isDefault: profile.isDefault,
                ownedBy: profile.ownedBy
            }));
        }
        catch (error) {
            logger_1.default.error("Error getting Lens profiles:", error);
            return [];
        }
    }
    /**
     * اتصال MetaMask به پروفایل Lens
     */
    async linkWallets(request) {
        try {
            const { metaMaskAddress, familyWalletAddress, lensProfileId } = request;
            const normalizedMetaMask = this.normalizeAddress(metaMaskAddress);
            const normalizedFamily = this.normalizeAddress(familyWalletAddress);
            logger_1.default.info(`Linking wallets: MetaMask=${normalizedMetaMask}, Family=${normalizedFamily}, Profile=${lensProfileId}`);
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
            const existingUser = await client_1.default.user.findUnique({
                include: { premiumProfile: true },
                where: { walletAddress: normalizedMetaMask }
            });
            if (existingUser) {
                // کاربر موجود - به‌روزرسانی
                await client_1.default.user.update({
                    data: {
                        lastActiveAt: new Date(),
                        linkedProfileId: lensProfileId,
                        totalLogins: existingUser.totalLogins + 1,
                        walletAddress: normalizedFamily
                    },
                    where: { walletAddress: normalizedMetaMask }
                });
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
            const _newUser = await client_1.default.user.create({
                data: {
                    lastActiveAt: new Date(),
                    linkedProfileId: lensProfileId,
                    status: "Premium",
                    totalLogins: 1,
                    walletAddress: normalizedMetaMask
                }
            });
            // ایجاد پروفایل پرمیوم
            await client_1.default.premiumProfile.create({
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
        }
        catch (error) {
            logger_1.default.error("Error linking wallets:", error);
            throw error;
        }
    }
    /**
     * دریافت وضعیت کاربر
     */
    async getUserStatus(metaMaskAddress) {
        try {
            const normalizedAddress = this.normalizeAddress(metaMaskAddress);
            const user = await client_1.default.user.findUnique({
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
        }
        catch (error) {
            logger_1.default.error("Error getting user status:", error);
            throw error;
        }
    }
    /**
     * اعتبارسنجی توکن
     */
    async validateToken(token) {
        return this.jwtService.verifyToken(token);
    }
}
exports.DualWalletService = DualWalletService;
exports.default = new DualWalletService();
