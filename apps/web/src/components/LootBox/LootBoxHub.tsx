import {
  ClockIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  GiftIcon,
  SparklesIcon,
  TrophyIcon
} from "@heroicons/react/24/solid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { type AdConfig, adService } from "../../services/AdService";
import { realAdService } from "../../services/RealAdService";

interface LootBoxHubProps {
  className?: string;
}

interface LootBox {
  id: string;
  name: string;
  description?: string;
  type: "Free" | "Premium";
  isActive: boolean;
  cooldownMinutes: number;
  maxOpensPerDay?: number;
  adRequired: boolean;
  adProvider?: string;
  adPlacementId?: string;
  requiresPremium: boolean;
  minCoinReward: number;
  maxCoinReward: number;
  coinType: "Experience" | "Achievement" | "Social" | "Premium";
  rewards: LootBoxReward[];
}

interface LootBoxReward {
  id: string;
  rewardType: "Coins" | "NFT" | "Crypto" | "Experience" | "Achievement";
  rewardValue: string;
  probability: number;
  isActive: boolean;
}

interface LootBoxOpenResult {
  success: boolean;
  rewards: LootBoxOpenReward[];
  nextAvailableAt?: string;
  error?: string;
}

interface LootBoxOpenReward {
  id: string;
  type: string;
  value: any;
  claimed: boolean;
  claimedAt?: string;
}

const LootBoxHub = ({ className = "" }: LootBoxHubProps) => {
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [openingResult, setOpeningResult] = useState<LootBoxOpenResult | null>(
    null
  );
  const [isOpening, setIsOpening] = useState(false);
  const [adServiceEnabled, setAdServiceEnabled] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Mock user type - در واقعیت از context یا store می‌آید
  const [userType, setUserType] = useState<"guest" | "standard" | "premium">(
    "guest"
  );

  const queryClient = useQueryClient();

  // Check if user can access loot box type
  const canAccessLootBox = (lootBoxType: string) => {
    switch (userType) {
      case "guest":
        return false; // مهمان‌ها نمی‌توانند هیچ لوت باکسی باز کنند
      case "standard":
        return lootBoxType === "Free"; // فقط Free Loot Box
      case "premium":
        return true; // همه لوت باکس‌ها
      default:
        return false;
    }
  };

  // Get access message for loot box
  const getAccessMessage = (lootBoxType: string) => {
    switch (userType) {
      case "guest":
        return "Please sign up to access loot boxes";
      case "standard":
        if (lootBoxType === "Free") return "Available";
        return "Upgrade to Premium to access this loot box";
      case "premium":
        return "Available";
      default:
        return "Access denied";
    }
  };

  // Handle loot box click based on user type
  const handleLootBoxClick = (lootBox: any) => {
    if (!canAccessLootBox(lootBox.type)) {
      if (userType === "guest") {
        setShowLoginModal(true);
      } else if (userType === "standard" && lootBox.type === "Premium") {
        setShowPremiumModal(true);
      }
      return;
    }

    // If user can access, proceed with opening
    handleOpenLootBox(lootBox);
  };

  // Initialize ad service
  const initializeAdService = async () => {
    try {
      await realAdService.initialize();
      setAdServiceEnabled(true);
      console.log("Real ad service initialized successfully");
    } catch (error) {
      console.error("Failed to initialize ad service:", error);
    }
  };

  // Fetch loot boxes
  const { data: lootBoxes, isLoading: lootBoxesLoading } = useQuery({
    queryFn: async () => {
      const response = await fetch("http://localhost:8080/lootbox");
      if (!response.ok) throw new Error("Failed to fetch loot boxes");
      const result = await response.json();
      return result.data;
    },
    queryKey: ["lootBoxes"]
  });

  // Mock cooldown and daily limit status for demo
  const cooldownStatus: any[] = [];
  const dailyLimitStatus: any[] = [];

  // Mock check availability for demo
  const checkAvailabilityMutation = useMutation({
    mutationFn: async (lootBoxId: string) => {
      // Mock response - always available for demo
      return {
        canOpen: true,
        cooldownRemaining: 0,
        dailyLimitRemaining: 3,
        message: "Available now"
      };
    }
  });

  // Open loot box mutation
  const openLootBoxMutation = useMutation({
    mutationFn: async ({
      lootBoxId,
      adData
    }: {
      lootBoxId: string;
      adData?: any;
    }) => {
      // Mock response for demo
      const mockRewards = [
        {
          claimed: false,
          claimedAt: undefined,
          id: "1",
          type: "coin",
          value: { amount: 25, currency: "Experience" }
        }
      ];

      return {
        nextAvailableAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
        rewards: mockRewards,
        success: true
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["lootBoxCooldowns"] });
      queryClient.invalidateQueries({ queryKey: ["lootBoxDailyLimits"] });
      queryClient.invalidateQueries({ queryKey: ["userBalance"] });
      setOpeningResult(data);
    }
  });

  const handleOpenLootBox = async (lootBox: LootBox) => {
    setIsOpening(true);

    try {
      // Check availability first
      const availability = await checkAvailabilityMutation.mutateAsync(
        lootBox.id
      );

      if (!availability.canOpen) {
        alert(availability.message || "Cannot open loot box at this time");
        setIsOpening(false);
        return;
      }

      // For free loot boxes that require ads, show ad first
      if (lootBox.type === "Free" && lootBox.adRequired) {
        const adWatched = await showAd(
          lootBox.adProvider,
          lootBox.adPlacementId
        );
        if (!adWatched) {
          alert("Ad must be watched to open this loot box");
          setIsOpening(false);
          return;
        }
      }

      // Open the loot box
      await openLootBoxMutation.mutateAsync({
        adData: lootBox.adRequired
          ? {
              adPlacementId: lootBox.adPlacementId,
              adProvider: lootBox.adProvider,
              adRewardId: crypto.randomUUID(),
              adWatched: true
            }
          : undefined,
        lootBoxId: lootBox.id
      });

      setShowOpenModal(true);
    } catch (error) {
      console.error("Error opening loot box:", error);
      alert(error instanceof Error ? error.message : "Failed to open loot box");
    } finally {
      setIsOpening(false);
    }
  };

  const showAd = async (
    provider?: string,
    placementId?: string
  ): Promise<boolean> => {
    if (!provider || !placementId) {
      return false;
    }

    const adConfig: AdConfig = {
      adFormat: "rewarded",
      placementId,
      provider
    };

    try {
      // Use real ad service if enabled, otherwise fallback to mock
      if (adServiceEnabled) {
        const isAvailable = await realAdService.isAdAvailable(provider);
        if (!isAvailable) {
          console.warn("Ad not available from real service, using mock");
          return await adService
            .showRewardedAd(adConfig)
            .then((result) => result.success);
        }

        const result = await realAdService.showRewardedAd(adConfig);
        if (result.success) {
          console.log(
            `Ad watched successfully! Reward: ${result.rewardAmount} coins`
          );
        }
        return result.success;
      }
      // Fallback to mock service
      const isAvailable = await adService.isAdAvailable(adConfig);
      if (!isAvailable) {
        return false;
      }

      const result = await adService.showRewardedAd(adConfig);
      return result.success;
    } catch (error) {
      console.error("Error showing ad:", error);
      return false;
    }
  };

  const getLootBoxTypeIcon = (type: string) => {
    switch (type) {
      case "Free":
        return <GiftIcon className="h-6 w-6 text-green-400" />;
      case "Premium":
        return <SparklesIcon className="h-6 w-6 text-purple-400" />;
      default:
        return <GiftIcon className="h-6 w-6 text-gray-400" />;
    }
  };

  const getRewardTypeIcon = (type: string) => {
    switch (type) {
      case "Coins":
        return <CurrencyDollarIcon className="h-5 w-5 text-yellow-400" />;
      case "NFT":
        return <CubeIcon className="h-5 w-5 text-blue-400" />;
      case "Crypto":
        return <CurrencyDollarIcon className="h-5 w-5 text-green-400" />;
      case "Experience":
        return <TrophyIcon className="h-5 w-5 text-blue-400" />;
      case "Achievement":
        return <TrophyIcon className="h-5 w-5 text-yellow-400" />;
      default:
        return <GiftIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getLootBoxStatus = (lootBox: LootBox) => {
    const cooldown = cooldownStatus?.find(
      (c: any) => c.lootBoxId === lootBox.id
    );
    const dailyLimit = dailyLimitStatus?.find(
      (d: any) => d.lootBoxId === lootBox.id
    );

    if (cooldown && !cooldown.isAvailable) {
      return {
        canOpen: false,
        message: `Available in ${Math.ceil((new Date(cooldown.nextAvailableAt).getTime() - Date.now()) / 60000)} minutes`,
        status: "cooldown"
      };
    }

    if (dailyLimit && dailyLimit.remaining === 0) {
      return {
        canOpen: false,
        message: "Daily limit reached",
        status: "limit"
      };
    }

    if (lootBox.requiresPremium) {
      return {
        canOpen: false,
        message: "Premium subscription required",
        status: "premium"
      };
    }

    return {
      canOpen: true,
      message: "Ready to open",
      status: "available"
    };
  };

  const formatTimeRemaining = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff <= 0) return "Available now";

    const minutes = Math.ceil(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className={`mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 ${className}`}>
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-[#00FFFF]/20 to-[#FF00FF]/20">
            <GiftIcon className="h-8 w-8 text-[#00FFFF]" />
          </div>
          <div>
            <h1 className="font-bold text-4xl text-white">Loot Boxes</h1>
            <p className="text-gray-400 text-lg">
              Open loot boxes to earn rewards and coins
            </p>
          </div>
        </div>

        {/* User Type Toggle for Testing */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">User Type:</span>
            <select
              aria-label="Select user type"
              className="rounded-lg bg-gray-800 px-3 py-1 text-white"
              onChange={(e) =>
                setUserType(e.target.value as "guest" | "standard" | "premium")
              }
              value={userType}
            >
              <option value="guest">Guest</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          {adServiceEnabled ? (
            <div className="inline-flex items-center gap-2 rounded-lg bg-green-500/20 px-4 py-2 text-green-400">
              <div className="h-2 w-2 rounded-full bg-green-400" />
              Real Ad System Active
            </div>
          ) : (
            <button
              className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 font-semibold text-white transition-all hover:from-blue-600 hover:to-purple-700"
              onClick={initializeAdService}
              type="button"
            >
              🎯 Activate Real Ad System
            </button>
          )}
        </div>
      </div>

      {/* Loot Boxes Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {lootBoxesLoading ? (
          [...Array(6)].map((_, i) => (
            <div
              className="rounded-xl border border-[#2A2A2A] bg-[#121212] p-6"
              key={i}
            >
              <div className="animate-pulse">
                <div className="mb-4 h-12 w-12 rounded-lg bg-white/10" />
                <div className="mb-2 h-6 w-32 rounded bg-white/10" />
                <div className="mb-4 h-4 w-48 rounded bg-white/10" />
                <div className="h-10 w-full rounded bg-white/10" />
              </div>
            </div>
          ))
        ) : lootBoxes && lootBoxes.length > 0 ? (
          lootBoxes.map((lootBox: LootBox) => {
            const status = getLootBoxStatus(lootBox);
            const canAccess = canAccessLootBox(lootBox.type);
            const accessMessage = getAccessMessage(lootBox.type);

            return (
              <div
                className={`rounded-xl border p-6 transition-all ${
                  canAccess
                    ? "border-[#2A2A2A] bg-[#121212] hover:border-[#00FFFF]/30"
                    : "border-gray-600 bg-gray-900/50 opacity-60"
                }`}
                key={lootBox.id}
              >
                {/* Header */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5">
                      {getLootBoxTypeIcon(lootBox.type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">
                        {lootBox.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-1 font-medium text-xs ${
                            lootBox.type === "Free"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-purple-500/20 text-purple-400"
                          }`}
                        >
                          {lootBox.type}
                        </span>
                        {lootBox.requiresPremium && (
                          <span className="rounded-full bg-purple-500/20 px-2 py-1 font-medium text-purple-400 text-xs">
                            Premium
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {lootBox.description && (
                  <p className="mb-4 text-gray-400 text-sm">
                    {lootBox.description}
                  </p>
                )}

                {/* Rewards Preview */}
                <div className="mb-4">
                  <h4 className="mb-2 font-medium text-sm text-white">
                    Possible Rewards:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {lootBox.type === "Free" ? (
                      <div className="flex items-center gap-1 rounded-full bg-yellow-500/20 px-2 py-1">
                        <CurrencyDollarIcon className="h-3 w-3 text-yellow-400" />
                        <span className="text-xs text-yellow-400">
                          {lootBox.minCoinReward}-{lootBox.maxCoinReward}{" "}
                          {lootBox.coinType}
                        </span>
                      </div>
                    ) : (
                      lootBox.rewards.slice(0, 3).map((reward) => (
                        <div
                          className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1"
                          key={reward.id}
                        >
                          {getRewardTypeIcon(reward.rewardType)}
                          <span className="text-white text-xs">
                            {JSON.parse(reward.rewardValue).amount || "1"}{" "}
                            {reward.rewardType}
                          </span>
                        </div>
                      ))
                    )}
                    {lootBox.rewards.length > 3 && (
                      <div className="rounded-full bg-white/10 px-2 py-1">
                        <span className="text-white text-xs">
                          +{lootBox.rewards.length - 3} more
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status and Info */}
                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <ClockIcon className="h-4 w-4" />
                    <span>{lootBox.cooldownMinutes}m cooldown</span>
                  </div>
                  {lootBox.maxOpensPerDay && (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <GiftIcon className="h-4 w-4" />
                      <span>{lootBox.maxOpensPerDay}/day limit</span>
                    </div>
                  )}
                  {lootBox.adRequired && (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <EyeIcon className="h-4 w-4" />
                      <span>Ad required</span>
                    </div>
                  )}
                </div>

                {/* Status Message */}
                <div className="mb-4">
                  <div
                    className={`flex items-center gap-2 text-sm ${
                      canAccess
                        ? status.status === "available"
                          ? "text-green-400"
                          : "text-yellow-400"
                        : "text-gray-400"
                    }`}
                  >
                    {canAccess ? (
                      <>
                        {status.status === "cooldown" && (
                          <ClockIcon className="h-4 w-4" />
                        )}
                        {status.status === "limit" && (
                          <ExclamationTriangleIcon className="h-4 w-4" />
                        )}
                        {status.status === "premium" && (
                          <SparklesIcon className="h-4 w-4" />
                        )}
                        {status.status === "available" && (
                          <GiftIcon className="h-4 w-4" />
                        )}
                        <span>{status.message}</span>
                      </>
                    ) : (
                      <>
                        <ExclamationTriangleIcon className="h-4 w-4" />
                        <span>{accessMessage}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Open Button */}
                <button
                  className={`w-full rounded-lg px-4 py-3 font-medium transition-all ${
                    canAccess && status.canOpen && !isOpening
                      ? "bg-[#00FFFF] text-black hover:bg-[#00FFFF]/80"
                      : canAccess
                        ? "cursor-not-allowed bg-white/10 text-gray-400"
                        : userType === "guest"
                          ? "bg-blue-500 text-white hover:bg-blue-600"
                          : "bg-purple-500 text-white hover:bg-purple-600"
                  }`}
                  disabled={canAccess && (!status.canOpen || isOpening)}
                  onClick={() => handleLootBoxClick(lootBox)}
                  type="button"
                >
                  {isOpening
                    ? "Opening..."
                    : canAccess
                      ? status.canOpen
                        ? "Open Loot Box"
                        : "Not Available"
                      : userType === "guest"
                        ? "Sign Up to Access"
                        : "Upgrade to Premium"}
                </button>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center">
            <GiftIcon className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 font-medium text-white text-xl">
              No Loot Boxes Available
            </h3>
            <p className="text-gray-400">
              Check back later for new loot boxes!
            </p>
          </div>
        )}
      </div>

      {/* Opening Result Modal */}
      {showOpenModal && openingResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border border-[#2A2A2A] bg-[#121212] p-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                <GiftIcon className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="mb-4 font-bold text-white text-xl">
                {openingResult.success ? "Loot Box Opened!" : "Failed to Open"}
              </h3>

              {openingResult.success && openingResult.rewards.length > 0 ? (
                <div className="mb-6">
                  <p className="mb-4 text-gray-400">You received:</p>
                  <div className="space-y-3">
                    {openingResult.rewards.map((reward, index) => (
                      <div
                        className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
                        key={index}
                      >
                        <div className="flex items-center gap-3">
                          {getRewardTypeIcon(reward.type)}
                          <div>
                            <p className="font-medium text-white">
                              {reward.type === "coins"
                                ? `${reward.value.amount} ${reward.value.coinType} Coins`
                                : `${reward.value.amount || "1"} ${reward.type}`}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {reward.claimed ? "Claimed" : "Pending"}
                            </p>
                          </div>
                        </div>
                        {reward.claimed && (
                          <div className="rounded-full bg-green-500/20 p-1">
                            <TrophyIcon className="h-4 w-4 text-green-400" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mb-6 text-gray-400">
                  {openingResult.error || "No rewards received"}
                </p>
              )}

              {openingResult.nextAvailableAt && (
                <p className="mb-6 text-gray-400 text-sm">
                  Next available:{" "}
                  {formatTimeRemaining(openingResult.nextAvailableAt)}
                </p>
              )}

              <button
                className="w-full rounded-lg bg-[#00FFFF] px-4 py-2 font-medium text-black transition-all hover:bg-[#00FFFF]/80"
                onClick={() => {
                  setShowOpenModal(false);
                  setOpeningResult(null);
                }}
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border border-[#2A2A2A] bg-[#121212] p-6">
            <div className="mb-4 text-center">
              <GiftIcon className="mx-auto mb-2 h-12 w-12 text-blue-400" />
              <h3 className="font-bold text-white text-xl">Sign Up Required</h3>
              <p className="mt-2 text-gray-400">
                Create an account to access loot boxes and earn rewards!
              </p>
            </div>

            <div className="space-y-3">
              <button
                className="w-full rounded-lg bg-blue-500 py-3 font-semibold text-white hover:bg-blue-600"
                onClick={() => setShowLoginModal(false)}
                type="button"
              >
                Sign Up Now
              </button>
              <button
                className="w-full rounded-lg bg-gray-600 py-3 font-semibold text-white hover:bg-gray-700"
                onClick={() => setShowLoginModal(false)}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Upgrade Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border border-[#2A2A2A] bg-[#121212] p-6">
            <div className="mb-4 text-center">
              <SparklesIcon className="mx-auto mb-2 h-12 w-12 text-purple-400" />
              <h3 className="font-bold text-white text-xl">
                Upgrade to Premium
              </h3>
              <p className="mt-2 text-gray-400">
                Unlock exclusive Premium Loot Boxes with NFTs, crypto, and rare
                rewards!
              </p>
            </div>

            <div className="mb-4 rounded-lg bg-purple-500/10 p-4">
              <h4 className="mb-2 font-semibold text-purple-400">
                Premium Benefits:
              </h4>
              <ul className="space-y-1 text-gray-300 text-sm">
                <li>• Access to Premium Loot Boxes</li>
                <li>• Higher coin rewards</li>
                <li>• Exclusive NFTs</li>
                <li>• Crypto rewards (USDT, ETH)</li>
                <li>• Shorter cooldowns</li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                className="w-full rounded-lg bg-purple-500 py-3 font-semibold text-white hover:bg-purple-600"
                onClick={() => setShowPremiumModal(false)}
                type="button"
              >
                Upgrade to Premium
              </button>
              <button
                className="w-full rounded-lg bg-gray-600 py-3 font-semibold text-white hover:bg-gray-700"
                onClick={() => setShowPremiumModal(false)}
                type="button"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LootBoxHub;
