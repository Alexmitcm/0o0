import { useEffect, useState } from "react";
import { Button } from "@/components/Shared/UI/Button";
import { useAccessControl } from "@/hooks/useAccessControl";
import { useGameHub } from "@/hooks/useGameHub";

interface Reward {
  id: string;
  type: "daily" | "weekly" | "achievement" | "tournament";
  title: string;
  description: string;
  amount: number;
  currency: string;
  status: "available" | "claimed" | "expired";
  claimedAt?: string;
  expiresAt?: string;
}

interface Balance {
  usdt: number;
  xp: number;
  coins: number;
}

const RewardsDashboard = () => {
  const { canAccess } = useAccessControl();
  const { coins, user, loading, refreshCoins } = useGameHub();
  const [rewards, setRewards] = useState<Reward[]>([]);

  useEffect(() => {
    const loadRewards = async () => {
      try {
        // Mock data - replace with actual API calls
        const mockRewards: Reward[] = [
          {
            amount: 5,
            currency: "USDT",
            description: "Login bonus for today",
            id: "1",
            status: "available",
            title: "Daily Login",
            type: "daily"
          },
          {
            amount: 10,
            claimedAt: "2024-01-15T10:30:00Z",
            currency: "USDT",
            description: "Play your first game",
            id: "2",
            status: "claimed",
            title: "First Game",
            type: "achievement"
          },
          {
            amount: 25,
            currency: "USDT",
            description: "Play 10 games this week",
            expiresAt: "2024-01-21T23:59:59Z",
            id: "3",
            status: "available",
            title: "Weekly Challenge",
            type: "weekly"
          }
        ];

        setRewards(mockRewards);
      } catch (error) {
        console.error("Failed to load rewards:", error);
      }
    };

    if (canAccess("canViewRewards")) {
      loadRewards();
    }
  }, [canAccess]);

  // Calculate balance from API data
  const balance: Balance = {
    coins: coins?.experienceCoins || 0,
    usdt: coins?.premiumCoins || 0, // Using premium coins as USDT equivalent
    xp: user?.totalEq || 0
  };

  const handleClaimReward = async (rewardId: string) => {
    try {
      // Mock claim - replace with actual API call
      setRewards((prev) =>
        prev.map((reward) =>
          reward.id === rewardId
            ? {
                ...reward,
                claimedAt: new Date().toISOString(),
                status: "claimed" as const
              }
            : reward
        )
      );

      // Refresh coin balance after claiming
      await refreshCoins();
    } catch (error) {
      console.error("Failed to claim reward:", error);
    }
  };

  if (!canAccess("canViewRewards")) {
    return (
      <div className="rounded-lg border border-white/10 bg-gray-800/50 p-6 text-center">
        <div className="mb-4 text-4xl">🔒</div>
        <h3 className="mb-2 font-semibold text-lg text-white">
          Rewards Dashboard
        </h3>
        <p className="mb-4 text-gray-400">
          Login to view your rewards and balance
        </p>
        <Button variant="primary">Login Now</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-white/10 bg-gray-800/50 p-6">
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-1/3 rounded bg-gray-700" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div className="h-16 rounded bg-gray-700" key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const availableRewards = rewards.filter((r) => r.status === "available");
  const claimedRewards = rewards.filter((r) => r.status === "claimed");

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-gray-800/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">USDT Balance</p>
              <p className="font-bold text-2xl text-white">{balance.usdt}</p>
            </div>
            <div className="text-2xl">💰</div>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-gray-800/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">XP Points</p>
              <p className="font-bold text-2xl text-white">{balance.xp}</p>
            </div>
            <div className="text-2xl">⭐</div>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-gray-800/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Coins</p>
              <p className="font-bold text-2xl text-white">{balance.coins}</p>
            </div>
            <div className="text-2xl">🪙</div>
          </div>
        </div>
      </div>

      {/* Available Rewards */}
      {availableRewards.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-gray-800/50 p-6">
          <h3 className="mb-4 font-semibold text-lg text-white">
            Available Rewards ({availableRewards.length})
          </h3>
          <div className="space-y-3">
            {availableRewards.map((reward) => (
              <div
                className="flex items-center justify-between rounded-lg border border-white/10 bg-gray-700/50 p-4"
                key={reward.id}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {reward.type === "daily" && "📅"}
                    {reward.type === "weekly" && "📊"}
                    {reward.type === "achievement" && "🏆"}
                    {reward.type === "tournament" && "🎮"}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{reward.title}</h4>
                    <p className="text-gray-400 text-sm">
                      {reward.description}
                    </p>
                    {reward.expiresAt && (
                      <p className="text-xs text-yellow-400">
                        Expires:{" "}
                        {new Date(reward.expiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-green-400">
                      +{reward.amount} {reward.currency}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleClaimReward(reward.id)}
                    size="sm"
                    variant="primary"
                  >
                    Claim
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Claimed Rewards */}
      {claimedRewards.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-gray-800/50 p-6">
          <h3 className="mb-4 font-semibold text-lg text-white">
            Recent Claims ({claimedRewards.length})
          </h3>
          <div className="space-y-3">
            {claimedRewards.slice(0, 5).map((reward) => (
              <div
                className="flex items-center justify-between rounded-lg border border-white/10 bg-gray-700/30 p-4 opacity-75"
                key={reward.id}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">✅</div>
                  <div>
                    <h4 className="font-semibold text-white">{reward.title}</h4>
                    <p className="text-gray-400 text-sm">
                      {reward.description}
                    </p>
                    {reward.claimedAt && (
                      <p className="text-gray-500 text-xs">
                        Claimed:{" "}
                        {new Date(reward.claimedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-400">
                    +{reward.amount} {reward.currency}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Rewards */}
      {availableRewards.length === 0 && claimedRewards.length === 0 && (
        <div className="rounded-lg border border-white/10 bg-gray-800/50 p-6 text-center">
          <div className="mb-4 text-4xl">🎁</div>
          <h3 className="mb-2 font-semibold text-lg text-white">
            No Rewards Yet
          </h3>
          <p className="mb-4 text-gray-400">
            Start playing games to earn rewards!
          </p>
          <Button variant="primary">Browse Games</Button>
        </div>
      )}
    </div>
  );
};

export default RewardsDashboard;
