import { PlayCircleIcon } from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";
import type { Game } from "@/helpers/gameHub";

interface GameHubHeroProps {
  game?: Game | null;
}

const GameHubHero = ({ game }: GameHubHeroProps) => {
  if (!game) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-[#2A2A2A] bg-[#121212] p-10">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(1000px 300px at 20% -20%, rgba(0,255,255,0.15), transparent), radial-gradient(800px 300px at 80% 120%, rgba(255,0,255,0.12), transparent)"
          }}
        />
        <div className="relative z-10">
          <h2 className="mb-2 font-bold text-2xl text-white">
            Discover new games
          </h2>
          <p className="text-gray-400">
            Curated picks, trending titles, and personalized recommendations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#2A2A2A] bg-[#121212]">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 400px at 10% -20%, rgba(0,255,255,0.18), transparent), radial-gradient(1000px 400px at 90% 120%, rgba(255,0,255,0.15), transparent)"
        }}
      />
      <div className="relative">
        <div className="relative aspect-video overflow-hidden">
          <img
            alt={game.title}
            className="h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
            src={game.thumb1Url || game.thumb2Url}
          />
        </div>

        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6">
          <div className="max-w-xl">
            {/* biome-ignore lint/nursery/useSortedClasses: keep visual order */}
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-[#00FFFF]">
              Featured
            </div>
            <h2 className="mb-2 font-extrabold text-3xl text-white md:text-4xl">
              {game.title}
            </h2>
            {game.description && (
              <p className="mb-4 line-clamp-2 text-gray-300">
                {game.description}
              </p>
            )}
            <Link
              aria-label={`Play ${game.title}`}
              className="inline-flex items-center gap-2 rounded-lg bg-[#00FFFF] px-5 py-3 font-semibold text-black transition-transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-[#00FFFF]/50"
              to={`/gaming-dashboard/game/${game.slug}`}
            >
              <PlayCircleIcon className="h-5 w-5" />
              Play now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameHubHero;
