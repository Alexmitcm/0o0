import {
  EyeIcon,
  HandThumbDownIcon,
  HeartIcon,
  PlayIcon,
  StarIcon
} from "@heroicons/react/24/outline";
import {
  HandThumbDownIcon as DislikeSolidIcon,
  HeartIcon as HeartSolidIcon
} from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  addSessionLike,
  dislikeGame,
  type Game,
  getGame,
  getSessionRating,
  isSessionLiked,
  likeGame,
  rateGame,
  removeSessionLike,
  setSessionRating,
  unlikeGame
} from "@/helpers/gameHub";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import GamePlayer from "./GamePlayer";
import ReportGameModal from "./ReportGameModal";
import SimilarGames from "./SimilarGames";
import SocialShareButtons from "./SocialShareButtons";

const GameDetail = () => {
  const { slug } = useParams();
  const { currentAccount } = useAccountStore();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [playCount, setPlayCount] = useState(0);
  const [rating, setRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);

  console.log("🔍 Current account:", currentAccount);

  useEffect(() => {
    const loadGame = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        const gameData = await getGame(slug);
        setGame(gameData);
        setLikeCount(gameData.likeCount);
        setDislikeCount(gameData.dislikeCount);
        setPlayCount(gameData.playCount);
        setRating(gameData.rating);
        setRatingCount(gameData.ratingCount);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load game");
      } finally {
        setLoading(false);
      }
    };

    loadGame();
  }, [slug]);

  // Initialize guest state from session (must run before any early returns)
  useEffect(() => {
    if (!game) return;
    const sessionLiked = isSessionLiked(game.id);
    if (sessionLiked) setIsLiked(true);
    const sr = getSessionRating(game.id);
    if (sr) setUserRating(sr);
  }, [game?.id]);

  const handleLike = async () => {
    if (!game) return;

    // Guest mode: store like locally in session
    if (!currentAccount) {
      const currentlyLiked = isLiked ?? isSessionLiked(game.id);
      const newLiked = !currentlyLiked;
      setIsLiked(newLiked);
      setLikeCount((prev) => (newLiked ? prev + 1 : Math.max(0, prev - 1)));
      if (newLiked) addSessionLike(game.id);
      else removeSessionLike(game.id);
      if (isDisliked && newLiked) {
        setIsDisliked(false);
        setDislikeCount((prev) => Math.max(0, prev - 1));
      }
      return;
    }

    try {
      if (isLiked) {
        await unlikeGame(game.slug);
        setIsLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
      } else {
        await likeGame(game.slug);
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
        if (isDisliked) {
          setIsDisliked(false);
          setDislikeCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error("Error liking game:", err);
    }
  };

  const handleDislike = async () => {
    if (!game) return;

    // Guest mode: local toggle only
    if (!currentAccount) {
      const newDisliked = !isDisliked;
      setIsDisliked(newDisliked);
      setDislikeCount((prev) =>
        newDisliked ? prev + 1 : Math.max(0, prev - 1)
      );
      if (isLiked && newDisliked) {
        setIsLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
      }
      return;
    }

    try {
      if (isDisliked) {
        // No backend endpoint for undislike yet; just update UI
        setIsDisliked(false);
        setDislikeCount((prev) => Math.max(0, prev - 1));
      } else {
        await dislikeGame(game.slug);
        setIsDisliked(true);
        setDislikeCount((prev) => prev + 1);
        if (isLiked) {
          setIsLiked(false);
          setLikeCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error("Error disliking game:", err);
    }
  };

  const handleRate = async (rating: number) => {
    if (!game) return;

    // Guest mode: store locally
    if (!currentAccount) {
      setUserRating(rating);
      setSessionRating(game.id, rating);
      return;
    }

    try {
      await rateGame(game.slug, rating);
      setUserRating(rating);
    } catch (err) {
      console.error("Error rating game:", err);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="mb-8 h-8 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="aspect-video rounded-xl bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="space-y-6">
              <div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-700" />
              <div className="h-24 rounded-xl bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="font-bold text-2xl text-gray-900 dark:text-white">
            Game Not Found
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {error || "The game you're looking for doesn't exist."}
          </p>
          <Link
            className="mt-4 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 font-medium text-sm text-white hover:bg-blue-700"
            to="/gaming-dashboard"
          >
            Back to Games
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              to="/gaming-dashboard"
            >
              Games
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="font-medium text-gray-900 dark:text-white">
            {game.title}
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Game Player */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl bg-white shadow-lg dark:bg-gray-800">
            <div className="aspect-video bg-gray-100 dark:bg-gray-700">
              {game.gameFileUrl ? (
                <>
                  {console.log("🎮 GameDetail: Rendering GamePlayer with:", {
                    gameFileUrl: game.gameFileUrl,
                    width: game.width,
                    height: game.height,
                    title: game.title,
                    entryFilePath: game.entryFilePath
                  })}
                  <GamePlayer
                    entryFilePath={game.entryFilePath}
                    gameFileUrl={game.gameFileUrl}
                    height={game.height}
                    title={game.title}
                    width={game.width}
                  />
                </>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <PlayIcon className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                    <p className="text-gray-500">Game not available</p>
                    <p className="text-gray-400 text-sm">gameFileUrl: {game.gameFileUrl}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Game Info */}
        <div className="space-y-6">
          {/* Title and Stats */}
          <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <h1 className="mb-4 font-bold text-2xl text-gray-900 dark:text-white">
              {game.title}
            </h1>

            {/* Rating */}
            <div className="mb-4 flex items-center space-x-2">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    className={`h-5 w-5 ${
                      i < Math.floor(rating) ? "fill-current" : ""
                    }`}
                    key={i}
                  />
                ))}
              </div>
              <span className="text-gray-600 text-sm dark:text-gray-400">
                {rating.toFixed(1)} ({ratingCount} ratings)
              </span>
            </div>

            {/* Stats */}
            <div className="mb-6 grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 text-gray-600 dark:text-gray-400">
                  <EyeIcon className="h-4 w-4" />
                  <span className="text-sm">{playCount.toLocaleString()}</span>
                </div>
                <p className="text-gray-500 text-xs">Plays</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 text-gray-600 dark:text-gray-400">
                  <HeartIcon className="h-4 w-4" />
                  <span className="text-sm">{likeCount.toLocaleString()}</span>
                </div>
                <p className="text-gray-500 text-xs">Likes</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 text-gray-600 dark:text-gray-400">
                  <HandThumbDownIcon className="h-4 w-4" />
                  <span className="text-sm">
                    {dislikeCount.toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-500 text-xs">Dislikes</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <div className="flex space-x-2">
                <button
                  className={`flex flex-1 items-center justify-center space-x-2 rounded-lg px-4 py-2 font-medium text-sm transition-colors ${
                    isLiked
                      ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                  onClick={handleLike}
                  type="button"
                >
                  {isLiked ? (
                    <HeartSolidIcon className="h-4 w-4" />
                  ) : (
                    <HeartIcon className="h-4 w-4" />
                  )}
                  <span>Like</span>
                </button>
                <button
                  className={`flex flex-1 items-center justify-center space-x-2 rounded-lg px-4 py-2 font-medium text-sm transition-colors ${
                    isDisliked
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                  onClick={handleDislike}
                  type="button"
                >
                  {isDisliked ? (
                    <DislikeSolidIcon className="h-4 w-4" />
                  ) : (
                    <HandThumbDownIcon className="h-4 w-4" />
                  )}
                  <span>Dislike</span>
                </button>
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <p className="font-medium text-gray-700 text-sm dark:text-gray-300">
                  Rate this game:
                </p>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      aria-label={`Rate ${star} ${star === 1 ? "star" : "stars"}`}
                      className={`transition-colors ${
                        userRating && star <= userRating
                          ? "text-yellow-400"
                          : "text-gray-300 hover:text-yellow-400"
                      }`}
                      key={star}
                      onClick={() => handleRate(star)}
                      title={`Rate ${star} ${star === 1 ? "star" : "stars"}`}
                      type="button"
                    >
                      <StarIcon className="h-6 w-6" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Game Details */}
          <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <h2 className="mb-4 font-semibold text-gray-900 text-lg dark:text-white">
              Game Details
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Type:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {game.gameType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Status:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {game.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Created:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date(game.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Categories */}
          {game.categories && game.categories.length > 0 && (
            <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
              <h2 className="mb-4 font-semibold text-gray-900 text-lg dark:text-white">
                Categories
              </h2>
              <div className="flex flex-wrap gap-2">
                {game.categories.map((category) => (
                  <span
                    className="rounded-full bg-blue-100 px-3 py-1 text-blue-800 text-sm dark:bg-blue-900/20 dark:text-blue-400"
                    key={category.id}
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Share */}
          <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <h2 className="mb-4 font-semibold text-gray-900 text-lg dark:text-white">
              Share
            </h2>
            {(() => {
              const gameUrl = `${window.location.origin}/gaming-dashboard/game/${game.slug}`;
              return (
                <SocialShareButtons gameTitle={game.title} gameUrl={gameUrl} />
              );
            })()}
          </div>

          {/* Report */}
          {currentAccount && (
            <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
              <button
                className="text-red-600 text-sm hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                onClick={() => setShowReportModal(true)}
                type="button"
              >
                Report this game
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Similar Games */}
      <div className="mt-12">
        <SimilarGames gameId={game.id} limit={6} />
      </div>

      {/* Report Modal */}
      <ReportGameModal
        gameSlug={game.slug}
        gameTitle={game.title}
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </div>
  );
};

export default GameDetail;
