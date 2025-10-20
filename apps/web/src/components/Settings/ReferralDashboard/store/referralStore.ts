import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { ReferralNode, ReferralStats, TreeNode } from "../types";

export interface ReferralState {
  // Core data
  currentNode: ReferralNode | null;
  parentNode: ReferralNode | null;
  childNodes: Map<string, ReferralNode>;
  treeData: TreeNode | null;
  stats: ReferralStats | null;

  // UI state
  expandedNodes: Set<string>;
  selectedNode: string | null;
  inspectedNode: ReferralNode | null;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  isDragging: boolean;

  // Search and filtering
  walletFilter: string;
  balanceFilter: { min: number; max: number };
  depthFilter: { min: number; max: number };
  statusFilter: "all" | "balanced" | "unbalanced";

  // Loading states
  isLoadingCurrent: boolean;
  isLoadingParent: boolean;
  isLoadingChildren: boolean;
  isRefreshing: boolean;

  // Cache management
  lastUpdated: number;
  cacheExpiry: number;

  // Real-time updates
  isConnected: boolean;
  lastActivity: number;

  // Actions
  setCurrentNode: (node: ReferralNode | null) => void;
  setParentNode: (node: ReferralNode | null) => void;
  setChildNode: (address: string, node: ReferralNode | null) => void;
  setTreeData: (data: TreeNode | null) => void;
  setStats: (stats: ReferralStats | null) => void;

  // UI actions
  toggleExpandedNode: (address: string) => void;
  setSelectedNode: (address: string | null) => void;
  setInspectedNode: (node: ReferralNode | null) => void;
  setZoomLevel: (level: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  setDragging: (isDragging: boolean) => void;

  // Filter actions
  setWalletFilter: (filter: string) => void;
  setBalanceFilter: (filter: { min: number; max: number }) => void;
  setDepthFilter: (filter: { min: number; max: number }) => void;
  setStatusFilter: (filter: "all" | "balanced" | "unbalanced") => void;
  clearFilters: () => void;

  // Loading actions
  setLoadingCurrent: (loading: boolean) => void;
  setLoadingParent: (loading: boolean) => void;
  setLoadingChildren: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;

  // Cache actions
  updateLastUpdated: () => void;
  isCacheValid: () => boolean;
  clearCache: () => void;

  // Real-time actions
  setConnected: (connected: boolean) => void;
  updateActivity: () => void;

  // Optimistic updates
  optimisticUpdate: (address: string, updates: Partial<ReferralNode>) => void;
  revertOptimisticUpdate: (address: string) => void;

  // Batch operations
  batchUpdateNodes: (
    updates: Array<{ address: string; node: ReferralNode }>
  ) => void;
  preloadChildNodes: (addresses: string[]) => void;
}

export const useReferralStore = create<ReferralState>()(
  devtools(
    persist(
      (set, get) => ({
        balanceFilter: { max: Number.POSITIVE_INFINITY, min: 0 },

        // Batch operations
        batchUpdateNodes: (updates) =>
          set((state) => {
            const newChildNodes = new Map(state.childNodes);
            updates.forEach(({ address, node }) => {
              newChildNodes.set(address, node);
            });
            return { childNodes: newChildNodes };
          }),
        cacheExpiry: 5 * 60 * 1000, // 5 minutes
        childNodes: new Map(),
        clearCache: () =>
          set({
            childNodes: new Map(),
            lastUpdated: 0
          }),
        clearFilters: () =>
          set({
            balanceFilter: { max: Number.POSITIVE_INFINITY, min: 0 },
            depthFilter: { max: Number.POSITIVE_INFINITY, min: 0 },
            statusFilter: "all",
            walletFilter: ""
          }),
        // Initial state
        currentNode: null,
        depthFilter: { max: Number.POSITIVE_INFINITY, min: 0 },

        expandedNodes: new Set(),
        inspectedNode: null,
        isCacheValid: () => {
          const state = get();
          return Date.now() - state.lastUpdated < state.cacheExpiry;
        },

        isConnected: false,
        isDragging: false,
        isLoadingChildren: false,

        isLoadingCurrent: false,
        isLoadingParent: false,
        isRefreshing: false,
        lastActivity: Date.now(),

        lastUpdated: 0,

        // Optimistic updates
        optimisticUpdate: (address, updates) =>
          set((state) => {
            const newChildNodes = new Map(state.childNodes);
            const existingNode = newChildNodes.get(address);
            if (existingNode) {
              newChildNodes.set(address, { ...existingNode, ...updates });
            }
            return { childNodes: newChildNodes };
          }),
        panOffset: { x: 0, y: 0 },
        parentNode: null,
        preloadChildNodes: (addresses) => {
          // This will be implemented with the data fetching logic
          console.log("Preloading child nodes:", addresses);
        },
        revertOptimisticUpdate: (address) =>
          set((state) => {
            const newChildNodes = new Map(state.childNodes);
            newChildNodes.delete(address);
            return { childNodes: newChildNodes };
          }),
        selectedNode: null,
        setBalanceFilter: (filter) => set({ balanceFilter: filter }),
        setChildNode: (address, node) =>
          set((state) => {
            const newChildNodes = new Map(state.childNodes);
            if (node) {
              newChildNodes.set(address, node);
            } else {
              newChildNodes.delete(address);
            }
            return { childNodes: newChildNodes };
          }),

        // Real-time actions
        setConnected: (connected) => set({ isConnected: connected }),

        // Core data actions
        setCurrentNode: (node) =>
          set({ currentNode: node, lastUpdated: Date.now() }),
        setDepthFilter: (filter) => set({ depthFilter: filter }),
        setDragging: (isDragging) => set({ isDragging }),
        setInspectedNode: (node) => set({ inspectedNode: node }),
        setLoadingChildren: (loading) => set({ isLoadingChildren: loading }),

        // Loading actions
        setLoadingCurrent: (loading) => set({ isLoadingCurrent: loading }),
        setLoadingParent: (loading) => set({ isLoadingParent: loading }),
        setPanOffset: (offset) => set({ panOffset: offset }),
        setParentNode: (node) => set({ parentNode: node }),
        setRefreshing: (refreshing) => set({ isRefreshing: refreshing }),
        setSelectedNode: (address) => set({ selectedNode: address }),
        setStats: (stats) => set({ stats }),
        setStatusFilter: (filter) => set({ statusFilter: filter }),
        setTreeData: (data) => set({ treeData: data }),

        // Filter actions
        setWalletFilter: (filter) => set({ walletFilter: filter }),
        setZoomLevel: (level) =>
          set({ zoomLevel: Math.max(0.1, Math.min(3, level)) }),
        stats: null,
        statusFilter: "all",

        // UI actions
        toggleExpandedNode: (address) =>
          set((state) => {
            const newExpanded = new Set(state.expandedNodes);
            if (newExpanded.has(address)) {
              newExpanded.delete(address);
            } else {
              newExpanded.add(address);
            }
            return { expandedNodes: newExpanded };
          }),
        treeData: null,
        updateActivity: () => set({ lastActivity: Date.now() }),

        // Cache actions
        updateLastUpdated: () => set({ lastUpdated: Date.now() }),

        walletFilter: "",
        zoomLevel: 1
      }),
      {
        name: "referral-dashboard-store",
        onRehydrateStorage: () => (state) => {
          if (state) {
            // Convert expandedNodes back to Set
            state.expandedNodes = new Set(
              state.expandedNodes as unknown as string[]
            );
          }
        },
        partialize: (state) => ({
          balanceFilter: state.balanceFilter,
          depthFilter: state.depthFilter,
          expandedNodes: Array.from(state.expandedNodes),
          panOffset: state.panOffset,
          statusFilter: state.statusFilter,
          walletFilter: state.walletFilter,
          zoomLevel: state.zoomLevel
        })
      }
    ),
    { name: "referral-store" }
  )
);