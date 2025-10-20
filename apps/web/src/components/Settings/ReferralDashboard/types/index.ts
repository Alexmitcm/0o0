export interface ReferralNode {
  startTime: number;
  balance: string;
  point: number;
  depthLeftBranch: number;
  depthRightBranch: number;
  depth: number;
  player: string;
  parent: string;
  leftChild: string;
  rightChild: string;
  isPointChanged: boolean;
  unbalancedAllowance: boolean;
}

export interface TreeNode {
  address: string;
  balance: string;
  depth: number;
  isUnbalanced: boolean;
  leftChild?: TreeNode | null;
  rightChild?: TreeNode | null;
  children?: TreeNode[]; // For parent-child relationships
  isExpanded?: boolean;
  parent?: TreeNode | null;
}

export interface ReferralTreeState {
  expandedNodes: Set<string>;
  selectedNode: string | null;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  walletFilter: string;
  showRawData: boolean;
  inspectedNode: ReferralNode | null;
}

export interface ReferralStats {
  totalBalance: string;
  networkDepth: number;
  isUnbalanced: boolean;
  totalReferrals: number;
  points: number;
}

export interface NodeInspectorProps {
  node: ReferralNode | null;
  onClose: () => void;
  isVisible: boolean;
}

export interface TreeViewProps {
  treeData: TreeNode | null;
  selectedNode: string | null;
  onNodeSelect: (address: string) => void;
  onNodeToggle: (address: string) => void;
  onNodeCopy: (address: string) => void;
  onNodeInspect: (address: string) => void;
  zoomLevel: number;
  panOffset: { x: number; y: number };
}

export interface FilterPanelProps {
  walletFilter: string;
  onFilterChange: (filter: string) => void;
  onClearFilter: () => void;
}

export interface StatsCardsProps {
  stats: ReferralStats;
}

export interface ControlPanelProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  showRawData: boolean;
  onToggleRawData: () => void;
}
