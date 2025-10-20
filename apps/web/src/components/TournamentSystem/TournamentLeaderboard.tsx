import { useQuery } from "@tanstack/react-query";
import { Award, Coins, Crown, Medal, Trophy, Users } from "lucide-react";
import type React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton
} from "@/components/Shared/UI";

interface TournamentLeaderboardProps {
  tournamentId: string;
}

interface Participant {
  id: string;
  walletAddress: string;
  coinsBurned: number;
  prizeAmount?: number;
  prizeShareBps?: number;
  eligibilityType: string;
  createdAt: string;
  updatedAt: string;
  user: {
    walletAddress: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
}

interface LeaderboardResponse {
  success: boolean;
  participants: Participant[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const fetchTournamentParticipants = async (
  tournamentId: string,
  page = 1,
  limit = 50
): Promise<LeaderboardResponse> => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    page: page.toString()
  });

  const response = await fetch(
    `/api/tournament-system/${tournamentId}/participants?${params}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch tournament participants");
  }
  return response.json();
};

const TournamentLeaderboard: React.FC<TournamentLeaderboardProps> = ({
  tournamentId
}) => {
  const { data, isLoading, error } = useQuery({
    queryFn: () => fetchTournamentParticipants(tournamentId, 1, 50),
    queryKey: ["tournamentParticipants", tournamentId],
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Award className="h-5 w-5 text-orange-500" />;
      default:
        return (
          <span className="font-bold text-gray-500 text-sm">#{index + 1}</span>
        );
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
      case 1:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
      case 2:
        return "bg-gradient-to-r from-orange-400 to-orange-600 text-white";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            <Skeleton className="h-6 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <div
              className="flex items-center space-x-4 rounded-lg border p-3"
              key={i}
            >
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>Error loading leaderboard</p>
            <button
              className="mt-2 rounded border px-4 py-2 hover:bg-gray-50"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Tournament Leaderboard
        </CardTitle>
        <p className="text-gray-600 text-sm">
          {data.participants.length} participants
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.participants.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <Trophy className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>No one has joined this tournament yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.participants.map((participant, index) => (
              <div
                className={`flex items-center space-x-4 rounded-lg border p-4 transition-all hover:shadow-md ${
                  index < 3 ? "ring-2 ring-opacity-50" : ""
                } ${
                  index === 0
                    ? "ring-yellow-400"
                    : index === 1
                      ? "ring-gray-400"
                      : index === 2
                        ? "ring-orange-400"
                        : ""
                }`}
                key={participant.id}
              >
                {/* Rank */}
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${getRankColor(index)}`}
                >
                  {getRankIcon(index)}
                </div>

                {/* User Info */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="truncate font-semibold text-gray-900">
                      {participant.user.displayName ||
                        participant.user.username}
                    </h3>
                    {index < 3 && <Crown className="h-4 w-4 text-yellow-500" />}
                  </div>
                  <p className="truncate text-gray-500 text-sm">
                    @{participant.user.username}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {participant.walletAddress.slice(0, 6)}...
                    {participant.walletAddress.slice(-4)}
                  </p>
                </div>

                {/* Stats */}
                <div className="space-y-1 text-right">
                  <div className="flex items-center gap-1">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    <span className="font-bold text-lg">
                      {participant.coinsBurned.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs">Coins burned</p>
                  {participant.prizeAmount && (
                    <div className="flex items-center gap-1">
                      <Trophy className="h-3 w-3 text-green-500" />
                      <span className="font-medium text-green-600 text-sm">
                        {participant.prizeAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {data.participants.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span>Total participants:</span>
                <span className="font-bold">{data.participants.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-yellow-500" />
                <span>Total coins:</span>
                <span className="font-bold">
                  {data.participants
                    .reduce((sum, p) => sum + p.coinsBurned, 0)
                    .toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TournamentLeaderboard;
