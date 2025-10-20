import { Button } from "@headlessui/react";
import {
  ChartBarIcon,
  CpuChipIcon,
  EyeIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  StopIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import { useEffect, useId, useState } from "react";
import Card from "../../Shared/UI/Card";

interface Game {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  status: string;
  playCount: number;
  likeCount: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
  gameUrl?: string;
  isActive?: boolean;
}

interface GameStats {
  totalGames: number;
  activeGames: number;
  totalPlays: number;
  totalLikes: number;
  averageRating: number;
  popularGame: string;
  recentActivity: number;
}

const GameHubManagementPanel = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  // const [showAddGame, setShowAddGame] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  // Generate unique IDs for form elements
  const gameDescriptionId = useId();
  const gameCategoryId = useId();
  const gameStatusId = useId();
  const gamePlaysId = useId();
  const gameRatingId = useId();
  const gameUrlId = useId();

  // Fetch games and stats
  const fetchData = async () => {
    try {
      // For now, use mock data since there are no public game endpoints
      const mockGames = [
        {
          category: "Strategy",
          createdAt: "2024-01-15T10:30:00Z",
          description: "Classic chess game with AI opponents",
          id: "1",
          likeCount: 89,
          playCount: 1250,
          rating: 4.5,
          slug: "chess-master",
          status: "active",
          title: "Chess Master",
          updatedAt: "2024-10-15T14:20:00Z"
        },
        {
          category: "Board Games",
          createdAt: "2024-02-10T09:15:00Z",
          description: "Traditional backgammon with modern graphics",
          id: "2",
          likeCount: 67,
          playCount: 890,
          rating: 4.2,
          slug: "backgammon-pro",
          status: "active",
          title: "Backgammon Pro",
          updatedAt: "2024-10-10T11:45:00Z"
        },
        {
          category: "Adventure",
          createdAt: "2024-03-05T16:20:00Z",
          description: "Mining adventure with treasure hunting",
          id: "3",
          likeCount: 156,
          playCount: 2100,
          rating: 4.7,
          slug: "gold-miner",
          status: "active",
          title: "Gold Miner",
          updatedAt: "2024-10-12T13:30:00Z"
        },
        {
          category: "Puzzle",
          createdAt: "2024-04-12T12:00:00Z",
          description: "Puzzle game with color sorting mechanics",
          id: "4",
          likeCount: 234,
          playCount: 3400,
          rating: 4.8,
          slug: "liquid-sort",
          status: "active",
          title: "Liquid Sort",
          updatedAt: "2024-10-14T09:15:00Z"
        },
        {
          category: "Arcade",
          createdAt: "2024-05-20T14:30:00Z",
          description: "Build the tallest stack possible",
          id: "5",
          likeCount: 98,
          playCount: 1800,
          rating: 4.1,
          slug: "stack-builder",
          status: "maintenance",
          title: "Stack Builder",
          updatedAt: "2024-10-08T16:45:00Z"
        },
        {
          category: "Adventure",
          createdAt: "2024-06-08T11:45:00Z",
          description: "Find hidden treasures in mysterious locations",
          id: "6",
          likeCount: 189,
          playCount: 2750,
          rating: 4.6,
          slug: "treasure-hunt",
          status: "active",
          title: "Treasure Hunt",
          updatedAt: "2024-10-16T10:20:00Z"
        }
      ];

      const mockStats = {
        activeGames: 5,
        averageRating: 4.48,
        popularGame: "Liquid Sort",
        recentActivity: 45,
        totalGames: 6,
        totalLikes: 833,
        totalPlays: 12190
      };

      setGames(mockGames);
      setStats(mockStats);
    } catch (error) {
      console.error("Error fetching game data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter games
  const filteredGames = games.filter((game) => {
    const matchesSearch =
      game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || game.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = [
    "all",
    ...Array.from(new Set(games.map((g) => g.category)))
  ];

  // Handle game actions
  const handleGameAction = async (gameId: string, action: string) => {
    // For now, just show a message that this feature requires admin authentication
    alert(
      `Game action "${action}" requires admin authentication. This will be implemented when proper admin endpoints are available.`
    );

    // TODO: Implement proper game actions when admin endpoints are available
    console.log("Game action requested:", action, "for game:", gameId);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-2xl text-gray-900 dark:text-white">
          Game Hub Management
        </h2>
        <Button
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={() => {
            /* Add game functionality */
          }}
        >
          <PlusIcon className="h-5 w-5" />
          Add Game
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <CpuChipIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <div className="font-bold text-2xl text-gray-900 dark:text-white">
                    {stats.totalGames}
                  </div>
                  <div className="text-gray-500 text-sm dark:text-gray-400">
                    Total Games
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <PlayIcon className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <div className="font-bold text-2xl text-gray-900 dark:text-white">
                    {stats.activeGames}
                  </div>
                  <div className="text-gray-500 text-sm dark:text-gray-400">
                    Active Games
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <ChartBarIcon className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <div className="font-bold text-2xl text-gray-900 dark:text-white">
                    {stats.totalPlays.toLocaleString()}
                  </div>
                  <div className="text-gray-500 text-sm dark:text-gray-400">
                    Total Plays
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <ChartBarIcon className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <div className="font-bold text-2xl text-gray-900 dark:text-white">
                    {stats.averageRating.toFixed(1)}
                  </div>
                  <div className="text-gray-500 text-sm dark:text-gray-400">
                    Avg Rating
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <input
                  className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search games..."
                  type="text"
                  value={searchTerm}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <CpuChipIcon className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="md:w-48">
              <select
                aria-label="Select category"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setSelectedCategory(e.target.value)}
                value={selectedCategory}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Games Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredGames.map((game) => (
          <Card key={game.id}>
            <div className="p-4">
              <div className="mb-4">
                <img
                  alt={game.title}
                  className="h-32 w-full rounded-lg object-cover"
                  src={game.thumbnail || "/placeholder-game.png"}
                />
              </div>

              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 text-lg dark:text-white">
                  {game.title}
                </h3>
                <p className="text-gray-600 text-sm dark:text-gray-400">
                  {game.description}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 font-semibold text-xs ${
                      game.status === "active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    {game.status === "active" ? "Active" : "Inactive"}
                  </span>
                  <span className="rounded-full bg-blue-100 px-2 py-1 font-semibold text-blue-800 text-xs dark:bg-blue-900 dark:text-blue-200">
                    {game.category}
                  </span>
                </div>
              </div>

              <div className="mb-4 flex items-center justify-between text-gray-500 text-sm dark:text-gray-400">
                <span>{game.playCount} plays</span>
                <span>⭐ {game.rating.toFixed(1)}</span>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
                  onClick={() => setSelectedGame(game)}
                >
                  <EyeIcon className="h-4 w-4" />
                </Button>

                <Button
                  className="rounded-lg bg-green-600 px-3 py-2 text-white hover:bg-green-700"
                  onClick={() =>
                    handleGameAction(
                      game.id,
                      game.status === "active" ? "deactivate" : "activate"
                    )
                  }
                >
                  {game.status === "active" ? (
                    <StopIcon className="h-4 w-4" />
                  ) : (
                    <PlayIcon className="h-4 w-4" />
                  )}
                </Button>

                <Button
                  className="rounded-lg bg-yellow-600 px-3 py-2 text-white hover:bg-yellow-700"
                  onClick={() => {
                    /* Edit game */
                  }}
                >
                  <PencilIcon className="h-4 w-4" />
                </Button>

                <Button
                  className="rounded-lg bg-red-600 px-3 py-2 text-white hover:bg-red-700"
                  onClick={() => handleGameAction(game.id, "delete")}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Game Details Modal */}
      {selectedGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-2xl">
            <div className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <h3 className="font-semibold text-gray-900 text-lg dark:text-white">
                  {selectedGame.title}
                </h3>
                <Button
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={() => setSelectedGame(null)}
                >
                  ×
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <img
                    alt={selectedGame.title}
                    className="h-48 w-full rounded-lg object-cover"
                    src={selectedGame.thumbnail || "/placeholder-game.png"}
                  />
                </div>

                <div>
                  <label
                    className="block font-medium text-gray-700 text-sm dark:text-gray-300"
                    htmlFor={gameDescriptionId}
                  >
                    Description
                  </label>
                  <p
                    className="text-gray-900 text-sm dark:text-white"
                    id={gameDescriptionId}
                  >
                    {selectedGame.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block font-medium text-gray-700 text-sm dark:text-gray-300"
                      htmlFor={gameCategoryId}
                    >
                      Category
                    </label>
                    <p
                      className="text-gray-900 text-sm dark:text-white"
                      id={gameCategoryId}
                    >
                      {selectedGame.category}
                    </p>
                  </div>

                  <div>
                    <label
                      className="block font-medium text-gray-700 text-sm dark:text-gray-300"
                      htmlFor={gameStatusId}
                    >
                      Status
                    </label>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 font-semibold text-xs ${
                        selectedGame.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                      id={gameStatusId}
                    >
                      {selectedGame.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div>
                    <label
                      className="block font-medium text-gray-700 text-sm dark:text-gray-300"
                      htmlFor={gamePlaysId}
                    >
                      Play Count
                    </label>
                    <p
                      className="text-gray-900 text-sm dark:text-white"
                      id={gamePlaysId}
                    >
                      {selectedGame.playCount.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <label
                      className="block font-medium text-gray-700 text-sm dark:text-gray-300"
                      htmlFor={gameRatingId}
                    >
                      Rating
                    </label>
                    <p
                      className="text-gray-900 text-sm dark:text-white"
                      id={gameRatingId}
                    >
                      ⭐ {selectedGame.rating.toFixed(1)}
                    </p>
                  </div>
                </div>

                <div>
                  <label
                    className="block font-medium text-gray-700 text-sm dark:text-gray-300"
                    htmlFor={gameUrlId}
                  >
                    Game URL
                  </label>
                  <a
                    className="text-blue-600 text-sm hover:underline dark:text-blue-400"
                    href={selectedGame.gameUrl}
                    id={gameUrlId}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {selectedGame.gameUrl}
                  </a>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GameHubManagementPanel;
