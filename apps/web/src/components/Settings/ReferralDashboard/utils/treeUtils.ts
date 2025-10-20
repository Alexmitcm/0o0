import type { ReferralNode, ReferralStats, TreeNode } from "../types";

export const parseReferralNode = (nodeData: any): ReferralNode | null => {
  if (!nodeData || !Array.isArray(nodeData)) return null;

  const [
    startTime,
    balance,
    point,
    depthLeftBranch,
    depthRightBranch,
    depth,
    player,
    parent,
    leftChild,
    rightChild,
    isPointChanged,
    unbalancedAllowance
  ] = nodeData;

  // Check if this is a valid node (player should match the address)
  if (player === "0x0000000000000000000000000000000000000000") {
    return null;
  }

  console.log("Parsing node data:", {
    balance,
    depth,
    leftChild,
    parent,
    player,
    point,
    rightChild,
    startTime
  });

  // USDT has 6 decimal places, not 18 like ETH
  // Convert from wei to USDT: divide by 10^6
  const balanceInUSDT = Number(balance) / 1000000;

  return {
    balance: balanceInUSDT.toString(),
    depth: Number(depth),
    depthLeftBranch: Number(depthLeftBranch),
    depthRightBranch: Number(depthRightBranch),
    isPointChanged: Boolean(isPointChanged),
    leftChild: leftChild as string,
    parent: parent as string,
    player: player as string,
    point: Number(point),
    rightChild: rightChild as string,
    startTime: Number(startTime),
    unbalancedAllowance: Boolean(unbalancedAllowance)
  };
};

export const buildTreeStructure = (
  currentNode: ReferralNode,
  _expandedNodes: Set<string>,
  parentNode?: ReferralNode | null
): TreeNode => {
  console.log("Building tree structure:", { currentNode, parentNode });

  // Create the main node (current user)
  const mainNode: TreeNode = {
    address: currentNode.player,
    balance: currentNode.balance,
    depth: currentNode.depth,
    isExpanded: true, // Always expanded by default
    isUnbalanced: currentNode.unbalancedAllowance, // Use actual NodeSet data
    leftChild:
      currentNode.leftChild !== "0x0000000000000000000000000000000000000000"
        ? {
            address: currentNode.leftChild,
            balance: "0", // We don't have child data, so default to 0
            depth: currentNode.depth + 1,
            isExpanded: true, // Always expanded by default
            isUnbalanced: true // All wallets are unbalanced as per user feedback
          }
        : null,
    rightChild:
      currentNode.rightChild !== "0x0000000000000000000000000000000000000000"
        ? {
            address: currentNode.rightChild,
            balance: "0", // We don't have child data, so default to 0
            depth: currentNode.depth + 1,
            isExpanded: true, // Always expanded by default
            isUnbalanced: true // All wallets are unbalanced as per user feedback
          }
        : null
  };

  // If we have a parent node, create a tree with parent at top and current user as child
  if (
    parentNode &&
    parentNode.player !== "0x0000000000000000000000000000000000000000"
  ) {
    console.log("Creating tree with parent at top");
    return {
      address: parentNode.player,
      balance: parentNode.balance,
      // Add the current user as a child of the parent
      children: [mainNode],
      depth: parentNode.depth,
      isExpanded: true, // Always expanded by default
      isUnbalanced: parentNode.unbalancedAllowance, // Use actual NodeSet data
      leftChild: null,
      rightChild: null
    };
  }

  // If no parent, return the current user as the root
  console.log("Creating tree with current user as root");
  return mainNode;
};

export const filterTree = (
  treeData: TreeNode,
  walletFilter: string
): TreeNode | null => {
  if (!walletFilter) return treeData;

  const filterNode = (node: TreeNode): TreeNode | null => {
    // Check if current node matches filter
    if (node.address.toLowerCase().includes(walletFilter.toLowerCase())) {
      return node;
    }

    // Check left child
    const leftFiltered = node.leftChild ? filterNode(node.leftChild) : null;

    // Check right child
    const rightFiltered = node.rightChild ? filterNode(node.rightChild) : null;

    // Check children array (for parent-child relationships)
    const childrenFiltered = node.children
      ? (node.children
          .map((child) => filterNode(child))
          .filter(Boolean) as TreeNode[])
      : [];

    // If any child matches, return the node with filtered children
    if (leftFiltered || rightFiltered || childrenFiltered.length > 0) {
      return {
        ...node,
        children: childrenFiltered.length > 0 ? childrenFiltered : undefined,
        leftChild: leftFiltered,
        rightChild: rightFiltered
      };
    }

    return null;
  };

  return filterNode(treeData);
};

export const calculateStats = (currentNode: ReferralNode): ReferralStats => {
  const totalReferrals = [currentNode.leftChild, currentNode.rightChild].filter(
    (child) => child !== "0x0000000000000000000000000000000000000000"
  ).length;

  return {
    isUnbalanced: currentNode.unbalancedAllowance,
    networkDepth: currentNode.depth,
    points: currentNode.point,
    totalBalance: currentNode.balance,
    totalReferrals
  };
};

export const exportReferralData = (
  currentNode: ReferralNode,
  connectedAddress: string
) => {
  const exportData = {
    timestamp: new Date().toISOString(),
    user: {
      address: connectedAddress,
      nodeData: currentNode
    }
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `referral-data-${connectedAddress}-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Helper function to fetch parent node data
export const fetchParentNodeData = async (
  parentAddress: string,
  contract: any,
  _abi: any
): Promise<ReferralNode | null> => {
  if (parentAddress === "0x0000000000000000000000000000000000000000") {
    return null;
  }

  try {
    const parentData = await contract.read.NodeSet([
      parentAddress as `0x${string}`
    ]);
    return parseReferralNode(parentData);
  } catch (error) {
    console.error("Error fetching parent node data:", error);
    return null;
  }
};
