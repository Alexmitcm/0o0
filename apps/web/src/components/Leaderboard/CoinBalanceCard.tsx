import {
  CurrencyDollarIcon,
  HeartIcon,
  SparklesIcon,
  StarIcon,
  TrophyIcon
} from "@heroicons/react/24/solid";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface CoinBalance {
  totalCoins: number;
  experienceCoins: number;
  achievementCoins: number;
  socialCoins: number;
  premiumCoins: number;
  lastUpdatedAt: string;
}

interface CoinBalanceCardProps {
  className?: string;
  showDetails?: boolean;
}

const CoinBalanceCard = ({
  className = "",
  showDetails = true
}: CoinBalanceCardProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const {
    data: balance,
    isLoading,
    error
  } = useQuery({
    queryFn: async () => {
      const response = await fetch("/api/coins/balance");
      if (!response.ok) throw new Error("Failed to fetch coin balance");
      const result = await response.json();
      return result.data as CoinBalance;
    },
    queryKey: ["coinBalance"],
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  const formatCoins = (coins: number) => {
    if (coins >= 1000000) return `${(coins / 1000000).toFixed(1)}M`;
    if (coins >= 1000) return `${(coins / 1000).toFixed(1)}K`;
    return coins.toLocaleString();
  };

  const getCoinIcon = (type: string) => {
    switch (type) {
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
    switch (type) {
      case "experience":
        return "from-blue-400/20 to-blue-600/20 border-blue-400/30";
      case "achievement":
        return "from-yellow-400/20 to-yellow-600/20 border-yellow-400/30";
      case "social":
        return "from-pink-400/20 to-pink-600/20 border-pink-400/30";
      case "premium":
        return "from-purple-400/20 to-purple-600/20 border-purple-400/30";
      default:
        return "from-gray-400/20 to-gray-600/20 border-gray-400/30";
    }
  };

  const getCoinLabel = (type: string) => {
    switch (type) {
      case "experience":
        return "Experience";
      case "achievement":
        return "Achievement";
      case "social":
        return "Social";
      case "premium":
        return "Premium";
      default:
        return type;
    }
  };

  useEffect(() => {
    if (balance) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [balance]);

  if (isLoading) {
    return (
      <div
        className={`rounded-2xl border border-[#2A2A2A] bg-[#121212] p-6 ${className}`}
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-white/10" />
          <div className="h-6 w-32 animate-pulse rounded bg-white/10" />
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div className="flex items-center justify-between" key={i}>
              <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
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
            <CurrencyDollarIcon className="h-6 w-6" />
          </div>
          <h3 className="mb-2 font-semibold text-lg text-white">
            Failed to load balance
          </h3>
          <p className="text-gray-400">Please try again later</p>
        </div>
      </div>
    );
  }

  if (!balance) {
    return null;
  }

  const coinTypes = [
    { key: "experience", value: balance.experienceCoins },
    { key: "achievement", value: balance.achievementCoins },
    { key: "social", value: balance.socialCoins },
    { key: "premium", value: balance.premiumCoins }
  ];

  return (
    <div
      className={`rounded-2xl border border-[#2A2A2A] bg-[#121212] p-6 ${className}`}
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#00FFFF]/20 to-[#FF00FF]/20">
            <CurrencyDollarIcon className="h-5 w-5 text-[#00FFFF]" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Your Coins</h3>
            <p className="text-gray-400 text-sm">
              Last updated:{" "}
              {new Date(balance.lastUpdatedAt).toLocaleTimeString()}
            </p>
          </div>
        </div>

        <Link
          className="rounded-lg bg-white/10 px-3 py-1 font-medium text-white text-xs transition-all hover:bg-white/20"
          to="/profile/coins"
        >
          Manage
        </Link>
      </div>

      {/* Total Balance */}
      <div
        className={`mb-6 rounded-xl border p-4 transition-all ${
          isAnimating ? "scale-105" : ""
        } border-[#00FFFF]/20 bg-gradient-to-r from-[#00FFFF]/10 to-[#FF00FF]/10`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Total Balance</p>
            <p className="font-bold text-2xl text-white">
              {formatCoins(balance.totalCoins)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">coins</p>
            <div className="flex items-center gap-1">
              <SparklesIcon className="h-4 w-4 text-[#00FFFF]" />
              <span className="font-medium text-[#00FFFF] text-sm">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Coin Breakdown */}
      {showDetails && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-white">Coin Breakdown</h4>
          {coinTypes.map((coin) => (
            <div
              className={`flex items-center justify-between rounded-lg border p-3 ${getCoinColor(
                coin.key
              )}`}
              key={coin.key}
            >
              <div className="flex items-center gap-3">
                {getCoinIcon(coin.key)}
                <span className="font-medium text-sm text-white">
                  {getCoinLabel(coin.key)}
                </span>
              </div>
              <div className="text-right">
                <p className="font-bold text-white">
                  {formatCoins(coin.value)}
                </p>
                <p className="text-gray-400 text-xs">
                  {((coin.value / balance.totalCoins) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link
          className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#00FFFF] to-[#FF00FF] px-4 py-2 font-medium text-black transition-all hover:scale-105"
          to="/leaderboard"
        >
          <TrophyIcon className="h-4 w-4" />
          Leaderboard
        </Link>
        <Link
          className="flex items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-2 font-medium text-white transition-all hover:bg-white/20"
          to="/profile/coins"
        >
          <StarIcon className="h-4 w-4" />
          History
        </Link>
      </div>
    </div>
  );
};

export default CoinBalanceCard;
