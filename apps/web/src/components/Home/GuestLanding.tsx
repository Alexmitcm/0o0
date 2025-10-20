import { useEffect, useState } from "react";
import GameHubFeed from "@/components/GameHub/GameHubFeed";
import GameHubHeader from "@/components/GameHub/GameHubHeader";
import GameHubHero from "@/components/GameHub/GameHubHero";
import GameHubSideNav from "@/components/GameHub/GameHubSideNav";
import LikedGamesStrip from "@/components/GameHub/sections/LikedGamesStrip";
import PopularStrip from "@/components/GameHub/sections/PopularStrip";
import TrendingStrip from "@/components/GameHub/sections/TrendingStrip";
import { fetchGames, type Game } from "@/helpers/gameHub";

type GuestLandingProps = {};

const GuestLanding = ({}: GuestLandingProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sourceQuery, setSourceQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<
    "newest" | "popular" | "rating" | "plays"
  >("newest");
  const [showFeatured, setShowFeatured] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [featuredGame, setFeaturedGame] = useState<Game | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchGames({ featured: true, limit: 1 });
        setFeaturedGame(res.games?.[0] ?? null);
      } catch {
        setFeaturedGame(null);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#121212]">
      <div className="mx-auto max-w-[1400px] px-3 lg:px-6">
        <GameHubHeader
          onFeaturedChange={setShowFeatured}
          onOpenMenu={() => setMobileMenuOpen(true)}
          onSearchChange={setSearchQuery}
          onSortChange={setSortBy}
          onSourceChange={setSourceQuery}
          searchQuery={searchQuery}
          showFeatured={showFeatured}
          sortBy={sortBy}
          sourceQuery={sourceQuery}
        />

        <div className="relative py-6 lg:py-8">
          <button
            aria-label="Open navigation"
            className="fixed top-24 left-3 z-40 rounded-md border border-[#2A2A2A] bg-[#1A1A1A] p-2 text-gray-300 shadow-md hover:text-[#00FFFF] focus:outline-none focus:ring-2 focus:ring-[#00FFFF]/40 md:hidden"
            onClick={() => setMobileMenuOpen(true)}
            type="button"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M4 6h16M4 12h16M4 18h16"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </button>

          <GameHubSideNav
            isOpen={mobileMenuOpen}
            onCategoryChange={(v) => setSelectedCategory(v)}
            onClose={() => setMobileMenuOpen(false)}
            selectedCategory={selectedCategory}
          />

          <div className="md:pl-80">
            <div className="pb-6">
              <GameHubHero game={featuredGame} />
            </div>

            <div className="space-y-6">
              <TrendingStrip />
              <PopularStrip />
              <LikedGamesStrip />
            </div>

            <div className="pt-8">
              <GameHubFeed
                category={selectedCategory}
                featured={showFeatured}
                search={searchQuery}
                sortBy={sortBy}
                source={sourceQuery}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestLanding;
