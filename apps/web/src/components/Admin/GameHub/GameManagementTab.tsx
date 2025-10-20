import { PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { HEY_API_URL } from "@hey/data/constants";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import StatusBanner from "../../Shared/UI/StatusBanner";

interface Game {
  id: string;
  title: string;
  slug: string;
  status: "Draft" | "Published";
  gameType: "FreeToPlay" | "PlayToEarn";
  createdAt: string;
  categories: Array<{ name: string }>;
}

const GameManagementTab = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${HEY_API_URL}/games/manage`);
      if (response.ok) {
        const data = await response.json();
        setGames(data.games || []);
      }
    } catch (error) {
      console.error("Error fetching games:", error);
      toast.error("Failed to fetch games");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const handleDeleteGame = async (gameId: string) => {
    if (!confirm("Are you sure you want to delete this game?")) return;

    try {
      const response = await fetch(`${HEY_API_URL}/games/manage/${gameId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        toast.success("Game deleted successfully");
        fetchGames();
      }
    } catch (_error) {
      toast.error("Failed to delete game");
    }
  };

  return (
    <div className="space-y-6">
      <StatusBanner />
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-lg">Game Management</h3>
        <button
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          aria-label="Add Game"
          type="button"
        >
          <PlusIcon className="h-4 w-4" />
          Add Game
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center">Loading games...</div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase">
                  Game
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase">
                  Categories
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase">
                  Created
                </th>
                <th className="px-6 py-3 text-right font-medium text-gray-500 text-xs uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {games.map((game) => (
                <tr key={game.id}>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900 text-sm dark:text-white">
                        {game.title}
                      </div>
                      <div className="text-gray-500 text-sm dark:text-gray-400">
                        {game.slug}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold text-xs ${
                        game.gameType === "PlayToEarn"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      }`}
                    >
                      {game.gameType === "PlayToEarn" ? "💰 P2E" : "🎮 F2P"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 font-semibold text-xs ${
                        game.status === "Published"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {game.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {game.categories.map((category, index) => (
                        <span
                          className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-blue-800 text-xs"
                          key={index}
                        >
                          {category.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm dark:text-gray-400">
                    {new Date(game.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="text-gray-600 hover:text-gray-900"
                        aria-label={`Edit ${game.title}`}
                        type="button"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        aria-label={`Delete ${game.title}`}
                        onClick={() => handleDeleteGame(game.id)}
                        type="button"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GameManagementTab;
