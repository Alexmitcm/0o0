import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle, Coins, Trophy, Users } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { SimpleAlert } from "@/components/Shared/UI";
import { Button } from "@/components/Shared/UI/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/Shared/UI/Dialog";
import { Input } from "@/components/Shared/UI/Input";
import { Label } from "@/components/Shared/UI/Label";

interface TournamentJoinModalProps {
  tournament: {
    id: string;
    name: string;
    prizePool: number;
    minCoins?: number;
    participantCount: number;
    type: "Balanced" | "Unbalanced";
  };
  walletAddress: string;
  userCoins: number;
  children: React.ReactNode;
}

interface JoinTournamentData {
  tournamentId: string;
  coinsBurned: number;
}

const joinTournament = async (data: JoinTournamentData) => {
  const response = await fetch("/api/tournament-system/join", {
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error joining tournament");
  }

  return response.json();
};

const TournamentJoinModal: React.FC<TournamentJoinModalProps> = ({
  tournament,
  walletAddress,
  userCoins,
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coinsBurned, setCoinsBurned] = useState(
    tournament.minCoins?.toString() || "100"
  );
  const [isValidating, setIsValidating] = useState(false);

  const queryClient = useQueryClient();

  const joinMutation = useMutation({
    mutationFn: joinTournament,
    onError: (error: Error) => {
      toast.error(error.message);
    },
    onSuccess: (data) => {
      toast.success("Successfully joined the tournament!");
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      queryClient.invalidateQueries({
        queryKey: ["coinBalance", walletAddress]
      });
      setIsOpen(false);
      setCoinsBurned(tournament.minCoins?.toString() || "100");
    }
  });

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    const coins = Number.parseInt(coinsBurned);
    if (isNaN(coins) || coins <= 0) {
      toast.error("Invalid coin amount");
      return;
    }

    if (coins < (tournament.minCoins || 0)) {
      toast.error(`Minimum ${tournament.minCoins} coins required`);
      return;
    }

    if (coins > userCoins) {
      toast.error("Insufficient balance");
      return;
    }

    joinMutation.mutate({
      coinsBurned: coins,
      tournamentId: tournament.id
    });
  };

  const validateCoins = (value: string) => {
    const coins = Number.parseInt(value);
    if (isNaN(coins)) return false;
    if (coins < (tournament.minCoins || 0)) return false;
    if (coins > userCoins) return false;
    return true;
  };

  const isFormValid = validateCoins(coinsBurned) && !joinMutation.isPending;

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Join Tournament
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tournament Info */}
          <div className="space-y-3 rounded-lg bg-gray-50 p-4">
            <h3 className="font-semibold text-lg">{tournament.name}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-yellow-500" />
                <span>Prize:</span>
                <span className="font-bold">
                  {tournament.prizePool.toLocaleString()} coins
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span>Participants:</span>
                <span className="font-bold">{tournament.participantCount}</span>
              </div>
            </div>
            {tournament.minCoins && (
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span>
                  Minimum coins required: {tournament.minCoins.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Join Form */}
          <form className="space-y-4" onSubmit={handleJoin}>
            <div className="space-y-2">
              <Label htmlFor="coinsBurned">Coins to participate</Label>
              <div className="relative">
                <Input
                  className={`pr-10 ${
                    coinsBurned && !validateCoins(coinsBurned)
                      ? "border-red-500"
                      : coinsBurned && validateCoins(coinsBurned)
                        ? "border-green-500"
                        : ""
                  }`}
                  id="coinsBurned"
                  max={userCoins}
                  min={tournament.minCoins || 1}
                  onChange={(e) => {
                    setCoinsBurned(e.target.value);
                    setIsValidating(true);
                    setTimeout(() => setIsValidating(false), 300);
                  }}
                  type="number"
                  value={coinsBurned}
                />
                <div className="-translate-y-1/2 absolute top-1/2 right-3 transform">
                  {isValidating ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                  ) : coinsBurned && validateCoins(coinsBurned) ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : coinsBurned && !validateCoins(coinsBurned) ? (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  ) : null}
                </div>
              </div>
              <p className="text-gray-500 text-xs">
                Your balance: {userCoins.toLocaleString()} coins
              </p>
            </div>

            {/* Validation Messages */}
            {coinsBurned && !validateCoins(coinsBurned) && (
              <SimpleAlert>
                <AlertTriangle className="h-4 w-4" />
                <div>
                  {Number.parseInt(coinsBurned) < (tournament.minCoins || 0) &&
                    `Minimum ${tournament.minCoins} coins required`}
                  {Number.parseInt(coinsBurned) > userCoins &&
                    "Insufficient balance"}
                </div>
              </SimpleAlert>
            )}

            {/* Warning */}
            <SimpleAlert>
              <AlertTriangle className="h-4 w-4" />
              <div>
                ⚠️ Your coins will be burned to participate in the tournament and
                cannot be recovered.
              </div>
            </SimpleAlert>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={() => setIsOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={!isFormValid}
                type="submit"
              >
                {joinMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Joining...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Join Tournament
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TournamentJoinModal;
