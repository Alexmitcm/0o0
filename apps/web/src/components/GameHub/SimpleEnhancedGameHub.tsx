import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import { fetchGames, type Game } from "@/helpers/gameHub";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import GameCard from "./GameCard";

const SimpleEnhancedGameHub = () => {
  const { currentAccount } = useAccountStore();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");

  const categorySelectId = useId();
  const sortSelectId = useId();

  useEffect(() => {
    const loadGames = async () => {
      try {
        setLoading(true);
        const response = await fetchGames({
          featured: true,
          limit: 50,
          sortBy: sortBy as "popular" | "newest" | "rating"
        });
        setGames(response.games);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load games");
      } finally {
        setLoading(false);
      }
    };

    loadGames();
  }, [sortBy]);

  const filteredGames = games.filter((game) => {
    const matchesSearch = game.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      game.categories?.some((cat) => cat.slug === selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: "all", name: "All Games", slug: "all" },
    { id: "action", name: "Action", slug: "action" },
    { id: "strategy", name: "Strategy", slug: "strategy" },
    { id: "puzzle", name: "Puzzle", slug: "puzzle" },
    { id: "arcade", name: "Arcade", slug: "arcade" }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 font-bold text-3xl text-gray-900 dark:text-white">
          Gaming Hub
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Discover and play amazing games in the metaverse
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <input
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 pl-10 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search games..."
            type="text"
            value={searchQuery}
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <svg
              aria-hidden="true"
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <label
              className="font-medium text-gray-700 text-sm dark:text-gray-300"
              htmlFor={categorySelectId}
            >
              Category:
            </label>
            <select
              aria-label="Filter games by category"
              className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-gray-900 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              id={categorySelectId}
              onChange={(e) => setSelectedCategory(e.target.value)}
              value={selectedCategory}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Filter */}
          <div className="flex items-center space-x-2">
            <label
              className="font-medium text-gray-700 text-sm dark:text-gray-300"
              htmlFor={sortSelectId}
            >
              Sort by:
            </label>
            <select
              aria-label="Sort games by criteria"
              className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-gray-900 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              id={sortSelectId}
              onChange={(e) => setSortBy(e.target.value)}
              value={sortBy}
            >
              <option value="popular">Most Popular</option>
              <option value="newest">Newest</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* User Account Info */}
      {currentAccount?.address && (
        <div className="mb-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white">
              {currentAccount.address.slice(2, 4).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Welcome back!
              </p>
              <p className="text-blue-700 text-sm dark:text-blue-300">
                {currentAccount.address.slice(0, 6)}...
                {currentAccount.address.slice(-4)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Games Grid */}
      <div className="space-y-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div
                className="animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
                key={i}
              >
                <div className="aspect-video rounded-t-lg bg-gray-300 dark:bg-gray-600" />
                <div className="p-4">
                  <div className="mb-2 h-4 w-3/4 rounded bg-gray-300 dark:bg-gray-600" />
                  <div className="h-3 w-1/2 rounded bg-gray-300 dark:bg-gray-600" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <svg
                aria-hidden="true"
                className="h-8 w-8 text-red-600 dark:text-red-400"
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
            <h3 className="mb-2 font-semibold text-gray-900 text-lg dark:text-white">
              Error loading games
            </h3>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
            <button
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              onClick={() => window.location.reload()}
              type="button"
            >
              Try Again
            </button>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <svg
                aria-hidden="true"
                className="h-8 w-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </div>
            <h3 className="mb-2 font-semibold text-gray-900 text-lg dark:text-white">
              No games found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery || selectedCategory !== "all"
                ? "Try adjusting your search or filters"
                : "Check back later for new games!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredGames.map((game) => (
              <GameCard game={game} key={game.id} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-12 rounded-lg bg-gray-50 p-6 dark:bg-gray-800">
        <h2 className="mb-4 font-semibold text-gray-900 text-lg dark:text-white">
          Quick Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            className="flex items-center space-x-3 rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-gray-700"
            to="/gaming-dashboard/submit"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400">
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Submit Game
              </p>
              <p className="text-gray-600 text-sm dark:text-gray-400">
                Share your creation
              </p>
            </div>
          </Link>

          <Link
            className="flex items-center space-x-3 rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-gray-700"
            to="/tournaments"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400">
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Tournaments
              </p>
              <p className="text-gray-600 text-sm dark:text-gray-400">
                Compete for prizes
              </p>
            </div>
          </Link>

          <Link
            className="flex items-center space-x-3 rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-gray-700"
            to="/leaderboard"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Leaderboard
              </p>
              <p className="text-gray-600 text-sm dark:text-gray-400">
                Top players
              </p>
            </div>
          </Link>

          <Link
            className="flex items-center space-x-3 rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-gray-700"
            to="/lootbox"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400">
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Loot Box
              </p>
              <p className="text-gray-600 text-sm dark:text-gray-400">
                Open rewards
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SimpleEnhancedGameHub;
