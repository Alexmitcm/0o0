import { useState } from "react";
import { Button } from "@/components/Shared/UI/Button";
import type { Game } from "@/helpers/gameHub";
import GuestGamePlayer from "./GuestGamePlayer";

interface GuestGameCardProps {
  game: Game;
  variant?: "default" | "compact" | "featured";
  className?: string;
}

const GuestGameCard = ({
  game,
  variant = "default",
  className = ""
}: GuestGameCardProps) => {
  const [showPlayer, setShowPlayer] = useState(false);

  const getCardClasses = () => {
    const baseClasses =
      "group relative overflow-hidden rounded-lg border border-white/10 bg-gray-800/50 transition-all duration-300 hover:border-white/20 hover:bg-gray-800/70";

    switch (variant) {
      case "compact":
        return `${baseClasses} p-3`;
      case "featured":
        return `${baseClasses} p-6`;
      default:
        return `${baseClasses} p-4`;
    }
  };

  const getImageClasses = () => {
    switch (variant) {
      case "compact":
        return "h-32 w-full object-cover";
      case "featured":
        return "h-48 w-full object-cover";
      default:
        return "h-40 w-full object-cover";
    }
  };

  const getButtonSize = () => {
    switch (variant) {
      case "compact":
        return "sm" as const;
      case "featured":
        return "lg" as const;
      default:
        return "md" as const;
    }
  };

  const handlePlay = () => {
    if (game.gameType === "PlayToEarn") {
      // Show upgrade prompt for premium games
      return;
    }
    setShowPlayer(true);
  };

  const getGameStatus = () => {
    if (game.gameType === "PlayToEarn") {
      return {
        bgColor: "bg-purple-500/10",
        borderColor: "border-purple-500/30",
        color: "text-purple-400",
        icon: "⭐",
        text: "Premium Game"
      };
    }
    return {
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      color: "text-green-400",
      icon: "🎮",
      text: "Free to Play"
    };
  };

  const status = getGameStatus();

  return (
    <>
      <div className={`${getCardClasses()} ${className}`}>
        {/* Game Image */}
        <div className="relative mb-4 overflow-hidden rounded-lg">
          <img
            alt={game.title}
            className={getImageClasses()}
            src={game.thumb1Url || "/placeholder-game.jpg"}
          />

          {/* Game Type Badge */}
          <div
            className={`absolute top-2 right-2 rounded-full px-2 py-1 font-medium text-xs ${status.bgColor} ${status.color}`}
          >
            {status.icon} {status.text}
          </div>

          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
            <div className="rounded-full bg-black/50 p-3">
              <Button
                onClick={handlePlay}
                size={getButtonSize()}
                variant="primary"
              >
                {game.gameType === "PlayToEarn" ? "🔒" : "▶️"}
              </Button>
            </div>
          </div>
        </div>

        {/* Game Info */}
        <div className="space-y-2">
          <h3 className="line-clamp-1 font-semibold text-white">
            {game.title}
          </h3>

          {game.description && (
            <p className="line-clamp-2 text-gray-400 text-sm">
              {game.description}
            </p>
          )}

          {/* Game Stats */}
          <div className="flex items-center justify-between text-gray-400 text-sm">
            <div className="flex items-center gap-4">
              <span>👥 {game.playCount || 0}</span>
              <span>⭐ {game.rating || 0}</span>
            </div>
            <span className="text-xs">
              {game.gameType === "FreeToPlay" ? "Free" : "Premium"}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2">
            {game.gameType === "PlayToEarn" ? (
              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => {
                    /* Show upgrade modal */
                  }}
                  size={getButtonSize()}
                  variant="secondary"
                >
                  Upgrade to Play
                </Button>
                <p className="text-center text-gray-500 text-xs">
                  Premium game - requires upgrade
                </p>
              </div>
            ) : (
              <Button
                className="w-full"
                onClick={handlePlay}
                size={getButtonSize()}
                variant="primary"
              >
                Play Free
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Game Player Modal */}
      {showPlayer && (
        <GuestGamePlayer game={game} onClose={() => setShowPlayer(false)} />
      )}
    </>
  );
};

export default GuestGameCard;
