import { Button } from "@headlessui/react";
import {
  ArrowPathIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  PlusIcon
} from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";
import Card from "../../Shared/UI/Card";

interface CoinTransaction {
  id: string;
  userId: string;
  username: string;
  coinType: string;
  amount: number;
  transactionType: string;
  description: string;
  createdAt: string;
  adminId?: string;
}

interface CoinStats {
  totalCoins: number;
  totalTransactions: number;
  todayTransactions: number;
  coinDistribution: {
    experience: number;
    achievement: number;
    social: number;
    premium: number;
  };
}

const CoinManagementPanel = () => {
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [stats, setStats] = useState<CoinStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddCoins, setShowAddCoins] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [coinAmount, setCoinAmount] = useState(0);
  const [coinType, setCoinType] = useState("experience");
  const [transactionType, setTransactionType] = useState("earned");

  // Generate unique IDs for form elements
  const walletAddressId = useMemo(
    () => `wallet-address-${crypto.randomUUID()}`,
    []
  );
  const coinTypeId = useMemo(() => `coin-type-${crypto.randomUUID()}`, []);
  const transactionTypeId = useMemo(
    () => `transaction-type-${crypto.randomUUID()}`,
    []
  );
  const coinAmountId = useMemo(() => `coin-amount-${crypto.randomUUID()}`, []);

  // Fetch transactions and stats
  const fetchData = async () => {
    try {
      const baseApi =
        (import.meta as any).env?.VITE_API_URL || "http://localhost:8080";

      // Fetch transactions from public endpoint
      const transactionsResponse = await fetch(`${baseApi}/transactions`, {
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData.data || []);
      }

      // Fetch stats from admin-features
      const statsResponse = await fetch(`${baseApi}/admin-features/stats`, {
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data?.overview || {});
      }
    } catch (error) {
      console.error("Error fetching coin data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle coin adjustment
  const handleCoinAdjustment = async () => {
    if (!selectedUser || coinAmount <= 0) return;

    try {
      // For now, just show a message that this feature requires admin authentication
      alert(
        "Coin adjustment feature requires admin authentication. This will be implemented when proper admin endpoints are available."
      );

      // TODO: Implement proper coin adjustment when admin endpoints are available
      console.log("Coin adjustment requested:", {
        amount: coinAmount,
        coinType,
        transactionType,
        walletAddress: selectedUser
      });

      // Reset form
      setShowAddCoins(false);
      setSelectedUser("");
      setCoinAmount(0);
    } catch (error) {
      console.error("Error adjusting coins:", error);
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
          Coin Management
        </h2>
        <Button
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={() => setShowAddCoins(true)}
        >
          <PlusIcon className="h-5 w-5" />
          Adjust Coins
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <CurrencyDollarIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <div className="font-bold text-2xl text-gray-900 dark:text-white">
                    {stats.totalCoins?.toLocaleString() || "0"}
                  </div>
                  <div className="text-gray-500 text-sm dark:text-gray-400">
                    Total Coins
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <ArrowPathIcon className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <div className="font-bold text-2xl text-gray-900 dark:text-white">
                    {stats.totalTransactions?.toLocaleString() || "0"}
                  </div>
                  <div className="text-gray-500 text-sm dark:text-gray-400">
                    Total Transactions
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <ChartBarIcon className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <div className="font-bold text-2xl text-gray-900 dark:text-white">
                    {stats.todayTransactions || "0"}
                  </div>
                  <div className="text-gray-500 text-sm dark:text-gray-400">
                    Today's Transactions
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="mb-2 text-gray-500 text-sm dark:text-gray-400">
                Coin Distribution
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Experience:</span>
                  <span className="font-medium">
                    {stats.coinDistribution?.experience?.toLocaleString() ||
                      "0"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Achievement:</span>
                  <span className="font-medium">
                    {stats.coinDistribution?.achievement?.toLocaleString() ||
                      "0"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Social:</span>
                  <span className="font-medium">
                    {stats.coinDistribution?.social?.toLocaleString() || "0"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Premium:</span>
                  <span className="font-medium">
                    {stats.coinDistribution?.premium?.toLocaleString() || "0"}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Add Coins Modal */}
      {showAddCoins && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h3 className="mb-4 font-semibold text-gray-900 text-lg dark:text-white">
                Adjust User Coins
              </h3>

              <div className="space-y-4">
                <div>
                  <label
                    className="mb-1 block font-medium text-gray-700 text-sm dark:text-gray-300"
                    htmlFor={walletAddressId}
                  >
                    Wallet Address
                  </label>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    id={walletAddressId}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    placeholder="0x..."
                    type="text"
                    value={selectedUser}
                  />
                </div>

                <div>
                  <label
                    className="mb-1 block font-medium text-gray-700 text-sm dark:text-gray-300"
                    htmlFor={coinTypeId}
                  >
                    Coin Type
                  </label>
                  <select
                    aria-label="Select coin type"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    id={coinTypeId}
                    onChange={(e) => setCoinType(e.target.value)}
                    value={coinType}
                  >
                    <option value="experience">Experience</option>
                    <option value="achievement">Achievement</option>
                    <option value="social">Social</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>

                <div>
                  <label
                    className="mb-1 block font-medium text-gray-700 text-sm dark:text-gray-300"
                    htmlFor={transactionTypeId}
                  >
                    Transaction Type
                  </label>
                  <select
                    aria-label="Select transaction type"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    id={transactionTypeId}
                    onChange={(e) => setTransactionType(e.target.value)}
                    value={transactionType}
                  >
                    <option value="earned">Earned</option>
                    <option value="spent">Spent</option>
                    <option value="transferred">Transferred</option>
                    <option value="admin_adjustment">Admin Adjustment</option>
                  </select>
                </div>

                <div>
                  <label
                    className="mb-1 block font-medium text-gray-700 text-sm dark:text-gray-300"
                    htmlFor={coinAmountId}
                  >
                    Amount
                  </label>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    id={coinAmountId}
                    onChange={(e) => setCoinAmount(Number(e.target.value))}
                    placeholder="Enter amount"
                    type="number"
                    value={coinAmount}
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <Button
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  onClick={handleCoinAdjustment}
                >
                  Adjust Coins
                </Button>
                <Button
                  className="flex-1 rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
                  onClick={() => setShowAddCoins(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Recent Transactions */}
      <Card>
        <div className="p-6">
          <h3 className="mb-4 font-semibold text-gray-900 text-lg dark:text-white">
            Recent Transactions
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-300">
                    User
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-300">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-300">
                    Coin Type
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-300">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-300">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {transactions.slice(0, 10).map((transaction) => (
                  <tr
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    key={transaction.id}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 text-sm dark:text-white">
                        {transaction.username}
                      </div>
                      <div className="font-mono text-gray-500 text-xs dark:text-gray-400">
                        {transaction.userId.slice(0, 10)}...
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 font-semibold text-xs ${
                          transaction.transactionType === "earned"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : transaction.transactionType === "spent"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        }`}
                      >
                        {transaction.transactionType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900 text-sm capitalize dark:text-white">
                      {transaction.coinType}
                    </td>
                    <td className="px-6 py-4 text-gray-900 text-sm dark:text-white">
                      {transaction.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm dark:text-gray-400">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CoinManagementPanel;
