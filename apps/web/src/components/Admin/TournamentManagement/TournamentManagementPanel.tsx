import { Button } from "@headlessui/react";
import {
  EyeIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  StopIcon,
  TrashIcon,
  TrophyIcon
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useState } from "react";
import Card from "../../Shared/UI/Card";

interface Tournament {
  id: string;
  name: string;
  description?: string;
  entryFee?: number;
  prizePool: string;
  maxParticipants?: number;
  currentParticipants?: number;
  participantCount: number;
  status:
    | "upcoming"
    | "active"
    | "completed"
    | "cancelled"
    | "Upcoming"
    | "Active"
    | "Completed"
    | "Cancelled";
  startDate: string;
  endDate: string;
  createdAt: string;
  createdBy?: string;
  type: string;
  equilibriumMin?: number;
  equilibriumMax?: number;
  minCoins: string;
}

const TournamentManagementPanel = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  // const [showCreateTournament, setShowCreateTournament] = useState(false);
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);
  const [filter, setFilter] = useState<
    "all" | "upcoming" | "active" | "completed"
  >("all");

  // Memoized handlers to prevent unnecessary re-renders
  const handleCreateTournament = useCallback(() => {
    /* Create tournament functionality */
  }, []);

  const handleFilterChange = useCallback((filterType: string) => {
    setFilter(filterType as "all" | "upcoming" | "active" | "completed");
  }, []);

  const handleSelectTournament = useCallback((tournament: Tournament) => {
    setSelectedTournament(tournament);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedTournament(null);
  }, []);

  // Fetch tournaments
  const fetchTournaments = async () => {
    try {
      const baseApi =
        (import.meta as any).env?.VITE_API_URL || "http://localhost:8080";
      const response = await fetch(`${baseApi}/tournament-system`, {
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTournaments(data.tournaments || []);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching tournaments:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  // Filter tournaments
  const filteredTournaments = tournaments.filter((tournament) => {
    if (filter === "all") return true;
    return tournament.status.toLowerCase() === filter;
  });

  // Handle tournament actions
  const handleTournamentAction = async (
    tournamentId: string,
    action: string
  ) => {
    try {
      // For now, just refresh the tournaments list
      // TODO: Implement proper tournament actions when admin endpoints are available
      console.log(
        `Tournament action ${action} for ${tournamentId} - not implemented yet`
      );
      await fetchTournaments();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(`Error ${action} tournament:`, error);
      }
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "upcoming":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-2xl text-gray-900 dark:text-white">
          Tournament Management
        </h2>
        <Button
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={handleCreateTournament}
        >
          <PlusIcon className="h-5 w-5" />
          Create Tournament
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <TrophyIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <div className="font-bold text-2xl text-gray-900 dark:text-white">
                  {tournaments.length}
                </div>
                <div className="text-gray-500 text-sm dark:text-gray-400">
                  Total Tournaments
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <PlayIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <div className="font-bold text-2xl text-gray-900 dark:text-white">
                  {
                    tournaments.filter(
                      (t) => t.status.toLowerCase() === "active"
                    ).length
                  }
                </div>
                <div className="text-gray-500 text-sm dark:text-gray-400">
                  Active Tournaments
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <TrophyIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <div className="font-bold text-2xl text-gray-900 dark:text-white">
                  {tournaments
                    .reduce((sum, t) => sum + Number.parseInt(t.prizePool), 0)
                    .toLocaleString()}
                </div>
                <div className="text-gray-500 text-sm dark:text-gray-400">
                  Total Prize Pool
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <TrophyIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <div className="font-bold text-2xl text-gray-900 dark:text-white">
                  {tournaments.reduce((sum, t) => sum + t.participantCount, 0)}
                </div>
                <div className="text-gray-500 text-sm dark:text-gray-400">
                  Total Participants
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="flex gap-2">
            {(["all", "upcoming", "active", "completed"] as const).map(
              (filterType) => (
                <Button
                  className={`rounded-lg px-4 py-2 font-medium text-sm ${
                    filter === filterType
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  }`}
                  key={filterType}
                  onClick={() => handleFilterChange(filterType)}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </Button>
              )
            )}
          </div>
        </div>
      </Card>

      {/* Tournaments Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-300">
                  Tournament
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-300">
                  Status
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-300">
                  Participants
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-300">
                  Prize Pool
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-300">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {filteredTournaments.map((tournament) => (
                <tr
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  key={tournament.id}
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900 text-sm dark:text-white">
                        {tournament.name}
                      </div>
                      <div className="text-gray-500 text-sm dark:text-gray-400">
                        Entry: {tournament.minCoins} coins
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 font-semibold text-xs ${getStatusColor(tournament.status)}`}
                    >
                      {tournament.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-900 text-sm dark:text-white">
                    {tournament.participantCount} /{" "}
                    {tournament.maxParticipants || "∞"}
                  </td>
                  <td className="px-6 py-4 text-gray-900 text-sm dark:text-white">
                    {tournament.prizePool.toLocaleString()} coins
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm dark:text-gray-400">
                    {new Date(tournament.startDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-medium text-sm">
                    <div className="flex gap-2">
                      <Button
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        onClick={() => handleSelectTournament(tournament)}
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>

                      {tournament.status === "upcoming" && (
                        <Button
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          onClick={() =>
                            handleTournamentAction(tournament.id, "start")
                          }
                          title="Start Tournament"
                        >
                          <PlayIcon className="h-4 w-4" />
                        </Button>
                      )}

                      {tournament.status === "active" && (
                        <Button
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          onClick={() =>
                            handleTournamentAction(tournament.id, "stop")
                          }
                          title="Stop Tournament"
                        >
                          <StopIcon className="h-4 w-4" />
                        </Button>
                      )}

                      <Button
                        className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                        onClick={() => {
                          /* Edit tournament */
                        }}
                        title="Edit Tournament"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>

                      <Button
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        onClick={() =>
                          handleTournamentAction(tournament.id, "delete")
                        }
                        title="Delete Tournament"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Tournament Details Modal */}
      {selectedTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-2xl">
            <div className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <h3 className="font-semibold text-gray-900 text-lg dark:text-white">
                  {selectedTournament.name}
                </h3>
                <Button
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={handleClearSelection}
                >
                  ×
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    className="block font-medium text-gray-700 text-sm dark:text-gray-300"
                    htmlFor="tournament-description"
                  >
                    Description
                  </label>
                  <p className="text-gray-900 text-sm dark:text-white">
                    {selectedTournament.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block font-medium text-gray-700 text-sm dark:text-gray-300"
                      htmlFor="tournament-entry-fee"
                    >
                      Entry Fee
                    </label>
                    <p className="text-gray-900 text-sm dark:text-white">
                      {selectedTournament.minCoins} coins
                    </p>
                  </div>

                  <div>
                    <label
                      className="block font-medium text-gray-700 text-sm dark:text-gray-300"
                      htmlFor="tournament-prize-pool"
                    >
                      Prize Pool
                    </label>
                    <p className="text-gray-900 text-sm dark:text-white">
                      {selectedTournament.prizePool} coins
                    </p>
                  </div>

                  <div>
                    <label
                      className="block font-medium text-gray-700 text-sm dark:text-gray-300"
                      htmlFor="tournament-participants"
                    >
                      Participants
                    </label>
                    <p className="text-gray-900 text-sm dark:text-white">
                      {selectedTournament.participantCount} /{" "}
                      {selectedTournament.maxParticipants || "∞"}
                    </p>
                  </div>

                  <div>
                    <label
                      className="block font-medium text-gray-700 text-sm dark:text-gray-300"
                      htmlFor="tournament-status"
                    >
                      Status
                    </label>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 font-semibold text-xs ${getStatusColor(selectedTournament.status)}`}
                    >
                      {selectedTournament.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block font-medium text-gray-700 text-sm dark:text-gray-300"
                      htmlFor="tournament-start-date"
                    >
                      Start Date
                    </label>
                    <p className="text-gray-900 text-sm dark:text-white">
                      {new Date(selectedTournament.startDate).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <label
                      className="block font-medium text-gray-700 text-sm dark:text-gray-300"
                      htmlFor="tournament-end-date"
                    >
                      End Date
                    </label>
                    <p className="text-gray-900 text-sm dark:text-white">
                      {new Date(selectedTournament.endDate).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TournamentManagementPanel;
