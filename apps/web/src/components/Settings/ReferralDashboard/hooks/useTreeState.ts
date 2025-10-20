import { useCallback, useState } from "react";
import type { ReferralNode } from "../types";

export const useTreeState = () => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [walletFilter, setWalletFilter] = useState("");
  const [showRawData, setShowRawData] = useState(false);
  const [inspectedNode, setInspectedNode] = useState<ReferralNode | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(0);
  const [hasResults, setHasResults] = useState(true);

  const handleNodeToggle = useCallback((address: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(address)) {
        newSet.delete(address);
      } else {
        newSet.add(address);
      }
      return newSet;
    });
  }, []);

  const handleNodeSelect = useCallback((address: string) => {
    setSelectedNode(address);
  }, []);

  const handleNodeInspect = useCallback((address: string) => {
    console.log("Inspecting node:", address);
    // This will be handled by the main component
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev * 1.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev / 1.2, 0.1));
  }, []);

  const handleResetView = useCallback(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const handleFilterChange = useCallback((filter: string) => {
    setWalletFilter(filter);
    setIsSearching(true);

    // Simulate search delay
    setTimeout(() => {
      setIsSearching(false);
      // This would be calculated based on actual search results
      setSearchResults(filter ? 1 : 0);
      setHasResults(!!filter);
    }, 500);
  }, []);

  const handleClearFilter = useCallback(() => {
    setWalletFilter("");
    setIsSearching(false);
    setSearchResults(0);
    setHasResults(true);
  }, []);

  const handleToggleRawData = useCallback(() => {
    setShowRawData((prev) => !prev);
  }, []);

  const handleCopyAddress = useCallback((address: string) => {
    navigator.clipboard.writeText(address);
  }, []);

  const handleCloseInspector = useCallback(() => {
    setInspectedNode(null);
  }, []);

  const handleToggleDrag = useCallback(() => {
    setIsDragging((prev) => !prev);
  }, []);

  const handlePanChange = useCallback((offset: { x: number; y: number }) => {
    setPanOffset(offset);
  }, []);

  return {
    // State
    expandedNodes,
    handleClearFilter,
    handleCloseInspector,
    handleCopyAddress,
    handleFilterChange,
    handleNodeInspect,
    handleNodeSelect,

    // Handlers
    handleNodeToggle,
    handlePanChange,
    handleResetView,
    handleToggleDrag,
    handleToggleRawData,
    handleZoomIn,
    handleZoomOut,
    hasResults,
    inspectedNode,
    isDragging,
    isSearching,
    panOffset,
    searchResults,
    selectedNode,
    setInspectedNode,
    showRawData,
    walletFilter,
    zoomLevel
  };
};
