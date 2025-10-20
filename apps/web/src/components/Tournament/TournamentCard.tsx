import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

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

interface TournamentCardProps {
  tournament: Tournament;
}

const TournamentCard = ({ tournament }: TournamentCardProps) => {
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

  const getTimeStatus = () => {
    const now = new Date();
    const startDate = new Date(tournament.startDate);
    const endDate = new Date(tournament.endDate);

    if (now < startDate) {
      return `Starts ${formatDistanceToNow(startDate, { addSuffix: true })}`;
    }
    if (now > endDate) {
      return `Ended ${formatDistanceToNow(endDate, { addSuffix: true })}`;
    }
    return `Ends ${formatDistanceToNow(endDate, { addSuffix: true })}`;
  };

  const canJoin = tournament.status === "Active";
  const participantCount = tournament.participants?.length || 0;

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-md transition-shadow duration-200 hover:shadow-lg dark:bg-gray-800">
      {/* Header */}
      <div className="border-gray-200 border-b p-6 dark:border-gray-700">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="mb-2 font-semibold text-gray-900 text-xl dark:text-gray-100">
              {tournament.name}
            </h3>
            <div className="mb-2 flex items-center space-x-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs ${getTypeColor(tournament.type)}`}
              >
                {tournament.type}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs ${getStatusColor(tournament.status)}`}
              >
                {tournament.status}
              </span>
            </div>
          </div>
        </div>

        {/* Prize Pool */}
        <div className="text-center">
          <div className="mb-1 font-bold text-3xl text-green-600 dark:text-green-400">
            {formatPrizePool(tournament.prizePool)}
          </div>
          <div className="text-gray-600 text-sm dark:text-gray-400">
            Prize Pool
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Time Info */}
        <div className="mb-4">
          <div className="mb-1 flex items-center text-gray-600 text-sm dark:text-gray-400">
            <svg
              className="mr-2 h-4 w-4"
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
            {getTimeStatus()}
          </div>
          <div className="text-gray-500 text-xs dark:text-gray-500">
            {new Date(tournament.startDate).toLocaleDateString()} -{" "}
            {new Date(tournament.endDate).toLocaleDateString()}
          </div>
        </div>

        {/* Requirements */}
        <div className="mb-4 space-y-2">
          {tournament.minCoins && (
            <div className="flex items-center text-gray-600 text-sm dark:text-gray-400">
              <svg
                className="mr-2 h-4 w-4"
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
              Min: {Number.parseFloat(tournament.minCoins).toLocaleString()}{" "}
              coins
            </div>
          )}
          {(tournament.equilibriumMin || tournament.equilibriumMax) && (
            <div className="flex items-center text-gray-600 text-sm dark:text-gray-400">
              <svg
                className="mr-2 h-4 w-4"
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
              Equilibrium: {tournament.equilibriumMin || "∞"} -{" "}
              {tournament.equilibriumMax || "∞"}
            </div>
          )}
        </div>

        {/* Participants */}
        <div className="mb-4 flex items-center justify-between text-gray-600 text-sm dark:text-gray-400">
          <div className="flex items-center">
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
            {participantCount} participants
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <Link
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-center font-medium text-sm text-white transition-colors duration-200 hover:bg-blue-700"
            to={`/tournaments/${tournament.id}`}
          >
            View Details
          </Link>
          {canJoin && (
            <button
              className="flex-1 rounded-md bg-green-600 px-4 py-2 font-medium text-sm text-white transition-colors duration-200 hover:bg-green-700"
              onClick={() => {
                // TODO: Implement join tournament logic
                console.log("Join tournament:", tournament.id);
              }}
            >
              Join Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentCard;
