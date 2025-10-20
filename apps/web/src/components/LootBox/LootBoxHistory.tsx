import {
  ClockIcon,
  CubeIcon,
  CurrencyDollarIcon,
  EyeIcon,
  GiftIcon,
  TrophyIcon
} from "@heroicons/react/24/solid";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface LootBoxHistoryProps {
  className?: string;
}

interface LootBoxOpen {
  id: string;
  walletAddress: string;
  lootBoxId: string;
  adWatched: boolean;
  adProvider?: string;
  adPlacementId?: string;
  adRewardId?: string;
  openedAt: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  lootBox: {
    id: string;
    name: string;
    type: "Free" | "Premium";
  };
  rewards: LootBoxOpenReward[];
}

interface LootBoxOpenReward {
  id: string;
  lootBoxOpenId: string;
  rewardId: string;
  rewardType: "Coins" | "NFT" | "Crypto" | "Experience" | "Achievement";
  rewardValue: string;
  claimedAt?: string;
  createdAt: string;
  reward: {
    id: string;
    rewardType: string;
    probability: number;
  };
}

const LootBoxHistory = ({ className = "" }: LootBoxHistoryProps) => {
  const [selectedOpen, setSelectedOpen] = useState<LootBoxOpen | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch loot box history
  const { data: history, isLoading: historyLoading } = useQuery({
    queryFn: async () => {
      const response = await fetch(
        "http://localhost:8080/lootbox/history?limit=50"
      );
      if (!response.ok) throw new Error("Failed to fetch loot box history");
      const result = await response.json();
      return result.data;
    },
    queryKey: ["lootBoxHistory"]
  });

  const getRewardTypeIcon = (type: string) => {
    switch (type) {
      case "Coins":
        return <CurrencyDollarIcon className="h-4 w-4 text-yellow-400" />;
      case "NFT":
        return <CubeIcon className="h-4 w-4 text-blue-400" />;
      case "Crypto":
        return <CurrencyDollarIcon className="h-4 w-4 text-green-400" />;
      case "Experience":
        return <TrophyIcon className="h-4 w-4 text-blue-400" />;
      case "Achievement":
        return <TrophyIcon className="h-4 w-4 text-yellow-400" />;
      default:
        return <GiftIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const getLootBoxTypeIcon = (type: string) => {
    switch (type) {
      case "Free":
        return <GiftIcon className="h-5 w-5 text-green-400" />;
      case "Premium":
        return <TrophyIcon className="h-5 w-5 text-purple-400" />;
      default:
        return <GiftIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const formatRewardValue = (rewardValue: string, rewardType: string) => {
    try {
      const value = JSON.parse(rewardValue);
      switch (rewardType) {
        case "Coins":
          return `${value.amount} ${value.coinType} Coins`;
        case "NFT":
          return `NFT #${value.nftId}`;
        case "Crypto":
          return `${value.amount} ${value.symbol}`;
        case "Experience":
          return `${value.amount} Experience Points`;
        case "Achievement":
          return `${value.amount} Achievement Points`;
        default:
          return "Unknown Reward";
      }
    } catch {
      return "Invalid Reward";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleViewDetails = (open: LootBoxOpen) => {
    setSelectedOpen(open);
    setShowDetailsModal(true);
  };

  return (
    <div className={`mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#00FFFF]/20 to-[#FF00FF]/20">
            <ClockIcon className="h-6 w-6 text-[#00FFFF]" />
          </div>
          <div>
            <h1 className="font-bold text-3xl text-white">Loot Box History</h1>
            <p className="text-gray-400">
              View your loot box opening history and rewards
            </p>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="rounded-xl border border-[#2A2A2A] bg-[#121212] p-6">
        {historyLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div className="flex items-center gap-4" key={i}>
                <div className="h-12 w-12 animate-pulse rounded-lg bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 animate-pulse rounded bg-white/10" />
                  <div className="h-3 w-32 animate-pulse rounded bg-white/10" />
                </div>
                <div className="h-8 w-20 animate-pulse rounded bg-white/10" />
              </div>
            ))}
          </div>
        ) : history && history.length > 0 ? (
          <div className="space-y-4">
            {history.map((open: LootBoxOpen) => (
              <div
                className="flex items-center justify-between rounded-lg border border-white/10 p-4 transition-all hover:border-white/20"
                key={open.id}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5">
                    {getLootBoxTypeIcon(open.lootBox.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white">
                        {open.lootBox.name}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-1 font-medium text-xs ${
                          open.lootBox.type === "Free"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-purple-500/20 text-purple-400"
                        }`}
                      >
                        {open.lootBox.type}
                      </span>
                      {open.adWatched && (
                        <span className="rounded-full bg-blue-500/20 px-2 py-1 font-medium text-blue-400 text-xs">
                          Ad Watched
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">
                      {formatDate(open.openedAt)}
                    </p>
                    <div className="flex items-center gap-4 text-gray-500 text-xs">
                      <span>{open.rewards.length} reward(s)</span>
                      {open.adProvider && <span>via {open.adProvider}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="font-medium text-sm text-white">
                      {open.rewards.filter((r) => r.claimedAt).length}/
                      {open.rewards.length} claimed
                    </p>
                    <p className="text-gray-400 text-xs">
                      {open.rewards.length > 0
                        ? formatRewardValue(
                            open.rewards[0].rewardValue,
                            open.rewards[0].rewardType
                          )
                        : "No rewards"}
                    </p>
                  </div>
                  <button
                    aria-label="View loot box details"
                    className="rounded-lg bg-white/10 p-2 text-white transition-all hover:bg-white/20"
                    onClick={() => handleViewDetails(open)}
                    type="button"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <GiftIcon className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 font-medium text-white text-xl">
              No History Found
            </h3>
            <p className="text-gray-400">
              You haven't opened any loot boxes yet.
            </p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-xl border border-[#2A2A2A] bg-[#121212] p-6">
            <div className="mb-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5">
                  {getLootBoxTypeIcon(selectedOpen.lootBox.type)}
                </div>
                <div>
                  <h3 className="font-bold text-white text-xl">
                    {selectedOpen.lootBox.name}
                  </h3>
                  <p className="text-gray-400">
                    Opened on {formatDate(selectedOpen.openedAt)}
                  </p>
                </div>
              </div>

              {selectedOpen.adWatched && (
                <div className="mb-4 rounded-lg bg-blue-500/20 p-3">
                  <div className="flex items-center gap-2">
                    <EyeIcon className="h-4 w-4 text-blue-400" />
                    <span className="font-medium text-blue-400 text-sm">
                      Ad watched via{" "}
                      {selectedOpen.adProvider || "Unknown Provider"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h4 className="mb-4 font-medium text-white">Rewards Received:</h4>
              {selectedOpen.rewards.length > 0 ? (
                <div className="space-y-3">
                  {selectedOpen.rewards.map((reward) => (
                    <div
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4"
                      key={reward.id}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                          {getRewardTypeIcon(reward.rewardType)}
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {formatRewardValue(
                              reward.rewardValue,
                              reward.rewardType
                            )}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {(reward.reward.probability * 100).toFixed(1)}%
                            chance
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`rounded-full px-2 py-1 font-medium text-xs ${
                            reward.claimedAt
                              ? "bg-green-500/20 text-green-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {reward.claimedAt ? "Claimed" : "Pending"}
                        </span>
                        {reward.claimedAt && (
                          <p className="mt-1 text-gray-400 text-xs">
                            {formatDate(reward.claimedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <GiftIcon className="mx-auto mb-2 h-12 w-12 text-gray-400" />
                  <p className="text-gray-400">No rewards received</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                className="flex-1 rounded-lg bg-white/10 px-4 py-2 font-medium text-white transition-all hover:bg-white/20"
                onClick={() => setShowDetailsModal(false)}
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LootBoxHistory;
