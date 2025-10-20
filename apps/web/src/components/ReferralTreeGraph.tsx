import formatAddress from "@hey/helpers/formatAddress";
import { toast } from "sonner";
import cn from "../helpers/cn";
import { type ReferralNode, useReferralTree } from "../hooks/useReferralTree";

interface TreeNode {
  id: string;
  address: string;
  balance: string;
  point: number;
  depth: number;
  children: TreeNode[];
}

interface ReferralTreeGraphProps {
  walletAddress: string;
  maxDepth?: number;
  className?: string;
}

const formatTreeData = (nodes: ReferralNode[]): TreeNode | null => {
  if (!nodes.length) return null;

  const nodeMap = new Map<string, TreeNode>();
  const rootNode = nodes.find((node) => node.depth === 0);

  if (!rootNode) return null;

  // Create all nodes
  for (const node of nodes) {
    nodeMap.set(node.address.toLowerCase(), {
      address: node.address,
      balance: node.balance,
      children: [],
      depth: node.depth,
      id: node.address,
      point: node.point
    });
  }

  // Build tree structure
  for (const node of nodes) {
    const treeNode = nodeMap.get(node.address.toLowerCase());
    if (!treeNode) continue;

    if (node.leftChild && nodeMap.has(node.leftChild.toLowerCase())) {
      treeNode.children.push(nodeMap.get(node.leftChild.toLowerCase())!);
    }
    if (node.rightChild && nodeMap.has(node.rightChild.toLowerCase())) {
      treeNode.children.push(nodeMap.get(node.rightChild.toLowerCase())!);
    }
  }

  return nodeMap.get(rootNode.address.toLowerCase()) || null;
};

const TreeNodeComponent = ({
  node,
  x,
  y,
  level = 0,
  onNodeClick
}: {
  node: TreeNode;
  x: number;
  y: number;
  level?: number;
  onNodeClick?: (address: string) => void;
}) => {
  const nodeWidth = 200;
  const nodeHeight = 80;
  const levelHeight = 120;
  const childSpacing = 250;

  const children = node.children;

  return (
    <g>
      {/* Node */}
      <g
        onClick={() => onNodeClick?.(node.address)}
        style={{ cursor: "pointer" }}
      >
        <rect
          className="transition-all hover:shadow-lg"
          fill={level === 0 ? "#3b82f6" : "#f3f4f6"}
          height={nodeHeight}
          rx={8}
          stroke={level === 0 ? "#1d4ed8" : "#d1d5db"}
          strokeWidth={2}
          width={nodeWidth}
          x={x - nodeWidth / 2}
          y={y - nodeHeight / 2}
        />

        {/* Address */}
        <text
          className="fill-gray-900 font-medium text-xs"
          textAnchor="middle"
          x={x}
          y={y - 15}
        >
          {formatAddress(node.address)}
        </text>

        {/* Balance */}
        <text
          className="fill-gray-600 text-xs"
          textAnchor="middle"
          x={x}
          y={y + 5}
        >
          Balance: {(Number.parseFloat(node.balance) / 1e6).toLocaleString()}{" "}
          USDT
        </text>

        {/* Points */}
        <text
          className="fill-gray-600 text-xs"
          textAnchor="middle"
          x={x}
          y={y + 25}
        >
          Points: {node.point.toLocaleString()}
        </text>
      </g>

      {/* Children */}
      {children.map((child, index) => {
        // For binary trees, position left child to the left, right child to the right
        const isLeftChild = index === 0;
        const childX = isLeftChild
          ? x - childSpacing / 2
          : x + childSpacing / 2;
        const childY = y + levelHeight;

        return (
          <g key={child.id}>
            {/* Connection line */}
            <line
              stroke="#d1d5db"
              strokeWidth={2}
              x1={x}
              x2={childX}
              y1={y + nodeHeight / 2}
              y2={childY - nodeHeight / 2}
            />

            {/* Child node */}
            <TreeNodeComponent
              level={level + 1}
              node={child}
              onNodeClick={onNodeClick}
              x={childX}
              y={childY}
            />
          </g>
        );
      })}
    </g>
  );
};

export default function ReferralTreeGraph({
  walletAddress,
  maxDepth = 5,
  className
}: ReferralTreeGraphProps) {
  const { data, isLoading, error } = useReferralTree(walletAddress, maxDepth);

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex h-96 items-center justify-center rounded-xl bg-gray-50",
          className
        )}
      >
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-blue-500 border-b-2" />
          <p className="text-gray-600">Loading referral tree...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "flex h-96 items-center justify-center rounded-xl bg-red-50",
          className
        )}
      >
        <div className="text-center">
          <p className="mb-2 text-red-600">Failed to load referral tree</p>
          <p className="text-red-500 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!data?.data || !data.data.length) {
    return (
      <div
        className={cn(
          "flex h-96 items-center justify-center rounded-xl bg-gray-50",
          className
        )}
      >
        <div className="text-center">
          <p className="text-gray-600">No referral data found</p>
          <p className="mt-1 text-gray-500 text-sm">
            This wallet may not be registered in the referral system
          </p>
        </div>
      </div>
    );
  }

  const treeData = formatTreeData(data.data);

  if (!treeData) {
    return (
      <div
        className={cn(
          "flex h-96 items-center justify-center rounded-xl bg-gray-50",
          className
        )}
      >
        <div className="text-center">
          <p className="text-gray-600">Invalid tree structure</p>
        </div>
      </div>
    );
  }

  // Calculate SVG dimensions based on tree structure
  const calculateTreeDimensions = (
    node: TreeNode,
    level = 0
  ): { width: number; height: number } => {
    if (node.children.length === 0) {
      return { height: 80, width: 200 };
    }

    const childDimensions = node.children.map((child) =>
      calculateTreeDimensions(child, level + 1)
    );

    // For binary trees, calculate width based on left and right branches
    let totalWidth = 200;
    if (node.children.length === 1) {
      totalWidth = Math.max(200, childDimensions[0].width);
    } else if (node.children.length === 2) {
      totalWidth = Math.max(
        200,
        childDimensions[0].width + childDimensions[1].width + 250
      );
    }

    const maxChildHeight = Math.max(
      ...childDimensions.map((dim) => dim.height)
    );

    return {
      height: 80 + 120 + maxChildHeight,
      width: totalWidth
    };
  };

  const dimensions = calculateTreeDimensions(treeData);
  const svgWidth = Math.max(800, dimensions.width);
  const svgHeight = Math.max(600, dimensions.height);

  const handleNodeClick = (address: string) => {
    // Copy address to clipboard
    navigator.clipboard.writeText(address);
    // Show toast notification
    toast.success("Wallet address copied to clipboard");
  };

  return (
    <div className={cn("rounded-xl border bg-white shadow-sm", className)}>
      <div className="border-b p-4">
        <h3 className="font-semibold text-gray-900 text-lg">Referral Tree</h3>
        <div className="mt-2 flex items-center gap-4 text-gray-600 text-sm">
          <span>Root: {formatAddress(walletAddress)}</span>
          <span>•</span>
          <span>Total Nodes: {data.meta.totalNodes}</span>
          <span>•</span>
          <span>Max Depth: {data.meta.maxDepth}</span>
        </div>
      </div>

      <div className="overflow-auto p-4">
        <svg
          className="mx-auto"
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          width={svgWidth}
        >
          <TreeNodeComponent
            node={treeData}
            onNodeClick={handleNodeClick}
            x={svgWidth / 2}
            y={60}
          />
        </svg>
      </div>

      <div className="border-t bg-gray-50 p-4 text-gray-600 text-xs">
        <p>Click on any node to copy the wallet address to clipboard</p>
      </div>
    </div>
  );
}
