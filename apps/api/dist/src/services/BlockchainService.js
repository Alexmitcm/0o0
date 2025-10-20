"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainService = void 0;
const viem_1 = require("viem");
const chains_1 = require("viem/chains");
const logger_1 = __importDefault(require("../utils/logger"));
// ABI for the Referral contract - using the actual contract functions
const REFERRAL_ABI = [
    (0, viem_1.parseAbiItem)("function NodeSet(address) view returns (uint256 startTime, uint256 balance, uint24 point, uint24 depthLeftBranch, uint24 depthRightBranch, uint24 depth, address player, address parent, address leftChild, address rightChild, bool isPointChanged, bool unbalancedAllowance)"),
    (0, viem_1.parseAbiItem)("function getPlayerNode() view returns (uint256 startTime, uint256 balance, uint24 point, uint24 depthLeftBranch, uint24 depthRightBranch, uint24 depth, address player, address parent, address leftChild, address rightChild, bool isPointChanged, bool unbalancedAllowance)"),
    (0, viem_1.parseAbiItem)("function getPlayerNodeAdmin(address player) view returns (uint256 startTime, uint256 balance, uint24 point, uint24 depthLeftBranch, uint24 depthRightBranch, uint24 depth, address player, address parent, address leftChild, address rightChild, bool isPointChanged, bool unbalancedAllowance)"),
    (0, viem_1.parseAbiItem)("function getBalanceOfPlayer() view returns (uint256)"),
    (0, viem_1.parseAbiItem)("function getBalanceOfPlayerAdmin(address player) view returns (uint256)"),
    (0, viem_1.parseAbiItem)("function register(address referrer)"),
    (0, viem_1.parseAbiItem)("function withdraw()")
];
// ABI for the GameVault contracts
const GAME_VAULT_ABI = [
    (0, viem_1.parseAbiItem)("function getReward(address) view returns (uint256)")
];
// ABI for USDT contract
const USDT_ABI = [
    (0, viem_1.parseAbiItem)("function balanceOf(address) view returns (uint256)"),
    (0, viem_1.parseAbiItem)("function approve(address spender, uint256 amount) returns (bool)")
];
class BlockchainService {
    publicClient;
    // Contract addresses from environment variables
    referralContractAddress;
    balancedGameVaultAddress;
    unbalancedGameVaultAddress;
    usdtContractAddress;
    infuraUrl;
    constructor() {
        // Load configuration from environment variables
        this.referralContractAddress = this.getRequiredEnvVar("REFERRAL_CONTRACT_ADDRESS");
        this.balancedGameVaultAddress = this.getRequiredEnvVar("BALANCED_GAME_VAULT_ADDRESS");
        this.unbalancedGameVaultAddress = this.getRequiredEnvVar("UNBALANCED_GAME_VAULT_ADDRESS");
        this.usdtContractAddress = this.getRequiredEnvVar("USDT_CONTRACT_ADDRESS");
        // Make INFURA_URL optional for development
        this.infuraUrl =
            process.env.INFURA_URL || "https://arbitrum-mainnet.infura.io/v3/test";
        // Only create public client if INFURA_URL is properly set
        if (this.infuraUrl && !this.infuraUrl.includes("test")) {
            this.publicClient = (0, viem_1.createPublicClient)({
                chain: chains_1.arbitrum,
                transport: (0, viem_1.http)(this.infuraUrl)
            });
        }
        else {
            logger_1.default.warn("INFURA_URL not set or using test URL, blockchain features will be limited");
        }
    }
    getRequiredEnvVar(name) {
        const value = process.env[name];
        if (!value) {
            throw new Error(`Required environment variable ${name} is not set`);
        }
        return value;
    }
    normalizeWalletAddress(address) {
        return address.toLowerCase();
    }
    /**
     * Check if a wallet is premium by verifying its NodeSet on-chain
     * This is the main function to check premium status
     */
    async isWalletPremium(walletAddress) {
        try {
            // If public client isn't initialized (missing/placeholder INFURA_URL), treat as not premium
            // to avoid runtime errors during local/dev without RPC
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore - publicClient may be undefined at runtime in dev
            if (!this.publicClient) {
                return false;
            }
            const normalizedAddress = this.normalizeWalletAddress(walletAddress);
            logger_1.default.info(`Checking premium status for wallet: ${normalizedAddress}`);
            // Prefer public view function that accepts an address parameter
            const nodeData = await this.publicClient.readContract({
                abi: REFERRAL_ABI,
                address: this.referralContractAddress,
                args: [normalizedAddress],
                functionName: "NodeSet"
            });
            // Check if the node exists by checking if startTime is not 0
            const isPremium = nodeData[0] > 0n; // startTime > 0 means the node exists
            logger_1.default.info(`Wallet ${normalizedAddress} premium status: ${isPremium}`);
            return isPremium;
        }
        catch (error) {
            logger_1.default.error(`Error checking premium status for ${walletAddress}:`, error);
            return false;
        }
    }
    /**
     * Get detailed node data for a wallet
     */
    async getNodeData(walletAddress) {
        try {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (!this.publicClient) {
                return null;
            }
            const normalizedAddress = this.normalizeWalletAddress(walletAddress);
            const nodeData = await this.publicClient.readContract({
                abi: REFERRAL_ABI,
                address: this.referralContractAddress,
                args: [normalizedAddress],
                functionName: "NodeSet"
            });
            // Check if node exists
            if (nodeData[0] === 0n) {
                return null;
            }
            return {
                balance: nodeData[1],
                depth: nodeData[5],
                depthLeftBranch: nodeData[3],
                depthRightBranch: nodeData[4],
                isPointChanged: nodeData[10],
                leftChild: nodeData[8],
                parent: nodeData[7],
                player: nodeData[6],
                point: nodeData[2],
                rightChild: nodeData[9],
                startTime: nodeData[0],
                unbalancedAllowance: nodeData[11]
            };
        }
        catch (error) {
            logger_1.default.error(`Error getting node data for ${walletAddress}:`, error);
            return null;
        }
    }
    /**
     * Check USDT balance for a wallet
     */
    async getUsdtBalance(walletAddress) {
        try {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (!this.publicClient) {
                return 0n;
            }
            const normalizedAddress = this.normalizeWalletAddress(walletAddress);
            const balance = await this.publicClient.readContract({
                abi: USDT_ABI,
                address: this.usdtContractAddress,
                args: [normalizedAddress],
                functionName: "balanceOf"
            });
            return balance;
        }
        catch (error) {
            logger_1.default.error(`Error getting USDT balance for ${walletAddress}:`, error);
            return 0n;
        }
    }
    /**
     * Verify if wallet has sufficient USDT balance (minimum 200 USDT)
     */
    async hasSufficientUsdtBalance(walletAddress, minimumAmount = 200000000000000000000n) {
        try {
            const balance = await this.getUsdtBalance(walletAddress);
            return balance >= minimumAmount;
        }
        catch (error) {
            logger_1.default.error(`Error checking USDT balance sufficiency for ${walletAddress}:`, error);
            return false;
        }
    }
    /**
     * Get referral rewards balance for a wallet
     */
    async getReferralReward(walletAddress) {
        try {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (!this.publicClient) {
                return 0n;
            }
            const normalizedAddress = this.normalizeWalletAddress(walletAddress);
            // First try non-admin function that reads msg.sender context
            try {
                const rewardSelf = await this.publicClient.readContract({
                    abi: REFERRAL_ABI,
                    account: normalizedAddress,
                    address: this.referralContractAddress,
                    args: [],
                    functionName: "getBalanceOfPlayer"
                });
                return rewardSelf;
            }
            catch {
                // Fallback to admin variant if available (may revert due to AccessControl)
                const reward = await this.publicClient.readContract({
                    abi: REFERRAL_ABI,
                    address: this.referralContractAddress,
                    args: [normalizedAddress],
                    functionName: "getBalanceOfPlayerAdmin"
                });
                return reward;
            }
        }
        catch (error) {
            logger_1.default.error(`Error getting referral reward for ${walletAddress}:`, error);
            return 0n;
        }
    }
    /**
     * Get game vault rewards for a wallet
     */
    async getGameVaultRewards(walletAddress) {
        try {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (!this.publicClient) {
                return { balanced: 0n, unbalanced: 0n };
            }
            const normalizedAddress = this.normalizeWalletAddress(walletAddress);
            const [balancedReward, unbalancedReward] = await Promise.all([
                this.publicClient.readContract({
                    abi: GAME_VAULT_ABI,
                    address: this.balancedGameVaultAddress,
                    args: [normalizedAddress],
                    functionName: "getReward"
                }),
                this.publicClient.readContract({
                    abi: GAME_VAULT_ABI,
                    address: this.unbalancedGameVaultAddress,
                    args: [normalizedAddress],
                    functionName: "getReward"
                })
            ]);
            return {
                balanced: balancedReward,
                unbalanced: unbalancedReward
            };
        }
        catch (error) {
            logger_1.default.error(`Error getting game vault rewards for ${walletAddress}:`, error);
            return { balanced: 0n, unbalanced: 0n };
        }
    }
    /**
     * Get comprehensive profile statistics for a wallet
     */
    async getProfileStats(walletAddress) {
        try {
            const normalizedAddress = this.normalizeWalletAddress(walletAddress);
            // Get node data
            const nodeData = await this.getNodeData(normalizedAddress);
            if (!nodeData) {
                throw new Error("Wallet is not premium");
            }
            // Get rewards
            const [referralReward, gameRewards] = await Promise.all([
                this.getReferralReward(normalizedAddress),
                this.getGameVaultRewards(normalizedAddress)
            ]);
            return {
                balancedReward: gameRewards.balanced,
                leftNode: nodeData.leftChild,
                referralReward,
                rightNode: nodeData.rightChild,
                unbalancedReward: gameRewards.unbalanced
            };
        }
        catch (error) {
            logger_1.default.error(`Error getting profile stats for ${walletAddress}:`, error);
            throw new Error("Failed to fetch on-chain profile statistics");
        }
    }
    /**
     * Verify a registration transaction
     */
    async verifyRegistrationTransaction(userAddress, referrerAddress, transactionHash) {
        try {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (!this.publicClient) {
                return false;
            }
            const normalizedUserAddress = this.normalizeWalletAddress(userAddress);
            const normalizedReferrerAddress = this.normalizeWalletAddress(referrerAddress);
            logger_1.default.info(`Verifying registration transaction: ${transactionHash}`);
            // Get transaction receipt
            const receipt = await this.publicClient.getTransactionReceipt({
                hash: transactionHash
            });
            if (!receipt || receipt.status !== "success") {
                logger_1.default.error(`Transaction ${transactionHash} failed or not found`);
                return false;
            }
            // Verify the transaction is for the correct contract
            if (receipt.to?.toLowerCase() !== this.referralContractAddress.toLowerCase()) {
                logger_1.default.error(`Transaction ${transactionHash} is not for the referral contract`);
                return false;
            }
            // Verify the user is now premium
            const isPremium = await this.isWalletPremium(normalizedUserAddress);
            if (!isPremium) {
                logger_1.default.error(`User ${normalizedUserAddress} is not premium after transaction ${transactionHash}`);
                return false;
            }
            // Verify the referrer relationship (optional additional check)
            try {
                const nodeData = await this.getNodeData(normalizedUserAddress);
                if (nodeData &&
                    nodeData.parent.toLowerCase() !== normalizedReferrerAddress) {
                    logger_1.default.warn(`Referrer mismatch for user ${normalizedUserAddress}`);
                    // Don't fail verification for this, as the main check is if user is premium
                }
            }
            catch (error) {
                logger_1.default.warn(`Could not verify referrer relationship: ${error}`);
            }
            logger_1.default.info(`Registration transaction ${transactionHash} verified successfully`);
            return true;
        }
        catch (error) {
            logger_1.default.error(`Error verifying registration transaction ${transactionHash}:`, error);
            return false;
        }
    }
    /**
     * Validate referrer address
     */
    async validateReferrer(referrerAddress) {
        try {
            const normalizedReferrer = this.normalizeWalletAddress(referrerAddress);
            // Check if referrer exists in the system
            const nodeData = await this.getNodeData(normalizedReferrer);
            if (!nodeData) {
                return { isValid: false, message: "Invalid referrer address" };
            }
            // Check if referrer has available slots
            const hasAvailableSlots = nodeData.leftChild === "0x0000000000000000000000000000000000000000" ||
                nodeData.rightChild === "0x0000000000000000000000000000000000000000";
            if (!hasAvailableSlots) {
                return { isValid: false, message: "Referrer has no available slots" };
            }
            return { isValid: true, message: "Valid referrer address" };
        }
        catch (error) {
            logger_1.default.error(`Error validating referrer ${referrerAddress}:`, error);
            return { isValid: false, message: "Error validating referrer" };
        }
    }
    /**
     * Get contract addresses for reference
     */
    getContractAddresses() {
        return {
            balancedGameVault: this.balancedGameVaultAddress,
            referral: this.referralContractAddress,
            unbalancedGameVault: this.unbalancedGameVaultAddress,
            usdt: this.usdtContractAddress
        };
    }
}
exports.BlockchainService = BlockchainService;
exports.default = new BlockchainService();
