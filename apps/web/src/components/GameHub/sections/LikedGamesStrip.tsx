import { HeartIcon } from "@heroicons/react/24/solid";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/Shared/UI";
import { fetchGames, type Game, getSessionLikes } from "@/helpers/gameHub";
import GameCard from "../GameCard";

const LikedGamesStrip = () => {
  const [likedGames, setLikedGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data: allGames } = useQuery({
    queryFn: () => fetchGames({ limit: 100 }), // Get more games to find liked ones
    queryKey: ["games"]
  });

  // Filter liked games from session storage
  useEffect(() => {
    if (allGames?.games) {
      const sessionLikes = getSessionLikes();
      const liked = allGames.games.filter((game) => sessionLikes.has(game.id));
      setLikedGames(liked);
      setIsLoading(false);
    }
  }, [allGames?.games]);

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <HeartIcon className="h-5 w-5 text-red-500" />
          <h2 className="font-bold text-gray-900 text-xl dark:text-white">
            Liked Games
          </h2>
        </div>
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (likedGames.length === 0) {
    return (
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <HeartIcon className="h-5 w-5 text-red-500" />
          <h2 className="font-bold text-gray-900 text-xl dark:text-white">
            Liked Games
          </h2>
        </div>
        <div className="rounded-lg bg-gray-50 p-8 text-center dark:bg-gray-800">
          <HeartIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 font-semibold text-gray-900 text-lg dark:text-white">
            No liked games yet
          </h3>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Start liking games to see them here! Click the heart icon on any
            game card.
          </p>
          <p className="text-gray-500 text-sm dark:text-gray-400">
            Note: Likes are currently session-based and will reset when you
            close the browser tab.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8" id="liked-games">
      <div className="mb-4 flex items-center gap-2">
        <HeartIcon className="h-5 w-5 text-red-500" />
        <h2 className="font-bold text-gray-900 text-xl dark:text-white">
          Liked Games ({likedGames.length})
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {likedGames.map((game) => (
          <GameCard game={game} key={game.id} />
        ))}
      </div>
    </div>
  );
};

export default LikedGamesStrip;
