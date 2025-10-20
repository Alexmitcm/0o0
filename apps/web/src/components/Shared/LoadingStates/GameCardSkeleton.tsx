import { memo } from "react";

interface GameCardSkeletonProps {
  variant?: "default" | "compact" | "featured";
}

const GameCardSkeleton = ({ variant = "default" }: GameCardSkeletonProps) => {
  if (variant === "compact") {
    return (
      <div className="group hover-lift relative overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-200 hover:shadow-md dark:bg-gray-800">
        <div className="flex">
          {/* Compact Thumbnail Skeleton */}
          <div className="relative h-20 w-24 overflow-hidden">
            <div className="h-full w-full animate-pulse bg-gray-300 dark:bg-gray-600" />
          </div>

          {/* Compact Info Skeleton */}
          <div className="flex-1 p-3">
            <div className="mb-1 h-4 w-3/4 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
            <div className="flex items-center gap-2">
              <div className="h-3 w-12 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
              <div className="h-3 w-1 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
              <div className="h-3 w-8 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
              <div className="h-3 w-1 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
              <div className="h-3 w-10 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group hover-lift relative overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-2xl dark:bg-gray-800 ${
        variant === "featured" ? "animate-glow ring-2 ring-yellow-400" : ""
      }`}
    >
      {/* Game Thumbnail Skeleton */}
      <div className="relative aspect-video overflow-hidden">
        <div className="h-full w-full animate-pulse bg-gray-300 dark:bg-gray-600" />

        {/* Top Badges Skeleton */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <div className="h-6 w-16 animate-pulse rounded-full bg-gray-400 dark:bg-gray-500" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-gray-400 dark:bg-gray-500" />
        </div>

        {/* Action Buttons Skeleton */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <div className="h-8 w-8 animate-pulse rounded-full bg-gray-400 dark:bg-gray-500" />
          <div className="h-8 w-8 animate-pulse rounded-full bg-gray-400 dark:bg-gray-500" />
        </div>
      </div>

      {/* Game Info Skeleton */}
      <div className="p-6">
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-6 w-48 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
            <div className="h-6 w-12 animate-pulse rounded-full bg-gray-300 dark:bg-gray-600" />
          </div>
          <div className="h-4 w-24 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
        </div>

        <div className="mb-4 h-12 w-full animate-pulse rounded bg-gray-300 dark:bg-gray-600" />

        {/* Categories Skeleton */}
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="h-6 w-16 animate-pulse rounded-full bg-gray-300 dark:bg-gray-600" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-gray-300 dark:bg-gray-600" />
          <div className="h-6 w-14 animate-pulse rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        {/* Tags Skeleton */}
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="h-5 w-12 animate-pulse rounded-full bg-gray-300 dark:bg-gray-600" />
          <div className="h-5 w-16 animate-pulse rounded-full bg-gray-300 dark:bg-gray-600" />
          <div className="h-5 w-10 animate-pulse rounded-full bg-gray-300 dark:bg-gray-600" />
          <div className="h-5 w-14 animate-pulse rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        {/* Stats Skeleton */}
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
          <div className="h-4 w-20 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
          <div className="h-4 w-16 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
          <div className="h-4 w-18 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
          <div className="h-4 w-24 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
        </div>

        {/* Rating Stars Skeleton */}
        <div className="mb-4">
          <div className="mb-2 h-4 w-32 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <div
                key={star}
                className="h-5 w-5 animate-pulse rounded bg-gray-300 dark:bg-gray-600"
              />
            ))}
          </div>
        </div>

        {/* Footer Info Skeleton */}
        <div className="flex items-center justify-between border-gray-100 border-t pt-4 dark:border-gray-700">
          <div className="h-3 w-16 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
          <div className="h-3 w-12 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
        </div>
      </div>
    </div>
  );
};

export default memo(GameCardSkeleton);
