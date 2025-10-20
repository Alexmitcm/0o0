import type { ReactNode } from "react";
import cn from "@/helpers/cn";
import StatusIndicator from "./StatusIndicator";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  status?: "success" | "warning" | "error" | "info";
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

const MetricCard = ({
  title,
  value,
  subtitle,
  status,
  icon,
  trend,
  className = ""
}: MetricCardProps) => {
  const trendColors = {
    down: "text-red-400",
    neutral: "text-gray-400",
    up: "text-green-400"
  };

  const trendIcons = {
    down: "↘",
    neutral: "→",
    up: "↗"
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-600/50 bg-gradient-to-br from-gray-800/90 to-gray-900/90 p-6 shadow-xl ring-1 ring-white/5 backdrop-blur-sm transition-all duration-300",
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          {status && <StatusIndicator size="sm" status={status} />}
          <h3 className="font-medium text-gray-300 text-sm">{title}</h3>
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-2xl text-gray-100">{value}</span>
          {trend && (
            <span className={cn("font-medium text-sm", trendColors[trend])}>
              {trendIcons[trend]}
            </span>
          )}
        </div>
        {subtitle && <p className="text-gray-400 text-sm">{subtitle}</p>}
      </div>
    </div>
  );
};

export default MetricCard;
