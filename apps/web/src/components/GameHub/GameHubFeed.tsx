import { type InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import { fetchGames, type Game } from "@/helpers/gameHub";
import ErrorBoundary from "../Shared/ErrorBoundary";
import GameCard from "./GameCard";
import GameCardSkeleton from "./GameCardSkeleton";

interface GameHubFeedProps {
  category: string;
  search: string;
  source?: string;
  sortBy: "newest" | "popular" | "rating" | "plays";
  featured: boolean;
}

interface GamesPageResult {
  games: Game[];
  pagination: {
    hasNextPage: boolean;
    page: number;
  };
}

const GameHubFeed = ({
  category,
  search,
  source,
  sortBy,
  featured
}: GameHubFeedProps) => {
  const PAGE_SIZE = 12;

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery<
    GamesPageResult,
    Error,
    GamesPageResult,
    [string, string, number, string, typeof sortBy, string, number],
    number
  >({
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage
        ? lastPage.pagination.page + 1
        : undefined,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchGames({
        category,
        featured,
        limit: PAGE_SIZE,
        page: pageParam,
        search,
        sortBy,
        source
      }),
    queryKey: [
      "games",
      category || "",
      featured ? 1 : 0,
      search || "",
      sortBy,
      source || "",
      PAGE_SIZE
    ]
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-white/10" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              className={`animate-fade-in-up stagger-${(i % 5) + 1}`}
              key={i}
            >
              <GameCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400">
            <svg
              aria-hidden="true"
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </div>
          <h3 className="mb-2 font-semibold text-lg text-white">
            Failed to load games
          </h3>
          <p className="text-gray-400">
            Please try again later or check your connection
          </p>
        </div>
      </div>
    );
  }

  const pagesData = data as unknown as
    | InfiniteData<GamesPageResult>
    | undefined;
  const games: Game[] = pagesData?.pages.flatMap((p) => p.games) ?? [];

  if (!games || games.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-gray-300">
            <svg
              aria-hidden="true"
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </div>
          <h3 className="mb-2 font-semibold text-lg text-white">
            No games found
          </h3>
          <p className="text-gray-400">
            Try adjusting your search or filters to discover more games
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF00FF]/20 text-[#FF00FF]">
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </div>
          <div>
            <p className="font-medium text-white">
              Results loaded: {games.length}
            </p>
            {category && (
              <p className="text-gray-400 text-sm">
                in{" "}
                <span className="font-medium text-[#FF00FF]">{category}</span>
              </p>
            )}
          </div>
        </div>

        {/* Total pages unknown across combined pages in client; omit for now */}
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game: Game, index: number) => (
          <div
            className={`animate-fade-in-up stagger-${(index % 5) + 1}`}
            key={game.id}
          >
            <ErrorBoundary
              fallback={
                <div className="rounded-lg bg-red-50 p-4 text-center dark:bg-red-900/20">
                  <p className="text-red-600 text-sm dark:text-red-400">
                    Failed to load game card
                  </p>
                </div>
              }
            >
              <GameCard game={game} />
            </ErrorBoundary>
          </div>
        ))}
      </div>

      {hasNextPage && (
        <div className="flex justify-center pt-8">
          <button
            aria-label="Load more games"
            className="btn-animate hover-glow rounded-xl bg-[#FF00FF] px-6 py-3 font-medium text-black shadow-md transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#FF00FF]/40 disabled:opacity-60"
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
            onKeyDown={(e) => {
              if (e.key === "Enter") fetchNextPage();
            }}
            tabIndex={0}
            type="button"
          >
            {isFetchingNextPage ? "Loading..." : "Load More Games"}
          </button>
        </div>
      )}
    </div>
  );
};

export default GameHubFeed;
