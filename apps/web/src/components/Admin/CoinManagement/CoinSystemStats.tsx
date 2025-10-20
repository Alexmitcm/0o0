import {
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  StarIcon,
  TrophyIcon,
  UserGroupIcon
} from "@heroicons/react/24/solid";
import { useQuery } from "@tanstack/react-query";

interface CoinSystemStatsProps {
  className?: string;
}

const CoinSystemStats = ({ className = "" }: CoinSystemStatsProps) => {
  const {
    data: stats,
    isLoading,
    error
  } = useQuery({
    queryFn: async () => {
      const response = await fetch("/api/admin/coins/stats");
      if (!response.ok) throw new Error("Failed to fetch coin system stats");
      const result = await response.json();
      return result.data;
    },
    queryKey: ["adminCoinStats"],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const formatCoins = (coins: number) => {
    if (coins >= 1000000) return `${(coins / 1000000).toFixed(1)}M`;
    if (coins >= 1000) return `${(coins / 1000).toFixed(1)}K`;
    return coins.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              className="rounded-xl border border-[#2A2A2A] bg-[#121212] p-6"
              key={i}
            >
              <div className="h-6 w-24 animate-pulse rounded bg-white/10" />
              <div className="mt-2 h-8 w-16 animate-pulse rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`rounded-xl border border-red-500/20 bg-red-500/5 p-6 ${className}`}
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400">
            <ChartBarIcon className="h-6 w-6" />
          </div>
          <h3 className="mb-2 font-semibold text-lg text-white">
            Failed to load stats
          </h3>
          <p className="text-gray-400">Please try again later</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#2A2A2A] bg-[#121212] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
              <UserGroupIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Users</p>
              <p className="font-bold text-2xl text-white">
                {stats.totalUsers?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#2A2A2A] bg-[#121212] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20 text-green-400">
              <CurrencyDollarIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Coins</p>
              <p className="font-bold text-2xl text-white">
                {formatCoins(stats.totalCoins || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#2A2A2A] bg-[#121212] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
              <ChartBarIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Average Coins</p>
              <p className="font-bold text-2xl text-white">
                {formatCoins(stats.averageCoins || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#2A2A2A] bg-[#121212] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/20 text-yellow-400">
              <TrophyIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Top User</p>
              <p className="font-bold text-lg text-white">
                {stats.topUser?.displayName || stats.topUser?.username || "N/A"}
              </p>
              <p className="text-gray-400 text-xs">
                {formatCoins(stats.topUser?.totalCoins || 0)} coins
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Coin Type Breakdown */}
      {stats.coinTypeStats && stats.coinTypeStats.length > 0 && (
        <div className="rounded-xl border border-[#2A2A2A] bg-[#121212] p-6">
          <h3 className="mb-4 font-bold text-lg text-white">
            Coin Type Distribution
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.coinTypeStats.map((coinType: any) => (
              <div
                className="rounded-lg border border-white/10 p-4"
                key={coinType.coinType}
              >
                <div className="mb-2 flex items-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      coinType.coinType === "Experience"
                        ? "bg-blue-400"
                        : coinType.coinType === "Achievement"
                          ? "bg-yellow-400"
                          : coinType.coinType === "Social"
                            ? "bg-pink-400"
                            : coinType.coinType === "Premium"
                              ? "bg-purple-400"
                              : "bg-gray-400"
                    }`}
                  />
                  <span className="font-medium text-sm text-white">
                    {coinType.coinType}
                  </span>
                </div>
                <p className="font-bold text-lg text-white">
                  {formatCoins(coinType._sum.amount || 0)}
                </p>
                <p className="text-gray-400 text-xs">
                  {coinType._count.id} transactions
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source Type Breakdown */}
      {stats.sourceTypeStats && stats.sourceTypeStats.length > 0 && (
        <div className="rounded-xl border border-[#2A2A2A] bg-[#121212] p-6">
          <h3 className="mb-4 font-bold text-lg text-white">
            Source Type Distribution
          </h3>
          <div className="space-y-3">
            {stats.sourceTypeStats.map((sourceType: any) => (
              <div
                className="flex items-center justify-between rounded-lg border border-white/10 p-3"
                key={sourceType.sourceType}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                    <StarIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-white">
                      {sourceType.sourceType}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {sourceType._count.id} transactions
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">
                    {formatCoins(sourceType._sum.amount || 0)}
                  </p>
                  <p className="text-gray-400 text-xs">coins</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      {stats.recentTransactions && stats.recentTransactions.length > 0 && (
        <div className="rounded-xl border border-[#2A2A2A] bg-[#121212] p-6">
          <h3 className="mb-4 font-bold text-lg text-white">
            Recent Transactions
          </h3>
          <div className="space-y-3">
            {stats.recentTransactions.slice(0, 5).map((transaction: any) => (
              <div
                className="flex items-center justify-between rounded-lg border border-white/10 p-3"
                key={transaction.id}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                    <ClockIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-white">
                      {transaction.user?.displayName ||
                        transaction.user?.username ||
                        `${transaction.walletAddress.slice(0, 6)}...${transaction.walletAddress.slice(-4)}`}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {transaction.transactionType} • {transaction.coinType}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-bold ${
                      transaction.amount > 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {transaction.amount > 0 ? "+" : ""}
                    {formatCoins(transaction.amount)}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CoinSystemStats;
