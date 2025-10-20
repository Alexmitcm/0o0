import { useState } from "react";

import { Button } from "@/components/Shared/UI/Button";
import { useGameHub } from "@/hooks/useGameHub";
import { useGlobalDynamicStyles } from "@/hooks/useDynamicStyles";

import type { TournamentData } from "@/lib/api/gameHubApi";

interface TournamentSectionProps {
  className?: string;
}

const TournamentSection = ({ className = "" }: TournamentSectionProps) => {
  const { tournaments, loading, error, joinTournament } = useGameHub();
  const [joiningTournament, setJoiningTournament] = useState<string | null>(null);
  
  useGlobalDynamicStyles();

  const handleJoinTournament = async (tournamentId: string, amount: number) => {
    try {
      setJoiningTournament(tournamentId);
      await joinTournament(tournamentId, amount);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Failed to join tournament:", error);
      }
    } finally {
      setJoiningTournament(null);
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="h-8 w-1/3 animate-pulse rounded bg-gray-700" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              className="h-32 animate-pulse rounded-lg bg-gray-700"
              key={i}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`rounded-lg border border-red-500/20 bg-red-900/10 p-6 text-center ${className}`}
      >
        <div className="mb-2 text-2xl">⚠️</div>
        <h3 className="mb-2 font-semibold text-lg text-red-400">
          Error Loading Tournaments
        </h3>
        <p className="text-red-300 text-sm">{error}</p>
      </div>
    );
  }

  if (tournaments.length === 0) {
    return (
      <div
        className={`rounded-lg border border-white/10 bg-gray-800/50 p-6 text-center ${className}`}
      >
        <div className="mb-4 text-4xl">🏆</div>
        <h3 className="mb-2 font-semibold text-lg text-white">
          No Tournaments Available
        </h3>
        <p className="mb-4 text-gray-400">
          Check back later for new tournaments!
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-2xl text-white">Active Tournaments</h2>
        <div className="text-gray-400 text-sm">
          {tournaments.length} tournament{tournaments.length !== 1 ? "s" : ""} available
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tournaments.map((tournament) => (
          <TournamentCard
            isJoining={joiningTournament === tournament.id}
            key={tournament.id}
            onJoin={handleJoinTournament}
            tournament={tournament}
          />
        ))}
      </div>
    </div>
  );
};

interface TournamentCardProps {
  tournament: TournamentData;
  onJoin: (tournamentId: string, amount: number) => Promise<void>;
  isJoining: boolean;
}

const TournamentCard = ({
  tournament,
  onJoin,
  isJoining
}: TournamentCardProps) => {
  const [joinAmount, setJoinAmount] = useState(tournament.minimumCoin);

  const isDisabled =
    tournament.isDisabled ||
    tournament.coinsGathered >= tournament.storageCapacity;

  return (
    <div
      className={`rounded-lg border p-6 transition-all ${
        isDisabled
          ? "border-gray-600 bg-gray-800/30 opacity-60"
          : "border-white/10 bg-gray-800/50 hover:border-white/20"
      }`}
    >
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold text-lg text-white">
            {tournament.name || tournament.gameName}
          </h3>
          <span
            className={`rounded-full px-2 py-1 font-medium text-xs ${
              isDisabled
                ? "bg-gray-600 text-gray-300"
                : "bg-green-600 text-green-100"
            }`}
          >
            {isDisabled ? "Disabled" : "Active"}
          </span>
        </div>
        <p className="text-gray-400 text-sm">{tournament.tagForSeo}</p>
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Prize Pool:</span>
          <span className="font-semibold text-yellow-400">
            {tournament.tournamentPrize} USDT
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Coins Gathered:</span>
          <span className="font-semibold text-white">
            {tournament.coinsGathered} / {tournament.storageCapacity}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Min Entry:</span>
          <span className="font-semibold text-white">
            {tournament.minimumCoin} coins
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Min Referrals:</span>
          <span className="font-semibold text-white">
            {tournament.minimumRefer}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-1 flex justify-between text-gray-400 text-xs">
          <span>Progress</span>
          <span>
            {Math.round(
              (tournament.coinsGathered / tournament.storageCapacity) * 100
            )}
            %
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-700">
          <div
            className="tournament-progress-bar h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
            data-progress={Math.min((tournament.coinsGathered / tournament.storageCapacity) * 100, 100)}
          />
        </div>
      </div>

      {!isDisabled && (
        <div className="space-y-3">
          <div>
            <label
              className="mb-1 block text-gray-400 text-sm"
              htmlFor={`entry-amount-${tournament.id}`}
            >
              Entry Amount (coins)
            </label>
            <input
              className="w-full rounded-lg border border-white/10 bg-gray-700/50 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              id={`entry-amount-${tournament.id}`}
              max={tournament.storageCapacity - tournament.coinsGathered}
              min={tournament.minimumCoin}
              onChange={(e) => setJoinAmount(Number(e.target.value))}
              type="number"
              value={joinAmount}
            />
          </div>
          <Button
            className="w-full"
            disabled={isJoining || joinAmount < tournament.minimumCoin}
            onClick={() => onJoin(tournament.id, joinAmount)}
            variant="primary"
          >
            {isJoining ? "Joining..." : "Join Tournament"}
          </Button>
        </div>
      )}

      {isDisabled && (
        <div className="text-center">
          <p className="text-gray-500 text-sm">
            {tournament.isDisabled
              ? "Tournament is disabled"
              : "Tournament is full"}
          </p>
        </div>
      )}
    </div>
  );
};

export default TournamentSection;
