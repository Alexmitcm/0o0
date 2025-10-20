import { useEffect, useState } from "react";
import { gameHubApi } from "../../../lib/api/gameHubApi";

interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isDisabled: boolean;
  equilibriumMax: number;
  equilibriumMin: number;
  prizePool: number;
  participants: number;
  status: "upcoming" | "ongoing" | "ended";
}

interface TournamentTableProps {
  className?: string;
}

const TournamentTable = ({ className = "" }: TournamentTableProps) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await gameHubApi.getAllTournaments();
        if (response.success) {
          const normalized = (response.data as any[]).map((t) => ({
            equilibriumMax: 0,
            equilibriumMin: 0,
            participants: 0,
            ...t
          }));
          setTournaments(normalized as Tournament[]);
        }
      } catch (err) {
        setError("Failed to fetch tournaments");
        console.error("Error fetching tournaments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  const handleDisableTournament = async (tournamentId: string) => {
    try {
      const response = await gameHubApi.disableTournament(tournamentId);
      if (response.success) {
        setTournaments((prev) =>
          prev.map((t) =>
            t.id === tournamentId ? { ...t, isDisabled: true } : t
          )
        );
      }
    } catch (err) {
      console.error("Error disabling tournament:", err);
    }
  };

  const handleDownloadCSV = () => {
    // Implement CSV download functionality
    console.log("Downloading CSV...");
  };

  const handleSendToContract = () => {
    // Implement send to contract functionality
    console.log("Sending to contract...");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "ongoing":
        return "bg-green-100 text-green-800";
      case "ended":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isOngoing = (tournament: Tournament) => {
    const now = new Date();
    const endDate = new Date(tournament.endDate);
    return now < endDate && !tournament.isDisabled;
  };

  if (loading) {
    return (
      <div className={`flex h-64 items-center justify-center ${className}`}>
        <div className="h-12 w-12 animate-spin rounded-full border-blue-500 border-b-2" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 text-center text-red-500 ${className}`}>
        Error loading tournaments: {error}
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}
    >
      <div className="border-gray-200 border-b p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-lg">Tournaments</h3>
          <div className="flex space-x-2">
            <button
              className="rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={handleDownloadCSV}
            >
              Download CSV
            </button>
            <button
              className="rounded-md border border-transparent bg-blue-600 px-4 py-2 font-medium text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={handleSendToContract}
            >
              Send to Contract
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Tournament Name
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Start Date
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                End Date
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Equilibrium Range
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Prize Pool
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Participants
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {tournaments.map((tournament) => (
              <tr className="hover:bg-gray-50" key={tournament.id}>
                <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900 text-sm">
                  {tournament.name}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-gray-500 text-sm">
                  {formatDate(tournament.startDate)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-gray-500 text-sm">
                  {formatDate(tournament.endDate)}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 font-semibold text-xs ${getStatusColor(tournament.status)}`}
                  >
                    {tournament.isDisabled ? "Disabled" : tournament.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-gray-500 text-sm">
                  {tournament.equilibriumMin} - {tournament.equilibriumMax}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-gray-500 text-sm">
                  {tournament.prizePool} USDT
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-gray-500 text-sm">
                  {tournament.participants}
                </td>
                <td className="whitespace-nowrap px-6 py-4 font-medium text-sm">
                  <div className="flex space-x-2">
                    <button
                      className="text-blue-600 hover:text-blue-900"
                      onClick={() =>
                        console.log("View players for", tournament.id)
                      }
                    >
                      Players
                    </button>
                    {isOngoing(tournament) && (
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDisableTournament(tournament.id)}
                      >
                        Disable
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TournamentTable;
