/**
 * Performance monitoring dashboard component
 */

import { BarChart3Icon, CpuIcon, DatabaseIcon, ZapIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { performanceService } from "../../services/PerformanceService";

interface PerformanceStats {
  totalMetrics: number;
  averageRenderTime: number;
  averageApiTime: number;
  slowComponents: string[];
  recommendations: string[];
}

const PerformanceDashboard = () => {
  const [stats, setStats] = useState<PerformanceStats>({
    averageApiTime: 0,
    averageRenderTime: 0,
    recommendations: [],
    slowComponents: [],
    totalMetrics: 0
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      const summary = performanceService.getPerformanceSummary();
      setStats(summary);
    };

    // Update stats immediately
    updateStats();

    // Update stats every 5 seconds
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, []);

  const getPerformanceColor = (value: number, threshold: number) => {
    if (value <= threshold) return "text-green-500";
    if (value <= threshold * 1.5) return "text-yellow-500";
    return "text-red-500";
  };

  const getPerformanceScore = () => {
    const renderScore =
      stats.averageRenderTime <= 16
        ? 100
        : Math.max(0, 100 - (stats.averageRenderTime - 16) * 5);
    const apiScore =
      stats.averageApiTime <= 1000
        ? 100
        : Math.max(0, 100 - (stats.averageApiTime - 1000) / 10);
    return Math.round((renderScore + apiScore) / 2);
  };

  const performanceScore = getPerformanceScore();

  if (!isVisible) {
    return (
      <button
        className="fixed right-4 bottom-4 z-50 rounded-full bg-blue-600 p-3 text-white shadow-lg hover:bg-blue-700"
        onClick={() => setIsVisible(true)}
        type="button"
      >
        <BarChart3Icon className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 w-80 rounded-lg bg-white p-4 shadow-xl dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 text-lg dark:text-white">
          Performance Monitor
        </h3>
        <button
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          onClick={() => setIsVisible(false)}
          type="button"
        >
          ×
        </button>
      </div>

      {/* Performance Score */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-medium text-gray-700 text-sm dark:text-gray-300">
            Performance Score
          </span>
          <span
            className={`font-bold text-lg ${getPerformanceColor(100 - performanceScore, 20)}`}
          >
            {performanceScore}/100
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              performanceScore >= 80
                ? "bg-green-500"
                : performanceScore >= 60
                  ? "bg-yellow-500"
                  : "bg-red-500"
            }`}
            style={{ width: `${performanceScore}%` }}
          />
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CpuIcon className="h-4 w-4 text-blue-500" />
            <span className="text-gray-600 text-sm dark:text-gray-400">
              Render Time
            </span>
          </div>
          <span
            className={`font-medium text-sm ${getPerformanceColor(stats.averageRenderTime, 16)}`}
          >
            {stats.averageRenderTime.toFixed(1)}ms
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DatabaseIcon className="h-4 w-4 text-green-500" />
            <span className="text-gray-600 text-sm dark:text-gray-400">
              API Time
            </span>
          </div>
          <span
            className={`font-medium text-sm ${getPerformanceColor(stats.averageApiTime, 1000)}`}
          >
            {stats.averageApiTime.toFixed(0)}ms
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ZapIcon className="h-4 w-4 text-purple-500" />
            <span className="text-gray-600 text-sm dark:text-gray-400">
              Total Metrics
            </span>
          </div>
          <span className="font-medium text-gray-900 text-sm dark:text-white">
            {stats.totalMetrics}
          </span>
        </div>
      </div>

      {/* Slow Components */}
      {stats.slowComponents.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-2 font-medium text-red-600 text-sm dark:text-red-400">
            Slow Components
          </h4>
          <div className="space-y-1">
            {stats.slowComponents.slice(0, 3).map((component, index) => (
              <div
                className="text-gray-600 text-xs dark:text-gray-400"
                key={index}
              >
                • {component}
              </div>
            ))}
            {stats.slowComponents.length > 3 && (
              <div className="text-gray-500 text-xs">
                +{stats.slowComponents.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {stats.recommendations.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-2 font-medium text-blue-600 text-sm dark:text-blue-400">
            Recommendations
          </h4>
          <div className="space-y-1">
            {stats.recommendations.slice(0, 2).map((recommendation, index) => (
              <div
                className="text-gray-600 text-xs dark:text-gray-400"
                key={index}
              >
                • {recommendation}
              </div>
            ))}
            {stats.recommendations.length > 2 && (
              <div className="text-gray-500 text-xs">
                +{stats.recommendations.length - 2} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex space-x-2">
        <button
          className="flex-1 rounded bg-blue-500 px-3 py-1 text-white text-xs hover:bg-blue-600"
          onClick={() => performanceService.clearOldMetrics()}
          type="button"
        >
          Clear Old Data
        </button>
        <button
          className="flex-1 rounded bg-gray-500 px-3 py-1 text-white text-xs hover:bg-gray-600"
          onClick={() => window.location.reload()}
          type="button"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default PerformanceDashboard;

