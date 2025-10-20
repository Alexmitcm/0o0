import { Button } from "@headlessui/react";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  CircleStackIcon,
  CogIcon,
  ExclamationTriangleIcon,
  ServerIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import { useEffect, useId, useState } from "react";
import Card from "../../Shared/UI/Card";
import DatabaseExport from "../DatabaseExport";

interface ProgressBarProps {
  value: number;
  color: string;
  label: string;
}

const ProgressBar = ({ value, color, label }: ProgressBarProps) => {
  const clampedValue = Math.min(100, Math.max(0, Math.round(value)));
  const colorClass =
    color === "red"
      ? "bg-red-500"
      : color === "blue"
        ? "bg-blue-500"
        : color === "green"
          ? "bg-green-500"
          : "bg-gray-500";

  return (
    <progress
      aria-label={`${label}: ${clampedValue}%`}
      className={`mt-2 h-2 w-full ${colorClass}`}
      max={100}
      value={clampedValue}
    />
  );
};

interface SystemStatus {
  database?: "connected" | "disconnected" | string;
  blockchain?: "connected" | "disconnected" | string;
  websocket?: "connected" | "disconnected" | string;
  redis?: "connected" | "disconnected" | string;
  lastBackup?: string;
  diskUsage?: number;
  memoryUsage?: number;
  cpuUsage?: number;
  system?: {
    cpu?: { user: number; system: number };
    memory?: { used: number; total: number };
  };
}

interface SystemAction {
  id: string;
  action: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt: string;
  completedAt?: string;
  result?: string;
}

const SystemManagementPanel = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [systemActions, setSystemActions] = useState<SystemAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeType, setPurgeType] = useState("");
  const [showDatabaseExport, setShowDatabaseExport] = useState(false);
  const baseApi =
    (import.meta as any).env?.VITE_API_URL || "http://localhost:8080";
  const purgeSelectId = useId();

  // Fetch system status and actions
  const fetchSystemData = async () => {
    try {
      // Fetch system health status from public endpoint
      const statusResponse = await fetch(
        `${baseApi}/admin-features/system-health`,
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setSystemStatus(statusData.data || {});
      }

      // For now, use mock system actions since there's no public endpoint
      const mockActions: SystemAction[] = [
        {
          action: "Reset Daily Points",
          completedAt: undefined,
          id: "1",
          result: undefined,
          startedAt: new Date().toISOString(),
          status: "completed"
        },
        {
          action: "Clear Cache",
          completedAt: undefined,
          id: "2",
          result: undefined,
          startedAt: new Date().toISOString(),
          status: "completed"
        },
        {
          action: "Backup Database",
          completedAt: undefined,
          id: "3",
          result: undefined,
          startedAt: new Date().toISOString(),
          status: "running"
        },
        {
          action: "Restart Services",
          completedAt: undefined,
          id: "4",
          result: undefined,
          startedAt: new Date().toISOString(),
          status: "pending"
        }
      ];
      setSystemActions(mockActions);
    } catch (error) {
      console.error("Error fetching system data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchSystemData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle system actions
  const handleSystemAction = async (action: string) => {
    if (action === "backup") {
      setShowDatabaseExport(true);
      return;
    }

    try {
      // For now, just show a message that this feature requires admin authentication
      alert(
        `System action "${action}" requires admin authentication. This will be implemented when proper admin endpoints are available.`
      );

      // TODO: Implement proper system actions when admin endpoints are available
      console.log("System action requested:", action);
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
    }
  };

  // Handle purge action
  const handlePurge = async () => {
    if (!purgeType) return;

    try {
      // For now, just show a message that this feature requires admin authentication
      alert(
        `System purge "${purgeType}" requires admin authentication. This will be implemented when proper admin endpoints are available.`
      );

      // TODO: Implement proper system purge when admin endpoints are available
      console.log("System purge requested:", purgeType);

      // Reset form
      setShowPurgeModal(false);
      setPurgeType("");
    } catch (error) {
      console.error("Error performing purge:", error);
    }
  };

  // Get status icon and color
  const getStatusDisplay = (status: string) => {
    const isConnected = status === "connected";
    return {
      bgColor: isConnected
        ? "bg-green-100 dark:bg-green-900"
        : "bg-red-100 dark:bg-red-900",
      color: isConnected ? "text-green-600" : "text-red-600",
      icon: isConnected ? CheckCircleIcon : ExclamationTriangleIcon
    };
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-2xl text-gray-900 dark:text-white">
          System Management
        </h2>
        <Button
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={() => fetchSystemData()}
        >
          <ArrowPathIcon className="h-5 w-5" />
          Refresh
        </Button>
      </div>

      {/* System Status */}
      {systemStatus && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <CircleStackIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <div className="font-medium text-gray-500 text-sm dark:text-gray-400">
                    Database
                  </div>
                  <div
                    className={`font-semibold text-lg ${getStatusDisplay(systemStatus.database || "unknown").color}`}
                  >
                    {systemStatus.database || "Unknown"}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <ServerIcon className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <div className="font-medium text-gray-500 text-sm dark:text-gray-400">
                    Blockchain
                  </div>
                  <div
                    className={`font-semibold text-lg ${getStatusDisplay("connected").color}`}
                  >
                    Connected
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <CogIcon className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <div className="font-medium text-gray-500 text-sm dark:text-gray-400">
                    WebSocket
                  </div>
                  <div
                    className={`font-semibold text-lg ${getStatusDisplay("connected").color}`}
                  >
                    Connected
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <CogIcon className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <div className="font-medium text-gray-500 text-sm dark:text-gray-400">
                    Redis
                  </div>
                  <div
                    className={`font-semibold text-lg ${getStatusDisplay(systemStatus.redis || "healthy").color}`}
                  >
                    {systemStatus.redis || "Healthy"}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* System Resources */}
      {systemStatus && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <div className="p-4">
              <div className="mb-2 font-medium text-gray-500 text-sm dark:text-gray-400">
                CPU Usage
              </div>
              <div className="font-bold text-2xl text-gray-900 dark:text-white">
                {systemStatus.system?.cpu
                  ? Math.round(
                      (systemStatus.system.cpu.user +
                        systemStatus.system.cpu.system) /
                        1000
                    )
                  : 0}
                %
              </div>
              <ProgressBar
                color="red"
                label="CPU Usage"
                value={
                  systemStatus.system?.cpu
                    ? Math.round(
                        (systemStatus.system.cpu.user +
                          systemStatus.system.cpu.system) /
                          1000
                      )
                    : 0
                }
              />
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="mb-2 font-medium text-gray-500 text-sm dark:text-gray-400">
                Memory Usage
              </div>
              <div className="font-bold text-2xl text-gray-900 dark:text-white">
                {systemStatus.system?.memory
                  ? Math.round(
                      (systemStatus.system.memory.used /
                        systemStatus.system.memory.total) *
                        100
                    )
                  : 0}
                %
              </div>
              <ProgressBar
                color="blue"
                label="Memory Usage"
                value={
                  systemStatus.system?.memory
                    ? Math.round(
                        (systemStatus.system.memory.used /
                          systemStatus.system.memory.total) *
                          100
                      )
                    : 0
                }
              />
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="mb-2 font-medium text-gray-500 text-sm dark:text-gray-400">
                Disk Usage
              </div>
              <div className="font-bold text-2xl text-gray-900 dark:text-white">
                75%
              </div>
              <ProgressBar color="green" label="Disk Usage" value={75} />
            </div>
          </Card>
        </div>
      )}

      {/* System Actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <div className="p-6">
            <h3 className="mb-4 font-semibold text-gray-900 text-lg dark:text-white">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Button
                className="flex w-full items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                onClick={() => handleSystemAction("backup")}
              >
                <CircleStackIcon className="h-5 w-5" />
                Create Backup
              </Button>

              <Button
                className="flex w-full items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                onClick={() => handleSystemAction("reset-daily-points")}
              >
                <ArrowPathIcon className="h-5 w-5" />
                Reset Daily Points
              </Button>

              <Button
                className="flex w-full items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                onClick={() => setShowPurgeModal(true)}
              >
                <TrashIcon className="h-5 w-5" />
                System Purge
              </Button>

              <Button
                className="flex w-full items-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700"
                onClick={() => handleSystemAction("clear-cache")}
              >
                <CogIcon className="h-5 w-5" />
                Clear Cache
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="mb-4 font-semibold text-gray-900 text-lg dark:text-white">
              System Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Last Backup:
                </span>
                <span className="text-gray-900 dark:text-white">
                  {systemStatus?.lastBackup
                    ? new Date(systemStatus.lastBackup).toLocaleString()
                    : "Never"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Uptime:
                </span>
                <span className="text-gray-900 dark:text-white">24h 15m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Version:
                </span>
                <span className="text-gray-900 dark:text-white">v1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Environment:
                </span>
                <span className="text-gray-900 dark:text-white">
                  Development
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent System Actions */}
      <Card>
        <div className="p-6">
          <h3 className="mb-4 font-semibold text-gray-900 text-lg dark:text-white">
            Recent System Actions
          </h3>

          <div className="space-y-3">
            {systemActions.slice(0, 5).map((action) => (
              <div
                className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700"
                key={action.id}
              >
                <div>
                  <div className="font-medium text-gray-900 text-sm dark:text-white">
                    {action.action}
                  </div>
                  <div className="text-gray-500 text-xs dark:text-gray-400">
                    Started: {new Date(action.startedAt).toLocaleString()}
                  </div>
                </div>
                <span
                  className={`inline-flex rounded-full px-2 py-1 font-semibold text-xs ${
                    action.status === "completed"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : action.status === "failed"
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : action.status === "running"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                  }`}
                >
                  {action.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Purge Modal */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h3 className="mb-4 font-semibold text-gray-900 text-lg dark:text-white">
                System Purge
              </h3>

              <div className="space-y-4">
                <div>
                  <label
                    className="mb-2 block font-medium text-gray-700 text-sm dark:text-gray-300"
                    htmlFor={purgeSelectId}
                  >
                    Select Purge Type
                  </label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    id={purgeSelectId}
                    onChange={(e) => setPurgeType(e.target.value)}
                    value={purgeType}
                  >
                    <option value="">Select purge type...</option>
                    <option value="expired-sessions">Expired Sessions</option>
                    <option value="old-logs">Old Logs</option>
                    <option value="temp-files">Temporary Files</option>
                    <option value="cache">Cache Data</option>
                    <option value="all">All (Dangerous)</option>
                  </select>
                </div>

                <div className="text-red-600 text-sm dark:text-red-400">
                  ⚠️ Warning: This action cannot be undone!
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <Button
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:bg-gray-400"
                  disabled={!purgeType}
                  onClick={handlePurge}
                >
                  Purge
                </Button>
                <Button
                  className="flex-1 rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
                  onClick={() => setShowPurgeModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Database Export Modal */}
      {showDatabaseExport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto">
            <Card className="relative">
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 text-lg dark:text-white">
                    Database Export
                  </h3>
                  <Button
                    className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
                    onClick={() => setShowDatabaseExport(false)}
                  >
                    ✕
                  </Button>
                </div>
                <DatabaseExport />
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemManagementPanel;
