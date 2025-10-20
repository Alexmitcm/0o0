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
import { Link } from "react-router-dom";

interface CoinBalance {
  totalCoins: number;
  experienceCoins: number;
  achievementCoins: number;
  socialCoins: number;
  premiumCoins: number;
  lastUpdatedAt: string;
}

interface CoinTransaction {
  id: string;
  coinType: string;
  amount: number;
  transactionType: string;
  sourceType: string;
  sourceId?: string;
  sourceMetadata?: Record<string, any>;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  createdAt: string;
}

interface CoinHistory {
  id: string;
  coinType: string;
  amount: number;
  sourceType: string;
  sourceId?: string;
  sourceMetadata?: Record<string, any>;
  earnedAt: string;
  user: {
    displayName?: string;
    username?: string;
    avatarUrl?: string;
  };
}

const CoinManagement = () => {
  const [activeTab, setActiveTab] = useState<
    "balance" | "transactions" | "history"
  >("balance");
  const [selectedCoinType, setSelectedCoinType] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryFn: async () => {
      const response = await fetch("/api/coins/balance");
      if (!response.ok) throw new Error("Failed to fetch coin balance");
      const result = await response.json();
      return result.data as CoinBalance;
    },
    queryKey: ["coinBalance"],
    refetchInterval: 10000
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: ((currentPage - 1) * itemsPerPage).toString()
      });
      if (selectedCoinType !== "all") {
        params.append("coinType", selectedCoinType);
      }

      const response = await fetch(`/api/coins/transactions?${params}`);
      if (!response.ok) throw new Error("Failed to fetch transactions");
      const result = await response.json();
      return result.data as CoinTransaction[];
    },
    queryKey: ["coinTransactions", selectedCoinType, currentPage]
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: ((currentPage - 1) * itemsPerPage).toString()
      });

      const response = await fetch(`/api/coins/history?${params}`);
      if (!response.ok) throw new Error("Failed to fetch coin history");
      const result = await response.json();
      return result.data as CoinHistory[];
    },
    queryKey: ["coinHistory", currentPage]
  });

  const formatCoins = (coins: number) => {
    if (coins >= 1000000) return `${(coins / 1000000).toFixed(1)}M`;
    if (coins >= 1000) return `${(coins / 1000).toFixed(1)}K`;
    return coins.toLocaleString();
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

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "Earned":
        return "text-green-400";
      case "Spent":
        return "text-red-400";
      case "AdminAdjustment":
        return "text-purple-400";
      default:
        return "text-gray-400";
    }
  };

  const getSourceLabel = (sourceType: string) => {
    switch (sourceType) {
      case "Registration":
        return "Account Registration";
      case "Referral":
        return "Referral Bonus";
      case "Quest":
        return "Quest Completion";
      case "Activity":
        return "Activity Reward";
      case "Social":
        return "Social Interaction";
      case "GamePlay":
        return "Game Play";
      case "Tournament":
        return "Tournament Prize";
      case "Admin":
        return "Admin Adjustment";
      case "Bonus":
        return "Special Bonus";
      case "Achievement":
        return "Achievement Unlock";
      case "DailyLogin":
        return "Daily Login";
      case "WeeklyChallenge":
        return "Weekly Challenge";
      case "MonthlyReward":
        return "Monthly Reward";
      default:
        return sourceType;
    }
  };

  const coinTypes = [
    { key: "all", label: "All Types" },
    { key: "Experience", label: "Experience" },
    { key: "Achievement", label: "Achievement" },
    { key: "Social", label: "Social" },
    { key: "Premium", label: "Premium" }
  ];

  const tabs = [
    { icon: CurrencyDollarIcon, key: "balance", label: "Balance" },
    { icon: ClockIcon, key: "transactions", label: "Transactions" },
    { icon: TrophyIcon, key: "history", label: "Earning History" }
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#00FFFF]/20 to-[#FF00FF]/20">
            <CurrencyDollarIcon className="h-6 w-6 text-[#00FFFF]" />
          </div>
          <div>
            <h1 className="font-bold text-3xl text-white">Coin Management</h1>
            <p className="text-gray-400">
              Track your coin balance, transactions, and earning history
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
              onClick={() => setActiveTab(tab.key as any)}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Balance Tab */}
      {activeTab === "balance" && (
        <div className="space-y-6">
          {balanceLoading ? (
            <div className="rounded-2xl border border-[#2A2A2A] bg-[#121212] p-6">
              <div className="space-y-4">
                <div className="h-8 w-32 animate-pulse rounded bg-white/10" />
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div className="flex items-center justify-between" key={i}>
                      <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
                      <div className="h-4 w-16 animate-pulse rounded bg-white/10" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : balance ? (
            <>
              {/* Total Balance */}
              <div className="rounded-2xl border border-[#2A2A2A] bg-[#121212] p-6">
                <div className="mb-6">
                  <h3 className="mb-2 font-bold text-lg text-white">
                    Total Balance
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-3xl text-white">
                        {formatCoins(balance.totalCoins)}
                      </p>
                      <p className="text-gray-400 text-sm">coins</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-sm">Last updated</p>
                      <p className="text-sm text-white">
                        {new Date(balance.lastUpdatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Coin Breakdown */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-white">
                    Coin Breakdown
                  </h4>
                  {[
                    {
                      key: "experience",
                      label: "Experience",
                      value: balance.experienceCoins
                    },
                    {
                      key: "achievement",
                      label: "Achievement",
                      value: balance.achievementCoins
                    },
                    {
                      key: "social",
                      label: "Social",
                      value: balance.socialCoins
                    },
                    {
                      key: "premium",
                      label: "Premium",
                      value: balance.premiumCoins
                    }
                  ].map((coin) => (
                    <div
                      className="flex items-center justify-between rounded-lg border border-white/10 p-3"
                      key={coin.key}
                    >
                      <div className="flex items-center gap-3">
                        {getCoinIcon(coin.key)}
                        <span className="font-medium text-sm text-white">
                          {coin.label}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${getCoinColor(coin.key)}`}>
                          {formatCoins(coin.value)}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {((coin.value / balance.totalCoins) * 100).toFixed(1)}
                          %
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Link
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#2A2A2A] bg-[#121212] p-4 transition-all hover:border-[#00FFFF]/50"
                  to="/leaderboard"
                >
                  <TrophyIcon className="h-5 w-5 text-[#00FFFF]" />
                  <span className="font-medium text-white">
                    View Leaderboard
                  </span>
                </Link>
                <Link
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#2A2A2A] bg-[#121212] p-4 transition-all hover:border-[#FF00FF]/50"
                  to="/gaming-dashboard"
                >
                  <StarIcon className="h-5 w-5 text-[#FF00FF]" />
                  <span className="font-medium text-white">Play Games</span>
                </Link>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-[#2A2A2A] bg-[#121212] p-6 text-center">
              <p className="text-gray-400">No balance data available</p>
            </div>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === "transactions" && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex gap-2 rounded-lg bg-white/5 p-1">
            {coinTypes.map((type) => (
              <button
                className={`rounded-md px-3 py-1 font-medium text-sm transition-all ${
                  selectedCoinType === type.key
                    ? "bg-[#00FFFF] text-black"
                    : "text-gray-400 hover:text-white"
                }`}
                key={type.key}
                onClick={() => setSelectedCoinType(type.key)}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Transactions List */}
          <div className="rounded-2xl border border-[#2A2A2A] bg-[#121212] p-6">
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
            ) : transactions && transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    className="flex items-center gap-4 rounded-lg border border-white/10 p-4"
                    key={transaction.id}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
                      {getTransactionIcon(transaction.transactionType)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">
                          {getSourceLabel(transaction.sourceType)}
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
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#2A2A2A] bg-[#121212] p-6">
            {historyLoading ? (
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
            ) : history && history.length > 0 ? (
              <div className="space-y-4">
                {history.map((item) => (
                  <div
                    className="flex items-center gap-4 rounded-lg border border-white/10 p-4"
                    key={item.id}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
                      {getCoinIcon(item.coinType)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">
                          {getSourceLabel(item.sourceType)}
                        </p>
                        <span
                          className={`text-xs ${getCoinColor(item.coinType)}`}
                        >
                          {item.coinType}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        Earned {formatCoins(item.amount)} {item.coinType} coins
                      </p>
                      <p className="text-gray-500 text-xs">
                        {new Date(item.earnedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-400">
                        +{formatCoins(item.amount)}
                      </p>
                      <p className="text-gray-400 text-xs">earned</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-400">No earning history found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CoinManagement;
