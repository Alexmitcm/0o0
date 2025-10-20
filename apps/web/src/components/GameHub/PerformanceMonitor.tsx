import { useEffect, useState } from "react";

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  gameCount: number;
  errorCount: number;
}

interface PerformanceMonitorProps {
  gameCount: number;
  errorCount: number;
  className?: string;
}

const PerformanceMonitor = ({
  gameCount,
  errorCount,
  className = ""
}: PerformanceMonitorProps) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    errorCount: 0,
    gameCount: 0,
    loadTime: 0,
    memoryUsage: 0,
    renderTime: 0
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const startTime = performance.now();

    // Measure load time
    const measureLoadTime = () => {
      const loadTime = performance.now() - startTime;
      setMetrics((prev) => ({ ...prev, errorCount, gameCount, loadTime }));
    };

    // Measure memory usage
    const measureMemory = () => {
      if ("memory" in performance) {
        const memory = (performance as { memory?: { usedJSHeapSize: number } }).memory;
        if (memory) {
          setMetrics((prev) => ({
            ...prev,
            memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // MB
          }));
        }
      }
    };

    // Measure render time
    const measureRenderTime = () => {
      const renderTime = performance.now() - startTime;
      setMetrics((prev) => ({ ...prev, renderTime }));
    };

    // Initial measurements
    measureLoadTime();
    measureMemory();

    // Measure render time after component mounts
    requestAnimationFrame(() => {
      measureRenderTime();
    });

    // Update memory usage periodically
    const interval = setInterval(measureMemory, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [gameCount, errorCount]);

  // Toggle visibility with Ctrl+Shift+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "P") {
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isVisible) return null;

  const getPerformanceStatus = () => {
    if (metrics.loadTime < 1000 && metrics.memoryUsage < 50) {
      return { color: "text-green-400", status: "Excellent" };
    }
    if (metrics.loadTime < 2000 && metrics.memoryUsage < 100) {
      return { color: "text-yellow-400", status: "Good" };
    }
    return { color: "text-red-400", status: "Needs Optimization" };
  };

  const status = getPerformanceStatus();

  return (
    <div
      className={`fixed right-4 bottom-4 z-50 rounded-lg border border-white/10 bg-gray-900 p-4 shadow-lg ${className}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold text-sm text-white">
          Performance Monitor
        </h3>
        <button
          className="text-gray-400 hover:text-white"
          onClick={() => setIsVisible(false)}
          type="button"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-400">Load Time:</span>
          <span className="text-white">{metrics.loadTime.toFixed(0)}ms</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Render Time:</span>
          <span className="text-white">{metrics.renderTime.toFixed(0)}ms</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Memory:</span>
          <span className="text-white">{metrics.memoryUsage.toFixed(1)}MB</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Games:</span>
          <span className="text-white">{metrics.gameCount}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Errors:</span>
          <span className="text-white">{metrics.errorCount}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Status:</span>
          <span className={status.color}>{status.status}</span>
        </div>
      </div>

      <div className="mt-3 text-center">
        <p className="text-gray-500 text-xs">Press Ctrl+Shift+P to toggle</p>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
