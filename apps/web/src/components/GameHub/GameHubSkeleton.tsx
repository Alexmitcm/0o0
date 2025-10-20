const GameHubSkeleton = () => {
  return (
    <div className="min-h-screen bg-[#121212]">
      <div className="mx-auto max-w-[1400px] px-3 lg:px-6">
        {/* Header Skeleton */}
        <div className="py-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="h-8 w-48 animate-pulse rounded bg-gray-700" />
            <div className="flex gap-3">
              <div className="h-10 w-24 animate-pulse rounded bg-gray-700" />
              <div className="h-10 w-32 animate-pulse rounded bg-gray-700" />
            </div>
          </div>
        </div>

        {/* Layout Skeleton */}
        <div className="relative py-6 lg:py-8">
          <div className="md:pl-80">
            {/* Hero Skeleton */}
            <div className="pb-6">
              <div className="h-64 animate-pulse rounded-lg bg-gray-700" />
            </div>

            {/* Strips Skeleton */}
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div className="space-y-4" key={i}>
                  <div className="h-6 w-32 animate-pulse rounded bg-gray-700" />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div
                        className="animate-pulse rounded-lg bg-gray-800 p-4"
                        key={j}
                      >
                        <div className="mb-4 h-48 rounded bg-gray-700" />
                        <div className="mb-2 h-4 rounded bg-gray-700" />
                        <div className="h-3 w-3/4 rounded bg-gray-700" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Main Grid Skeleton */}
            <div className="pt-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    className="animate-pulse rounded-lg bg-gray-800 p-4"
                    key={i}
                  >
                    <div className="mb-4 h-48 rounded bg-gray-700" />
                    <div className="mb-2 h-4 rounded bg-gray-700" />
                    <div className="h-3 w-3/4 rounded bg-gray-700" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameHubSkeleton;
