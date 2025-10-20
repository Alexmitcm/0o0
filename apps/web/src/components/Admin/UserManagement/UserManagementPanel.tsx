import { Button } from "@headlessui/react";
import {
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import Card from "../../Shared/UI/Card";

interface User {
  id: string;
  walletAddress: string;
  username: string;
  email: string;
  status: string;
  isEmailVerified: boolean;
  rolePermission: string;
  createdAt: string;
  lastLoginAt?: string;
  totalCoins: number;
  premiumStatus: boolean;
  // Optional fields from API, guard with optional chaining
  displayName?: string;
  banned?: boolean;
  premiumUpgradedAt?: string;
  userCoinBalance?: { totalCoins?: number };
  lastActiveAt?: string;
}

const UserManagementPanel = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  // const [showAddUser, setShowAddUser] = useState(false);

  // Fetch users
  const fetchUsers = async () => {
    try {
      const baseApi =
        (import.meta as any).env?.VITE_API_URL || "http://localhost:8080";
      const response = await fetch(`${baseApi}/admin-features/users`, {
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      (user.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.walletAddress || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (user.displayName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle user selection
  const handleUserSelect = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return;

    try {
      // For now, just show a message that this feature requires admin authentication
      alert(
        `Bulk action "${action}" requires admin authentication. This will be implemented when proper admin endpoints are available.`
      );

      // TODO: Implement proper bulk actions when admin endpoints are available
      console.log(
        "Bulk action requested:",
        action,
        "for users:",
        selectedUsers
      );

      // Reset selection
      setSelectedUsers([]);
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
    }
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
          User Management
        </h2>
        <Button
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={() => {
            /* Add user functionality */
          }}
        >
          <UserPlusIcon className="h-5 w-5" />
          Add User
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="-translate-y-1/2 absolute top-1/2 left-3 h-5 w-5 transform text-gray-400" />
                <input
                  className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search users by username, email, or wallet address..."
                  type="text"
                  value={searchTerm}
                />
              </div>
            </div>

            {selectedUsers.length > 0 && (
              <div className="flex gap-2">
                <Button
                  className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                  onClick={() => handleBulkAction("ban")}
                >
                  Ban Selected ({selectedUsers.length})
                </Button>
                <Button
                  className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                  onClick={() => handleBulkAction("unban")}
                >
                  Unban Selected ({selectedUsers.length})
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    aria-label="Select all users"
                    className="rounded border-gray-300"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(filteredUsers.map((u) => u.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                    type="checkbox"
                  />
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-300">
                  User
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-300">
                  Status
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-300">
                  Coins
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-300">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-300">
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
                  <td className="px-6 py-4">
                    <input
                      aria-label={`Select user ${user.username || user.displayName}`}
                      checked={selectedUsers.includes(user.walletAddress)}
                      className="rounded border-gray-300"
                      onChange={() => handleUserSelect(user.walletAddress)}
                      type="checkbox"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900 text-sm dark:text-white">
                        {user.username || user.displayName || "Unknown"}
                      </div>
                      <div className="text-gray-500 text-sm dark:text-gray-400">
                        {user.email || "No email"}
                      </div>
                      <div className="font-mono text-gray-400 text-xs dark:text-gray-500">
                        {user.walletAddress.slice(0, 10)}...
                        {user.walletAddress.slice(-8)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 font-semibold text-xs ${
                          user.banned
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        }`}
                      >
                        {user.banned ? "Banned" : "Active"}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 font-semibold text-xs ${
                          user.premiumUpgradedAt
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                        }`}
                      >
                        {user.premiumUpgradedAt ? "Premium" : "Standard"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-900 text-sm dark:text-white">
                    {user.userCoinBalance?.totalCoins?.toLocaleString() || user.totalCoins?.toLocaleString?.() || "0"}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm dark:text-gray-400">
                    {user.lastActiveAt
                      ? new Date(user.lastActiveAt).toLocaleDateString()
                      : user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString()
                        : "Never"}
                  </td>
                  <td className="px-6 py-4 font-medium text-sm">
                    <div className="flex gap-2">
                      <Button
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        onClick={() => {
                          /* Edit user */
                        }}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        onClick={() => {
                          /* Delete user */
                        }}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <div className="p-4">
            <div className="font-bold text-2xl text-gray-900 dark:text-white">
              {users.length}
            </div>
            <div className="text-gray-500 text-sm dark:text-gray-400">
              Total Users
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="font-bold text-2xl text-green-600">
              {users.filter((u) => u.status === "Active").length}
            </div>
            <div className="text-gray-500 text-sm dark:text-gray-400">
              Active Users
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="font-bold text-2xl text-purple-600">
              {users.filter((u) => u.premiumStatus).length}
            </div>
            <div className="text-gray-500 text-sm dark:text-gray-400">
              Premium Users
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="font-bold text-2xl text-blue-600">
              {users.reduce((sum, u) => sum + u.totalCoins, 0).toLocaleString()}
            </div>
            <div className="text-gray-500 text-sm dark:text-gray-400">
              Total Coins
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UserManagementPanel;
