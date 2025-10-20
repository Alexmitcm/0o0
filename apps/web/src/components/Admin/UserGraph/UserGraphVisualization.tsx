import { Button } from "@headlessui/react";
import {
  ArrowPathIcon,
  ChartBarIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";
import { useEffect, useId, useState } from "react";
import Card from "../../Shared/UI/Card";

interface UserNode {
  id: string;
  walletAddress: string;
  username: string;
  email?: string;
  referer?: string;
  children?: UserNode[];
  parent?: UserNode;
  coins: number;
  totalEq: number;
  createdAt: string;
  isEmailVerified: boolean;
  level: number;
}

interface GraphStats {
  totalUsers: number;
  totalReferrals: number;
  maxDepth: number;
  averageReferrals: number;
  topReferrer: string;
}

const UserGraphVisualization = () => {
  const [users, setUsers] = useState<UserNode[]>([]);
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserNode | null>(null);
  const [showAll, setShowAll] = useState(true);

  // Generate unique IDs for form elements
  const searchInputId = useId();
  const userDetailsId = useId();
  const userWalletId = useId();
  const userEmailId = useId();
  const userCoinsId = useId();
  const userEqId = useId();
  const userLevelId = useId();
  const userReferralsId = useId();
  const userVerifiedId = useId();

  // Fetch users data
  const fetchUsers = async () => {
    try {
      const baseApi =
        (import.meta as any).env?.VITE_API_URL || "http://localhost:8080";

      // Fetch users from admin-features
      const response = await fetch(`${baseApi}/admin-features/users`, {
        headers: { "Content-Type": "application/json" }
      });

      if (response.ok) {
        const data = await response.json();
        const userNodes = (data.data || []).map((user: any) => ({
          children: [],
          coins: user.userCoinBalance?.totalCoins || 0,
          createdAt: user.createdAt,
          email: user.email,
          id: user.walletAddress,
          isEmailVerified: user.emailVerified || false,
          level: 0,
          referer: user.parentWallet,
          totalEq: user.equilibrium || 0,
          username: user.username || user.displayName || "Unknown",
          walletAddress: user.walletAddress
        }));

        setUsers(userNodes);
      }

      // Mock stats for now
      const mockStats: GraphStats = {
        averageReferrals: 2.6,
        maxDepth: 8,
        topReferrer: "0x1234...5678",
        totalReferrals: 3200,
        totalUsers: 1250
      };
      setStats(mockStats);
    } catch (error) {
      console.error("Error fetching users data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Build referral tree
  const buildReferralTree = (users: UserNode[]): UserNode[] => {
    const userMap = new Map<string, UserNode>();
    const rootUsers: UserNode[] = [];

    // Create user map
    for (const user of users) {
      userMap.set(user.walletAddress, { ...user, children: [], level: 0 });
    }

    // Build tree structure
    for (const user of userMap.values()) {
      if (
        user.referer &&
        user.referer !== "NO_DATA" &&
        userMap.has(user.referer)
      ) {
        const parent = userMap.get(user.referer);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(user);
          user.parent = parent;
          user.level = (parent.level || 0) + 1;
        }
      } else {
        rootUsers.push(user);
      }
    }

    return rootUsers;
  };

  // Filter users based on search
  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return showAll;
    return (
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.walletAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const referralTree = buildReferralTree(filteredUsers);

  // Calculate user stats
  const getUserStats = (user: UserNode) => {
    const childrenCount = user.children?.length ?? 0;
    const totalCoins = user.coins;
    const totalEq = user.totalEq;

    return {
      childrenCount,
      level: user.level,
      totalCoins,
      totalEq
    };
  };

  const getLevelColor = (level: number) => {
    if (level === 0)
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    if (level <= 2)
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (level <= 4)
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
        <div>
          <h2 className="font-semibold text-2xl text-gray-900 dark:text-white">
            User Graph Visualization
          </h2>
          <p className="text-gray-600 text-sm dark:text-gray-400">
            Visualize user referral network and relationships
          </p>
        </div>
        <Button
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={fetchUsers}
        >
          <ArrowPathIcon className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm dark:text-gray-400">
                    Total Users
                  </p>
                  <p className="font-semibold text-2xl text-gray-900 dark:text-white">
                    {stats.totalUsers.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm dark:text-gray-400">
                    Total Referrals
                  </p>
                  <p className="font-semibold text-2xl text-gray-900 dark:text-white">
                    {stats.totalReferrals.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
                    <div className="h-4 w-4 rounded-full bg-yellow-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm dark:text-gray-400">
                    Max Depth
                  </p>
                  <p className="font-semibold text-2xl text-gray-900 dark:text-white">
                    {stats.maxDepth}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                    <div className="h-4 w-4 rounded-full bg-purple-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm dark:text-gray-400">
                    Avg Referrals
                  </p>
                  <p className="font-semibold text-2xl text-gray-900 dark:text-white">
                    {stats.averageReferrals}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <div className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative">
                <input
                  aria-label="Search users"
                  className="rounded-lg border border-gray-300 px-3 py-2 pl-10 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  id={searchInputId}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search users..."
                  type="text"
                  value={searchTerm}
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              <Button
                className={`rounded-lg px-4 py-2 text-sm ${
                  showAll
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                }`}
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? "Show All" : "Show Referrals Only"}
              </Button>
            </div>

            <div className="text-gray-600 text-sm dark:text-gray-400">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </div>
        </div>
      </Card>

      {/* User Tree Visualization */}
      <Card>
        <div className="p-6">
          <h3 className="mb-4 font-semibold text-gray-900 text-lg dark:text-white">
            Referral Network
          </h3>

          {referralTree.length === 0 ? (
            <div className="py-8 text-center">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                No users found matching your criteria
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {referralTree.map((rootUser, rootIndex) => (
                <div
                  className="space-y-2"
                  key={`root-${rootUser.id}-${rootIndex}`}
                >
                  {/* Root User */}
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`rounded-full px-2 py-1 font-semibold text-xs ${getLevelColor(rootUser.level)}`}
                      >
                        Level {rootUser.level}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {rootUser.username}
                        </h4>
                        <p className="text-gray-600 text-sm dark:text-gray-400">
                          {formatAddress(rootUser.walletAddress)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-gray-600 text-sm dark:text-gray-400">
                          Coins
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {rootUser.coins.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600 text-sm dark:text-gray-400">
                          EQ
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {rootUser.totalEq.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600 text-sm dark:text-gray-400">
                          Referrals
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {rootUser.children?.length || 0}
                        </p>
                      </div>
                      <Button
                        className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
                        onClick={() => setSelectedUser(rootUser)}
                      >
                        <EyeIcon className="h-4 w-4" />
                        View
                      </Button>
                    </div>
                  </div>

                  {/* Children */}
                  {rootUser.children && rootUser.children.length > 0 && (
                    <div className="ml-8 space-y-2">
                      {rootUser.children.map((child, index) => {
                        const childStats = getUserStats(child);
                        return (
                          <div
                            className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-800"
                            key={`${child.id}-${index}`}
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={`rounded-full px-2 py-1 font-semibold text-xs ${getLevelColor(child.level)}`}
                              >
                                Level {child.level}
                              </div>
                              <div>
                                <h5 className="font-medium text-gray-900 dark:text-white">
                                  {child.username}
                                </h5>
                                <p className="text-gray-600 text-sm dark:text-gray-400">
                                  {formatAddress(child.walletAddress)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4">
                              <div className="text-center">
                                <p className="text-gray-600 text-xs dark:text-gray-400">
                                  Coins
                                </p>
                                <p className="font-semibold text-gray-900 text-sm dark:text-white">
                                  {childStats.totalCoins.toLocaleString()}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-gray-600 text-xs dark:text-gray-400">
                                  EQ
                                </p>
                                <p className="font-semibold text-gray-900 text-sm dark:text-white">
                                  {childStats.totalEq.toLocaleString()}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-gray-600 text-xs dark:text-gray-400">
                                  Referrals
                                </p>
                                <p className="font-semibold text-gray-900 text-sm dark:text-white">
                                  {childStats.childrenCount}
                                </p>
                              </div>
                              <Button
                                className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
                                onClick={() => setSelectedUser(child)}
                              >
                                <EyeIcon className="h-4 w-4" />
                                View
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-2xl">
            <div className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <h3 className="font-semibold text-gray-900 text-lg dark:text-white">
                  User Details
                </h3>
                <Button
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={() => setSelectedUser(null)}
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="block font-medium text-gray-700 text-sm dark:text-gray-300">
                    Username
                  </div>
                  <p
                    className="mt-1 text-gray-900 text-sm dark:text-white"
                    id={userDetailsId}
                  >
                    {selectedUser.username}
                  </p>
                </div>

                <div>
                  <div className="block font-medium text-gray-700 text-sm dark:text-gray-300">
                    Wallet Address
                  </div>
                  <p
                    className="mt-1 font-mono text-gray-900 text-sm dark:text-white"
                    id={userWalletId}
                  >
                    {selectedUser.walletAddress}
                  </p>
                </div>

                {selectedUser.email && (
                  <div>
                    <div className="block font-medium text-gray-700 text-sm dark:text-gray-300">
                      Email
                    </div>
                    <p
                      className="mt-1 text-gray-900 text-sm dark:text-white"
                      id={userEmailId}
                    >
                      {selectedUser.email}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="block font-medium text-gray-700 text-sm dark:text-gray-300">
                      Total Coins
                    </div>
                    <p
                      className="mt-1 text-gray-900 text-sm dark:text-white"
                      id={userCoinsId}
                    >
                      {selectedUser.coins.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <div className="block font-medium text-gray-700 text-sm dark:text-gray-300">
                      Total EQ
                    </div>
                    <p
                      className="mt-1 text-gray-900 text-sm dark:text-white"
                      id={userEqId}
                    >
                      {selectedUser.totalEq.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <div className="block font-medium text-gray-700 text-sm dark:text-gray-300">
                      Level
                    </div>
                    <p
                      className="mt-1 text-gray-900 text-sm dark:text-white"
                      id={userLevelId}
                    >
                      {selectedUser.level}
                    </p>
                  </div>

                  <div>
                    <div className="block font-medium text-gray-700 text-sm dark:text-gray-300">
                      Referrals
                    </div>
                    <p
                      className="mt-1 text-gray-900 text-sm dark:text-white"
                      id={userReferralsId}
                    >
                      {selectedUser.children?.length || 0}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="block font-medium text-gray-700 text-sm dark:text-gray-300">
                    Email Verified
                  </div>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2 py-1 font-semibold text-xs ${
                      selectedUser.isEmailVerified
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                    id={userVerifiedId}
                  >
                    {selectedUser.isEmailVerified ? "Verified" : "Not Verified"}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default UserGraphVisualization;
