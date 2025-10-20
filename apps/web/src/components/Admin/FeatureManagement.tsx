import { useEffect, useState } from "react";

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

interface AdminUserInfo {
  id: string;
  walletAddress: string;
  email: string;
  username: string;
  displayName?: string;
  role: "SuperAdmin" | "SupportAgent" | "Auditor" | "Moderator";
  permissions: string[];
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
}

const FeatureManagement = () => {
  const [features, setFeatures] = useState<FeatureInfo[]>([]);
  const [adminUser, setAdminUser] = useState<AdminUserInfo | null>(null);
  const [_loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states (only manage access retained)
  const [selectedFeature, setSelectedFeature] = useState<FeatureInfo | null>(
    null
  );
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [targetWallet, setTargetWallet] = useState("");
  const [grantAccess, setGrantAccess] = useState(true);

  // Generate unique IDs for form elements
  const searchInputId = `search-features-${Math.random().toString(36).substr(2, 9)}`;
  const categoryFilterId = `category-filter-${Math.random().toString(36).substr(2, 9)}`;
  const walletAddressId = `wallet-address-${Math.random().toString(36).substr(2, 9)}`;
  const grantAccessId = `grant-access-${Math.random().toString(36).substr(2, 9)}`;
  const revokeAccessId = `revoke-access-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    fetchFeatures();
    fetchAdminUserInfo();
  }, []);

  const fetchFeatures = async () => {
    setLoading(true);
    try {
      // For now, use mock features since there's no public endpoint
      const mockFeatures = [
        {
          adminOverride: true,
          category: "Administration",
          description: "Manage users, ban/unban, view profiles",
          enabled: true,
          id: "1",
          featureId: "user_mgmt",
          isActive: true,
          name: "User Management",
          premiumAccess: false,
          standardAccess: true,
          userAccessCount: 1250
        },
        {
          adminOverride: false,
          category: "Gaming",
          description: "Create and manage tournaments",
          enabled: true,
          id: "2",
          featureId: "tournament",
          isActive: true,
          name: "Tournament System",
          premiumAccess: true,
          standardAccess: false,
          userAccessCount: 890
        },
        {
          adminOverride: false,
          category: "Communication",
          description: "Send notifications to users",
          enabled: true,
          id: "3",
          featureId: "notifications",
          isActive: true,
          name: "Notification System",
          premiumAccess: false,
          standardAccess: true,
          userAccessCount: 2100
        },
        {
          adminOverride: false,
          category: "Economy",
          description: "Manage user coins and transactions",
          enabled: true,
          id: "4",
          featureId: "coins",
          isActive: true,
          name: "Coin System",
          premiumAccess: true,
          standardAccess: false,
          userAccessCount: 3400
        },
        {
          adminOverride: true,
          category: "Analytics",
          description: "View system analytics and reports",
          enabled: true,
          id: "5",
          featureId: "analytics",
          isActive: true,
          name: "Analytics Dashboard",
          premiumAccess: true,
          standardAccess: false,
          userAccessCount: 45
        },
        {
          adminOverride: false,
          category: "Content",
          description: "Manage banners, slides, and content",
          enabled: false,
          id: "6",
          featureId: "content",
          isActive: false,
          name: "Content Management",
          premiumAccess: false,
          standardAccess: false,
          userAccessCount: 0
        }
      ];
      setFeatures(mockFeatures);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch features");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminUserInfo = async () => {
    try {
      // For now, use mock admin user info since there's no public endpoint
      const mockAdminUser: AdminUserInfo = {
        createdAt: new Date(),
        email: "admin@example.com",
        id: "admin-1",
        isActive: true,
        lastLoginAt: new Date(),
        permissions: ["read", "write", "admin"],
        role: "SuperAdmin",
        username: "AdminUser",
        walletAddress: "0x123..."
      };
      setAdminUser(mockAdminUser);
    } catch (err) {
      console.error("Failed to fetch admin user info:", err);
    }
  };

  // Create/Update feature flows removed (no backend endpoints)

  const handleFeatureAccess = async () => {
    if (!adminUser || !selectedFeature || !targetWallet) return;

    setActionLoading(true);
    try {
      // For now, just show a message that this feature requires admin authentication
      alert(
        "Feature access management requires admin authentication. This will be implemented when proper admin endpoints are available."
      );

      // TODO: Implement proper feature access management when admin endpoints are available
      console.log("Feature access requested:", {
        adminWallet: adminUser.walletAddress,
        featureId: selectedFeature.featureId,
        grantAccess,
        targetWallet
      });

      setShowAccessModal(false);
      setTargetWallet("");
      setGrantAccess(true);
      setSelectedFeature(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update feature access"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const hasPermission = (permission: string) => {
    if (!adminUser) return false;
    if (adminUser.role === "SuperAdmin") return true;
    return adminUser.permissions.includes(permission);
  };

  const filteredFeatures = features
    .filter(
      (feature) =>
        feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feature.featureId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feature.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(
      (feature) => !categoryFilter || feature.category === categoryFilter
    );

  const categories = [...new Set(features.map((f) => f.category))];

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20"
      : "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-2xl text-gray-900 dark:text-gray-100">
          Feature Management
        </h2>
        <div className="flex items-center space-x-4">
          <input
            aria-label="Search features"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            id={searchInputId}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search features..."
            type="text"
            value={searchQuery}
          />
          <select
            aria-label="Filter by category"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            id={categoryFilterId}
            onChange={(e) => setCategoryFilter(e.target.value)}
            value={categoryFilter}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="text-red-800 dark:text-red-200">{error}</div>
        </div>
      )}

      {/* Features Table */}
      <div className="rounded-lg bg-white shadow dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/40">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">
                  Feature
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">
                  Category
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">
                  Access Control
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">
                  Users
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {filteredFeatures.map((feature) => (
                <tr
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  key={feature.id}
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900 text-sm dark:text-gray-100">
                        {feature.name}
                      </div>
                      <div className="text-gray-500 text-sm dark:text-gray-400">
                        {feature.featureId}
                      </div>
                      <div className="text-gray-400 text-xs dark:text-gray-500">
                        {feature.description}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-900 text-sm capitalize dark:text-gray-100">
                    {feature.category.replace(/_/g, " ")}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500 text-xs dark:text-gray-400">
                          Standard:
                        </span>
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 font-medium text-xs ${
                            feature.standardAccess
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200"
                          }`}
                        >
                          {feature.standardAccess ? "Yes" : "No"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500 text-xs dark:text-gray-400">
                          Premium:
                        </span>
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 font-medium text-xs ${
                            feature.premiumAccess
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200"
                          }`}
                        >
                          {feature.premiumAccess ? "Yes" : "No"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500 text-xs dark:text-gray-400">
                          Admin Override:
                        </span>
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 font-medium text-xs ${
                            feature.adminOverride
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200"
                          }`}
                        >
                          {feature.adminOverride ? "Yes" : "No"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs ${getStatusColor(feature.isActive)}`}
                    >
                      {feature.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-900 text-sm dark:text-gray-100">
                    {(feature.userAccessCount || 0).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-sm">
                    <div className="flex items-center space-x-2">
                      {hasPermission("feature.manage") && (
                        <button
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          onClick={() => {
                            setSelectedFeature(feature);
                            setShowAccessModal(true);
                          }}
                          type="button"
                        >
                          Manage Access
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Feature UIs removed (no backend endpoints) */}

      {/* Feature Access Modal */}
      {showAccessModal && selectedFeature && (
        <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="relative top-20 mx-auto w-96 rounded-md border bg-white p-5 shadow-lg dark:bg-gray-800">
            <h3 className="mb-4 font-medium text-gray-900 text-lg dark:text-gray-100">
              Manage Access: {selectedFeature.name}
            </h3>

            <div className="space-y-4">
              <div>
                <label
                  className="block font-medium text-gray-700 text-sm dark:text-gray-300"
                  htmlFor={walletAddressId}
                >
                  Wallet Address
                </label>
                <input
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  id={walletAddressId}
                  onChange={(e) => setTargetWallet(e.target.value)}
                  placeholder="Enter wallet address"
                  type="text"
                  value={targetWallet}
                />
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    checked={grantAccess}
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    id={grantAccessId}
                    name="access-type"
                    onChange={() => setGrantAccess(true)}
                    type="radio"
                  />
                  <span className="ml-2 text-gray-900 text-sm dark:text-gray-100">
                    Grant Access
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    checked={!grantAccess}
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    id={revokeAccessId}
                    name="access-type"
                    onChange={() => setGrantAccess(false)}
                    type="radio"
                  />
                  <span className="ml-2 text-gray-900 text-sm dark:text-gray-100">
                    Revoke Access
                  </span>
                </label>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 font-medium text-sm text-white hover:bg-green-700 disabled:opacity-50"
                  disabled={actionLoading || !targetWallet}
                  onClick={handleFeatureAccess}
                  type="button"
                >
                  {actionLoading ? "Processing..." : "Update Access"}
                </button>
                <button
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  onClick={() => {
                    setShowAccessModal(false);
                    setTargetWallet("");
                    setGrantAccess(true);
                    setSelectedFeature(null);
                  }}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureManagement;
