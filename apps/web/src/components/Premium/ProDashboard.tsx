import {
  ArrowPathIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { useLinkedProfile, useProfileStats } from "@/hooks/usePremium";

const ProDashboard = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { address: connectedAddress } = useAccount();

  const {
    data: statsData,
    isLoading: isLoadingStats,
    refetch: refetchStats
  } = useProfileStats();
  const { data: linkedProfileData } = useLinkedProfile();

  const stats = (statsData as any)?.data as
    | {
        leftNode: string;
        rightNode: string;
        referralReward: string;
        balancedReward: string;
        unbalancedReward: string;
      }
    | undefined;
  const linkedProfile = (linkedProfileData as any)?.data?.linkedProfile as
    | { handle: string; linkedAt?: string }
    | undefined;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchStats();
    setIsRefreshing(false);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatReward = (reward: string) => {
    return Number.parseFloat(formatEther(BigInt(reward || "0"))).toFixed(4);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-gray-900">Pro Dashboard</h1>
          <p className="text-gray-600">Manage your premium account and rewards</p>
        </div>
        <button
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 font-medium text-sm text-white hover:bg-purple-700 disabled:opacity-50"
          disabled={isRefreshing}
          onClick={handleRefresh}
          type="button"
        >
          <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Linked Profile */}
      {linkedProfile && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900 text-lg">Linked Profile</h2>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600">
              <span className="font-bold text-lg text-white">
                {linkedProfile.handle?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="font-medium text-gray-900">@{linkedProfile.handle}</div>
              <div className="text-gray-500 text-sm">
                Linked on {linkedProfile.linkedAt ? new Date(linkedProfile.linkedAt).toLocaleDateString() : "—"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Referral Program Stats */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <UserGroupIcon className="h-5 w-5 text-purple-600" />
          <h2 className="font-semibold text-gray-900 text-lg">Referral Program</h2>
        </div>

        {isLoadingStats ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div className="h-20 animate-pulse rounded-lg bg-gray-100" key={i} />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-blue-50 p-4">
              <div className="font-medium text-blue-600 text-sm">Left Node</div>
              <div className="font-bold text-2xl text-blue-900">
                {stats.leftNode === "0x0000000000000000000000000000000000000000" ? "None" : formatAddress(stats.leftNode)}
              </div>
            </div>
            <div className="rounded-lg bg-green-50 p-4">
              <div className="font-medium text-green-600 text-sm">Right Node</div>
              <div className="font-bold text-2xl text-green-900">
                {stats.rightNode === "0x0000000000000000000000000000000000000000" ? "None" : formatAddress(stats.rightNode)}
              </div>
            </div>
            <div className="rounded-lg bg-purple-50 p-4">
              <div className="font-medium text-purple-600 text-sm">Referral Reward</div>
              <div className="font-bold text-2xl text-purple-900">{formatReward(stats.referralReward)} USDT</div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">Failed to load referral stats</div>
        )}
      </div>

      {/* Game Rewards */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <TrophyIcon className="h-5 w-5 text-purple-600" />
          <h2 className="font-semibold text-gray-900 text-lg">Game Rewards</h2>
        </div>

        {isLoadingStats ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div className="h-20 animate-pulse rounded-lg bg-gray-100" key={i} />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-amber-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-amber-600 text-sm">Balanced Game</div>
                  <div className="font-bold text-2xl text-amber-900">{formatReward(stats.balancedReward)} USDT</div>
                </div>
                <button className="rounded-lg bg-amber-600 px-3 py-1.5 font-medium text-white text-xs hover:bg-amber-700" type="button">
                  Claim
                </button>
              </div>
            </div>
            <div className="rounded-lg bg-orange-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-orange-600 text-sm">Unbalanced Game</div>
                  <div className="font-bold text-2xl text-orange-900">{formatReward(stats.unbalancedReward)} USDT</div>
                </div>
                <button className="rounded-lg bg-orange-600 px-3 py-1.5 font-medium text-white text-xs hover:bg-orange-700" type="button">
                  Claim
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">Failed to load game rewards</div>
        )}
      </div>

      {/* Referral Reward Claim */}
      {stats && Number.parseFloat(formatEther(BigInt(stats.referralReward || "0"))) > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CurrencyDollarIcon className="h-5 w-5 text-purple-600" />
            <h2 className="font-semibold text-gray-900 text-lg">Claim Referral Reward</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-600 text-sm">Available to claim</div>
              <div className="font-bold text-gray-900 text-xl">{formatReward(stats.referralReward)} USDT</div>
            </div>
            <button className="rounded-lg bg-purple-600 px-4 py-2 font-medium text-sm text-white hover:bg-purple-700" type="button">
              Claim Reward
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProDashboard;
