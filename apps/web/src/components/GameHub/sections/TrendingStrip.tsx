import { useEffect, useState } from "react";
import { fetchGames } from "@/helpers/gameHub";

interface CardGame {
  id: string;
  slug: string;
  title: string;
  thumb1Url?: string;
}

const TrendingStrip = () => {
  const [games, setGames] = useState<CardGame[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        // Use plays count for trending instead of popular
        const data = await fetchGames({ limit: 10, sortBy: "plays" });
        setGames(
          (data.games || []).map((g) => ({
            id: g.id,
            slug: g.slug,
            thumb1Url: g.thumb1Url,
            title: g.title
          }))
        );
      } catch (e: any) {
        setError(e?.message || "Failed to load trending");
      }
    };
    load();
  }, []);

  if (error) return null;
  if (games.length === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-lg">
          <svg
            aria-label="Trending icon"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M13 10V3L4 14h7v7l9-11h-7z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
        </div>
        <div>
          <h2 className="font-bold text-gray-900 text-xl dark:text-white">
            Trending Now
          </h2>
          <p className="text-gray-600 text-sm dark:text-gray-400">
            Games that are heating up
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {games.map((g) => (
          <a
            className="group block rounded-xl bg-gray-50 p-3 transition-all duration-200 hover:scale-105 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700"
            href={`/gaming-dashboard/game/${g.slug}`}
            key={g.id}
          >
            <div className="relative mb-3 aspect-video overflow-hidden rounded-lg">
              <img
                alt={g.title || "Game thumbnail"}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                src={g.thumb1Url || ""}
              />
              <div className="absolute inset-0 bg-black/0 transition-all group-hover:bg-black/20" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-900">
                  <svg
                    aria-label="Play game"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="line-clamp-2 text-center font-medium text-gray-800 text-sm group-hover:text-gray-900 dark:text-gray-200 dark:group-hover:text-white">
              {g.title}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default TrendingStrip;
