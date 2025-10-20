/**
 * Performance-optimized game list with virtualization and lazy loading
 */

import { memo, useCallback, useMemo } from "react";
import { useComponentPerformance } from "../../hooks/usePerformanceApi";
import LoadingState from "../Shared/UI/LoadingState";
import VirtualizedList from "../Shared/UI/VirtualizedList";

interface Game {
  id: string;
  title: string;
  description: string;
  thumb1Url?: string;
  thumb2Url?: string;
  rating: number;
  playCount: number;
  likeCount: number;
  categories: Array<{ name: string; slug: string }>;
  tags: string[];
}

interface PerformanceGameListProps {
  games: Game[];
  loading?: boolean;
  onGameClick?: (game: Game) => void;
  onLike?: (gameId: string) => void;
  onPlay?: (gameId: string) => void;
  heightClass?: string; // Tailwind height class for the list container
  itemHeightClass?: string; // Tailwind height class per row
}

const PerformanceGameList = memo<PerformanceGameListProps>(
  ({
    games,
    loading = false,
    onGameClick,
    onLike,
    onPlay,
    heightClass = "h-[600px]",
    itemHeightClass = "h-[200px]"
  }) => {
    // Track component performance
    useComponentPerformance("PerformanceGameList");

    // Memoized game item renderer
    const renderGameItem = useCallback(
      (game: Game, index: number) => (
        <div
          className="group cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
          onClick={() => onGameClick?.(game)}
        >
          <div className="flex space-x-4">
            {/* Game Thumbnail */}
            <div className="flex-shrink-0">
              <div className="relative h-24 w-32 overflow-hidden rounded-lg">
                {game.thumb1Url ? (
                  <img
                    alt={game.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                    src={game.thumb1Url}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-700">
                    <span className="text-2xl">🎮</span>
                  </div>
                )}
              </div>
            </div>

            {/* Game Info */}
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-gray-900 text-lg dark:text-white">
                {game.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-gray-600 text-sm dark:text-gray-400">
                {game.description}
              </p>

              {/* Categories */}
              {game.categories.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {game.categories.slice(0, 3).map((category) => (
                    <span
                      className="rounded-full bg-blue-100 px-2 py-1 text-blue-800 text-xs dark:bg-blue-900 dark:text-blue-200"
                      key={category.slug}
                    >
                      {category.name}
                    </span>
                  ))}
                  {game.categories.length > 3 && (
                    <span className="text-gray-500 text-xs">
                      +{game.categories.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="mt-2 flex items-center space-x-4 text-gray-500 text-sm dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <span>⭐</span>
                  <span>{game.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>👥</span>
                  <span>{game.playCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>❤️</span>
                  <span>{game.likeCount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col space-y-2">
              <button
                className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay?.(game.id);
                }}
                type="button"
              >
                Play
              </button>
              <button
                className="rounded bg-gray-500 px-3 py-1 text-sm text-white hover:bg-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onLike?.(game.id);
                }}
                type="button"
              >
                Like
              </button>
            </div>
          </div>
        </div>
      ),
      [onGameClick, onLike, onPlay]
    );

    // Memoized empty state
    const emptyState = useMemo(
      () => (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-6xl">🎮</div>
            <h3 className="font-medium text-gray-900 text-lg dark:text-white">
              No games found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search or filters
            </p>
          </div>
        </div>
      ),
      []
    );

    if (loading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <LoadingState size="lg" text="Loading games..." variant="spinner" />
        </div>
      );
    }

    if (games.length === 0) {
      return emptyState;
    }

    return (
      <div className="w-full">
        <VirtualizedList
          className="rounded-lg border border-gray-200 dark:border-gray-700"
          containerHeightClass={heightClass}
          itemHeightClass={itemHeightClass}
          items={games}
          renderItem={renderGameItem}
        />
      </div>
    );
  }
);

PerformanceGameList.displayName = "PerformanceGameList";

export default PerformanceGameList;

