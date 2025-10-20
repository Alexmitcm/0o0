import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  CurrencyDollarIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  StarIcon,
  TrophyIcon
} from "@heroicons/react/24/solid";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface UserCoinManagementProps {
  className?: string;
}

const UserCoinManagement = ({ className = "" }: UserCoinManagementProps) => {
  const [searchWallet, setSearchWallet] = useState("");
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [adjustForm, setAdjustForm] = useState({
    amount: 0,
    coinType: "Experience",
    reason: ""
  });

  const {
    data: userDetails,
    isLoading: userLoading,
    error: userError
  } = useQuery({
    enabled: !!selectedWallet,
    queryFn: async () => {
      if (!selectedWallet) return null;
      const response = await fetch(`/api/admin/coins/user/${selectedWallet}`);
      if (!response.ok) throw new Error("Failed to fetch user details");
      const result = await response.json();
      return result.data;
    },
    queryKey: ["adminUserCoinDetails", selectedWallet]
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchWallet.trim()) {
      setSelectedWallet(searchWallet.trim());
    }
  };

  const handleAdjustCoins = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWallet || !adjustForm.amount || !adjustForm.reason) return;

    try {
      const response = await fetch("/api/admin/coins/adjust", {
        body: JSON.stringify({
          amount: adjustForm.amount,
          coinType: adjustForm.coinType,
          reason: adjustForm.reason,
          walletAddress: selectedWallet
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      if (response.ok) {
        alert("Coins adjusted successfully!");
        setAdjustForm({ amount: 0, coinType: "Experience", reason: "" });
        // Refetch user details
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error?.message || "Failed to adjust coins"}`);
      }
    } catch (error) {
      alert(
        `Error: ${error instanceof Error ? error.message : "Failed to adjust coins"}`
      );
    }
  };

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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search User */}
      <div className="rounded-xl border border-[#2A2A2A] bg-[#121212] p-6">
        <h3 className="mb-4 font-bold text-lg text-white">Search User</h3>
        <form className="flex gap-4" onSubmit={handleSearch}>
          <div className="flex-1">
            <input
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-gray-400 focus:border-[#00FFFF] focus:outline-none"
              onChange={(e) => setSearchWallet(e.target.value)}
              placeholder="Enter wallet address..."
              type="text"
              value={searchWallet}
            />
          </div>
          <button
            className="flex items-center gap-2 rounded-lg bg-[#00FFFF] px-4 py-2 font-medium text-black transition-all hover:scale-105"
            type="submit"
          >
            <MagnifyingGlassIcon className="h-4 w-4" />
            Search
          </button>
        </form>
      </div>

      {/* User Details */}
      {userLoading && (
        <div className="rounded-xl border border-[#2A2A2A] bg-[#121212] p-6">
          <div className="space-y-4">
            <div className="h-6 w-32 animate-pulse rounded bg-white/10" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  className="h-4 w-full animate-pulse rounded bg-white/10"
                  key={i}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {userError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
          <div className="text-center">
            <h3 className="mb-2 font-semibold text-lg text-white">
              User not found
            </h3>
            <p className="text-gray-400">
              Please check the wallet address and try again
            </p>
          </div>
        </div>
      )}

      {userDetails && (
        <div className="space-y-6">
          {/* User Info */}
          <div className="rounded-xl border border-[#2A2A2A] bg-[#121212] p-6">
            <h3 className="mb-4 font-bold text-lg text-white">
              User Information
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-gray-400 text-sm">Display Name</p>
                <p className="font-medium text-white">
                  {userDetails.user?.displayName || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Username</p>
                <p className="font-medium text-white">
                  {userDetails.user?.username || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Wallet Address</p>
                <p className="font-mono text-sm text-white">
                  {userDetails.user?.walletAddress}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Status</p>
                <p className="font-medium text-white">
                  {userDetails.user?.status}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Registration Date</p>
                <p className="font-medium text-white">
                  {userDetails.user?.registrationDate
                    ? new Date(
                        userDetails.user.registrationDate
                      ).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Last Active</p>
                <p className="font-medium text-white">
                  {userDetails.user?.lastActiveAt
                    ? new Date(
                        userDetails.user.lastActiveAt
                      ).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Coin Balance */}
          {userDetails.balance && (
            <div className="rounded-xl border border-[#2A2A2A] bg-[#121212] p-6">
              <h3 className="mb-4 font-bold text-lg text-white">
                Coin Balance
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-lg border border-white/10 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-sm text-white">
                      Total
                    </span>
                  </div>
                  <p className="font-bold text-lg text-white">
                    {formatCoins(userDetails.balance.totalCoins)}
                  </p>
                </div>
                {[
                  {
                    key: "experience",
                    label: "Experience",
                    value: userDetails.balance.experienceCoins
                  },
                  {
                    key: "achievement",
                    label: "Achievement",
                    value: userDetails.balance.achievementCoins
                  },
                  {
                    key: "social",
                    label: "Social",
                    value: userDetails.balance.socialCoins
                  },
                  {
                    key: "premium",
                    label: "Premium",
                    value: userDetails.balance.premiumCoins
                  }
                ].map((coin) => (
                  <div
                    className="rounded-lg border border-white/10 p-4"
                    key={coin.key}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      {getCoinIcon(coin.key)}
                      <span
                        className={`font-medium text-sm ${getCoinColor(coin.key)}`}
                      >
                        {coin.label}
                      </span>
                    </div>
                    <p className="font-bold text-lg text-white">
                      {formatCoins(coin.value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Adjust Coins */}
          <div className="rounded-xl border border-[#2A2A2A] bg-[#121212] p-6">
            <h3 className="mb-4 font-bold text-lg text-white">Adjust Coins</h3>
            <form className="space-y-4" onSubmit={handleAdjustCoins}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-gray-400 text-sm">
                    Coin Type
                  </label>
                  <select
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#00FFFF] focus:outline-none"
                    onChange={(e) =>
                      setAdjustForm((prev) => ({
                        ...prev,
                        coinType: e.target.value
                      }))
                    }
                    value={adjustForm.coinType}
                  >
                    <option value="Experience">Experience</option>
                    <option value="Achievement">Achievement</option>
                    <option value="Social">Social</option>
                    <option value="Premium">Premium</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-gray-400 text-sm">
                    Amount
                  </label>
                  <input
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#00FFFF] focus:outline-none"
                    onChange={(e) =>
                      setAdjustForm((prev) => ({
                        ...prev,
                        amount: Number.parseInt(e.target.value) || 0
                      }))
                    }
                    placeholder="Enter amount"
                    type="number"
                    value={adjustForm.amount}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-gray-400 text-sm">
                    Reason
                  </label>
                  <input
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#00FFFF] focus:outline-none"
                    onChange={(e) =>
                      setAdjustForm((prev) => ({
                        ...prev,
                        reason: e.target.value
                      }))
                    }
                    placeholder="Enter reason"
                    type="text"
                    value={adjustForm.reason}
                  />
                </div>
              </div>
              <button
                className="rounded-lg bg-[#FF00FF] px-6 py-2 font-medium text-white transition-all hover:scale-105"
                type="submit"
              >
                Adjust Coins
              </button>
            </form>
          </div>

          {/* Recent Transactions */}
          {userDetails.transactions && userDetails.transactions.length > 0 && (
            <div className="rounded-xl border border-[#2A2A2A] bg-[#121212] p-6">
              <h3 className="mb-4 font-bold text-lg text-white">
                Recent Transactions
              </h3>
              <div className="space-y-3">
                {userDetails.transactions
                  .slice(0, 10)
                  .map((transaction: any) => (
                    <div
                      className="flex items-center justify-between rounded-lg border border-white/10 p-3"
                      key={transaction.id}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                          {getTransactionIcon(transaction.transactionType)}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-white">
                            {transaction.description ||
                              `${transaction.transactionType} ${transaction.coinType}`}
                          </p>
                          <p className="text-gray-400 text-xs">
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserCoinManagement;
