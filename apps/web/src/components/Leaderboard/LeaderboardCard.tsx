import { FireIcon, StarIcon, TrophyIcon } from "@heroicons/react/24/solid";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";

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

interface LeaderboardCardProps {
  type?: "FreeToEarn" | "PlayToEarn" | "AllTime";
  period?: "Daily" | "Weekly" | "Monthly" | "AllTime";
  showUserRank?: boolean;
  className?: string;
}

const LeaderboardCard = ({
  type = "AllTime",
  period = "AllTime",
  showUserRank = true,
  className = ""
}: LeaderboardCardProps) => {
  const [selectedType, setSelectedType] = useState(type);
  const [selectedPeriod, setSelectedPeriod] = useState(period);

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

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <TrophyIcon className="h-5 w-5 text-yellow-400" />;
    if (rank === 2) return <TrophyIcon className="h-5 w-5 text-gray-300" />;
    if (rank === 3) return <TrophyIcon className="h-5 w-5 text-amber-600" />;
    return <span className="font-medium text-gray-400 text-sm">#{rank}</span>;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1)
      return "from-yellow-400/20 to-yellow-600/20 border-yellow-400/30";
    if (rank === 2) return "from-gray-300/20 to-gray-500/20 border-gray-300/30";
    if (rank === 3)
      return "from-amber-600/20 to-amber-800/20 border-amber-600/30";
    return "from-white/5 to-white/10 border-white/10";
  };

  const formatCoins = (coins: number) => {
    if (coins >= 1000000) return `${(coins / 1000000).toFixed(1)}M`;
    if (coins >= 1000) return `${(coins / 1000).toFixed(1)}K`;
    return coins.toString();
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

  if (isLoading) {
    return (
      <div
        className={`rounded-2xl border border-[#2A2A2A] bg-[#121212] p-6 ${className}`}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="h-6 w-32 animate-pulse rounded-lg bg-white/10" />
          <div className="h-6 w-20 animate-pulse rounded-lg bg-white/10" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div className="flex items-center gap-3" key={i}>
              <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
              <div className="h-4 flex-1 animate-pulse rounded bg-white/10" />
              <div className="h-4 w-16 animate-pulse rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`rounded-2xl border border-[#2A2A2A] bg-[#121212] p-6 ${className}`}
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400">
            <FireIcon className="h-6 w-6" />
          </div>
          <h3 className="mb-2 font-semibold text-lg text-white">
            Failed to load leaderboard
          </h3>
          <p className="text-gray-400">Please try again later</p>
        </div>
      </div>
    );
  }

  if (!leaderboard) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border border-[#2A2A2A] bg-[#121212] p-6 ${className}`}
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#00FFFF]/20 to-[#FF00FF]/20">
            <TrophyIcon className="h-5 w-5 text-[#00FFFF]" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">
              {getTypeLabel(selectedType)} Leaderboard
            </h3>
            <p className="text-gray-400 text-sm">
              {getPeriodLabel(selectedPeriod)} • {leaderboard.totalEntries}{" "}
              players
            </p>
          </div>
        </div>

        {/* Type Selector */}
        <div className="flex gap-1 rounded-lg bg-white/5 p-1">
          {["AllTime", "FreeToEarn", "PlayToEarn"].map((t) => (
            <button
              className={`rounded-md px-3 py-1 font-medium text-xs transition-all ${
                selectedType === t
                  ? "bg-[#00FFFF] text-black"
                  : "text-gray-400 hover:text-white"
              }`}
              key={t}
              onClick={() => setSelectedType(t as any)}
            >
              {getTypeLabel(t)}
            </button>
          ))}
        </div>
      </div>

      {/* Period Selector */}
      <div className="mb-4 flex gap-1 rounded-lg bg-white/5 p-1">
        {["AllTime", "Weekly", "Monthly"].map((p) => (
          <button
            className={`rounded-md px-3 py-1 font-medium text-xs transition-all ${
              selectedPeriod === p
                ? "bg-[#FF00FF] text-black"
                : "text-gray-400 hover:text-white"
            }`}
            key={p}
            onClick={() => setSelectedPeriod(p as any)}
          >
            {getPeriodLabel(p)}
          </button>
        ))}
      </div>

      {/* User Rank (if authenticated and showUserRank) */}
      {showUserRank && leaderboard.userRank && leaderboard.userEntry && (
        <div className="mb-4 rounded-xl border border-[#00FFFF]/20 bg-gradient-to-r from-[#00FFFF]/10 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00FFFF]/20">
                {getRankIcon(leaderboard.userRank)}
              </div>
              <div>
                <p className="font-medium text-white">Your Rank</p>
                <p className="text-gray-400 text-sm">
                  {formatCoins(leaderboard.userEntry.totalCoins)} coins
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-[#00FFFF] text-lg">
                #{leaderboard.userRank}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Entries */}
      <div className="space-y-2">
        {leaderboard.entries.slice(0, 10).map((entry, index) => (
          <div
            className={`flex items-center gap-3 rounded-xl border p-3 transition-all hover:scale-[1.02] ${getRankColor(
              entry.rank
            )}`}
            key={entry.id}
          >
            {/* Rank */}
            <div className="flex h-8 w-8 items-center justify-center">
              {getRankIcon(entry.rank)}
            </div>

            {/* Avatar */}
            <div className="h-10 w-10 overflow-hidden rounded-full">
              {entry.avatarUrl ? (
                <img
                  alt={entry.displayName || entry.username || "User"}
                  className="h-full w-full object-cover"
                  src={entry.avatarUrl}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#00FFFF]/20 to-[#FF00FF]/20">
                  <span className="font-bold text-sm text-white">
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
                <p className="truncate font-medium text-white">
                  {entry.displayName ||
                    entry.username ||
                    `${entry.walletAddress.slice(0, 6)}...${entry.walletAddress.slice(-4)}`}
                </p>
                {entry.status === "Premium" && (
                  <StarIcon className="h-4 w-4 text-[#FF00FF]" />
                )}
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-xs">
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
              <p className="font-bold text-lg text-white">
                {formatCoins(entry.totalCoins)}
              </p>
              <p className="text-gray-400 text-xs">coins</p>
            </div>
          </div>
        ))}
      </div>

      {/* View All Button */}
      {leaderboard.entries.length > 10 && (
        <div className="mt-4 text-center">
          <Link
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#00FFFF] to-[#FF00FF] px-4 py-2 font-medium text-black transition-all hover:scale-105 hover:shadow-lg"
            to="/leaderboard"
          >
            <TrophyIcon className="h-4 w-4" />
            View Full Leaderboard
          </Link>
        </div>
      )}
    </div>
  );
};

export default LeaderboardCard;
