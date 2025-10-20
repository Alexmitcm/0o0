import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/Shared/UI/Button";
import { fetchGames, type Game } from "@/helpers/gameHub";
// import { useAuthModalStore } from "@/store/persisted/useAuthModalStore";
import GuestGameCard from "./GuestGameCard";
import GuestLimitations from "./GuestLimitations";
import GuestOnboarding from "./GuestOnboarding";

const GameHubGuest = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLimitations, setShowLimitations] = useState(false);
  const navigate = useNavigate();
  // const { setShowAuthModal } = useAuthModalStore();
  const setShowAuthModal = (show: boolean) => {
    console.log("Auth modal:", show);
  };

  useEffect(() => {
    const loadFreeGames = async () => {
      try {
        setLoading(true);
        const response = await fetchGames({
          limit: 20
        });
        setGames(response.games || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load games");
      } finally {
        setLoading(false);
      }
    };

    loadFreeGames();

    // Show onboarding for first-time guests
    try {
      const hasSeenOnboarding = localStorage.getItem("guest-onboarding-seen");
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    } catch (_) {
      // storage might be disabled; skip onboarding persistence
      setShowOnboarding(true);
    }
  }, []);

  // Game click handling is now done in GuestGameCard component

  const handleLoginClick = () => {
    setShowAuthModal(true);
  };

  const handleUpgradeClick = () => {
    navigate("/premium");
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    try {
      localStorage.setItem("guest-onboarding-seen", "true");
    } catch (_) {}
  };

  const handleShowLimitations = () => {
    setShowLimitations(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] p-4">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <div className="mb-4 h-8 w-64 animate-pulse rounded bg-gray-700" />
            <div className="h-4 w-96 animate-pulse rounded bg-gray-700" />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div className="animate-pulse rounded-lg bg-gray-800 p-4" key={i}>
                <div className="mb-4 h-48 rounded bg-gray-700" />
                <div className="mb-2 h-4 rounded bg-gray-700" />
                <div className="h-3 w-3/4 rounded bg-gray-700" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#121212]">
        <div className="text-center">
          <h2 className="mb-4 font-bold text-2xl text-white">
            Failed to load games
          </h2>
          <p className="mb-6 text-gray-400">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Header with Login Prompt */}
      <div className="border-white/10 border-b bg-gradient-to-r from-purple-900/20 to-pink-900/20">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-3xl text-white">GameHub</h1>
              <p className="mt-2 text-gray-300">
                Play amazing games and earn rewards
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleShowLimitations} variant="ghost">
                Guest Info
              </Button>
              <Button onClick={handleLoginClick} variant="ghost">
                Login
              </Button>
              <Button onClick={handleUpgradeClick} variant="primary">
                Join Pro
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Free Games Section */}
        <div className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-bold text-2xl text-white">Free Games</h2>
            <div className="text-gray-400 text-sm">
              {games.length} games available
            </div>
          </div>

          {games.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {games.map((game) => (
                <GuestGameCard game={game} key={game.id} variant="default" />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="mb-4 text-gray-400 text-lg">
                No free games available
              </div>
              <p className="text-gray-500">Check back later for new games!</p>
            </div>
          )}
        </div>

        {/* Upgrade Banner */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-8">
          <div className="text-center">
            <h3 className="mb-4 font-bold text-2xl text-white">
              Unlock Premium Games
            </h3>
            <p className="mx-auto mb-6 max-w-2xl text-gray-300">
              Get access to 100+ premium games, earn real USDT rewards, and
              participate in exclusive tournaments. No ads, pure gaming
              experience.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button onClick={handleUpgradeClick} size="lg" variant="primary">
                Upgrade to Premium
              </Button>
              <Button onClick={handleLoginClick} size="lg" variant="ghost">
                Login First
              </Button>
            </div>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-gray-800/50 p-6">
            <div className="mb-3 text-2xl text-purple-400">🎮</div>
            <h4 className="mb-2 font-semibold text-lg text-white">
              Premium Games
            </h4>
            <p className="text-gray-400 text-sm">
              Access to exclusive Play-to-Earn games with real rewards
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-gray-800/50 p-6">
            <div className="mb-3 text-2xl text-purple-400">💰</div>
            <h4 className="mb-2 font-semibold text-lg text-white">
              Real Rewards
            </h4>
            <p className="text-gray-400 text-sm">
              Earn USDT by playing games and completing challenges
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-gray-800/50 p-6">
            <div className="mb-3 text-2xl text-purple-400">🏆</div>
            <h4 className="mb-2 font-semibold text-lg text-white">
              Tournaments
            </h4>
            <p className="text-gray-400 text-sm">
              Compete in tournaments with prize pools up to $10,000
            </p>
          </div>
        </div>
      </div>

      {/* Guest Onboarding Modal */}
      {showOnboarding && (
        <GuestOnboarding onComplete={handleOnboardingComplete} />
      )}

      {/* Guest Limitations Modal */}
      {showLimitations && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-4xl rounded-lg bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-2xl text-white">Guest Mode Info</h2>
              <button
                className="rounded-lg bg-gray-700 p-2 text-white hover:bg-gray-600"
                onClick={() => setShowLimitations(false)}
                type="button"
              >
                ✕
              </button>
            </div>
            <GuestLimitations />
          </div>
        </div>
      )}
    </div>
  );
};

export default GameHubGuest;
