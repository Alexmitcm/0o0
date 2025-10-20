import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";
import { useAccount, useReadContract } from "wagmi";
import { MAINNET_CONTRACTS, REFERRAL_ABI } from "../../../../lib/constants";
import { useReferralStore } from "../store/referralStore";
import type { ReferralNode } from "../types";
import {
  buildTreeStructure,
  calculateStats,
  filterTree,
  parseReferralNode
} from "../utils/treeUtils";

// Query keys for React Query
const QUERY_KEYS = {
  childNode: (address: string) => ["referral", "childNode", address],
  currentNode: (address: string) => ["referral", "currentNode", address],
  parentNode: (address: string) => ["referral", "parentNode", address],
  treeData: (address: string, expandedNodes: Set<string>) => [
    "referral",
    "treeData",
    address,
    Array.from(expandedNodes).sort()
  ]
};

// Custom hook for fetching node data with caching
const useNodeData = (address: string | null) => {
  const { data, isLoading, error, refetch } = useReadContract({
    abi: REFERRAL_ABI,
    address: MAINNET_CONTRACTS.REFERRAL as `0x${string}`,
    args: [address as `0x${string}`],
    functionName: "NodeSet"
  });

  const node = useMemo(() => {
    return data ? parseReferralNode(data) : null;
  }, [data]);

  return { error, isLoading, node, refetch };
};

// Enhanced referral data hook with React Query
export const useReferralDataWithQuery = (
  expandedNodes: Set<string>,
  walletFilter: string
) => {
  const { address: connectedAddress, isConnected } = useAccount();
  const queryClient = useQueryClient();

  // Get store actions
  const {
    currentNode,
    parentNode,
    childNodes,
    setCurrentNode,
    setParentNode,
    setChildNode,
    setTreeData,
    setStats,
    setLoadingCurrent,
    setLoadingParent,
    setLoadingChildren,
    isCacheValid,
    updateLastUpdated
  } = useReferralStore();

  // Fetch current user's node data
  const {
    node: currentNodeData,
    isLoading: isLoadingCurrent,
    error: currentError,
    refetch: refetchCurrent
  } = useNodeData(connectedAddress || null);

  // Fetch parent node data
  const {
    node: parentNodeData,
    isLoading: isLoadingParent,
    error: parentError,
    refetch: refetchParent
  } = useNodeData(currentNodeData?.parent || null);

  // Update store when data changes
  useEffect(() => {
    if (currentNodeData && currentNodeData !== currentNode) {
      setCurrentNode(currentNodeData);
      updateLastUpdated();
    }
  }, [currentNodeData, currentNode, setCurrentNode, updateLastUpdated]);

  useEffect(() => {
    if (parentNodeData && parentNodeData !== parentNode) {
      setParentNode(parentNodeData);
    }
  }, [parentNodeData, parentNode, setParentNode]);

  // Update loading states
  useEffect(() => {
    setLoadingCurrent(isLoadingCurrent);
  }, [isLoadingCurrent, setLoadingCurrent]);

  useEffect(() => {
    setLoadingParent(isLoadingParent);
  }, [isLoadingParent, setLoadingParent]);

  // Build tree data with React Query caching
  const treeDataQuery = useQuery({
    enabled: !!currentNodeData && isConnected,
    gcTime: 5 * 60 * 1000, // 5 minutes
    queryFn: () => {
      if (!currentNodeData) return null;
      return buildTreeStructure(currentNodeData, expandedNodes, parentNodeData);
    },
    queryKey: QUERY_KEYS.treeData(connectedAddress || "", expandedNodes),
    staleTime: 30000 // 30 seconds
  });

  // Update tree data in store
  useEffect(() => {
    if (treeDataQuery.data) {
      setTreeData(treeDataQuery.data);
    }
  }, [treeDataQuery.data, setTreeData]);

  // Filter tree data
  const filteredTree = useMemo(() => {
    if (!treeDataQuery.data || !walletFilter) return treeDataQuery.data;
    return filterTree(treeDataQuery.data, walletFilter);
  }, [treeDataQuery.data, walletFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    return currentNodeData ? calculateStats(currentNodeData) : null;
  }, [currentNodeData]);

  // Update stats in store
  useEffect(() => {
    if (stats) {
      setStats(stats);
    }
  }, [stats, setStats]);

  // Auto-refresh mechanism
  useEffect(() => {
    if (!isConnected || !connectedAddress) return;

    const interval = setInterval(() => {
      // Only refresh if cache is stale
      if (!isCacheValid()) {
        console.log("Auto-refreshing referral data...");
        refetchCurrent();
        if (currentNodeData?.parent) {
          refetchParent();
        }
      }
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [
    isConnected,
    connectedAddress,
    isCacheValid,
    refetchCurrent,
    refetchParent,
    currentNodeData?.parent
  ]);

  // Pre-fetch child nodes
  const preloadChildNodes = useCallback(
    (addresses: string[]) => {
      addresses.forEach((address) => {
        if (!childNodes.has(address)) {
          queryClient.prefetchQuery({
            gcTime: 5 * 60 * 1000,
            queryFn: async () => {
              // This would be implemented with a custom hook or direct contract call
              console.log("Preloading child node:", address);
            },
            queryKey: QUERY_KEYS.childNode(address),
            staleTime: 30000
          });
        }
      });
    },
    [childNodes, queryClient]
  );

  // Optimistic updates
  const optimisticUpdate = useCallback(
    (address: string, updates: Partial<ReferralNode>) => {
      // Update the query cache optimistically
      queryClient.setQueryData(
        QUERY_KEYS.childNode(address),
        (oldData: any) => {
          if (!oldData) return null;
          return { ...oldData, ...updates };
        }
      );
    },
    [queryClient]
  );

  // Revert optimistic updates
  const revertOptimisticUpdate = useCallback(
    (address: string) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.childNode(address)
      });
    },
    [queryClient]
  );

  return {
    // Data
    connectedAddress,

    // Errors
    currentError,
    currentNode: currentNodeData,
    filteredTree,

    // Connection state
    isConnected,
    isLoadingChildren: treeDataQuery.isLoading,

    // Loading states
    isLoadingCurrent,
    isLoadingParent,
    optimisticUpdate,
    parentError,
    parentNode: parentNodeData,
    preloadChildNodes,

    // Actions
    refetchCurrent,
    refetchParent,
    revertOptimisticUpdate,
    stats
  };
};

// Hook for fetching individual child nodes
export const useChildNodeDataWithQuery = (childAddress: string | null) => {
  const { node, isLoading, error, refetch } = useNodeData(childAddress);

  return {
    childError: error,
    childNode: node,
    isLoadingChild: isLoading,
    refetchChild: refetch
  };
};
