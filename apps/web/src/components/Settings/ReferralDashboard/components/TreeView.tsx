import { ArrowsPointingOutIcon } from "@heroicons/react/24/outline";
import { ArrowPathIcon, MinusIcon, PlusIcon } from "@heroicons/react/24/solid";
import formatAddress from "@hey/helpers/formatAddress";
import { useCallback, useRef, useState } from "react";
import type { TreeNode } from "../types";

interface TreeViewProps {
  treeData: TreeNode | null;
  selectedNode: string | null;
  onNodeInspect: (address: string) => void;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  walletFilter: string;
  isDragging: boolean;
  onToggleDrag: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onPanChange?: (offset: { x: number; y: number }) => void;
}

const TreeView = ({
  treeData,
  selectedNode,
  onNodeInspect,
  zoomLevel,
  panOffset,
  walletFilter,
  isDragging,
  onToggleDrag,
  onZoomIn,
  onZoomOut,
  onResetView,
  onPanChange
}: TreeViewProps) => {
  console.log("TreeView render:", {
    isDragging,
    selectedNode,
    treeData,
    walletFilter
  });

  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;

      e.preventDefault();
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    },
    [isDragging]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning || !isDragging) return;

      e.preventDefault();
      const deltaX = e.clientX - lastMousePos.x;
      const deltaY = e.clientY - lastMousePos.y;

      const newPanOffset = {
        x: panOffset.x + deltaX,
        y: panOffset.y + deltaY
      };

      onPanChange?.(newPanOffset);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    },
    [isPanning, isDragging, lastMousePos, panOffset, onPanChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
  }, []);

  if (!treeData) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
        <div className="text-center">
          <h3 className="mt-2 font-medium text-gray-900 text-lg">
            No Referral Tree
          </h3>
          <p className="mt-1 text-gray-500">This address has no referrals.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-96 w-full overflow-hidden rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100">
      <svg
        height="100%"
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        ref={svgRef}
        style={{
          cursor: isDragging ? (isPanning ? "grabbing" : "grab") : "default",
          transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
          transformOrigin: "center",
          transition: isDragging ? "none" : "transform 0.2s ease-in-out"
        }}
        viewBox="0 0 1200 600"
        width="100%"
      >
        <title>Referral Tree Visualization</title>

        {/* Main tree rendering */}
        <g transform="translate(600, 100)">
          {renderNode(
            treeData,
            0,
            0,
            selectedNode,
            onNodeInspect,
            walletFilter
          )}
        </g>
      </svg>

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          className="rounded-lg bg-white/90 p-2 shadow-lg backdrop-blur-sm hover:bg-white disabled:opacity-50"
          disabled={zoomLevel >= 3}
          onClick={onZoomIn}
          type="button"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
        <button
          className="rounded-lg bg-white/90 p-2 shadow-lg backdrop-blur-sm hover:bg-white disabled:opacity-50"
          disabled={zoomLevel <= 0.1}
          onClick={onZoomOut}
          type="button"
        >
          <MinusIcon className="h-4 w-4" />
        </button>
        <button
          className="rounded-lg bg-white/90 p-2 shadow-lg backdrop-blur-sm hover:bg-white"
          onClick={onResetView}
          type="button"
        >
          <ArrowPathIcon className="h-4 w-4" />
        </button>
        <button
          className={`rounded-lg p-2 shadow-lg backdrop-blur-sm ${
            isDragging
              ? "bg-purple-500 text-white"
              : "bg-white/90 hover:bg-white"
          }`}
          onClick={onToggleDrag}
          type="button"
        >
          <ArrowsPointingOutIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Zoom Level Display - Moved to bottom right */}
      <div className="absolute right-4 bottom-4 rounded-lg bg-white/90 px-3 py-1 text-sm shadow-lg backdrop-blur-sm">
        {Math.round(zoomLevel * 100)}%
      </div>

      {/* Drag Mode Indicator */}
      {isDragging && (
        <div className="absolute top-4 left-4 rounded-lg bg-purple-500 px-3 py-1 text-sm text-white shadow-lg">
          Drag Mode Active
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 rounded-lg bg-white/90 p-3 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-blue-500" />
            <span>Balanced</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-orange-500" />
            <span>Unbalanced</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-green-500" />
            <span>Selected</span>
          </div>
          {walletFilter && (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 animate-pulse rounded bg-purple-500" />
              <span>Search Result</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Enhanced node rendering function
const renderNode = (
  node: TreeNode,
  x: number,
  y: number,
  selectedNode: string | null,
  onInspect: (address: string) => void,
  walletFilter: string,
  level = 0
) => {
  const nodeWidth = 180;
  const nodeHeight = 70;
  const levelHeight = 120;
  const childSpacing = 200;
  const isSelected = selectedNode === node.address;
  const isMatched =
    walletFilter &&
    node.address.toLowerCase().includes(walletFilter.toLowerCase());
  const hasChildren =
    node.leftChild ||
    node.rightChild ||
    (node.children && node.children.length > 0);

  console.log("Rendering node:", {
    address: node.address,
    balance: node.balance,
    children: node.children,
    hasChildren,
    isMatched,
    leftChild: node.leftChild,
    rightChild: node.rightChild
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <g key={node.address} transform={`translate(${x}, ${y})`}>
      {/* Connection lines */}
      {node.leftChild && (
        <line
          stroke="#94a3b8"
          strokeDasharray="5,5"
          strokeWidth={2}
          x1={nodeWidth / 2}
          x2={x - childSpacing / 2 + nodeWidth / 2}
          y1={nodeHeight}
          y2={y + levelHeight - nodeHeight / 2}
        />
      )}

      {node.rightChild && (
        <line
          stroke="#94a3b8"
          strokeDasharray="5,5"
          strokeWidth={2}
          x1={nodeWidth / 2}
          x2={x + childSpacing / 2 + nodeWidth / 2}
          y1={nodeHeight}
          y2={y + levelHeight - nodeHeight / 2}
        />
      )}

      {/* Connection line for children array */}
      {node.children && node.children.length > 0 && (
        <line
          stroke="#16a34a"
          strokeDasharray="5,5"
          strokeWidth={3}
          x1={nodeWidth / 2}
          x2={nodeWidth / 2}
          y1={nodeHeight}
          y2={y + levelHeight - nodeHeight / 2}
        />
      )}

      {/* Node container */}
      <g
        className="cursor-pointer transition-all duration-200 hover:scale-105"
        onClick={() => onInspect(node.address)}
      >
        {/* Background with search animation */}
        <rect
          className={`transition-all duration-300 ${
            isMatched ? "animate-pulse" : ""
          }`}
          fill={
            isMatched
              ? "#e9d5ff" // Purple background for search results
              : node.isUnbalanced
                ? "#fed7aa"
                : "#dbeafe"
          }
          height={nodeHeight}
          rx={12}
          stroke={
            isSelected
              ? "#10b981"
              : isMatched
                ? "#9333ea" // Purple border for search results
                : node.isUnbalanced
                  ? "#ea580c"
                  : "#2563eb"
          }
          strokeWidth={isSelected ? 3 : isMatched ? 3 : 2}
          width={nodeWidth}
        />

        {/* Status indicator */}
        <circle
          cx={nodeWidth - 12}
          cy={12}
          fill={
            isMatched
              ? "#9333ea" // Purple for search results
              : node.isUnbalanced
                ? "#ea580c"
                : "#16a34a"
          }
          r={isMatched ? 6 : 5}
        />

        {/* Address with copy button */}
        <g>
          <text
            className="fill-gray-900 font-semibold text-xs"
            textAnchor="middle"
            x={nodeWidth / 2}
            y={22}
          >
            {formatAddress(node.address)}
          </text>
          <g className="opacity-0 transition-opacity group-hover:opacity-100">
            <rect
              className="cursor-pointer fill-gray-100 hover:fill-gray-200"
              height={16}
              rx={4}
              width={16}
              x={nodeWidth - 20}
              y={8}
            />
            <text
              className="cursor-pointer fill-gray-600 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(node.address);
              }}
              textAnchor="middle"
              x={nodeWidth - 12}
              y={18}
            >
              📋
            </text>
          </g>
        </g>

        {/* Balance */}
        <text
          className="fill-gray-700 font-bold text-xs"
          textAnchor="middle"
          x={nodeWidth / 2}
          y={40}
        >
          {Number(node.balance).toFixed(6)} USDT
        </text>

        {/* Depth */}
        <text
          className="fill-gray-500 text-xs"
          textAnchor="middle"
          x={nodeWidth / 2}
          y={55}
        >
          Depth: {node.depth}
        </text>
      </g>

      {/* Render children */}
      {node.isExpanded && node.leftChild && (
        <g>
          {renderNode(
            node.leftChild,
            x - childSpacing / 2,
            y + levelHeight,
            selectedNode,
            onInspect,
            walletFilter,
            level + 1
          )}
        </g>
      )}

      {node.isExpanded && node.rightChild && (
        <g>
          {renderNode(
            node.rightChild,
            x + childSpacing / 2,
            y + levelHeight,
            selectedNode,
            onInspect,
            walletFilter,
            level + 1
          )}
        </g>
      )}

      {/* Render children from children array (parent-child relationships) */}
      {node.isExpanded &&
        node.children &&
        node.children.map((child, index) => (
          <g key={child.address}>
            {renderNode(
              child,
              x +
                (index - ((node.children?.length ?? 0) - 1) / 2) * childSpacing,
              y + levelHeight,
              selectedNode,
              onInspect,
              walletFilter,
              level + 1
            )}
          </g>
        ))}
    </g>
  );
};

export default TreeView;
