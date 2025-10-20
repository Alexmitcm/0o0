import { useEffect, useState } from "react";
import { fetchGames, type Game } from "@/helpers/gameHub";

const PremiumGamingDashboard = () => {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [games, setGames] = useState<Game[]>([]);
  const [_loading, setLoading] = useState(true);

  // Load real games from API
  useEffect(() => {
    const loadGames = async () => {
      try {
        setLoading(true);
        const response = await fetchGames({
          featured: true,
          limit: 12,
          sortBy: "popular"
        });
        setGames(response.games);
      } catch (error) {
        console.error("Failed to load games:", error);
        // Fallback to mock data if API fails
        setGames([
          {
            categories: [{ id: "1", name: "Strategy", slug: "strategy" }],
            createdAt: new Date().toISOString(),
            dislikeCount: 0,
            gameFileUrl: "",
            gameType: "PlayToEarn",
            height: 600,
            id: "1",
            isFeatured: true,
            likeCount: 0,
            playCount: 12500,
            rating: 4.8,
            ratingCount: 0,
            slug: "crypto-miner-tycoon",
            source: "local",
            status: "Published",
            tags: [],
            thumb1Url: "🎮",
            thumb2Url: "",
            title: "Crypto Miner Tycoon",
            updatedAt: new Date().toISOString(),
            width: 800
          }
        ] as Game[]);
      } finally {
        setLoading(false);
      }
    };

    loadGames();
  }, []);

  const tasks = [
    {
      completed: true,
      icon: "📅",
      id: 1,
      title: "Daily Login"
    },
    {
      completed: false,
      icon: "🎯",
      id: 2,
      title: "Complete 3 Games"
    },
    {
      completed: false,
      icon: "🏆",
      id: 3,
      title: "Win a Tournament"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #ffd700 2px, transparent 2px),
                           radial-gradient(circle at 75% 75%, #ffd700 2px, transparent 2px)`,
            backgroundSize: "100px 100px"
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 border-yellow-500/20 border-b bg-black/40 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center justify-between">
            {/* User Profile */}
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-yellow-300 bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-2xl shadow-yellow-500/50">
                  <span className="text-3xl">👑</span>
                </div>
                <div className="-bottom-2 -right-2 absolute rounded-full border-2 border-white bg-yellow-500 px-3 py-1 font-bold text-black text-xs">
                  LVL 2
                </div>
              </div>

              <div>
                <h1 className="mb-1 font-bold text-2xl text-white">
                  Gamer Pro
                </h1>
                <p className="font-medium text-sm text-yellow-400">
                  XP: 12,450 / 15,000
                </p>
                <div className="mt-2 h-2 w-32 overflow-hidden rounded-full bg-gray-700">
                  <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600" />
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex space-x-8">
              <div className="text-center">
                <div className="font-bold text-2xl text-white">47</div>
                <div className="text-gray-300 text-sm">Games Played</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-2xl text-white">23</div>
                <div className="text-gray-300 text-sm">Wins</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-2xl text-white">1,250</div>
                <div className="text-gray-300 text-sm">Coins</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 py-12">
        {/* Navigation Tabs */}
        <div className="mb-8 flex space-x-1 rounded-lg bg-black/20 p-1 backdrop-blur-sm">
          {[
            { icon: "🏠", id: "home", label: "Home" },
            { icon: "🎮", id: "games", label: "Games" },
            { icon: "🏆", id: "tournaments", label: "Tournaments" },
            { icon: "🎁", id: "rewards", label: "Rewards" }
          ].map((tab) => (
            <button
              className={`flex items-center space-x-2 rounded-md px-4 py-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "bg-yellow-500 text-black"
                  : "text-gray-300 hover:text-white"
              }`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "home" && (
          <div className="space-y-8">
            {/* Daily Tasks */}
            <div className="rounded-xl bg-black/20 p-6 backdrop-blur-sm">
              <h2 className="mb-4 font-bold text-white text-xl">Daily Tasks</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {tasks.map((task) => (
                  <div
                    className={`flex items-center space-x-3 rounded-lg p-4 ${
                      task.completed
                        ? "border-green-500/30 bg-green-500/20"
                        : "border-gray-600/30 bg-gray-800/50"
                    } border`}
                    key={task.id}
                  >
                    <span className="text-2xl">{task.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-white">{task.title}</div>
                      <div className="text-gray-400 text-sm">
                        {task.completed ? "Completed" : "In Progress"}
                      </div>
                    </div>
                    {task.completed && <div className="text-green-400">✓</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Games */}
            <div className="rounded-xl bg-black/20 p-6 backdrop-blur-sm">
              <h2 className="mb-4 font-bold text-white text-xl">
                Featured Games
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {games.slice(0, 6).map((game) => (
                  <div
                    className="group cursor-pointer overflow-hidden rounded-lg bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-sm transition-transform hover:scale-105"
                    key={game.id}
                    onClick={() => {
                      setSelectedGame(game);
                      setShowModal(true);
                    }}
                  >
                    <div className="aspect-video bg-gradient-to-br from-purple-500 to-blue-500 p-4">
                      <div className="flex h-full items-center justify-center">
                        <span className="text-4xl">
                          {game.thumb1Url || "🎮"}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-white">{game.title}</h3>
                      <p className="text-gray-300 text-sm">
                        {game.playCount.toLocaleString()} plays
                      </p>
                      <div className="mt-2 flex items-center space-x-2">
                        <div className="flex text-yellow-400">
                          {"★".repeat(Math.floor(game.rating))}
                        </div>
                        <span className="text-gray-400 text-sm">
                          {game.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "games" && (
          <div className="rounded-xl bg-black/20 p-6 backdrop-blur-sm">
            <h2 className="mb-4 font-bold text-white text-xl">All Games</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {games.map((game) => (
                <div
                  className="group cursor-pointer overflow-hidden rounded-lg bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-sm transition-transform hover:scale-105"
                  key={game.id}
                  onClick={() => {
                    setSelectedGame(game);
                    setShowModal(true);
                  }}
                >
                  <div className="aspect-video bg-gradient-to-br from-purple-500 to-blue-500 p-4">
                    <div className="flex h-full items-center justify-center">
                      <span className="text-4xl">{game.thumb1Url || "🎮"}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-white">{game.title}</h3>
                    <p className="text-gray-300 text-sm">
                      {game.playCount.toLocaleString()} plays
                    </p>
                    <div className="mt-2 flex items-center space-x-2">
                      <div className="flex text-yellow-400">
                        {"★".repeat(Math.floor(game.rating))}
                      </div>
                      <span className="text-gray-400 text-sm">
                        {game.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "tournaments" && (
          <div className="rounded-xl bg-black/20 p-6 backdrop-blur-sm">
            <h2 className="mb-4 font-bold text-white text-xl">Tournaments</h2>
            <div className="text-center text-gray-400">
              <p>No active tournaments at the moment.</p>
              <p className="mt-2 text-sm">
                Check back later for exciting competitions!
              </p>
            </div>
          </div>
        )}

        {activeTab === "rewards" && (
          <div className="rounded-xl bg-black/20 p-6 backdrop-blur-sm">
            <h2 className="mb-4 font-bold text-white text-xl">Rewards</h2>
            <div className="text-center text-gray-400">
              <p>No rewards available at the moment.</p>
              <p className="mt-2 text-sm">
                Complete tasks and play games to earn rewards!
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Game Modal */}
      {showModal && selectedGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 max-w-2xl rounded-xl bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-white text-xl">
                {selectedGame.title}
              </h3>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="aspect-video bg-gradient-to-br from-purple-500 to-blue-500 p-4">
              <div className="flex h-full items-center justify-center">
                <span className="text-6xl">
                  {selectedGame.thumb1Url || "🎮"}
                </span>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-gray-300">
                <strong>Plays:</strong>{" "}
                {selectedGame.playCount.toLocaleString()}
              </p>
              <p className="text-gray-300">
                <strong>Rating:</strong> {selectedGame.rating.toFixed(1)}/5.0
              </p>
              <p className="text-gray-300">
                <strong>Type:</strong> {selectedGame.gameType}
              </p>
            </div>
            <div className="mt-6 flex space-x-4">
              <button className="flex-1 rounded-lg bg-yellow-500 px-4 py-2 font-bold text-black hover:bg-yellow-400">
                Play Now
              </button>
              <button
                className="rounded-lg border border-gray-600 px-4 py-2 text-white hover:bg-gray-700"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumGamingDashboard;
