import prisma from "../prisma/client";
import BlockchainService from "../services/BlockchainService";

export type SegmentationResult = {
  isBalanced: boolean;
  leftCount: number;
  rightCount: number;
  equilibriumPoint?: number | null;
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const SegmentationService = {
  getForWallet: async (walletAddress: string): Promise<SegmentationResult> => {
    const normalized = walletAddress.toLowerCase();

    const cached = await prisma.referralBalanceCache
      .findUnique({
        where: { walletAddress: normalized }
      })
      .catch(() => null);

    if (cached) {
      return {
        equilibriumPoint: cached.equilibriumPoint ?? null,
        isBalanced: cached.isBalanced,
        leftCount: cached.leftCount,
        rightCount: cached.rightCount
      };
    }

    const node = await BlockchainService.getNodeData(normalized);
    if (!node) {
      // No node yet -> consider unbalanced with zero branches
      const result: SegmentationResult = {
        isBalanced: false,
        leftCount: 0,
        rightCount: 0
      };
      await prisma.referralBalanceCache
        .upsert({
          create: {
            isBalanced: false,
            leftCount: 0,
            rightCount: 0,
            walletAddress: normalized
          },
          update: { isBalanced: false, leftCount: 0, rightCount: 0 },
          where: { walletAddress: normalized }
        })
        .catch(() => null);
      return result;
    }

    const hasLeft = !!node.leftChild && node.leftChild !== ZERO_ADDRESS;
    const hasRight = !!node.rightChild && node.rightChild !== ZERO_ADDRESS;

    const leftCount =
      node.depthLeftBranch > 0 ? node.depthLeftBranch : hasLeft ? 1 : 0;
    const rightCount =
      node.depthRightBranch > 0 ? node.depthRightBranch : hasRight ? 1 : 0;
    const isBalanced = hasLeft && hasRight;

    await prisma.referralBalanceCache
      .upsert({
        create: {
          equilibriumPoint: node.point,
          isBalanced,
          leftCount,
          rightCount,
          walletAddress: normalized
        },
        update: {
          equilibriumPoint: node.point,
          isBalanced,
          leftCount,
          rightCount
        },
        where: { walletAddress: normalized }
      })
      .catch(() => null);

    return { equilibriumPoint: node.point, isBalanced, leftCount, rightCount };
  }
};

export default SegmentationService;
