import { ClipboardDocumentIcon, XMarkIcon } from "@heroicons/react/24/outline";
import formatAddress from "@hey/helpers/formatAddress";
import type { ReferralNode } from "../types";

interface NodeInspectorProps {
  node: ReferralNode | null;
  isVisible: boolean;
  onClose: () => void;
}

const NodeInspector = ({ node, isVisible, onClose }: NodeInspectorProps) => {
  if (!isVisible || !node) return null;

  const formatStartTime = (timestamp: number) => {
    if (timestamp === 0) return "Not set";
    try {
      return new Date(timestamp * 1000).toLocaleString();
    } catch {
      return "Invalid date";
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-60 bg-white/95 p-2 shadow-xl backdrop-blur-sm sm:w-68 md:w-76 md:p-3 lg:w-84 lg:p-4 xl:w-96 xl:p-6">
      <div className="mb-2 flex items-center justify-between md:mb-3 lg:mb-4 xl:mb-6">
        <h3 className="font-semibold text-gray-900 text-xs sm:text-sm md:text-base lg:text-lg">
          Node Inspector
        </h3>
        <button
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 md:p-1.5 lg:p-2"
          onClick={onClose}
          type="button"
        >
          <XMarkIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 lg:h-4.5 lg:w-4.5 xl:h-5 xl:w-5" />
        </button>
      </div>

      <div className="max-h-[calc(100vh-120px)] space-y-1.5 overflow-y-auto md:space-y-2 lg:space-y-3 xl:space-y-4">
        {/* Player Address */}
        <div className="rounded-lg border border-gray-200 p-1.5 md:p-2 lg:p-3 xl:p-4">
          <div className="mb-1 flex items-center justify-between md:mb-1.5 lg:mb-2">
            <span className="font-medium text-gray-900 text-xs sm:text-xs md:text-sm">
              Player Address
            </span>
            <button
              className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 md:p-1"
              onClick={() => copyToClipboard(node.player)}
              type="button"
            >
              <ClipboardDocumentIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4" />
            </button>
          </div>
          <div className="break-all font-mono text-gray-700 text-xs sm:text-xs md:text-sm">
            {formatAddress(node.player)}
          </div>
        </div>

        {/* Parent Address */}
        <div className="rounded-lg border border-gray-200 p-1.5 md:p-2 lg:p-3 xl:p-4">
          <div className="mb-1 flex items-center justify-between md:mb-1.5 lg:mb-2">
            <span className="font-medium text-gray-900 text-xs sm:text-xs md:text-sm">
              Parent Address
            </span>
            {node.parent !== "0x0000000000000000000000000000000000000000" && (
              <button
                className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 md:p-1"
                onClick={() => copyToClipboard(node.parent)}
                type="button"
              >
                <ClipboardDocumentIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4" />
              </button>
            )}
          </div>
          <div className="break-all font-mono text-gray-700 text-xs sm:text-xs md:text-sm">
            {node.parent === "0x0000000000000000000000000000000000000000" ? (
              <span className="text-gray-400">None</span>
            ) : (
              formatAddress(node.parent)
            )}
          </div>
        </div>

        {/* Left Child */}
        <div className="rounded-lg border border-gray-200 p-1.5 md:p-2 lg:p-3 xl:p-4">
          <div className="mb-1 flex items-center justify-between md:mb-1.5 lg:mb-2">
            <span className="font-medium text-gray-900 text-xs sm:text-xs md:text-sm">
              Left Child
            </span>
            {node.leftChild !==
              "0x0000000000000000000000000000000000000000" && (
              <button
                className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 md:p-1"
                onClick={() => copyToClipboard(node.leftChild)}
                type="button"
              >
                <ClipboardDocumentIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4" />
              </button>
            )}
          </div>
          <div className="break-all font-mono text-gray-700 text-xs sm:text-xs md:text-sm">
            {node.leftChild === "0x0000000000000000000000000000000000000000" ? (
              <span className="text-gray-400">None</span>
            ) : (
              formatAddress(node.leftChild)
            )}
          </div>
        </div>

        {/* Right Child */}
        <div className="rounded-lg border border-gray-200 p-1.5 md:p-2 lg:p-3 xl:p-4">
          <div className="mb-1 flex items-center justify-between md:mb-1.5 lg:mb-2">
            <span className="font-medium text-gray-900 text-xs sm:text-xs md:text-sm">
              Right Child
            </span>
            {node.rightChild !==
              "0x0000000000000000000000000000000000000000" && (
              <button
                className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 md:p-1"
                onClick={() => copyToClipboard(node.rightChild)}
                type="button"
              >
                <ClipboardDocumentIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4" />
              </button>
            )}
          </div>
          <div className="break-all font-mono text-gray-700 text-xs sm:text-xs md:text-sm">
            {node.rightChild ===
            "0x0000000000000000000000000000000000000000" ? (
              <span className="text-gray-400">None</span>
            ) : (
              formatAddress(node.rightChild)
            )}
          </div>
        </div>

        {/* Balance */}
        <div className="rounded-lg border border-gray-200 p-1.5 md:p-2 lg:p-3 xl:p-4">
          <div className="mb-1 md:mb-1.5 lg:mb-2">
            <span className="font-medium text-gray-900 text-xs sm:text-xs md:text-sm">
              Balance
            </span>
          </div>
          <div className="font-mono text-gray-700 text-xs sm:text-xs md:text-sm">
            {Number(node.balance).toFixed(4)} USDT
          </div>
        </div>

        {/* Points */}
        <div className="rounded-lg border border-gray-200 p-1.5 md:p-2 lg:p-3 xl:p-4">
          <div className="mb-1 md:mb-1.5 lg:mb-2">
            <span className="font-medium text-gray-900 text-xs sm:text-xs md:text-sm">
              Points
            </span>
          </div>
          <div className="font-mono text-gray-700 text-xs sm:text-xs md:text-sm">
            {node.point}
          </div>
        </div>

        {/* Depth */}
        <div className="rounded-lg border border-gray-200 p-1.5 md:p-2 lg:p-3 xl:p-4">
          <div className="mb-1 md:mb-1.5 lg:mb-2">
            <span className="font-medium text-gray-900 text-xs sm:text-xs md:text-sm">
              Depth
            </span>
          </div>
          <div className="font-mono text-gray-700 text-xs sm:text-xs md:text-sm">
            {node.depth}
          </div>
        </div>

        {/* Start Time - Ensured to be visible */}
        <div className="rounded-lg border border-gray-200 p-1.5 md:p-2 lg:p-3 xl:p-4">
          <div className="mb-1 md:mb-1.5 lg:mb-2">
            <span className="font-medium text-gray-900 text-xs sm:text-xs md:text-sm">
              Start Time
            </span>
          </div>
          <div className="font-mono text-gray-700 text-xs sm:text-xs md:text-sm">
            {formatStartTime(node.startTime)}
          </div>
        </div>

        {/* Point Changed */}
        <div className="rounded-lg border border-gray-200 p-1.5 md:p-2 lg:p-3 xl:p-4">
          <div className="mb-1 md:mb-1.5 lg:mb-2">
            <span className="font-medium text-gray-900 text-xs sm:text-xs md:text-sm">
              Point Changed
            </span>
          </div>
          <div className="font-mono text-gray-700 text-xs sm:text-xs md:text-sm">
            {node.isPointChanged ? "Yes" : "No"}
          </div>
        </div>

        {/* Unbalanced Allowance */}
        <div className="rounded-lg border border-gray-200 p-1.5 md:p-2 lg:p-3 xl:p-4">
          <div className="mb-1 md:mb-1.5 lg:mb-2">
            <span className="font-medium text-gray-900 text-xs sm:text-xs md:text-sm">
              Unbalanced Allowance
            </span>
          </div>
          <div className="font-mono text-gray-700 text-xs sm:text-xs md:text-sm">
            {node.unbalancedAllowance ? "Yes" : "No"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeInspector;
