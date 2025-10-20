import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/Shared/UI/Button";
import type { Game } from "@/helpers/gameHub";
import { useAccountStore } from "@/store/persisted/useAccountStore";

// import { useAuthModalStore } from "@/store/persisted/useAuthModalStore";

interface GuestGamePlayerProps {
  game: Game;
  onClose: () => void;
}

const GuestGamePlayer = ({ game, onClose }: GuestGamePlayerProps) => {
  const navigate = useNavigate();
  const { currentAccount } = useAccountStore();
  // const { setShowAuthModal } = useAuthModalStore();
  const setShowAuthModal = (show: boolean) => {
    console.log("Auth modal:", show);
  };
  const [isPlaying, setIsPlaying] = useState(false);
  const [playTime, setPlayTime] = useState(0);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const intervalRef = useRef<number | null>(null);
  useEffect(() => {
    if (isPlaying && intervalRef.current == null) {
      intervalRef.current = window.setInterval(() => {
        setPlayTime((prev) => prev + 1);
      }, 1000);
    }
    if (!isPlaying && intervalRef.current != null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current != null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    // Show upgrade prompt after 2 minutes of play
    if (playTime >= 120) {
      setShowUpgradePrompt(true);
    }
  }, [playTime]);

  const handlePlay = () => {
    if (game.gameType === "PlayToEarn") {
      setShowAuthModal(true);
      return;
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleUpgrade = () => {
    navigate("/premium");
  };

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const iframeSrc = useMemo(() => {
    try {
      const isAbsolute = /^https?:\/\//i.test(game.gameFileUrl);
      const baseApi = import.meta.env.VITE_API_URL || "http://localhost:8080";
      const urlStr = isAbsolute
        ? game.gameFileUrl
        : `${baseApi}${game.gameFileUrl}`;
      const url = new URL(urlStr, window.location.origin);
      const addr = currentAccount?.address || "guest";
      url.searchParams.set("walletaddress", addr);
      return url.toString();
    } catch (_) {
      return game.gameFileUrl;
    }
  }, [game.gameFileUrl, currentAccount?.address]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-6xl rounded-lg bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-white/10 border-b p-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🎮</div>
            <div>
              <h2 className="font-bold text-white text-xl">{game.title}</h2>
              <p className="text-gray-400 text-sm">
                {game.gameType === "FreeToPlay"
                  ? "Free to Play"
                  : "Premium Game"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isPlaying && (
              <div className="text-sm text-white">
                Play Time: {formatTime(playTime)}
              </div>
            )}
            <button
              aria-label="Close player"
              className="rounded-lg bg-gray-700 p-2 text-white hover:bg-gray-600"
              onClick={onClose}
              onKeyDown={(e) => {
                if (e.key === "Enter") onClose();
              }}
              type="button"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Game Area */}
        <div className="relative">
          {isPlaying ? (
            <div className="relative">
              {/* Game Frame */}
              <div className="h-96 bg-gray-800">
                <iframe
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  className="h-full w-full rounded-lg"
                  loading="lazy"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-downloads"
                  src={iframeSrc}
                  title={game.title}
                />
              </div>

              {/* Game Controls */}
              <div className="absolute right-4 bottom-4 left-4">
                <div className="flex items-center justify-between rounded-lg bg-black/50 p-3">
                  <div className="flex items-center gap-3">
                    <button
                      className="rounded-lg bg-gray-700 px-4 py-2 text-white hover:bg-gray-600"
                      onClick={handlePause}
                      type="button"
                    >
                      {isPlaying ? "Pause" : "Resume"}
                    </button>
                    <div className="text-sm text-white">
                      {formatTime(playTime)}
                    </div>
                  </div>

                  <div className="text-sm text-white">
                    Guest Mode - Limited Time
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-96 items-center justify-center bg-gray-800">
              <div className="text-center">
                <div className="mb-6 text-6xl">🎮</div>
                <h3 className="mb-4 font-bold text-2xl text-white">
                  {game.title}
                </h3>
                <p className="mb-6 text-gray-400">
                  {game.description || "Click play to start the game"}
                </p>

                {game.gameType === "PlayToEarn" ? (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
                      <div className="mb-2 text-2xl">⭐</div>
                      <h4 className="mb-2 font-semibold text-white">
                        Premium Game
                      </h4>
                      <p className="text-gray-400 text-sm">
                        This game requires a premium account to play
                      </p>
                    </div>
                    <div className="flex justify-center gap-3">
                      <Button onClick={handleUpgrade} variant="primary">
                        Upgrade to Premium
                      </Button>
                      <Button onClick={handleLogin} variant="ghost">
                        Login First
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button onClick={handlePlay} size="lg" variant="primary">
                    Play Free Game
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Upgrade Prompt Overlay */}
        {showUpgradePrompt && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="mx-4 max-w-md rounded-lg bg-gray-800 p-6 text-center">
              <div className="mb-4 text-4xl">⏰</div>
              <h3 className="mb-2 font-bold text-white text-xl">Time's Up!</h3>
              <p className="mb-6 text-gray-400">
                You've played for {formatTime(playTime)}. Upgrade to Premium for
                unlimited play time!
              </p>

              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={handleUpgrade}
                  variant="primary"
                >
                  Upgrade to Premium
                </Button>
                <Button
                  className="w-full"
                  onClick={handleLogin}
                  variant="ghost"
                >
                  Login to Continue
                </Button>
                <button
                  className="text-gray-400 text-sm hover:text-white"
                  onClick={() => setShowUpgradePrompt(false)}
                  type="button"
                >
                  Continue as Guest (Limited)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Guest Limitations Notice */}
        <div className="border-white/10 border-t p-4">
          <div className="flex items-center justify-between">
            <div className="text-gray-400 text-sm">
              <span className="text-yellow-400">⚠️</span> Guest Mode - Limited
              features
            </div>
            <div className="flex gap-2">
              <Button onClick={handleLogin} size="sm" variant="ghost">
                Login
              </Button>
              <Button onClick={handleUpgrade} size="sm" variant="primary">
                Upgrade
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestGamePlayer;
