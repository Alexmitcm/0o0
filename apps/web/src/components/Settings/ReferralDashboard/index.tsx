import { UsersIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { usePremiumStore } from "@/store/persisted/usePremiumStore";
import { ARBITRUM_CHAIN_ID } from "../../../lib/constants";
import {
  ControlPanel,
  FilterPanel,
  NodeInspector,
  StatsCards,
  TreeView
} from "./components";
import { useChildNodeData, useReferralData } from "./hooks/useReferralData";
import { useTreeState } from "./hooks/useTreeState";
import { exportReferralData } from "./utils/treeUtils";

const ReferralDashboard = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { isPremium } = usePremiumStore();

  // Check if user is on Arbitrum network
  const isOnArbitrum = chainId === ARBITRUM_CHAIN_ID;

  // Handle network switch to Arbitrum
  const handleSwitchToArbitrum = async () => {
    try {
      await switchChainAsync({ chainId: ARBITRUM_CHAIN_ID });
    } catch (error) {
      console.error("Failed to switch to Arbitrum:", error);
    }
  };

  const {
    expandedNodes,
    selectedNode,
    zoomLevel,
    panOffset,
    walletFilter,
    showRawData,
    inspectedNode,
    isDragging,
    isSearching,
    searchResults,
    hasResults,
    handleZoomIn,
    handleZoomOut,
    handleResetView,
    handleFilterChange,
    handleClearFilter,
    handleToggleRawData,
    handleCloseInspector,
    handleToggleDrag,
    handlePanChange,
    setInspectedNode
  } = useTreeState();

  const {
    contractError,
    currentNode,
    filteredTree,
    isLoadingCurrent,
    stats,
    parentNode
  } = useReferralData(expandedNodes, walletFilter);

  // State to track which child node is being inspected
  const [inspectingChildAddress, setInspectingChildAddress] = useState<
    string | null
  >(null);

  // Hook for fetching child node data
  const { childNode, isLoadingChild, childError } = useChildNodeData(
    inspectingChildAddress
  );

  const handleExportData = () => {
    if (!currentNode || !connectedAddress) return;
    exportReferralData(currentNode, connectedAddress);
  };

  // Enhanced node inspection handler
  const handleNodeInspectEnhanced = async (address: string) => {
    console.log("Enhanced node inspection for:", address);

    // If clicking on current user's node, show current user data
    if (address === currentNode?.player) {
      console.log("Setting current node data in inspector");
      setInspectedNode(currentNode);
      setInspectingChildAddress(null);
      return;
    }

    // If clicking on parent node, show parent data
    if (address === parentNode?.player) {
      console.log("Setting parent node data in inspector");
      setInspectedNode(parentNode);
      setInspectingChildAddress(null);
      return;
    }

    // If clicking on child nodes (left or right child), fetch real data
    if (
      address === currentNode?.leftChild ||
      address === currentNode?.rightChild
    ) {
      console.log("Fetching real child node data for:", address);
      setInspectingChildAddress(address);
      return;
    }

    // For other nodes, create placeholder data
    console.log("Setting placeholder data for:", address);
    setInspectedNode({
      balance: "0",
      depth: 0,
      depthLeftBranch: 0,
      depthRightBranch: 0,
      isPointChanged: false,
      leftChild: "0x0000000000000000000000000000000000000000",
      parent: "0x0000000000000000000000000000000000000000",
      player: address,
      point: 0,
      rightChild: "0x0000000000000000000000000000000000000000",
      startTime: 0,
      unbalancedAllowance: true
    });
    setInspectingChildAddress(null);
  };

  // Update inspected node when child data is loaded
  if (inspectingChildAddress && childNode && !isLoadingChild) {
    console.log("Setting real child node data in inspector:", childNode);
    setInspectedNode(childNode);
    setInspectingChildAddress(null);
  }

  // Handle child node error
  if (inspectingChildAddress && childError && !isLoadingChild) {
    console.error("Error fetching child node data:", childError);
    setInspectedNode({
      balance: "Error loading data",
      depth: 0,
      depthLeftBranch: 0,
      depthRightBranch: 0,
      isPointChanged: false,
      leftChild: "0x0000000000000000000000000000000000000000",
      parent: "0x0000000000000000000000000000000000000000",
      player: inspectingChildAddress,
      point: 0,
      rightChild: "0x0000000000000000000000000000000000000000",
      startTime: 0,
      unbalancedAllowance: true
    });
    setInspectingChildAddress(null);
  }

  // Show loading state for child node
  if (inspectingChildAddress && isLoadingChild) {
    if (!inspectedNode || inspectedNode.player !== inspectingChildAddress) {
      setInspectedNode({
        balance: "Loading...",
        depth: 0,
        depthLeftBranch: 0,
        depthRightBranch: 0,
        isPointChanged: false,
        leftChild: "0x0000000000000000000000000000000000000000",
        parent: "0x0000000000000000000000000000000000000000",
        player: inspectingChildAddress,
        point: 0,
        rightChild: "0x0000000000000000000000000000000000000000",
        startTime: 0,
        unbalancedAllowance: true
      });
    }
  }

  // Premium access check
  if (!isPremium) {
    return (
      <div className="space-y-6 p-5">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
              <span className="font-bold text-lg text-white">⭐</span>
            </div>
            <h3 className="mt-4 font-medium text-gray-900 text-lg">
              Premium Feature
            </h3>
            <p className="mt-2 text-gray-600">
              The Referral Dashboard is exclusively available to premium users.
            </p>
            <p className="mt-1 text-gray-500 text-sm">
              Upgrade to premium to access advanced referral analytics,
              real-time tracking, and detailed network insights.
            </p>
            <button
              className="mt-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2 font-medium text-white transition-all duration-200 hover:from-purple-700 hover:to-pink-700"
              onClick={() => (window.location.href = "/settings/premium")}
              type="button"
            >
              Upgrade to Premium
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Network validation check
  if (!isOnArbitrum) {
    return (
      <div className="space-y-6 p-5">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
              <span className="font-bold text-lg text-white">🔗</span>
            </div>
            <h3 className="mt-4 font-medium text-gray-900 text-lg">
              Wrong Network
            </h3>
            <p className="mt-2 text-gray-600">
              The Referral Dashboard requires Arbitrum network to access
              referral data.
            </p>
            <p className="mt-1 text-gray-500 text-sm">
              Please switch to Arbitrum to view your referral network and
              analytics.
            </p>
            <button
              className="mt-4 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2 font-medium text-white transition-all duration-200 hover:from-blue-700 hover:to-purple-700"
              onClick={handleSwitchToArbitrum}
              type="button"
            >
              Switch to Arbitrum
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="space-y-6 p-5">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="text-center">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 font-medium text-gray-900 text-lg">
              Connect Wallet
            </h3>
            <p className="mt-1 text-gray-500">
              Please connect your wallet to view referral data.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingCurrent) {
    return (
      <div className="space-y-6 p-5">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 rounded bg-gray-200" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div className="h-24 rounded-lg bg-gray-200" key={i} />
            ))}
          </div>
          <div className="h-96 rounded-lg bg-gray-200" />
        </div>
      </div>
    );
  }

  if (!currentNode) {
    return (
      <div className="space-y-6 p-5">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="text-center">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 font-medium text-gray-900 text-lg">
              No Referral Data
            </h3>
            <p className="mt-1 text-gray-500">
              {contractError
                ? `Error loading referral data: ${contractError.message}`
                : "This address is not registered in the referral program."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-gray-900">
            Referral Dashboard
          </h1>
          <p className="text-gray-600">
            Manage and visualize your referral network
          </p>
        </div>
        <button
          className="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-700"
          onClick={handleExportData}
          type="button"
        >
          Export Data
        </button>
      </div>

      {/* Stats Cards */}
      {stats && <StatsCards stats={stats} />}

      {/* Filter */}
      <FilterPanel
        hasResults={hasResults}
        isSearching={isSearching}
        onClearFilter={handleClearFilter}
        onFilterChange={handleFilterChange}
        searchResults={searchResults}
        walletFilter={walletFilter}
      />

      {/* Tree View */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-lg">Referral Tree</h2>
          <ControlPanel
            onResetView={handleResetView}
            onToggleRawData={handleToggleRawData}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            showRawData={showRawData}
            zoomLevel={zoomLevel}
          />
        </div>

        <TreeView
          isDragging={isDragging}
          onNodeInspect={handleNodeInspectEnhanced}
          onPanChange={handlePanChange}
          onResetView={handleResetView}
          onToggleDrag={handleToggleDrag}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          panOffset={panOffset}
          selectedNode={selectedNode}
          treeData={filteredTree}
          walletFilter={walletFilter}
          zoomLevel={zoomLevel}
        />
      </div>

      {/* Raw Data - Always visible */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="font-semibold text-gray-900 text-lg">
            Raw NodeSet Data
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              isAddress: true,
              label: "Player Address",
              value: currentNode.player
            },
            {
              isAddress: true,
              label: "Parent Address",
              value: currentNode.parent
            },
            {
              isAddress: true,
              label: "Left Child",
              value: currentNode.leftChild
            },
            {
              isAddress: true,
              label: "Right Child",
              value: currentNode.rightChild
            },
            {
              isAddress: false,
              label: "Balance",
              value: `${Number(currentNode.balance).toFixed(4)} USDT`
            },
            {
              isAddress: false,
              label: "Points",
              value: currentNode.point.toString()
            },
            {
              isAddress: false,
              label: "Depth",
              value: currentNode.depth.toString()
            },
            {
              isAddress: false,
              label: "Start Time",
              value: new Date(currentNode.startTime * 1000).toLocaleString()
            },
            {
              isAddress: false,
              label: "Point Changed",
              value: currentNode.isPointChanged ? "Yes" : "No"
            },
            {
              isAddress: false,
              label: "Unbalanced Allowance",
              value: currentNode.unbalancedAllowance ? "Yes" : "No"
            }
          ].map((field) => (
            <div
              className="rounded-lg border border-gray-200 p-4"
              key={field.label}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-gray-900 text-sm">
                  {field.label}
                </span>
                {field.isAddress &&
                  field.value !==
                    "0x0000000000000000000000000000000000000000" && (
                    <button
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      onClick={() => navigator.clipboard.writeText(field.value)}
                      type="button"
                    >
                      📋
                    </button>
                  )}
              </div>
              <div className="break-all font-mono text-gray-700 text-sm">
                {field.value ===
                "0x0000000000000000000000000000000000000000" ? (
                  <span className="text-gray-400">None</span>
                ) : (
                  field.value
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Node Inspector */}
      <NodeInspector
        isVisible={!!inspectedNode}
        node={inspectedNode}
        onClose={handleCloseInspector}
      />
    </div>
  );
};

export default ReferralDashboard;
