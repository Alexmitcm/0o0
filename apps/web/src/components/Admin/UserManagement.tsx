import { HEY_API_URL } from "@hey/data/constants";
import { useEffect, useState } from "react";

interface AdminUser {
  walletAddress: string;
  userStatus: "Standard" | "OnChainUnlinked" | "ProLinked";
  isPremiumOnChain: boolean;
  hasLinkedProfile: boolean;
  linkedProfile?: {
    profileId: string;
    handle: string;
    linkedAt: Date;
  };
  registrationDate: Date;
  referrerAddress?: string;
  registrationTxHash?: string;
  premiumUpgradedAt?: Date;
  lastActiveAt: Date;
  totalLogins: number;
  availableFeatures: string[];
  adminNotes?: string;
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

const UserManagement = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUserInfo | null>(null);
  const [features, setFeatures] = useState<FeatureInfo[]>([]);
  const [_loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Action form states
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<string>("");
  const [actionReason, setActionReason] = useState("");
  const [actionProfileId, setActionProfileId] = useState("");
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [isPrivateNote, setIsPrivateNote] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<string>("");
  const [grantFeatureAccess, setGrantFeatureAccess] = useState(true);

  useEffect(() => {
    fetchUsers();
    fetchAdminUserInfo();
    fetchFeatures();
  }, [page, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: "20",
        page: page.toString()
      });
      if (statusFilter) params.append("status", statusFilter);

      const response = await fetch(`${HEY_API_URL}/admin/users?${params}`);
      if (!response.ok) throw new Error("Failed to fetch users");

      const data = await response.json();
      setUsers(data.data.users);
      setTotalPages(Math.ceil(data.data.total / 20));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminUserInfo = async () => {
    try {
      // This would typically come from the current admin's session
      const adminWallet = "0x123..."; // Placeholder
      const response = await fetch(
        `${HEY_API_URL}/admin/admin-user?walletAddress=${adminWallet}`
      );
      if (response.ok) {
        const data = await response.json();
        setAdminUser(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch admin user info:", err);
    }
  };

  const fetchFeatures = async () => {
    try {
      const response = await fetch(`${HEY_API_URL}/admin/features`);
      if (response.ok) {
        const data = await response.json();
        setFeatures(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch features:", err);
    }
  };

  const handleAction = async () => {
    if (!selectedUser || !adminUser || !actionReason) return;

    setActionLoading(true);
    try {
      const payload = {
        adminWalletAddress: adminUser.walletAddress,
        reason: actionReason,
        targetWallet: selectedUser.walletAddress
      };

      let endpoint = "";
      switch (actionType) {
        case "force-unlink":
          endpoint = "/admin/force-unlink-profile";
          break;
        case "grant-premium":
          endpoint = "/admin/grant-premium";
          break;
        case "force-link":
          if (!actionProfileId) throw new Error("Profile ID is required");
          endpoint = "/admin/force-link-profile";
          Object.assign(payload, { profileId: actionProfileId });
          break;
        default:
          throw new Error("Invalid action type");
      }

      const response = await fetch(`${HEY_API_URL}${endpoint}`, {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });

      if (!response.ok) throw new Error("Action failed");

      setShowActionModal(false);
      setActionType("");
      setActionReason("");
      setActionProfileId("");
      fetchUsers(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedUser || !adminUser || !noteText) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${HEY_API_URL}/admin/add-note`, {
        body: JSON.stringify({
          adminWalletAddress: adminUser.walletAddress,
          isPrivate: isPrivateNote,
          note: noteText,
          targetWallet: selectedUser.walletAddress
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });

      if (!response.ok) throw new Error("Failed to add note");

      setShowNoteModal(false);
      setNoteText("");
      setIsPrivateNote(false);
      fetchUsers(); // Refresh to get updated notes
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add note");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFeatureAccess = async () => {
    if (!selectedUser || !adminUser || !selectedFeature) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${HEY_API_URL}/admin/features/access`, {
        body: JSON.stringify({
          adminWalletAddress: adminUser.walletAddress,
          featureId: selectedFeature,
          grantAccess: grantFeatureAccess,
          reason: `Feature access ${grantFeatureAccess ? "granted" : "revoked"} by admin`,
          targetWallet: selectedUser.walletAddress
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });

      if (!response.ok) throw new Error("Failed to update feature access");

      setShowFeatureModal(false);
      setSelectedFeature("");
      setGrantFeatureAccess(true);
      fetchUsers(); // Refresh to get updated features
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update feature access"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ProLinked":
        return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20";
      case "OnChainUnlinked":
        return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20";
      case "Standard":
        return "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20";
      default:
        return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20";
    }
  };

  const hasPermission = (permission: string) => {
    if (!adminUser) return false;
    if (adminUser.role === "SuperAdmin") return true;
    return adminUser.permissions.includes(permission);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.walletAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.linkedProfile?.profileId
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-2xl text-gray-900 dark:text-gray-100">
          User Management
        </h2>
        <div className="flex items-center space-x-4">
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            type="text"
            value={searchQuery}
          />
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            onChange={(e) => setStatusFilter(e.target.value)}
            value={statusFilter}
          >
            <option value="">All Status</option>
            <option value="Standard">Standard</option>
            <option value="OnChainUnlinked">On-Chain Unlinked</option>
            <option value="ProLinked">Pro Linked</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="text-red-800 dark:text-red-200">{error}</div>
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-lg bg-white shadow dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/40">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">
                  Wallet Address
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">
                  Profile
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">
                  Registration
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">
                  Last Active
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {filteredUsers.map((user) => (
                <tr
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  key={user.walletAddress}
                >
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900 text-sm dark:text-gray-100">
                    <div className="flex items-center space-x-2">
                      <span>
                        {user.walletAddress.slice(0, 8)}...
                        {user.walletAddress.slice(-6)}
                      </span>
                      {user.isPremiumOnChain && (
                        <span className="inline-flex items-center rounded bg-purple-100 px-2 py-0.5 font-medium text-purple-800 text-xs dark:bg-purple-900/20 dark:text-purple-200">
                          Premium
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs ${getStatusColor(user.userStatus)}`}
                    >
                      {user.userStatus}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-900 text-sm dark:text-gray-100">
                    {user.linkedProfile ? (
                      <div>
                        <div className="font-medium">
                          {user.linkedProfile.profileId}
                        </div>
                        <div className="text-gray-500 text-xs dark:text-gray-400">
                          {new Date(
                            user.linkedProfile.linkedAt
                          ).toLocaleDateString()}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">
                        Not linked
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-900 text-sm dark:text-gray-100">
                    {new Date(user.registrationDate).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-900 text-sm dark:text-gray-100">
                    {new Date(user.lastActiveAt).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-sm">
                    <div className="flex items-center space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        onClick={() => setSelectedUser(user)}
                      >
                        View
                      </button>
                      {hasPermission("user.force_unlink") &&
                        user.hasLinkedProfile && (
                          <button
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            onClick={() => {
                              setSelectedUser(user);
                              setActionType("force-unlink");
                              setShowActionModal(true);
                            }}
                          >
                            Unlink
                          </button>
                        )}
                      {hasPermission("user.force_link") &&
                        !user.hasLinkedProfile && (
                          <button
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            onClick={() => {
                              setSelectedUser(user);
                              setActionType("force-link");
                              setShowActionModal(true);
                            }}
                          >
                            Link
                          </button>
                        )}
                      {hasPermission("user.grant_premium") &&
                        !user.isPremiumOnChain && (
                          <button
                            className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                            onClick={() => {
                              setSelectedUser(user);
                              setActionType("grant-premium");
                              setShowActionModal(true);
                            }}
                          >
                            Grant Premium
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-gray-200 border-t bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
              disabled={page === 1}
              onClick={() => setPage(Math.max(1, page - 1))}
            >
              Previous
            </button>
            <button
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
              disabled={page === totalPages}
              onClick={() => setPage(Math.min(totalPages, page + 1))}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-gray-700 text-sm dark:text-gray-300">
                Page <span className="font-medium">{page}</span> of{" "}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="-space-x-px relative z-0 inline-flex rounded-md shadow-sm">
                <button
                  className="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 font-medium text-gray-500 text-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  disabled={page === 1}
                  onClick={() => setPage(Math.max(1, page - 1))}
                >
                  Previous
                </button>
                <button
                  className="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 font-medium text-gray-500 text-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  disabled={page === totalPages}
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="relative top-20 mx-auto w-11/12 rounded-md border bg-white p-5 shadow-lg md:w-3/4 lg:w-1/2 dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="mb-4 font-medium text-gray-900 text-lg dark:text-gray-100">
                User Details: {selectedUser.walletAddress.slice(0, 8)}...
                {selectedUser.walletAddress.slice(-6)}
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-gray-700 text-sm dark:text-gray-300">
                      Status
                    </label>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs ${getStatusColor(selectedUser.userStatus)}`}
                    >
                      {selectedUser.userStatus}
                    </span>
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 text-sm dark:text-gray-300">
                      Premium On-Chain
                    </label>
                    <span className="text-gray-900 text-sm dark:text-gray-100">
                      {selectedUser.isPremiumOnChain ? "Yes" : "No"}
                    </span>
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 text-sm dark:text-gray-300">
                      Registration Date
                    </label>
                    <span className="text-gray-900 text-sm dark:text-gray-100">
                      {new Date(
                        selectedUser.registrationDate
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 text-sm dark:text-gray-300">
                      Last Active
                    </label>
                    <span className="text-gray-900 text-sm dark:text-gray-100">
                      {new Date(selectedUser.lastActiveAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {selectedUser.linkedProfile && (
                  <div>
                    <label className="block font-medium text-gray-700 text-sm dark:text-gray-300">
                      Linked Profile ID
                    </label>
                    <div className="text-gray-900 text-sm dark:text-gray-100">
                      <div>
                        Profile ID: {selectedUser.linkedProfile.profileId}
                      </div>
                      <div>
                        Linked:{" "}
                        {new Date(
                          selectedUser.linkedProfile.linkedAt
                        ).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}

                {selectedUser.adminNotes && (
                  <div>
                    <label className="block font-medium text-gray-700 text-sm dark:text-gray-300">
                      Admin Notes
                    </label>
                    <div className="whitespace-pre-wrap text-gray-900 text-sm dark:text-gray-100">
                      {selectedUser.adminNotes}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-medium text-gray-700 text-sm dark:text-gray-300">
                    Available Features
                  </label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedUser.availableFeatures.map((feature) => (
                      <span
                        className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 font-medium text-green-800 text-xs dark:bg-green-900/20 dark:text-green-200"
                        key={feature}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-4 pt-4">
                  {hasPermission("user.add_note") && (
                    <button
                      className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 font-medium text-sm text-white hover:bg-blue-700"
                      onClick={() => setShowNoteModal(true)}
                    >
                      Add Note
                    </button>
                  )}
                  {hasPermission("feature.manage") && (
                    <button
                      className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 font-medium text-sm text-white hover:bg-green-700"
                      onClick={() => setShowFeatureModal(true)}
                    >
                      Manage Features
                    </button>
                  )}
                  <button
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    onClick={() => setSelectedUser(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedUser && (
        <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="relative top-20 mx-auto w-96 rounded-md border bg-white p-5 shadow-lg dark:bg-gray-800">
            <h3 className="mb-4 font-medium text-gray-900 text-lg dark:text-gray-100">
              {actionType === "force-unlink" && "Force Unlink Profile"}
              {actionType === "force-link" && "Force Link Profile"}
              {actionType === "grant-premium" && "Grant Premium Access"}
            </h3>

            <div className="space-y-4">
              {actionType === "force-link" && (
                <div>
                  <label className="block font-medium text-gray-700 text-sm dark:text-gray-300">
                    Profile ID
                  </label>
                  <input
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    onChange={(e) => setActionProfileId(e.target.value)}
                    placeholder="Enter profile ID"
                    type="text"
                    value={actionProfileId}
                  />
                </div>
              )}

              <div>
                <label className="block font-medium text-gray-700 text-sm dark:text-gray-300">
                  Reason
                </label>
                <textarea
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter reason for this action"
                  rows={3}
                  value={actionReason}
                />
              </div>

              <div className="flex items-center space-x-4">
                <button
                  className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 font-medium text-sm text-white hover:bg-red-700 disabled:opacity-50"
                  disabled={actionLoading || !actionReason}
                  onClick={handleAction}
                >
                  {actionLoading ? "Processing..." : "Confirm"}
                </button>
                <button
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  onClick={() => {
                    setShowActionModal(false);
                    setActionType("");
                    setActionReason("");
                    setActionProfileId("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && selectedUser && (
        <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="relative top-20 mx-auto w-96 rounded-md border bg-white p-5 shadow-lg dark:bg-gray-800">
            <h3 className="mb-4 font-medium text-gray-900 text-lg dark:text-gray-100">
              Add Admin Note
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block font-medium text-gray-700 text-sm dark:text-gray-300">
                  Note
                </label>
                <textarea
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Enter admin note"
                  rows={4}
                  value={noteText}
                />
              </div>

              <div className="flex items-center">
                <input
                  checked={isPrivateNote}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  id="private-note"
                  onChange={(e) => setIsPrivateNote(e.target.checked)}
                  type="checkbox"
                />
                <label
                  className="ml-2 block text-gray-900 text-sm dark:text-gray-100"
                  htmlFor="private-note"
                >
                  Private note (only visible to admins)
                </label>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 font-medium text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                  disabled={actionLoading || !noteText}
                  onClick={handleAddNote}
                >
                  {actionLoading ? "Adding..." : "Add Note"}
                </button>
                <button
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  onClick={() => {
                    setShowNoteModal(false);
                    setNoteText("");
                    setIsPrivateNote(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Modal */}
      {showFeatureModal && selectedUser && (
        <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="relative top-20 mx-auto w-96 rounded-md border bg-white p-5 shadow-lg dark:bg-gray-800">
            <h3 className="mb-4 font-medium text-gray-900 text-lg dark:text-gray-100">
              Manage Feature Access
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block font-medium text-gray-700 text-sm dark:text-gray-300">
                  Feature
                </label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  onChange={(e) => setSelectedFeature(e.target.value)}
                  value={selectedFeature}
                >
                  <option value="">Select a feature</option>
                  {features.map((feature) => (
                    <option key={feature.id} value={feature.featureId}>
                      {feature.name} ({feature.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    checked={grantFeatureAccess}
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    onChange={() => setGrantFeatureAccess(true)}
                    type="radio"
                  />
                  <span className="ml-2 text-gray-900 text-sm dark:text-gray-100">
                    Grant Access
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    checked={!grantFeatureAccess}
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    onChange={() => setGrantFeatureAccess(false)}
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
                  disabled={actionLoading || !selectedFeature}
                  onClick={handleFeatureAccess}
                >
                  {actionLoading ? "Processing..." : "Update Access"}
                </button>
                <button
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  onClick={() => {
                    setShowFeatureModal(false);
                    setSelectedFeature("");
                    setGrantFeatureAccess(true);
                  }}
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

export default UserManagement;
