import { HEY_API_URL } from "@hey/data/constants";
import { useCallback, useEffect, useRef, useState } from "react";
import StatusBanner from "../../Shared/UI/StatusBanner";

interface AdminStats {
  totalUsers: number;
  standardUsers: number;
  onChainUnlinkedUsers: number;
  proLinkedUsers: number;
  totalPremiumWallets: number;
  totalLinkedProfiles: number;
  recentRegistrations: number;
  recentProfileLinks: number;
  adminUsers: {
    total: number;
    active: number;
    byRole: Record<string, number>;
  };
  actions: {
    total: number;
    pending: number;
    completed: number;
    failed: number;
    recent: number;
  };
  features: {
    total: number;
    active: number;
    byCategory: Record<string, number>;
  };
  systemHealth: {
    databaseConnected: boolean;
    blockchainConnected: boolean;
    websocketConnected: boolean;
    lastError?: string;
  };
}

interface AdminAction {
  id: string;
  adminUserId: string;
  adminUsername: string;
  actionType: string;
  targetWallet: string;
  targetProfileId?: string;
  reason: string;
  status: "Pending" | "Completed" | "Failed" | "Cancelled";
  createdAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

interface FeatureInfo {
  id: string;
  featureId: string;
  name: string;
  description: string;
  category: string;
  standardAccess: boolean;
  premiumAccess: boolean;
  adminOverride: boolean;
  isActive: boolean;
  userAccessCount: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentActions, setRecentActions] = useState<AdminAction[]>([]);
  const [_features, setFeatures] = useState<FeatureInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const hasMounted = useRef(false);

  const fetchStats = useCallback(async (retryCount = 0) => {
    try {
      const token =
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken");
      const headers: HeadersInit = {
        "Content-Type": "application/json"
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${HEY_API_URL}/admin/stats`, {
        headers,
        method: "GET"
      });
      if (!response.ok) {
        if (response.status === 429) {
          if (retryCount < 3) {
            // Retry after exponential backoff
            const delay = 2 ** retryCount * 1000;
            setTimeout(() => fetchStats(retryCount + 1), delay);
            return;
          }
          throw new Error("Too many requests. Please wait a moment.");
        }
        throw new Error("Failed to fetch stats");
      }
      const data = await response.json();
      setStats(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch stats");
    }
  }, []);

  const fetchRecentActions = useCallback(async (retryCount = 0) => {
    try {
      const token =
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken");
      const headers: HeadersInit = {
        "Content-Type": "application/json"
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${HEY_API_URL}/admin/actions?limit=10`, {
        headers,
        method: "GET"
      });
      if (!response.ok) {
        if (response.status === 429) {
          if (retryCount < 3) {
            const delay = 2 ** retryCount * 1000;
            setTimeout(() => fetchRecentActions(retryCount + 1), delay);
            return;
          }
          throw new Error("Too many requests. Please wait a moment.");
        }
        throw new Error("Failed to fetch recent actions");
      }
      const data = await response.json();
      setRecentActions(data.data.actions);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Failed to fetch recent actions:", err);
      }
    }
  }, []);

  const fetchFeatures = useCallback(async (retryCount = 0) => {
    try {
      const token =
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken");
      const headers: HeadersInit = {
        "Content-Type": "application/json"
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${HEY_API_URL}/admin/features`, {
        headers,
        method: "GET"
      });
      if (!response.ok) {
        if (response.status === 429) {
          if (retryCount < 3) {
            const delay = 2 ** retryCount * 1000;
            setTimeout(() => fetchFeatures(retryCount + 1), delay);
            return;
          }
          throw new Error("Too many requests. Please wait a moment.");
        }
        throw new Error("Failed to fetch features");
      }
      const data = await response.json();
      setFeatures(data.data);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Failed to fetch features:", err);
      }
    }
  }, []);

  useEffect(() => {
    // Prevent double mounting in React Strict Mode
    if (hasMounted.current) {
      return;
    }
    hasMounted.current = true;

    const loadData = async () => {
      setLoading(true);
      const [statsRes, actionsRes, featuresRes] = await Promise.allSettled([
        fetchStats(),
        fetchRecentActions(),
        fetchFeatures()
      ]);
      
      // Handle each result individually
      if (statsRes.status === 'rejected') {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to load stats:', statsRes.reason);
        }
      }
      if (actionsRes.status === 'rejected') {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to load recent actions:', actionsRes.reason);
        }
      }
      if (featuresRes.status === 'rejected') {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to load features:', featuresRes.reason);
        }
      }
      
      setLoading(false);
    };

    // Add delay to prevent rate limiting
    const timeoutId = setTimeout(loadData, 2000);

    // Set up auto-refresh every 120 seconds (increased to prevent rate limiting)
    const interval = setInterval(loadData, 120000);
    setRefreshInterval(interval);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [fetchStats, fetchRecentActions, fetchFeatures]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20";
      case "Pending":
        return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20";
      case "Failed":
        return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20";
      default:
        return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20";
    }
  };

  const getHealthStatusColor = (isHealthy: boolean) => {
    return isHealthy
      ? "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20"
      : "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20";
  };

  const handleManualRefresh = async () => {
    setLoading(true);
    setError(null);
    const [statsRes, actionsRes, featuresRes] = await Promise.allSettled([
      fetchStats(),
      fetchRecentActions(),
      fetchFeatures()
    ]);
    
    // Handle each result individually
    if (statsRes.status === 'rejected') {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load stats:', statsRes.reason);
      }
    }
    if (actionsRes.status === 'rejected') {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load recent actions:', actionsRes.reason);
      }
    }
    if (featuresRes.status === 'rejected') {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load features:', featuresRes.reason);
      }
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <StatusBanner />
        <div className="flex h-64 items-center justify-center">
          <div className="text-gray-600 text-lg dark:text-gray-400">
            Loading admin dashboard...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <StatusBanner />
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="text-red-800 dark:text-red-200">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatusBanner />

      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-2xl text-gray-900 dark:text-white">
          Admin Dashboard
        </h2>
        <button
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
          onClick={handleManualRefresh}
          type="button"
        >
          {loading ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      {/* System Health Status */}
      {stats?.systemHealth && (
        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 className="mb-4 font-semibold text-gray-900 text-lg dark:text-gray-100">
            System Health
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div
              className={`rounded-lg p-3 ${getHealthStatusColor(stats.systemHealth.databaseConnected)}`}
            >
              <div className="font-medium text-sm">Database</div>
              <div className="text-xs">
                {stats.systemHealth.databaseConnected
                  ? "Connected"
                  : "Disconnected"}
              </div>
            </div>
            <div
              className={`rounded-lg p-3 ${getHealthStatusColor(stats.systemHealth.blockchainConnected)}`}
            >
              <div className="font-medium text-sm">Blockchain</div>
              <div className="text-xs">
                {stats.systemHealth.blockchainConnected
                  ? "Connected"
                  : "Disconnected"}
              </div>
            </div>
            <div
              className={`rounded-lg p-3 ${getHealthStatusColor(stats.systemHealth.websocketConnected)}`}
            >
              <div className="font-medium text-sm">WebSocket</div>
              <div className="text-xs">
                {stats.systemHealth.websocketConnected
                  ? "Connected"
                  : "Disconnected"}
              </div>
            </div>
            <div className="rounded-lg bg-blue-100 p-3 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
              <div className="font-medium text-sm">Last Updated</div>
              <div className="text-xs">{new Date().toLocaleTimeString()}</div>
            </div>
          </div>
          {stats.systemHealth.lastError && (
            <div className="mt-3 rounded-lg bg-red-50 p-3 text-red-800 text-sm dark:bg-red-900/20 dark:text-red-200">
              <strong>Last Error:</strong> {stats.systemHealth.lastError}
            </div>
          )}
        </div>
      )}

      {/* Key Statistics */}
      {stats && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <div className="font-medium text-gray-500 text-sm dark:text-gray-400">
              Total Users
            </div>
            <div className="font-bold text-2xl text-gray-900 dark:text-gray-100">
              {stats.totalUsers.toLocaleString()}
            </div>
            <div className="text-gray-500 text-xs dark:text-gray-400">
              {stats.recentRegistrations} new this week
            </div>
          </div>

          <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <div className="font-medium text-gray-500 text-sm dark:text-gray-400">
              Premium Users
            </div>
            <div className="font-bold text-2xl text-gray-900 dark:text-gray-100">
              {stats.totalPremiumWallets.toLocaleString()}
            </div>
            <div className="text-gray-500 text-xs dark:text-gray-400">
              {stats.proLinkedUsers} profiles linked
            </div>
          </div>

          <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <div className="font-medium text-gray-500 text-sm dark:text-gray-400">
              Admin Actions
            </div>
            <div className="font-bold text-2xl text-gray-900 dark:text-gray-100">
              {stats.actions.total.toLocaleString()}
            </div>
            <div className="text-gray-500 text-xs dark:text-gray-400">
              {stats.actions.pending} pending, {stats.actions.recent} today
            </div>
          </div>

          <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <div className="font-medium text-gray-500 text-sm dark:text-gray-400">
              Active Features
            </div>
            <div className="font-bold text-2xl text-gray-900 dark:text-gray-100">
              {stats.features.active}
            </div>
            <div className="text-gray-500 text-xs dark:text-gray-400">
              {stats.features.total} total features
            </div>
          </div>
        </div>
      )}

      {/* User Status Distribution */}
      {stats && (
        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 className="mb-4 font-semibold text-gray-900 text-lg dark:text-gray-100">
            User Status Distribution
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="font-medium text-blue-800 text-sm dark:text-blue-200">
                Standard
              </div>
              <div className="font-bold text-2xl text-blue-900 dark:text-blue-100">
                {stats.standardUsers.toLocaleString()}
              </div>
              <div className="text-blue-600 text-xs dark:text-blue-300">
                {((stats.standardUsers / stats.totalUsers) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
              <div className="font-medium text-sm text-yellow-800 dark:text-yellow-200">
                On-Chain Unlinked
              </div>
              <div className="font-bold text-2xl text-yellow-900 dark:text-yellow-100">
                {stats.onChainUnlinkedUsers.toLocaleString()}
              </div>
              <div className="text-xs text-yellow-600 dark:text-yellow-300">
                {(
                  (stats.onChainUnlinkedUsers / stats.totalUsers) *
                  100
                ).toFixed(1)}
                %
              </div>
            </div>
            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
              <div className="font-medium text-green-800 text-sm dark:text-green-200">
                Pro Linked
              </div>
              <div className="font-bold text-2xl text-green-900 dark:text-green-100">
                {stats.proLinkedUsers.toLocaleString()}
              </div>
              <div className="text-green-600 text-xs dark:text-green-300">
                {((stats.proLinkedUsers / stats.totalUsers) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
              <div className="font-medium text-purple-800 text-sm dark:text-purple-200">
                Total Premium
              </div>
              <div className="font-bold text-2xl text-purple-900 dark:text-purple-100">
                {stats.totalPremiumWallets.toLocaleString()}
              </div>
              <div className="text-purple-600 text-xs dark:text-purple-300">
                {((stats.totalPremiumWallets / stats.totalUsers) * 100).toFixed(
                  1
                )}
                %
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Actions and Features */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Admin Actions */}
        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 className="mb-4 font-semibold text-gray-900 text-lg dark:text-gray-100">
            Recent Admin Actions
          </h3>
          {recentActions.length > 0 ? (
            <div className="space-y-3">
              {recentActions.slice(0, 5).map((action) => (
                <div
                  className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                  key={action.id}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-900 text-sm dark:text-gray-100">
                      {action.actionType.replace(/([A-Z])/g, " $1").trim()}
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 font-medium text-xs ${getStatusColor(action.status)}`}
                    >
                      {action.status}
                    </span>
                  </div>
                  <div className="mt-1 text-gray-500 text-xs dark:text-gray-400">
                    by {action.adminUsername} •{" "}
                    {new Date(action.createdAt).toLocaleString()}
                  </div>
                  <div className="mt-1 text-gray-600 text-xs dark:text-gray-300">
                    Target: {action.targetWallet.slice(0, 8)}...
                    {action.targetWallet.slice(-6)}
                  </div>
                  {action.errorMessage && (
                    <div className="mt-1 text-red-600 text-xs dark:text-red-400">
                      Error: {action.errorMessage}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm dark:text-gray-400">
              No recent actions
            </div>
          )}
        </div>

        {/* Feature Categories */}
        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 className="mb-4 font-semibold text-gray-900 text-lg dark:text-gray-100">
            Feature Categories
          </h3>
          {stats?.features.byCategory &&
          Object.keys(stats.features.byCategory).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.features.byCategory).map(
                ([category, count]) => (
                  <div
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                    key={category}
                  >
                    <div className="font-medium text-gray-900 text-sm capitalize dark:text-gray-100">
                      {category.replace(/_/g, " ")}
                    </div>
                    <div className="text-gray-500 text-sm dark:text-gray-400">
                      {count} features
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="text-gray-500 text-sm dark:text-gray-400">
              No feature categories
            </div>
          )}
        </div>
      </div>

      {/* Admin Users by Role */}
      {stats?.adminUsers.byRole && (
        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 className="mb-4 font-semibold text-gray-900 text-lg dark:text-gray-100">
            Admin Users by Role
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {Object.entries(stats.adminUsers.byRole).map(([role, count]) => (
              <div
                className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700"
                key={role}
              >
                <div className="font-medium text-gray-800 text-sm capitalize dark:text-gray-200">
                  {role.replace(/([A-Z])/g, " $1").trim()}
                </div>
                <div className="font-bold text-2xl text-gray-900 dark:text-gray-100">
                  {count}
                </div>
                <div className="text-gray-500 text-xs dark:text-gray-400">
                  {((count / stats.adminUsers.total) * 100).toFixed(1)}% of
                  total
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Status Summary */}
      {stats?.actions && (
        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 className="mb-4 font-semibold text-gray-900 text-lg dark:text-gray-100">
            Action Status Summary
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
              <div className="font-medium text-green-800 text-sm dark:text-green-200">
                Completed
              </div>
              <div className="font-bold text-2xl text-green-900 dark:text-green-100">
                {stats.actions.completed.toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
              <div className="font-medium text-sm text-yellow-800 dark:text-yellow-200">
                Pending
              </div>
              <div className="font-bold text-2xl text-yellow-900 dark:text-yellow-100">
                {stats.actions.pending.toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
              <div className="font-medium text-red-800 text-sm dark:text-red-200">
                Failed
              </div>
              <div className="font-bold text-2xl text-red-900 dark:text-red-100">
                {stats.actions.failed.toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="font-medium text-blue-800 text-sm dark:text-blue-200">
                Today
              </div>
              <div className="font-bold text-2xl text-blue-900 dark:text-blue-100">
                {stats.actions.recent.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
