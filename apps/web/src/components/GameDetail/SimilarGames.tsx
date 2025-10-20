import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchSimilarGames, type Game } from "@/helpers/gameHub";

interface SimilarGamesProps {
  gameId: string;
  limit?: number;
}

const SimilarGames = ({ gameId, limit = 6 }: SimilarGamesProps) => {
  const [similarGames, setSimilarGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const loadSimilarGames = async () => {
      try {
        setLoading(true);
        const data = await fetchSimilarGames(gameId);
        setSimilarGames(data.games || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load similar games"
        );
        console.error("Error loading similar games:", err);
      } finally {
        setLoading(false);
      }
    };

    if (gameId) {
      void loadSimilarGames();
    }
  }, [gameId, limit]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 text-lg dark:text-white">
          Similar Games
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-2">
          {[...Array(limit)].map((_, i) => (
            <div
              className="animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
              key={i}
            >
              <div className="aspect-video rounded-t-lg bg-gray-300 dark:bg-gray-600" />
              <div className="p-3">
                <div className="mb-2 h-4 w-3/4 rounded bg-gray-300 dark:bg-gray-600" />
                <div className="h-3 w-1/2 rounded bg-gray-300 dark:bg-gray-600" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || similarGames.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900 text-lg dark:text-white">
        Similar Games
      </h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-2">
        {similarGames.map((game) => (
          <Link
            className="group block rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-gray-800 dark:hover:shadow-lg"
            key={game.id}
            to={`/gaming-dashboard/game/${game.slug}`}
          >
            <div className="aspect-video overflow-hidden rounded-t-lg bg-gray-100 dark:bg-gray-700">
              {game.thumb1Url ? (
                <img
                  alt={game.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  src={game.thumb1Url}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-2 h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <p className="text-gray-500 text-xs dark:text-gray-400">
                      No Image
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-3">
              <h4 className="mb-1 line-clamp-2 font-medium text-gray-900 text-sm group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                {game.title}
              </h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        aria-hidden="true"
                        className={`h-3 w-3 ${
                          i < Math.floor(game.rating || 0) ? "fill-current" : ""
                        }`}
                        key={i}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-gray-500 text-xs dark:text-gray-400">
                    {game.rating?.toFixed(1) || "0.0"}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-gray-500 text-xs dark:text-gray-400">
                  <svg
                    aria-hidden="true"
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                  <span>{game.playCount?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SimilarGames;
