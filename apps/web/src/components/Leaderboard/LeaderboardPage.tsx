import {
  ClockIcon,
  FireIcon,
  StarIcon,
  TrophyIcon
} from "@heroicons/react/24/solid";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import LeaderboardCard from "./LeaderboardCard";

interface LeaderboardEntry {
  id: string;
  rank: number;
  walletAddress: string;
  displayName?: string;
  username?: string;
  avatarUrl?: string;
  status: string;
  totalCoins: number;
  experienceCoins: number;
  achievementCoins: number;
  socialCoins: number;
  premiumCoins: number;
  lastUpdatedAt: string;
}

interface LeaderboardData {
  id: string;
  type: string;
  period: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  entries: LeaderboardEntry[];
  totalEntries: number;
  userRank?: number;
  userEntry?: LeaderboardEntry;
}

const LeaderboardPage = () => {
  const [selectedType, setSelectedType] = useState<
    "FreeToEarn" | "PlayToEarn" | "AllTime"
  >("AllTime");
  const [selectedPeriod, setSelectedPeriod] = useState<
    "Daily" | "Weekly" | "Monthly" | "AllTime"
  >("AllTime");
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 50;

  const {
    data: leaderboard,
    isLoading,
    error
  } = useQuery({
    queryFn: async () => {
      const response = await fetch(
        `/api/leaderboard?type=${selectedType}&period=${selectedPeriod}`
      );
      if (!response.ok) throw new Error("Failed to fetch leaderboard");
      const result = await response.json();
      return result.data as LeaderboardData;
    },
    queryKey: ["leaderboard", selectedType, selectedPeriod],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: stats } = useQuery({
    queryFn: async () => {
      const response = await fetch("/api/leaderboard/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      const result = await response.json();
      return result.data;
    },
    queryKey: ["leaderboardStats"]
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <TrophyIcon className="h-6 w-6 text-yellow-400" />;
    if (rank === 2) return <TrophyIcon className="h-6 w-6 text-gray-300" />;
    if (rank === 3) return <TrophyIcon className="h-6 w-6 text-amber-600" />;
    return <span className="font-bold text-gray-400 text-lg">#{rank}</span>;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1)
      return "from-yellow-400/20 to-yellow-600/20 border-yellow-400/30";
    if (rank === 2) return "from-gray-300/20 to-gray-500/20 border-gray-300/30";
    if (rank === 3)
      return "from-amber-600/20 to-amber-800/20 border-amber-600/30";
    if (rank <= 10) return "from-white/10 to-white/20 border-white/20";
    return "from-white/5 to-white/10 border-white/10";
  };

  const formatCoins = (coins: number) => {
    if (coins >= 1000000) return `${(coins / 1000000).toFixed(1)}M`;
    if (coins >= 1000) return `${(coins / 1000).toFixed(1)}K`;
    return coins.toLocaleString();
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "FreeToEarn":
        return "Free to Earn";
      case "PlayToEarn":
        return "Play to Earn";
      case "AllTime":
        return "All Time";
      default:
        return type;
    }
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case "Daily":
        return "Today";
      case "Weekly":
        return "This Week";
      case "Monthly":
        return "This Month";
      case "AllTime":
        return "All Time";
      default:
        return period;
    }
  };

  const totalPages = leaderboard
    ? Math.ceil(leaderboard.entries.length / entriesPerPage)
    : 0;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentEntries = leaderboard?.entries.slice(startIndex, endIndex) || [];

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-white/10" />
          <div className="mt-2 h-4 w-96 animate-pulse rounded bg-white/10" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-[#2A2A2A] bg-[#121212] p-6">
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div className="flex items-center gap-4" key={i}>
                    <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
                    <div className="h-12 w-12 animate-pulse rounded-full bg-white/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
                      <div className="h-3 w-48 animate-pulse rounded bg-white/10" />
                    </div>
                    <div className="h-6 w-16 animate-pulse rounded bg-white/10" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            {[...Array(2)].map((_, i) => (
              <div
                className="h-64 animate-pulse rounded-2xl bg-white/10"
                key={i}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex h-96 items-center justify-center rounded-2xl border border-[#2A2A2A] bg-[#121212]">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400">
              <FireIcon className="h-8 w-8" />
            </div>
            <h3 className="mb-2 font-semibold text-white text-xl">
              Failed to load leaderboard
            </h3>
            <p className="text-gray-400">Please try again later</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#00FFFF]/20 to-[#FF00FF]/20">
            <TrophyIcon className="h-6 w-6 text-[#00FFFF]" />
          </div>
          <div>
            <h1 className="font-bold text-3xl text-white">Leaderboard</h1>
            <p className="text-gray-400">
              Compete with other players and climb the ranks
            </p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#2A2A2A] bg-[#121212] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                  <StarIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Players</p>
                  <p className="font-bold text-lg text-white">
                    {stats.totalUsers?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-[#2A2A2A] bg-[#121212] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/20 text-green-400">
                  <TrophyIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Coins</p>
                  <p className="font-bold text-lg text-white">
                    {formatCoins(stats.totalCoins || 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-[#2A2A2A] bg-[#121212] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                  <ClockIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Average Coins</p>
                  <p className="font-bold text-lg text-white">
                    {formatCoins(stats.averageCoins || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Leaderboard */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-[#2A2A2A] bg-[#121212] p-6">
            {/* Filters */}
            <div className="mb-6">
              <div className="mb-4 flex gap-2 rounded-lg bg-white/5 p-1">
                {["AllTime", "FreeToEarn", "PlayToEarn"].map((type) => (
                  <button
                    className={`flex-1 rounded-md px-4 py-2 font-medium text-sm transition-all ${
                      selectedType === type
                        ? "bg-[#00FFFF] text-black"
                        : "text-gray-400 hover:text-white"
                    }`}
                    key={type}
                    onClick={() => setSelectedType(type as any)}
                  >
                    {getTypeLabel(type)}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 rounded-lg bg-white/5 p-1">
                {["AllTime", "Weekly", "Monthly"].map((period) => (
                  <button
                    className={`flex-1 rounded-md px-4 py-2 font-medium text-sm transition-all ${
                      selectedPeriod === period
                        ? "bg-[#FF00FF] text-black"
                        : "text-gray-400 hover:text-white"
                    }`}
                    key={period}
                    onClick={() => setSelectedPeriod(period as any)}
                  >
                    {getPeriodLabel(period)}
                  </button>
                ))}
              </div>
            </div>

            {/* User Rank Highlight */}
            {leaderboard?.userRank && leaderboard.userEntry && (
              <div className="mb-6 rounded-xl border border-[#00FFFF]/20 bg-gradient-to-r from-[#00FFFF]/10 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00FFFF]/20">
                      {getRankIcon(leaderboard.userRank)}
                    </div>
                    <div>
                      <p className="font-bold text-lg text-white">Your Rank</p>
                      <p className="text-gray-400">
                        {formatCoins(leaderboard.userEntry.totalCoins)} coins
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-2xl text-[#00FFFF]">
                      #{leaderboard.userRank}
                    </p>
                    <p className="text-gray-400 text-sm">
                      out of {leaderboard.totalEntries}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Leaderboard Entries */}
            <div className="space-y-2">
              {currentEntries.map((entry) => (
                <div
                  className={`flex items-center gap-4 rounded-xl border p-4 transition-all hover:scale-[1.01] ${getRankColor(
                    entry.rank
                  )}`}
                  key={entry.id}
                >
                  {/* Rank */}
                  <div className="flex h-10 w-10 items-center justify-center">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* Avatar */}
                  <div className="h-12 w-12 overflow-hidden rounded-full">
                    {entry.avatarUrl ? (
                      <img
                        alt={entry.displayName || entry.username || "User"}
                        className="h-full w-full object-cover"
                        src={entry.avatarUrl}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#00FFFF]/20 to-[#FF00FF]/20">
                        <span className="font-bold text-white">
                          {(
                            entry.displayName ||
                            entry.username ||
                            entry.walletAddress
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-lg text-white">
                        {entry.displayName ||
                          entry.username ||
                          `${entry.walletAddress.slice(0, 6)}...${entry.walletAddress.slice(-4)}`}
                      </p>
                      {entry.status === "Premium" && (
                        <StarIcon className="h-5 w-5 text-[#FF00FF]" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-gray-400 text-sm">
                      <span>{formatCoins(entry.experienceCoins)} XP</span>
                      <span>•</span>
                      <span>{formatCoins(entry.achievementCoins)} ACH</span>
                      <span>•</span>
                      <span>{formatCoins(entry.socialCoins)} SOC</span>
                      {entry.premiumCoins > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-[#FF00FF]">
                            {formatCoins(entry.premiumCoins)} PRE
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Total Coins */}
                  <div className="text-right">
                    <p className="font-bold text-white text-xl">
                      {formatCoins(entry.totalCoins)}
                    </p>
                    <p className="text-gray-400 text-sm">coins</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  className="rounded-lg bg-white/10 px-3 py-2 font-medium text-sm text-white transition-all hover:bg-white/20 disabled:opacity-50"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                >
                  Previous
                </button>
                <span className="text-gray-400 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="rounded-lg bg-white/10 px-3 py-2 font-medium text-sm text-white transition-all hover:bg-white/20 disabled:opacity-50"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <LeaderboardCard
            period="Weekly"
            showUserRank={false}
            type="FreeToEarn"
          />
          <LeaderboardCard
            period="Weekly"
            showUserRank={false}
            type="PlayToEarn"
          />
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
