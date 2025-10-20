import { HEY_API_URL } from "@hey/data/constants";
import { useEffect, useState } from "react";
import TournamentCard from "./TournamentCard";

interface Tournament {
  id: string;
  name: string;
  type: "Balanced" | "Unbalanced";
  status: "Upcoming" | "Active" | "Ended" | "Settled";
  startDate: string;
  endDate: string;
  prizePool: string;
  minCoins?: string;
  equilibriumMin?: number;
  equilibriumMax?: number;
  participants?: Array<{
    id: string;
    walletAddress: string;
    coinsBurned: string;
    prizeAmount?: string;
  }>;
}

const TournamentList = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<{
    type?: string;
    status?: string;
  }>({});

  useEffect(() => {
    fetchTournaments();
  }, [filter]);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.type) params.append("type", filter.type);
      if (filter.status) params.append("status", filter.status);

      const response = await fetch(`${HEY_API_URL}/tournaments?${params}`);
      if (!response.ok) throw new Error("Failed to fetch tournaments");

      const data = await response.json();
      setTournaments(data.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch tournaments"
      );
    } finally {
      setLoading(false);
    }
  };

  const _getStatusColor = (status: string) => {
    switch (status) {
      case "Upcoming":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "Ended":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "Settled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const _getTypeColor = (type: string) => {
    return type === "Balanced"
      ? "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
      : "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Loading tournaments...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <div className="mb-4 text-red-600 dark:text-red-400">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
        </div>
        <h3 className="mb-2 font-medium text-gray-900 text-lg dark:text-gray-100">
          Error loading tournaments
        </h3>
        <p className="mb-4 text-gray-600 dark:text-gray-400">{error}</p>
        <button
          className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 font-medium text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          onClick={fetchTournaments}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="mb-2 font-bold text-3xl text-gray-900 dark:text-gray-100">
          Tournaments
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Compete in tournaments and win prizes based on your performance
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label
            className="mb-1 block font-medium text-gray-700 text-sm dark:text-gray-300"
            htmlFor="type-filter"
          >
            Type
          </label>
          <select
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            id="type-filter"
            onChange={(e) =>
              setFilter({ ...filter, type: e.target.value || undefined })
            }
            value={filter.type || ""}
          >
            <option value="">All Types</option>
            <option value="Balanced">Balanced</option>
            <option value="Unbalanced">Unbalanced</option>
          </select>
        </div>
        <div>
          <label
            className="mb-1 block font-medium text-gray-700 text-sm dark:text-gray-300"
            htmlFor="status-filter"
          >
            Status
          </label>
          <select
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            id="status-filter"
            onChange={(e) =>
              setFilter({ ...filter, status: e.target.value || undefined })
            }
            value={filter.status || ""}
          >
            <option value="">All Status</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Active">Active</option>
            <option value="Ended">Ended</option>
            <option value="Settled">Settled</option>
          </select>
        </div>
      </div>

      {/* Tournaments Grid */}
      {tournaments.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mb-4 text-gray-400 dark:text-gray-500">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </div>
          <h3 className="mb-2 font-medium text-gray-900 text-lg dark:text-gray-100">
            No tournaments found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {Object.keys(filter).length > 0
              ? "Try adjusting your filters to see more tournaments."
              : "Check back later for new tournaments."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TournamentList;
