import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
// import { fa } from "date-fns/locale";
import { Calendar, Clock, Coins, Star, Trophy, Users, Zap } from "lucide-react";
import type React from "react";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  Skeleton
} from "@/components/Shared/UI";
import { Badge } from "@/components/Shared/UI/Badge";
import { Button } from "@/components/Shared/UI/Button";

interface Tournament {
  id: string;
  name: string;
  type: "Balanced" | "Unbalanced";
  status: "Upcoming" | "Active" | "Ended" | "Settled";
  startDate: string;
  endDate: string;
  prizePool: number;
  minCoins?: number;
  equilibriumMin?: number;
  equilibriumMax?: number;
  prizeTokenAddress?: string;
  chainId?: number;
  participantCount: number;
  participants: any[];
  createdAt: string;
  updatedAt: string;
}

interface TournamentResponse {
  success: boolean;
  tournaments: Tournament[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const fetchTournaments = async (
  page = 1,
  limit = 20,
  status?: string,
  type?: string
): Promise<TournamentResponse> => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    page: page.toString()
  });

  if (status) params.append("status", status);
  if (type) params.append("type", type);

  const response = await fetch(`/api/tournament-system?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch tournaments");
  }
  return response.json();
};

const TournamentList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("");
  const [type, setType] = useState<string>("");

  const { data, isLoading, error } = useQuery({
    queryFn: () => fetchTournaments(page, 20, status, type),
    queryKey: ["tournaments", page, status, type],
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Upcoming":
        return "bg-blue-100 text-blue-800";
      case "Active":
        return "bg-green-100 text-green-800";
      case "Ended":
        return "bg-gray-100 text-gray-800";
      case "Settled":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Upcoming":
        return "Upcoming";
      case "Active":
        return "Active";
      case "Ended":
        return "Ended";
      case "Settled":
        return "Settled";
      default:
        return status;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Balanced":
        return "bg-green-500";
      case "Unbalanced":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "Balanced":
        return "Balanced";
      case "Unbalanced":
        return "Unbalanced";
      default:
        return type;
    }
  };

  const isTournamentActive = (tournament: Tournament) => {
    const now = new Date();
    const startDate = new Date(tournament.startDate);
    const endDate = new Date(tournament.endDate);
    return now >= startDate && now <= endDate && tournament.status === "Active";
  };

  const isTournamentUpcoming = (tournament: Tournament) => {
    const now = new Date();
    const startDate = new Date(tournament.startDate);
    return now < startDate && tournament.status === "Upcoming";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>Error loading tournaments</p>
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

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h2 className="flex items-center justify-center gap-2 font-bold text-2xl text-gray-900">
          <Trophy className="h-6 w-6" />
          Tournaments
        </h2>
        <p className="text-gray-600">Join tournaments and win prizes</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select
          onValueChange={setStatus}
          options={[
            { label: "All Status", value: "" },
            { label: "Upcoming", value: "Upcoming" },
            { label: "Active", value: "Active" },
            { label: "Ended", value: "Ended" },
            { label: "Settled", value: "Settled" }
          ]}
          value={status}
        />

        <Select
          onValueChange={setType}
          options={[
            { label: "All Types", value: "" },
            { label: "Balanced", value: "Balanced" },
            { label: "Unbalanced", value: "Unbalanced" }
          ]}
          value={type}
        />
      </div>

      {/* Tournaments Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.tournaments.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500">
            <Trophy className="mx-auto mb-4 h-16 w-16 opacity-50" />
            <p className="text-lg">No tournaments found</p>
          </div>
        ) : (
          data.tournaments.map((tournament) => (
            <Card
              className="transition-shadow hover:shadow-lg"
              key={tournament.id}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-lg">{tournament.name}</CardTitle>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(tournament.status)}>
                        {getStatusLabel(tournament.status)}
                      </Badge>
                      <Badge
                        className={`text-white ${getTypeColor(tournament.type)}`}
                      >
                        {getTypeLabel(tournament.type)}
                      </Badge>
                    </div>
                  </div>
                  <Trophy className="h-6 w-6 text-yellow-500" />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Prize Pool */}
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">Prize:</span>
                  <span className="font-bold text-lg text-yellow-600">
                    {tournament.prizePool.toLocaleString()} coins
                  </span>
                </div>

                {/* Participants */}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Participants:</span>
                  <span className="font-bold">
                    {tournament.participantCount}
                  </span>
                </div>

                {/* Min Coins */}
                {tournament.minCoins && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">Min Coins:</span>
                    <span className="font-bold">
                      {tournament.minCoins.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Time Info */}
                <div className="space-y-2 text-gray-600 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Start:{" "}
                      {formatDistanceToNow(new Date(tournament.startDate), {
                        addSuffix: true
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      End:{" "}
                      {formatDistanceToNow(new Date(tournament.endDate), {
                        addSuffix: true
                      })}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-4">
                  {isTournamentActive(tournament) ? (
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      <Zap className="mr-2 h-4 w-4" />
                      Join Tournament
                    </Button>
                  ) : isTournamentUpcoming(tournament) ? (
                    <Button className="w-full" disabled variant="outline">
                      <Clock className="mr-2 h-4 w-4" />
                      Starting Soon
                    </Button>
                  ) : (
                    <Button className="w-full" disabled variant="outline">
                      <Trophy className="mr-2 h-4 w-4" />
                      Tournament Ended
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            size="sm"
            variant="outline"
          >
            Previous
          </Button>
          <span className="text-gray-600 text-sm">
            Page {page} of {data.pagination.totalPages}
          </span>
          <Button
            disabled={page === data.pagination.totalPages}
            onClick={() => setPage(page + 1)}
            size="sm"
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default TournamentList;
