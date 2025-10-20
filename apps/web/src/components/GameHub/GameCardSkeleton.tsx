interface GameCardSkeletonProps {
  variant?: "default" | "compact" | "featured";
}

const GameCardSkeleton = ({ variant = "default" }: GameCardSkeletonProps) => {
  if (variant === "compact") {
    return (
      <div className="group relative overflow-hidden rounded-xl bg-white shadow-sm dark:bg-gray-800">
        <div className="flex">
          {/* Compact Thumbnail Skeleton */}
          <div className="relative h-20 w-24 overflow-hidden">
            <div className="skeleton skeleton-image h-full w-full" />
          </div>

          {/* Compact Info Skeleton */}
          <div className="flex-1 p-3">
            <div className="skeleton skeleton-title w-3/4" />
            <div className="mt-1 flex items-center gap-2">
              <div className="skeleton skeleton-text w-16" />
              <div className="skeleton skeleton-text w-12" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-white shadow-lg dark:bg-gray-800 ${
        variant === "featured" ? "ring-2 ring-yellow-400" : ""
      }`}
    >
      {/* Game Thumbnail Skeleton */}
      <div className="relative aspect-video overflow-hidden">
        <div className="skeleton skeleton-image h-full w-full" />

        {/* Top Badges Skeleton */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <div className="skeleton skeleton-text h-6 w-20 rounded-full" />
          <div className="skeleton skeleton-text h-6 w-16 rounded-full" />
        </div>

        {/* Action Buttons Skeleton */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <div className="skeleton skeleton-text h-8 w-8 rounded-full" />
          <div className="skeleton skeleton-text h-8 w-8 rounded-full" />
        </div>
      </div>

      {/* Game Info Skeleton */}
      <div className="p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <div className="skeleton skeleton-title w-2/3" />
            <div className="skeleton skeleton-text h-6 w-12 rounded-full" />
          </div>

          <div className="mt-2">
            <div className="skeleton skeleton-text h-4 w-24" />
          </div>
        </div>

        <div className="mb-4">
          <div className="skeleton skeleton-text w-full" />
          <div className="skeleton skeleton-text w-3/4" />
        </div>

        {/* Categories Skeleton */}
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="skeleton skeleton-text h-6 w-16 rounded-full" />
          <div className="skeleton skeleton-text h-6 w-20 rounded-full" />
          <div className="skeleton skeleton-text h-6 w-14 rounded-full" />
        </div>

        {/* Game Stats Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="skeleton skeleton-text h-4 w-12" />
            <div className="skeleton skeleton-text h-4 w-12" />
            <div className="skeleton skeleton-text h-4 w-12" />
          </div>
          <div className="skeleton skeleton-text h-4 w-8" />
        </div>
      </div>
    </div>
  );
};

export default GameCardSkeleton;
