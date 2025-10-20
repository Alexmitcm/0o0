import { HEY_API_URL } from "@hey/data/constants";
import { hydrateAuthTokens } from "@/store/persisted/useAuthStore";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";

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
  participants: Array<{
    id: string;
    walletAddress: string;
    coinsBurned: string;
    prizeAmount?: string;
    prizeShareBps?: number;
  }>;
}

const TournamentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [coinsToBurn, setCoinsToBurn] = useState("");

  useEffect(() => {
    if (id) {
      fetchTournament();
    }
  }, [id]);

  const fetchTournament = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${HEY_API_URL}/tournaments/${id}`);
      if (!response.ok) throw new Error("Failed to fetch tournament");

      const data = await response.json();
      setTournament(data.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch tournament"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTournament = async () => {
    if (!tournament || !coinsToBurn) return;

    try {
      setJoining(true);
      const { accessToken } = hydrateAuthTokens();
      if (!accessToken) {
        throw new Error("Please sign in to join the tournament");
      }
      const response = await fetch(
        `${HEY_API_URL}/tournaments/${tournament.id}/join`,
        {
          body: JSON.stringify({
            coinsBurned: coinsToBurn
          }),
          headers: {
            "Content-Type": "application/json",
            "X-Access-Token": accessToken
          },
          credentials: "include",
          method: "POST"
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to join tournament");
      }

      toast.success("Successfully joined tournament!");
      setCoinsToBurn("");
      fetchTournament(); // Refresh tournament data
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to join tournament"
      );
    } finally {
      setJoining(false);
    }
  };

  const getStatusColor = (status: string) => {
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

  const getTypeColor = (type: string) => {
    return type === "Balanced"
      ? "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
      : "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
  };

  const formatPrizePool = (prizePool: string) => {
    const amount = Number.parseFloat(prizePool);
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(2)}`;
  };

  const formatCoins = (coins: string) => {
    const amount = Number.parseFloat(coins);
    return amount.toLocaleString();
  };

  const canJoin = tournament?.status === "Active";
  const now = new Date();
  const startDate = tournament ? new Date(tournament.startDate) : null;
  const endDate = tournament ? new Date(tournament.endDate) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Loading tournament...
        </span>
      </div>
    );
  }

  if (error || !tournament) {
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
          Tournament not found
        </h3>
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          {error || "The tournament you're looking for doesn't exist."}
        </p>
        <Link
          className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 font-medium text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          to="/tournaments"
        >
          Back to Tournaments
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          className="mb-4 inline-flex items-center text-gray-600 text-sm hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          to="/tournaments"
        >
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M15 19l-7-7 7-7"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
          Back to Tournaments
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="mb-4 font-bold text-3xl text-gray-900 dark:text-gray-100">
              {tournament.name}
            </h1>
            <div className="mb-4 flex items-center space-x-3">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 font-medium text-sm ${getTypeColor(tournament.type)}`}
              >
                {tournament.type}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 font-medium text-sm ${getStatusColor(tournament.status)}`}
              >
                {tournament.status}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="mb-1 font-bold text-4xl text-green-600 dark:text-green-400">
              {formatPrizePool(tournament.prizePool)}
            </div>
            <div className="text-gray-600 text-sm dark:text-gray-400">
              Prize Pool
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Tournament Info */}
          <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
            <h2 className="mb-4 font-semibold text-gray-900 text-xl dark:text-gray-100">
              Tournament Details
            </h2>
            <div className="space-y-4">
              <div className="flex items-center text-gray-600 text-sm dark:text-gray-400">
                <svg
                  className="mr-3 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
                <div>
                  <div className="font-medium">Duration</div>
                  <div>
                    {startDate?.toLocaleDateString()} -{" "}
                    {endDate?.toLocaleDateString()}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {now < startDate!
                      ? `Starts ${formatDistanceToNow(startDate!, { addSuffix: true })}`
                      : now > endDate!
                        ? `Ended ${formatDistanceToNow(endDate!, { addSuffix: true })}`
                        : `Ends ${formatDistanceToNow(endDate!, { addSuffix: true })}`}
                  </div>
                </div>
              </div>

              {tournament.minCoins && (
                <div className="flex items-center text-gray-600 text-sm dark:text-gray-400">
                  <svg
                    className="mr-3 h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                  <div>
                    <div className="font-medium">Minimum Coins</div>
                    <div>{formatCoins(tournament.minCoins)} coins</div>
                  </div>
                </div>
              )}

              {(tournament.equilibriumMin || tournament.equilibriumMax) && (
                <div className="flex items-center text-gray-600 text-sm dark:text-gray-400">
                  <svg
                    className="mr-3 h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                  <div>
                    <div className="font-medium">Equilibrium Range</div>
                    <div>
                      {tournament.equilibriumMin || "∞"} -{" "}
                      {tournament.equilibriumMax || "∞"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Join Tournament */}
          {canJoin && (
            <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <h2 className="mb-4 font-semibold text-gray-900 text-xl dark:text-gray-100">
                Join Tournament
              </h2>
              <div className="space-y-4">
                <div>
                  <label
                    className="mb-2 block font-medium text-gray-700 text-sm dark:text-gray-300"
                    htmlFor="coins-to-burn"
                  >
                    Coins to Burn
                  </label>
                  <input
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    id="coins-to-burn"
                    onChange={(e) => setCoinsToBurn(e.target.value)}
                    placeholder="Enter amount of coins to burn"
                    type="number"
                    value={coinsToBurn}
                  />
                  {tournament.minCoins && (
                    <p className="mt-1 text-gray-500 text-sm">
                      Minimum required: {formatCoins(tournament.minCoins)} coins
                    </p>
                  )}
                </div>
                <button
                  className="w-full rounded-md bg-green-600 px-4 py-2 font-medium text-sm text-white transition-colors duration-200 hover:bg-green-700 disabled:bg-gray-400"
                  disabled={joining || !coinsToBurn}
                  onClick={handleJoinTournament}
                >
                  {joining ? "Joining..." : "Join Tournament"}
                </button>
              </div>
            </div>
          )}

          {/* Participants */}
          <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
            <h2 className="mb-4 font-semibold text-gray-900 text-xl dark:text-gray-100">
              Participants ({tournament.participants.length})
            </h2>
            {tournament.participants.length === 0 ? (
              <p className="py-4 text-center text-gray-500 dark:text-gray-400">
                No participants yet
              </p>
            ) : (
              <div className="space-y-3">
                {tournament.participants
                  .sort(
                    (a, b) =>
                      Number.parseFloat(b.coinsBurned) -
                      Number.parseFloat(a.coinsBurned)
                  )
                  .map((participant, index) => (
                    <div
                      className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700"
                      key={participant.id}
                    >
                      <div className="flex items-center">
                        <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-medium text-blue-800 text-sm dark:bg-blue-900/20 dark:text-blue-400">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {participant.walletAddress.slice(0, 6)}...
                            {participant.walletAddress.slice(-4)}
                          </div>
                          <div className="text-gray-500 text-sm dark:text-gray-400">
                            {formatCoins(participant.coinsBurned)} coins burned
                          </div>
                        </div>
                      </div>
                      {participant.prizeAmount && (
                        <div className="text-right">
                          <div className="font-medium text-green-600 dark:text-green-400">
                            {formatPrizePool(participant.prizeAmount)}
                          </div>
                          <div className="text-gray-500 text-sm dark:text-gray-400">
                            {participant.prizeShareBps
                              ? `${(participant.prizeShareBps / 100).toFixed(2)}%`
                              : ""}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
            <h3 className="mb-4 font-semibold text-gray-900 text-lg dark:text-gray-100">
              Quick Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Participants
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {tournament.participants.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Total Coins Burned
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatCoins(
                    tournament.participants
                      .reduce(
                        (sum, p) => sum + Number.parseFloat(p.coinsBurned),
                        0
                      )
                      .toString()
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Type</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {tournament.type}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentDetail;
