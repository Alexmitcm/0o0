import {
  Bars3Icon,
  GiftIcon,
  MagnifyingGlassIcon,
  PlayIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { Button } from "@/components/Shared/UI/Button";
import { useGameHub } from "@/hooks/useGameHub";
import NotificationCenter from "./NotificationCenter";

interface GameHubHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sourceQuery: string;
  onSourceChange: (q: string) => void;
  sortBy: "newest" | "popular" | "rating" | "plays";
  onSortChange: (sort: "newest" | "popular" | "rating" | "plays") => void;
  showFeatured: boolean;
  onFeaturedChange: (featured: boolean) => void;
  onOpenMenu?: () => void;
}

const GameHubHeader = ({
  searchQuery,
  onSearchChange,
  sourceQuery,
  onSourceChange,
  sortBy,
  onSortChange,
  showFeatured,
  onFeaturedChange,
  onOpenMenu
}: GameHubHeaderProps) => {
  const { user, coins } = useGameHub();
  return (
    <div className="sticky top-0 z-10 border-[#2A2A2A] border-b bg-[#121212]/80 px-3 py-4 backdrop-blur-md md:px-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        {/* Left Section - Title and Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open navigation menu"
              className="rounded-md p-2 text-gray-300 hover:text-[#00FFFF] focus:outline-none focus:ring-2 focus:ring-[#00FFFF]/40 md:hidden"
              onClick={onOpenMenu}
              type="button"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-[#00FFFF] text-black shadow-lg md:flex">
              <PlayIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-bold text-2xl text-white md:text-3xl">
                Game Hub
              </h1>
              <p className="text-gray-400 text-sm">
                Discover and play amazing HTML5 games
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              className="flex items-center gap-2 shadow-md transition-all duration-200 hover:scale-105"
              onClick={() => onFeaturedChange(!showFeatured)}
              size="sm"
              variant={showFeatured ? "primary" : "secondary"}
            >
              <SparklesIcon className="h-4 w-4" />
              Featured
            </Button>
            <Link
              className="inline-flex items-center gap-2 rounded-lg bg-[#00FFFF] px-4 py-2 font-medium text-black text-sm shadow-md transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#00FFFF]/40"
              to="/lootbox"
            >
              <GiftIcon className="h-4 w-4" />
              Loot Boxes
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-lg bg-[#FF00FF] px-4 py-2 font-medium text-black text-sm shadow-md transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#FF00FF]/40"
              to="/gaming-dashboard/demo"
            >
              <PlayIcon className="h-4 w-4" />
              View Demo
            </Link>
          </div>
        </div>

        {/* Right Section - Search and Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* User Info and Notifications */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-medium text-sm text-white">
                  {user.username || "Anonymous"}
                </div>
                <div className="text-gray-400 text-xs">
                  {coins?.experienceCoins || 0} XP • {coins?.premiumCoins || 0}{" "}
                  USDT
                </div>
              </div>
              <NotificationCenter />
            </div>
          )}
          {/* Search */}
          <div className="relative">
            <label className="sr-only" htmlFor="gh-search">
              Search games
            </label>
            <MagnifyingGlassIcon className="-translate-y-1/2 absolute top-1/2 left-3 h-5 w-5 text-gray-400" />
            <input
              aria-label="Search games"
              className="w-full rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-10 py-3 text-sm text-white shadow-sm transition-all duration-200 focus:border-[#00FFFF] focus:outline-none focus:ring-2 focus:ring-[#00FFFF]/20"
              id="gh-search"
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search games..."
              type="text"
              value={searchQuery}
            />
          </div>

          {/* Source filter */}
          <div className="relative">
            <label className="sr-only" htmlFor="gh-source">
              Source filter
            </label>
            <input
              aria-label="Source filter"
              className="w-full rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-3 text-sm text-white shadow-sm transition-all duration-200 focus:border-[#00FFFF] focus:outline-none focus:ring-2 focus:ring-[#00FFFF]/20"
              id="gh-source"
              onChange={(e) => onSourceChange(e.target.value)}
              placeholder="Source filter..."
              type="text"
              value={sourceQuery}
            />
          </div>

          {/* Sort */}
          <label className="sr-only" htmlFor="gh-sort">
            Sort by
          </label>
          <select
            aria-label="Sort by"
            className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-3 text-sm text-white shadow-sm transition-all duration-200 focus:border-[#00FFFF] focus:outline-none focus:ring-2 focus:ring-[#00FFFF]/20"
            id="gh-sort"
            onChange={(e) => onSortChange(e.target.value as any)}
            value={sortBy}
          >
            <option value="newest">Newest</option>
            <option value="popular">Popular</option>
            <option value="rating">Top Rated</option>
            <option value="plays">Most Played</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default GameHubHeader;
