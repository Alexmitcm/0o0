import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

interface ControlPanelProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  showRawData: boolean;
  onToggleRawData: () => void;
}

const ControlPanel = ({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetView,
  showRawData,
  onToggleRawData
}: ControlPanelProps) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white">
        <button
          className="rounded-l-lg px-3 py-1.5 text-sm hover:bg-gray-50"
          onClick={onZoomOut}
          title="Zoom Out"
          type="button"
        >
          -
        </button>
        <span className="px-2 text-gray-600 text-sm">
          {Math.round(zoomLevel * 100)}%
        </span>
        <button
          className="rounded-r-lg px-3 py-1.5 text-sm hover:bg-gray-50"
          onClick={onZoomIn}
          title="Zoom In"
          type="button"
        >
          +
        </button>
      </div>
      <button
        className="rounded-lg bg-gray-100 px-3 py-1.5 font-medium text-gray-700 text-sm hover:bg-gray-200"
        onClick={onResetView}
        title="Reset View"
        type="button"
      >
        Reset
      </button>
      <button
        className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 font-medium text-gray-700 text-sm hover:bg-gray-200"
        onClick={onToggleRawData}
        type="button"
      >
        {showRawData ? (
          <>
            <EyeSlashIcon className="h-4 w-4" />
            Hide Data
          </>
        ) : (
          <>
            <EyeIcon className="h-4 w-4" />
            Show Data
          </>
        )}
      </button>
    </div>
  );
};

export default ControlPanel;
