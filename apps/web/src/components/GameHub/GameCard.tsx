import {
  ArrowsPointingOutIcon,
  CalendarIcon,
  EyeIcon,
  HandThumbDownIcon,
  HeartIcon,
  PlayIcon,
  StarIcon
} from "@heroicons/react/24/outline";
import {
  HandThumbDownIcon as DislikeSolidIcon,
  HeartIcon as HeartSolidIcon,
  StarIcon as StarSolidIcon
} from "@heroicons/react/24/solid";
import { PLACEHOLDER_IMAGE } from "@hey/data/constants";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { memo, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  addSessionLike,
  dislikeGame,
  type Game,
  getSessionRating,
  isSessionLiked,
  likeGame,
  rateGame,
  removeSessionLike,
  setSessionRating,
  unlikeGame
} from "@/helpers/gameHub";
import { useHasPremiumAccess } from "@/helpers/premiumUtils";
import useErrorMonitoring from "@/hooks/useErrorMonitoring";
import usePerformanceMonitoring from "@/hooks/usePerformanceMonitoring";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import SmartGameButton from "./SmartGameButton";

interface GameCardProps {
  game: Game;
  variant?: "default" | "compact" | "featured";
  showActions?: boolean;
  showUpgradePrompt?: boolean;
  onClick?: (game: Game) => void;
}

const GameCard = ({
  game,
  variant = "default",
  showActions = true,
  onClick
}: GameCardProps) => {
  const queryClient = useQueryClient();
  const { currentAccount } = useAccountStore();
  const hasPremiumAccess = useHasPremiumAccess();

  // Performance and error monitoring
  const { startRender, endRender } = usePerformanceMonitoring({
    enableLogging: process.env.NODE_ENV === "development"
  });
  const { trackUserError } = useErrorMonitoring({
    enableLogging: process.env.NODE_ENV === "development",
    userId: currentAccount?.address
  });
  const [imageSrc, setImageSrc] = useState<string>(
    game.thumb1Url || game.thumb2Url || PLACEHOLDER_IMAGE
  );
  const [imageFallbackTried, setImageFallbackTried] = useState<boolean>(false);

  // Local state for immediate UI updates
  const [localLikeCount, setLocalLikeCount] = useState<number | null>(null);
  const [localDislikeCount, setLocalDislikeCount] = useState<number | null>(
    null
  );
  const [localUserLike, setLocalUserLike] = useState<boolean | null>(null);
  const [localUserDislike, setLocalUserDislike] = useState<boolean | null>(
    null
  );
  const [localUserRating, setLocalUserRating] = useState<number | null>(null);
  const [localRating, setLocalRating] = useState<number | null>(null);
  const [localRatingCount, setLocalRatingCount] = useState<number | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [lastLikeTime, setLastLikeTime] = useState<number>(0);
  const [lastDislikeTime, setLastDislikeTime] = useState<number>(0);
  const [lastRateTime, setLastRateTime] = useState<number>(0);

  // Initialize from session storage on component mount
  const likeMutation = useMutation({
    mutationFn: () => {
      const currentlyLiked = localUserLike ?? isSessionLiked(game.id);
      return currentlyLiked ? unlikeGame(game.slug) : likeGame(game.slug);
    },
    onError: (error) => {
      toast.error("Failed to update like status. Please try again.");
      console.error("Like error:", error);
    },
    onSuccess: (response: { success: boolean; liked: boolean }) => {
      const newLikedState = response.liked;
      toast.success(
        newLikedState
          ? "Game liked successfully!"
          : "Game unliked successfully!"
      );

      // Update local state and session storage
      setLocalUserLike(newLikedState);
      if (newLikedState) {
        setLocalLikeCount((prev) => (prev ?? game.likeCount) + 1);
        addSessionLike(game.id);
      } else {
        setLocalLikeCount((prev) => Math.max(0, (prev ?? game.likeCount) - 1));
        removeSessionLike(game.id);
      }

      queryClient.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "games"
      });
      queryClient.invalidateQueries({ queryKey: ["trending-games"] });
      queryClient.invalidateQueries({ queryKey: ["popular-games"] });
      queryClient.invalidateQueries({ queryKey: ["liked-games"] });
    }
  });

  const dislikeMutation = useMutation({
    mutationFn: () => {
      return dislikeGame(game.slug);
    },
    onError: (error) => {
      toast.error("Failed to update dislike status. Please try again.");
      console.error("Dislike error:", error);
    },
    onSuccess: (response: { success: boolean; disliked: boolean }) => {
      const newDislikedState = response.disliked;
      toast.success(
        newDislikedState
          ? "Game disliked successfully!"
          : "Game undisliked successfully!"
      );

      // Update local state
      setLocalUserDislike(newDislikedState);
      if (newDislikedState) {
        setLocalDislikeCount((prev) => (prev ?? game.dislikeCount) + 1);
      } else {
        setLocalDislikeCount((prev) =>
          Math.max(0, (prev ?? game.dislikeCount) - 1)
        );
      }

      queryClient.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "games"
      });
      queryClient.invalidateQueries({ queryKey: ["trending-games"] });
      queryClient.invalidateQueries({ queryKey: ["popular-games"] });
    }
  });

  const rateMutation = useMutation({
    mutationFn: (rating: number) => {
      return rateGame(game.slug, rating);
    },
    onError: (error) => {
      toast.error("Failed to rate game. Please try again.");
      console.error("Rate error:", error);
    },
    onSuccess: async (response) => {
      toast.success(`Game rated ${response.rating} stars!`);
      // Update local state and session storage
      setLocalUserRating(response.rating);
      setSessionRating(game.id, response.rating);

      // Update local rating display immediately
      setLocalRating(
        game.rating +
          (response.rating - (game.userRating || 0)) /
            Math.max(1, game.ratingCount + 1)
      );
      setLocalRatingCount((game.ratingCount || 0) + 1);

      // Force re-render
      setForceUpdate((prev) => prev + 1);

      // Invalidate all game-related queries to refresh data
      queryClient.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "games"
      });
      queryClient.invalidateQueries({ queryKey: ["trending-games"] });
      queryClient.invalidateQueries({ queryKey: ["popular-games"] });
      queryClient.invalidateQueries({ queryKey: ["liked-games"] });
    }
  });

  const handleLike = useCallback(() => {
    // Rate limiting: prevent rapid clicks (500ms cooldown)
    const now = Date.now();
    if (now - lastLikeTime < 500) {
      return;
    }
    setLastLikeTime(now);

    try {
      startRender();
      likeMutation.mutate();
    } catch (error) {
      trackUserError(error as Error, "like_game", { gameId: game.id });
    } finally {
      endRender();
    }
  }, [
    likeMutation,
    startRender,
    endRender,
    trackUserError,
    game.id,
    lastLikeTime
  ]);

  const handleDislike = useCallback(() => {
    // Rate limiting: prevent rapid clicks (500ms cooldown)
    const now = Date.now();
    if (now - lastDislikeTime < 500) {
      return;
    }
    setLastDislikeTime(now);

    dislikeMutation.mutate();
  }, [dislikeMutation, lastDislikeTime]);

  const handleRate = useCallback(
    (rating: number) => {
      // Rate limiting: prevent rapid clicks (500ms cooldown)
      const now = Date.now();
      if (now - lastRateTime < 500) {
        return;
      }
      setLastRateTime(now);

      rateMutation.mutate(rating);
    },
    [rateMutation, lastRateTime]
  );

  // Initialize from session storage on component mount
  useEffect(() => {
    const sessionLiked = isSessionLiked(game.id);
    const sessionRating = getSessionRating(game.id);

    setLocalUserLike(sessionLiked);
    if (sessionRating !== null) {
      setLocalUserRating(sessionRating);
    }

    // Initialize local counts with game counts
    setLocalLikeCount(game.likeCount || 0);
    setLocalDislikeCount(game.dislikeCount || 0);
    setLocalRating(game.rating || 0);
    setLocalRatingCount(game.ratingCount || 0);
  }, [
    game.id,
    game.likeCount,
    game.dislikeCount,
    game.rating,
    game.ratingCount
  ]);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      // Cleanup any pending mutations
      if (likeMutation.isPending) {
        likeMutation.reset();
      }
      if (dislikeMutation.isPending) {
        dislikeMutation.reset();
      }
      if (rateMutation.isPending) {
        rateMutation.reset();
      }
    };
  }, []); // Empty dependency array since we only need cleanup on unmount

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays <= 7) return `${diffDays} days ago`;
      if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays <= 365) return `${Math.floor(diffDays / 30)} months ago`;
      return date.toLocaleDateString();
    } catch {
      return "Invalid date";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "published":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      case "archived":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    }
  };

  if (variant === "compact") {
    return (
      <div className="group hover-lift relative overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-200 hover:shadow-md dark:bg-gray-800">
        <div className="flex">
          {/* Compact Thumbnail */}
          <div className="relative h-20 w-24 overflow-hidden">
            <img
              alt={game.title}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={() => setImageSrc(PLACEHOLDER_IMAGE)}
              src={imageSrc}
            />
            {game.gameType === "PlayToEarn" && !hasPremiumAccess ? (
              <div className="absolute inset-0 flex items-center justify-center bg-red-500/80 transition-all group-hover:bg-red-500/90">
                <span className="font-bold text-white text-xs opacity-0 transition-opacity group-hover:opacity-100">
                  🔒
                </span>
              </div>
            ) : (
              <Link
                className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/30"
                to={`/gaming-dashboard/game/${game.slug}`}
              >
                <PlayIcon className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            )}
          </div>

          {/* Compact Info */}
          <div className="flex-1 p-3">
            <h3 className="line-clamp-1 font-medium text-gray-900 text-sm dark:text-white">
              {game.title}
            </h3>
            <div className="mt-1 flex items-center gap-2 text-gray-500 text-xs dark:text-gray-400">
              <span>{game.playCount || 0} plays</span>
              <span>•</span>
              <span>{(localLikeCount ?? game.likeCount) || 0} ❤️</span>
              <span>•</span>
              <span>{(localDislikeCount ?? game.dislikeCount) || 0} 👎</span>
              <span>•</span>
              <span>
                {((localRating ?? game.rating) || 0).toFixed(1)} ★ (
                {(localRatingCount ?? game.ratingCount) || 0})
              </span>
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
      {/* Game Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img
          alt={game.title}
          className="game-card-image h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          onError={() => {
            // Fallback order: thumb2Url -> PLACEHOLDER_IMAGE, guarded
            if (
              !imageFallbackTried &&
              imageSrc === game.thumb1Url &&
              game.thumb2Url
            ) {
              setImageFallbackTried(true);
              setImageSrc(game.thumb2Url);
              return;
            }
            if (imageSrc !== PLACEHOLDER_IMAGE) {
              setImageSrc(PLACEHOLDER_IMAGE);
            }
          }}
          src={imageSrc}
        />

        {/* Gradient Overlay */}
        <div className="game-card-overlay absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="opacity-0 transition-all duration-300 group-hover:scale-110 group-hover:opacity-100">
            <SmartGameButton
              game={game}
              onPlay={onClick}
              size="lg"
              variant="compact"
            />
          </div>
        </div>

        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {/* Featured Badge */}
          {game.isFeatured && (
            <div className="rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 px-3 py-1 font-bold text-xs text-yellow-900 shadow-lg">
              ⭐ Featured
            </div>
          )}

          {/* Status Badge */}
          {game.status && (
            <div
              className={`rounded-full px-3 py-1 font-medium text-xs shadow-lg ${getStatusColor(game.status)}`}
            >
              {game.status}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            {/* Like Button */}
            <button
              aria-label={
                localUserLike ? `Unlike ${game.title}` : `Like ${game.title}`
              }
              className="btn-animate hover-glow rounded-full bg-white/90 p-2 text-gray-600 shadow-lg transition-all duration-200 hover:scale-110 hover:bg-white hover:text-red-500 disabled:opacity-50"
              disabled={likeMutation.isPending}
              onClick={handleLike}
              title={localUserLike ? "Unlike game" : "Like game"}
              type="button"
            >
              {likeMutation.isPending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
              ) : (localUserLike ?? game.userLike) ? (
                <HeartSolidIcon className="h-4 w-4 text-red-500" />
              ) : (
                <HeartIcon className="h-4 w-4" />
              )}
            </button>

            {/* Dislike Button */}
            <button
              aria-label={
                localUserDislike
                  ? `Remove dislike for ${game.title}`
                  : `Dislike ${game.title}`
              }
              className="btn-animate hover-glow rounded-full bg-white/90 p-2 text-gray-600 shadow-lg transition-all duration-200 hover:scale-110 hover:bg-white hover:text-blue-500 disabled:opacity-50"
              disabled={dislikeMutation.isPending}
              onClick={handleDislike}
              title={localUserDislike ? "Remove dislike" : "Dislike game"}
              type="button"
            >
              {dislikeMutation.isPending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              ) : (localUserDislike ?? game.userDislike) ? (
                <DislikeSolidIcon className="h-4 w-4 text-blue-500" />
              ) : (
                <HandThumbDownIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Game Info */}
      <div className="p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <h3 className="line-clamp-1 font-bold text-gray-900 text-xl transition-colors group-hover:text-purple-600 dark:text-white">
              {game.title}
            </h3>

            {/* Game Type Badge */}
            {game.gameType === "PlayToEarn" && (
              <div className="hover-scale flex animate-float items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 px-2 py-1 font-bold text-xs text-yellow-900 shadow-sm">
                <span>💰</span>
                <span>P2E</span>
              </div>
            )}

            {game.gameType === "FreeToPlay" && (
              <div className="hover-scale flex animate-float items-center gap-1 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 px-2 py-1 font-bold text-green-900 text-xs shadow-sm">
                <span>🎮</span>
                <span>F2P</span>
              </div>
            )}
          </div>

          {/* Source Badge */}
          {game.source && (
            <div className="mt-2 inline-flex items-center gap-2">
              <span className="text-gray-500 text-xs dark:text-gray-400">
                Source:
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700 text-xs dark:bg-gray-700 dark:text-gray-300">
                {game.source}
              </span>
            </div>
          )}
        </div>

        {game.description && (
          <p className="mb-4 line-clamp-2 text-gray-600 text-sm leading-relaxed dark:text-gray-300">
            {game.description}
          </p>
        )}

        {/* Categories */}
        {game.categories && game.categories.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {game.categories.slice(0, 3).map((category) => (
              <Link
                className="rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-700 text-xs transition-all duration-200 hover:scale-105 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                key={typeof category === "string" ? category : category.id}
                to={`/gaming-dashboard/category/${typeof category === "string" ? category : category.slug}`}
              >
                {typeof category === "string" ? category : category.name}
              </Link>
            ))}
            {game.categories.length > 3 && (
              <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-600 text-xs dark:bg-gray-700 dark:text-gray-300">
                +{game.categories.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {game.tags && game.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {game.tags.slice(0, 4).map((tag) => (
              <Link
                className="rounded-full bg-purple-50 px-2 py-1 text-purple-600 text-xs transition-all duration-200 hover:scale-105 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50"
                key={typeof tag === "string" ? tag : String(tag)}
                to={`/gaming-dashboard/tag/${typeof tag === "string" ? tag : String(tag)}`}
              >
                #{typeof tag === "string" ? tag : String(tag)}
              </Link>
            ))}
            {game.tags.length > 4 && (
              <span className="rounded-full bg-purple-50 px-2 py-1 text-purple-600 text-xs dark:bg-purple-400">
                +{game.tags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Enhanced Stats */}
        <div className="mb-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 sm:gap-4">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <EyeIcon className="h-4 w-4" />
            <span>{(game.playCount || 0).toLocaleString()} plays</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <HeartIcon className="h-4 w-4" />
            <span>
              {((localLikeCount ?? game.likeCount) || 0).toLocaleString()} likes
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <HandThumbDownIcon className="h-4 w-4" />
            <span>
              {((localDislikeCount ?? game.dislikeCount) || 0).toLocaleString()}{" "}
              dislikes
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <StarIcon className="h-4 w-4 text-yellow-400" />
            <span
              key={`rating-${forceUpdate}-${localRating}-${localRatingCount}`}
            >
              {((localRating ?? game.rating) || 0).toFixed(1)} (
              {(localRatingCount ?? game.ratingCount) || 0} reviews)
            </span>
          </div>
        </div>

        {/* Rating Stars */}
        {showActions && (
          <div className="mb-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="font-medium text-gray-700 text-sm dark:text-gray-300">
                Rate this game:
              </span>
              <span className="text-gray-500 text-xs dark:text-gray-400">
                {localUserRating
                  ? `Your rating: ${localUserRating}/5`
                  : "Click to rate"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  className="text-yellow-400 transition-all duration-200 hover:scale-110 hover:text-yellow-500 disabled:opacity-50"
                  disabled={rateMutation.isPending}
                  key={star}
                  onClick={() => handleRate(star)}
                  title={`Rate ${star} stars`}
                  type="button"
                >
                  {star <= ((localUserRating ?? game.userRating) || 0) ? (
                    <StarSolidIcon className="h-5 w-5" />
                  ) : (
                    <StarIcon className="h-5 w-5" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="flex items-center justify-between border-gray-100 border-t pt-4 text-gray-500 text-xs dark:border-gray-700 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            <span>
              {game.createdAt ? formatDate(game.createdAt) : "Unknown date"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <ArrowsPointingOutIcon className="h-3 w-3" />
            <span>
              {game.width || 0}×{game.height || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(GameCard);
