import { useAccount, useReadContract } from "wagmi";
import { MAINNET_CONTRACTS, REFERRAL_ABI } from "../../../../lib/constants";
import type { ReferralStats } from "../types";
import {
  buildTreeStructure,
  calculateStats,
  filterTree,
  parseReferralNode
} from "../utils/treeUtils";

export const useReferralData = (
  expandedNodes: Set<string>,
  walletFilter: string
) => {
  const { address: connectedAddress, isConnected } = useAccount();

  // Fetch current user's node data
  const {
    data: currentNodeData,
    isLoading: isLoadingCurrent,
    error: contractError
  } = useReadContract({
    abi: REFERRAL_ABI,
    address: MAINNET_CONTRACTS.REFERRAL as `0x${string}`,
    args: [connectedAddress as `0x${string}`],
    functionName: "NodeSet"
  });

  // Parse current node data
  const currentNode = currentNodeData
    ? parseReferralNode(currentNodeData)
    : null;

  // Fetch parent node data if current node has a parent
  const { data: parentNodeData, isLoading: isLoadingParent } = useReadContract({
    abi: REFERRAL_ABI,
    address: MAINNET_CONTRACTS.REFERRAL as `0x${string}`,
    args: [currentNode?.parent as `0x${string}`],
    functionName: "NodeSet"
  });

  // Parse parent node data
  const parentNode = parentNodeData ? parseReferralNode(parentNodeData) : null;

  // Build tree structure
  const treeData = currentNode
    ? buildTreeStructure(currentNode, expandedNodes, parentNode)
    : null;

  // Filter tree based on wallet filter
  const filteredTree =
    treeData && walletFilter ? filterTree(treeData, walletFilter) : treeData;

  // Calculate stats
  const stats: ReferralStats | null = currentNode
    ? calculateStats(currentNode)
    : null;

  return {
    connectedAddress,
    contractError,
    currentNode,
    filteredTree,
    isConnected,
    isLoadingCurrent,
    isLoadingParent,
    parentNode,
    stats,
    treeData
  };
};

// Custom hook for fetching child node data
export const useChildNodeData = (childAddress: string | null) => {
  const {
    data: childNodeData,
    isLoading: isLoadingChild,
    error: childError,
    refetch: refetchChild
  } = useReadContract({
    abi: REFERRAL_ABI,
    address: MAINNET_CONTRACTS.REFERRAL as `0x${string}`,
    args: [childAddress as `0x${string}`],
    functionName: "NodeSet"
  });

  const childNode = childNodeData ? parseReferralNode(childNodeData) : null;

  return {
    childError,
    childNode,
    isLoadingChild,
    refetchChild
  };
};
