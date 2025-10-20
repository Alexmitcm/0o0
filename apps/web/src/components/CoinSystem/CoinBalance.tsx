import { useQuery } from "@tanstack/react-query";
import { Award, Coins, Crown, TrendingUp, Users } from "lucide-react";
import type React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/Shared/UI";
import { Button } from "@/components/Shared/UI/Button";
import { Skeleton } from "@/components/Shared/UI/Skeleton";

interface CoinBalanceProps {
  walletAddress: string;
}

interface UserData {
  walletAddress: string;
  username: string;
  displayName: string;
  coins: number;
  experienceCoins: number;
  achievementCoins: number;
  socialCoins: number;
  premiumCoins: number;
  staminaLevel: number;
  todaysPoints: number;
  hasTournaments: boolean;
  tournamentIds: string[];
}

const fetchUserData = async (walletAddress: string): Promise<UserData> => {
  const response = await fetch(`/api/coin-system/${walletAddress}`);
  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }
  const data = await response.json();
  return data.user;
};

const CoinBalance: React.FC<CoinBalanceProps> = ({ walletAddress }) => {
  const { data: stamina, isLoading: staminaLoading } = useQuery({
    queryFn: async () => {
      const res = await fetch(`/api/coin-system/stamina/${walletAddress}`);
      if (!res.ok) throw new Error("Failed to fetch stamina");
      return res.json();
    },
    queryKey: ["stamina", walletAddress],
    staleTime: 30000
  });
  const {
    data: userData,
    isLoading,
    error
  } = useQuery({
    queryFn: () => fetchUserData(walletAddress),
    queryKey: ["coinBalance", walletAddress],
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            <Skeleton className="h-6 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>Error loading coin information</p>
            <Button
              className="mt-2"
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userData) return null;

  const coinTypes = [
    {
      color: "bg-blue-500",
      description: "Your total coin balance",
      icon: Coins,
      name: "Total Coins",
      value: userData.coins
    },
    {
      color: "bg-green-500",
      description: "Coins earned from gameplay",
      icon: TrendingUp,
      name: "Experience",
      value: userData.experienceCoins
    },
    {
      color: "bg-yellow-500",
      description: "Achievement coins",
      icon: Award,
      name: "Achievement",
      value: userData.achievementCoins
    },
    {
      color: "bg-purple-500",
      description: "Social activity coins",
      icon: Users,
      name: "Social",
      value: userData.socialCoins
    },
    {
      color: "bg-orange-500",
      description: "Premium exclusive coins",
      icon: Crown,
      name: "Premium",
      value: userData.premiumCoins
    }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Coin Balance
        </CardTitle>
        <p className="text-gray-600 text-sm">
          {userData.displayName || userData.username} -{" "}
          {userData.walletAddress.slice(0, 6)}...
          {userData.walletAddress.slice(-4)}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Coins</p>
                <p className="font-bold text-2xl">
                  {userData.coins.toLocaleString()}
                </p>
              </div>
              <Coins className="h-8 w-8 opacity-80" />
            </div>
          </div>

          <div className="rounded-lg bg-gradient-to-r from-green-500 to-green-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Stamina</p>
                <p className="font-bold text-2xl">
                  {staminaLoading
                    ? "..."
                    : `${stamina.remainingStamina}/${stamina.maxStamina}`}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 opacity-80" />
            </div>
          </div>

          <div className="rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Today's Points</p>
                <p className="font-bold text-2xl">{userData.todaysPoints}</p>
              </div>
              <Award className="h-8 w-8 opacity-80" />
            </div>
          </div>
        </div>

        {/* Coin Types */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {coinTypes.map((coinType) => {
            const IconComponent = coinType.icon;
            return (
              <div
                className="rounded-lg border p-4 transition-shadow hover:shadow-md"
                key={coinType.name}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-full p-2 ${coinType.color} text-white`}
                  >
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{coinType.name}</p>
                    <p className="font-bold text-2xl text-gray-900">
                      {coinType.value.toLocaleString()}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {coinType.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tournament Status */}
        {userData.hasTournaments && (
          <div className="rounded-lg border border-orange-300 bg-gradient-to-r from-orange-100 to-orange-200 p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-orange-600" />
              <p className="font-medium text-orange-800">
                You have participated in {userData.tournamentIds.length}{" "}
                tournaments
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CoinBalance;
