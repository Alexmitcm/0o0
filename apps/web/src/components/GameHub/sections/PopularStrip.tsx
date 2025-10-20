import { useEffect, useState } from "react";
import { fetchGames } from "@/helpers/gameHub";

interface CardGame {
  id: string;
  slug: string;
  title: string;
  thumb1Url?: string;
}

const PopularStrip = () => {
  const [games, setGames] = useState<CardGame[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchGames({ limit: 10, sortBy: "popular" });
        setGames(
          (data.games || []).map((g) => ({
            id: g.id,
            slug: g.slug,
            thumb1Url: g.thumb1Url,
            title: g.title
          }))
        );
      } catch (e: any) {
        setError(e?.message || "Failed to load popular");
      }
    };
    load();
  }, []);

  if (error) return null;
  if (games.length === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-400 to-purple-500 text-white shadow-lg">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
        </div>
        <div>
          <h2 className="font-bold text-gray-900 text-xl dark:text-white">
            Most Popular
          </h2>
          <p className="text-gray-600 text-sm dark:text-gray-400">
            Games everyone loves
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
                alt={g.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                src={g.thumb1Url || ""}
              />
              <div className="absolute inset-0 bg-black/0 transition-all group-hover:bg-black/20" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-900">
                  <svg
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

export default PopularStrip;
