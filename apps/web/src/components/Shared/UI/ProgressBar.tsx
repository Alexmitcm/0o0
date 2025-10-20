import cn from "@/helpers/cn";

interface ProgressBarProps {
  progress: number; // 0-100
  size?: "sm" | "md" | "lg";
  color?: "blue" | "green" | "purple" | "orange" | "red";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const ProgressBar = ({
  progress,
  size = "md",
  color = "blue",
  showLabel = false,
  label,
  className = ""
}: ProgressBarProps) => {
  const sizeClasses = {
    lg: "h-4",
    md: "h-3",
    sm: "h-2"
  };

  const colorClasses = {
    blue: "bg-gradient-to-r from-blue-500 to-blue-600",
    green: "bg-gradient-to-r from-green-500 to-green-600",
    orange: "bg-gradient-to-r from-orange-500 to-orange-600",
    purple: "bg-gradient-to-r from-purple-500 to-purple-600",
    red: "bg-gradient-to-r from-red-500 to-red-600"
  };

  const shadowClasses = {
    blue: "shadow-blue-500/30",
    green: "shadow-green-500/30",
    orange: "shadow-orange-500/30",
    purple: "shadow-purple-500/30",
    red: "shadow-red-500/30"
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="mb-2 flex items-center justify-between">
          <span className="font-medium text-gray-300 text-sm">
            {label || "Progress"}
          </span>
          <span className="text-gray-400 text-sm">{Math.round(progress)}%</span>
        </div>
      )}
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-gray-700/50",
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            "progress-bar-fill h-full rounded-full shadow-lg transition-all duration-1000 ease-out",
            colorClasses[color],
            shadowClasses[color]
          )}
          data-progress={progress}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
