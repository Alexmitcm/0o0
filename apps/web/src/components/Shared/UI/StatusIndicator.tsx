import cn from "@/helpers/cn";

interface StatusIndicatorProps {
  status: "success" | "warning" | "error" | "info" | "loading";
  size?: "sm" | "md" | "lg";
  className?: string;
  pulse?: boolean;
}

const StatusIndicator = ({
  status,
  size = "md",
  className = "",
  pulse = true
}: StatusIndicatorProps) => {
  const sizeClasses = {
    lg: "h-4 w-4",
    md: "h-3 w-3",
    sm: "h-2 w-2"
  };

  const statusClasses = {
    error: "bg-gradient-to-r from-red-400 to-red-500 shadow-red-400/30",
    info: "bg-gradient-to-r from-blue-400 to-blue-500 shadow-blue-400/30",
    loading:
      "bg-gradient-to-r from-purple-400 to-purple-500 shadow-purple-400/30",
    success: "bg-gradient-to-r from-green-400 to-green-500 shadow-green-400/30",
    warning:
      "bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-yellow-400/30"
  };

  return (
    <div
      className={cn(
        "rounded-full shadow-lg",
        sizeClasses[size],
        statusClasses[status],
        className
      )}
    />
  );
};

export default StatusIndicator;
