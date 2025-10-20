import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  CurrencyDollarIcon,
  HeartIcon,
  SparklesIcon,
  StarIcon,
  TrophyIcon
} from "@heroicons/react/24/solid";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface AdminCoinManagementProps {
  className?: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  coinType: string;
  walletAddress: string;
  timestamp: string;
  status: string;
  transactionType: string;
  user?: {
    displayName?: string;
    username?: string;
  };
  description?: string;
  createdAt: string;
  balanceAfter: number;
}

const AdminCoinManagement = ({ className = "" }: AdminCoinManagementProps) => {
  const [activeTab, setActiveTab] = useState<
    "stats" | "users" | "transactions"
  >("stats");
  const [transactionFilters, setTransactionFilters] = useState({
    coinType: "",
    limit: 50,
    offset: 0,
    transactionType: "",
    walletAddress: ""
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryFn: async () => {
      const params = new URLSearchParams();
      if (transactionFilters.coinType)
        params.append("coinType", transactionFilters.coinType);
      if (transactionFilters.transactionType)
        params.append("transactionType", transactionFilters.transactionType);
      if (transactionFilters.walletAddress)
        params.append("walletAddress", transactionFilters.walletAddress);
      params.append("limit", transactionFilters.limit.toString());
      params.append("offset", transactionFilters.offset.toString());

      const response = await fetch(`/api/admin/coins/transactions?${params}`);
      if (!response.ok) throw new Error("Failed to fetch transactions");
      const result = await response.json();
      return result.data;
    },
    queryKey: ["adminCoinTransactions", transactionFilters]
  });

  const formatCoins = (coins: number) => {
    if (coins >= 1000000) return `${(coins / 1000000).toFixed(1)}M`;
    if (coins >= 1000) return `${(coins / 1000).toFixed(1)}K`;
    return coins.toLocaleString();
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "Earned":
        return <ArrowTrendingUpIcon className="h-4 w-4 text-green-400" />;
      case "Spent":
        return <ArrowTrendingDownIcon className="h-4 w-4 text-red-400" />;
      case "AdminAdjustment":
        return <StarIcon className="h-4 w-4 text-purple-400" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const getCoinIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "experience":
        return <TrophyIcon className="h-4 w-4 text-blue-400" />;
      case "achievement":
        return <StarIcon className="h-4 w-4 text-yellow-400" />;
      case "social":
        return <HeartIcon className="h-4 w-4 text-pink-400" />;
      case "premium":
        return <SparklesIcon className="h-4 w-4 text-purple-400" />;
      default:
        return <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const getCoinColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "experience":
        return "text-blue-400";
      case "achievement":
        return "text-yellow-400";
      case "social":
        return "text-pink-400";
      case "premium":
        return "text-purple-400";
      default:
        return "text-gray-400";
    }
  };

  const tabs = [
    { icon: CurrencyDollarIcon, key: "stats", label: "System Stats" },
    { icon: TrophyIcon, key: "users", label: "User Management" },
    { icon: ClockIcon, key: "transactions", label: "Transactions" }
  ];

  return (
    <div className={`mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#00FFFF]/20 to-[#FF00FF]/20">
            <CurrencyDollarIcon className="h-6 w-6 text-[#00FFFF]" />
          </div>
          <div>
            <h1 className="font-bold text-3xl text-white">
              Coin System Management
            </h1>
            <p className="text-gray-400">
              Manage user coins, leaderboards, and system statistics
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-1 rounded-lg bg-white/5 p-1">
          {tabs.map((tab) => (
            <button
              className={`flex items-center gap-2 rounded-md px-4 py-2 font-medium text-sm transition-all ${
                activeTab === tab.key
                  ? "bg-[#00FFFF] text-black"
                  : "text-gray-400 hover:text-white"
              }`}
              key={tab.key}
              onClick={() => setActiveTab(tab.key as "stats" | "users" | "transactions")}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "stats" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#2A2A2A] bg-[#121212] p-6">
            <h3 className="mb-4 font-bold text-lg text-white">
              System Statistics
            </h3>
            <p className="text-gray-400">
              View comprehensive coin system statistics and analytics.
            </p>
            {/* Stats component would be imported here */}
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#2A2A2A] bg-[#121212] p-6">
            <h3 className="mb-4 font-bold text-lg text-white">
              User Management
            </h3>
            <p className="text-gray-400">
              Search and manage individual user coin balances and transactions.
            </p>
            {/* User management component would be imported here */}
          </div>
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="rounded-xl border border-[#2A2A2A] bg-[#121212] p-6">
            <h3 className="mb-4 font-bold text-lg text-white">
              Transaction Filters
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="coin-type" className="mb-2 block text-gray-400 text-sm">
                  Coin Type
                </label>
                <select
                  id="coin-type"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#00FFFF] focus:outline-none"
                  onChange={(e) =>
                    setTransactionFilters((prev) => ({
                      ...prev,
                      coinType: e.target.value
                    }))
                  }
                  value={transactionFilters.coinType}
                >
                  <option value="">All Types</option>
                  <option value="Experience">Experience</option>
                  <option value="Achievement">Achievement</option>
                  <option value="Social">Social</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
              <div>
                <label htmlFor="transaction-type" className="mb-2 block text-gray-400 text-sm">
                  Transaction Type
                </label>
                <select
                  id="transaction-type"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#00FFFF] focus:outline-none"
                  onChange={(e) =>
                    setTransactionFilters((prev) => ({
                      ...prev,
                      transactionType: e.target.value
                    }))
                  }
                  value={transactionFilters.transactionType}
                >
                  <option value="">All Types</option>
                  <option value="Earned">Earned</option>
                  <option value="Spent">Spent</option>
                  <option value="AdminAdjustment">Admin Adjustment</option>
                </select>
              </div>
              <div>
                <label htmlFor="wallet-address" className="mb-2 block text-gray-400 text-sm">
                  Wallet Address
                </label>
                <input
                  id="wallet-address"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-400 focus:border-[#00FFFF] focus:outline-none"
                  onChange={(e) =>
                    setTransactionFilters((prev) => ({
                      ...prev,
                      walletAddress: e.target.value
                    }))
                  }
                  placeholder="Search by wallet..."
                  type="text"
                  value={transactionFilters.walletAddress}
                />
              </div>
              <div>
                <label htmlFor="limit" className="mb-2 block text-gray-400 text-sm">
                  Limit
                </label>
                <select
                  id="limit"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#00FFFF] focus:outline-none"
                  onChange={(e) =>
                    setTransactionFilters((prev) => ({
                      ...prev,
                      limit: Number.parseInt(e.target.value)
                    }))
                  }
                  value={transactionFilters.limit}
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="rounded-xl border border-[#2A2A2A] bg-[#121212] p-6">
            <h3 className="mb-4 font-bold text-lg text-white">Transactions</h3>
            {transactionsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div className="flex items-center gap-4" key={i}>
                    <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
                      <div className="h-3 w-48 animate-pulse rounded bg-white/10" />
                    </div>
                    <div className="h-4 w-16 animate-pulse rounded bg-white/10" />
                  </div>
                ))}
              </div>
            ) : transactions?.transactions &&
              transactions.transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.transactions.map((transaction: Transaction) => (
                  <div
                    className="flex items-center justify-between rounded-lg border border-white/10 p-4"
                    key={transaction.id}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                        {getTransactionIcon(transaction.transactionType)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">
                            {transaction.user?.displayName ||
                              transaction.user?.username ||
                              `${transaction.walletAddress.slice(0, 6)}...${transaction.walletAddress.slice(-4)}`}
                          </p>
                          <span
                            className={`text-xs ${getCoinColor(transaction.coinType)}`}
                          >
                            {transaction.coinType}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm">
                          {transaction.description ||
                            `${transaction.transactionType} ${transaction.coinType} coins`}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {new Date(transaction.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          transaction.amount > 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {transaction.amount > 0 ? "+" : ""}
                        {formatCoins(transaction.amount)}
                      </p>
                      <p className="text-gray-400 text-xs">
                        Balance: {formatCoins(transaction.balanceAfter)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-400">No transactions found</p>
              </div>
            )}

            {/* Pagination */}
            {transactions?.pagination &&
              transactions.pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <button
                    className="rounded-lg bg-white/10 px-3 py-2 font-medium text-sm text-white transition-all hover:bg-white/20 disabled:opacity-50"
                    disabled={transactionFilters.offset === 0}
                    onClick={() =>
                      setTransactionFilters((prev) => ({
                        ...prev,
                        offset: Math.max(0, prev.offset - prev.limit)
                      }))
                    }
                  >
                    Previous
                  </button>
                  <span className="text-gray-400 text-sm">
                    Page {transactions.pagination.page} of{" "}
                    {transactions.pagination.totalPages}
                  </span>
                  <button
                    className="rounded-lg bg-white/10 px-3 py-2 font-medium text-sm text-white transition-all hover:bg-white/20 disabled:opacity-50"
                    disabled={
                      transactions.pagination.page >=
                      transactions.pagination.totalPages
                    }
                    onClick={() =>
                      setTransactionFilters((prev) => ({
                        ...prev,
                        offset: prev.offset + prev.limit
                      }))
                    }
                  >
                    Next
                  </button>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoinManagement;
