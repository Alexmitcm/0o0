import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchGames, type Game } from "@/helpers/gameHub";
import { useAccessControl } from "@/hooks/useAccessControl";
import { UserAccessLevel } from "@/types/access";
import CoinBalanceCard from "../Leaderboard/CoinBalanceCard";
import LeaderboardCard from "../Leaderboard/LeaderboardCard";
import ErrorBoundary from "../Shared/ErrorBoundary";
import AdIntegration from "./AdIntegration";
import AnalyticsTracker from "./AnalyticsTracker";
import ConditionalRender from "./ConditionalRender";
import ErrorRecovery from "./ErrorRecovery";
import GameHubFeed from "./GameHubFeed";
import GameHubGuest from "./GameHubGuest";
import GameHubHeader from "./GameHubHeader";
import GameHubHero from "./GameHubHero";
import GameHubSideNav from "./GameHubSideNav";
import GameHubSkeleton from "./GameHubSkeleton";
import LoadingOptimizer from "./LoadingOptimizer";
import PerformanceMonitor from "./PerformanceMonitor";
import ProgressiveDisclosure from "./ProgressiveDisclosure";
import RewardsDashboard from "./RewardsDashboard";
import SmartCTA from "./SmartCTA";
import LikedGamesStrip from "./sections/LikedGamesStrip";
import PopularStrip from "./sections/PopularStrip";
import TrendingStrip from "./sections/TrendingStrip";
import TestSuite from "./TestSuite";
import TournamentSection from "./TournamentSection";
import UpgradeBanner from "./UpgradeBanner";
import UpgradeFlow from "./UpgradeFlow";

const ProgressiveGameHub = () => {
  const { isGuest } = useAccessControl();
  const [params, setParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>(
    params.get("category") || ""
  );
  const [searchQuery, setSearchQuery] = useState<string>(params.get("q") || "");
  const [sourceQuery, setSourceQuery] = useState<string>(
    params.get("source") || ""
  );
  const [sortBy, setSortBy] = useState<
    "newest" | "popular" | "rating" | "plays"
  >((params.get("sort") as any) || "newest");
  const [showFeatured, setShowFeatured] = useState<boolean>(
    params.get("featured") === "1"
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [featuredGame, setFeaturedGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameCount, setGameCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [sessionId] = useState(
    () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );

  // Keep state in sync if URLSearchParams changes externally
  useEffect(() => {
    setSelectedCategory(params.get("category") || "");
    setSearchQuery(params.get("q") || "");
    setSourceQuery(params.get("source") || "");
    setSortBy(((params.get("sort") as any) || "newest") as any);
    setShowFeatured(params.get("featured") === "1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.toString()]);

  const syncParams = (next: Partial<Record<string, string>>) => {
    const nextParams = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v) nextParams.set(k, v);
      else nextParams.delete(k);
    }
    setParams(nextParams, { replace: true });
  };

  // Load one featured game for the hero
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchGames({ featured: true, limit: 1 });
        setFeaturedGame(res.games?.[0] ?? null);
        setGameCount(res.games?.length || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load games");
        setFeaturedGame(null);
        setErrorCount((prev) => prev + 1);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Show loading state
  if (loading) {
    return <GameHubSkeleton />;
  }

  // Show error state
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#121212] p-4">
        <div className="w-full max-w-2xl">
          <ErrorRecovery
            error={new Error(error)}
            onReport={(err) => {
              console.log("Error reported:", err);
              setErrorCount((prev) => prev + 1);
            }}
            onRetry={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  // Show guest mode for non-authenticated users
  if (isGuest) {
    return <GameHubGuest />;
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error("GameHub Error:", error, errorInfo);
        setErrorCount((prev) => prev + 1);
      }}
    >
      <LoadingOptimizer>
        <div className="min-h-screen bg-[#121212]">
          <div className="mx-auto max-w-[1400px] px-3 lg:px-6">
            <GameHubHeader
              onFeaturedChange={(v) => {
                setShowFeatured(v);
                syncParams({ featured: v ? "1" : "" });
              }}
              onOpenMenu={() => setMobileMenuOpen(true)}
              onSearchChange={(q) => {
                setSearchQuery(q);
                syncParams({ q });
              }}
              onSortChange={(s) => {
                setSortBy(s);
                syncParams({ sort: s });
              }}
              onSourceChange={(s) => {
                setSourceQuery(s);
                syncParams({ source: s });
              }}
              searchQuery={searchQuery}
              showFeatured={showFeatured}
              sortBy={sortBy}
              sourceQuery={sourceQuery}
            />

            {/* Layout: fixed left sidebar on desktop; drawer on mobile */}
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
                onCategoryChange={(v) => {
                  setSelectedCategory(v);
                  syncParams({ category: v });
                }}
                onClose={() => setMobileMenuOpen(false)}
                selectedCategory={selectedCategory}
              />

              <div className="md:pl-80">
                {/* Hero - Only for Standard and Premium users */}
                <ConditionalRender
                  accessLevel={[
                    UserAccessLevel.STANDARD,
                    UserAccessLevel.PREMIUM
                  ]}
                >
                  <div className="pb-6">
                    <GameHubHero game={featuredGame} />
                  </div>
                </ConditionalRender>

                {/* Featured strips - Progressive disclosure */}
                <div className="space-y-6">
                  {/* Leaderboard - All authenticated users */}
                  <ConditionalRender
                    accessLevel={[
                      UserAccessLevel.STANDARD,
                      UserAccessLevel.PREMIUM
                    ]}
                  >
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                      <div className="lg:col-span-2">
                        <LeaderboardCard period="AllTime" type="AllTime" />
                      </div>
                      <div>
                        <CoinBalanceCard />
                      </div>
                    </div>
                  </ConditionalRender>

                  {/* Loot Box Section - All authenticated users */}
                  <ConditionalRender
                    accessLevel={[
                      UserAccessLevel.STANDARD,
                      UserAccessLevel.PREMIUM
                    ]}
                  >
                    <div className="rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-bold text-white text-xl">
                          Loot Boxes
                        </h2>
                        <a
                          className="text-[#00FFFF] text-sm hover:text-[#00FFFF]/80"
                          href="/lootbox"
                        >
                          View All →
                        </a>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* Free Loot Box */}
                        <div className="rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00FFFF]">
                              <span className="font-bold text-black text-sm">
                                F
                              </span>
                            </div>
                            <h3 className="font-semibold text-white">
                              Free Loot Box
                            </h3>
                          </div>
                          <p className="mb-4 text-gray-400 text-sm">
                            Watch an ad to earn 10-50 Experience coins
                          </p>
                          <div className="mb-4 flex items-center gap-2 text-gray-500 text-xs">
                            <span>• 3 times per day</span>
                            <span>• 60 min cooldown</span>
                          </div>
                          <a
                            className="inline-flex items-center gap-2 rounded-lg bg-[#00FFFF] px-4 py-2 font-medium text-black text-sm hover:bg-[#00FFFF]/80"
                            href="/lootbox"
                          >
                            Open Now
                          </a>
                        </div>

                        {/* Premium Loot Box */}
                        <div className="rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF00FF]">
                              <span className="font-bold text-sm text-white">
                                P
                              </span>
                            </div>
                            <h3 className="font-semibold text-white">
                              Premium Loot Box
                            </h3>
                          </div>
                          <p className="mb-4 text-gray-400 text-sm">
                            Earn NFTs, USDT, ETH and more rewards
                          </p>
                          <div className="mb-4 flex items-center gap-2 text-gray-500 text-xs">
                            <span>• 1 time per day</span>
                            <span>• 24h cooldown</span>
                          </div>
                          <a
                            className="inline-flex items-center gap-2 rounded-lg bg-[#FF00FF] px-4 py-2 font-medium text-sm text-white hover:bg-[#FF00FF]/80"
                            href="/lootbox"
                          >
                            Open Now
                          </a>
                        </div>
                      </div>
                    </div>
                  </ConditionalRender>

                  {/* Trending - All authenticated users */}
                  <ConditionalRender
                    accessLevel={[
                      UserAccessLevel.STANDARD,
                      UserAccessLevel.PREMIUM
                    ]}
                  >
                    <TrendingStrip />
                  </ConditionalRender>

                  {/* Popular - All authenticated users */}
                  <ConditionalRender
                    accessLevel={[
                      UserAccessLevel.STANDARD,
                      UserAccessLevel.PREMIUM
                    ]}
                  >
                    <PopularStrip />
                  </ConditionalRender>

                  {/* Tournaments - Only for authenticated users */}
                  <ConditionalRender
                    accessLevel={[
                      UserAccessLevel.STANDARD,
                      UserAccessLevel.PREMIUM
                    ]}
                  >
                    <TournamentSection />
                  </ConditionalRender>

                  {/* Liked Games - Only for users with accounts */}
                  <ConditionalRender
                    accessLevel={[
                      UserAccessLevel.STANDARD,
                      UserAccessLevel.PREMIUM
                    ]}
                  >
                    <LikedGamesStrip />
                  </ConditionalRender>
                </div>

                {/* Ad Integration - Only for Standard users */}
                <ConditionalRender
                  accessLevel={UserAccessLevel.STANDARD}
                  fallback={null}
                >
                  <AdIntegration position="top" type="banner" />
                </ConditionalRender>

                {/* Main Game Grid */}
                <div className="pt-8">
                  <GameHubFeed
                    category={selectedCategory}
                    featured={showFeatured}
                    search={searchQuery}
                    sortBy={sortBy}
                    source={sourceQuery}
                  />
                </div>

                {/* Ad Integration - Only for Standard users */}
                <ConditionalRender
                  accessLevel={UserAccessLevel.STANDARD}
                  fallback={null}
                >
                  <AdIntegration position="bottom" type="banner" />
                </ConditionalRender>

                {/* Upgrade Prompts - Progressive disclosure */}
                <ConditionalRender
                  accessLevel={UserAccessLevel.STANDARD}
                  fallback={null}
                >
                  <div className="mt-12">
                    <UpgradeBanner
                      cta="Upgrade to Premium"
                      description="Get access to exclusive Play-to-Earn games, earn real USDT rewards, and participate in tournaments with no ads."
                      features={[
                        "100+ Premium Games",
                        "Real USDT Rewards",
                        "Exclusive Tournaments",
                        "No Advertisements"
                      ]}
                      title="Unlock Premium Games"
                    />
                  </div>
                </ConditionalRender>

                {/* Rewards Dashboard - Only for authenticated users */}
                <ConditionalRender
                  accessLevel={[
                    UserAccessLevel.STANDARD,
                    UserAccessLevel.PREMIUM
                  ]}
                  fallback={null}
                >
                  <div className="mt-12">
                    <ProgressiveDisclosure
                      description="View your earnings, claim rewards, and track progress"
                      feature="canViewRewards"
                      title="Rewards Dashboard"
                    >
                      <RewardsDashboard />
                    </ProgressiveDisclosure>
                  </div>
                </ConditionalRender>

                {/* Premium Features Preview - Only for Standard users */}
                <ConditionalRender
                  accessLevel={UserAccessLevel.STANDARD}
                  fallback={null}
                >
                  <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                    <UpgradeFlow
                      feature="canPlayPremiumGames"
                      showPreview={true}
                    />
                    <UpgradeFlow feature="canEarnRewards" showPreview={true} />
                    <UpgradeFlow
                      feature="canAccessTournaments"
                      showPreview={true}
                    />
                  </div>
                </ConditionalRender>

                {/* Smart CTAs for different access levels */}
                <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <SmartCTA
                    feature="canPlayPremiumGames"
                    size="sm"
                    variant="primary"
                  />
                  <SmartCTA
                    feature="canEarnRewards"
                    size="sm"
                    variant="secondary"
                  />
                  <SmartCTA
                    feature="canAccessTournaments"
                    size="sm"
                    variant="ghost"
                  />
                  <SmartCTA
                    feature="canUploadGames"
                    size="sm"
                    variant="primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Tracker */}
          <AnalyticsTracker
            enabled={process.env.NODE_ENV === "production"}
            sessionId={sessionId}
          />

          {/* Performance Monitor */}
          <PerformanceMonitor errorCount={errorCount} gameCount={gameCount} />

          {/* Test Suite (dev only) */}
          {process.env.NODE_ENV !== "production" && <TestSuite />}
        </div>
      </LoadingOptimizer>
    </ErrorBoundary>
  );
};

export default ProgressiveGameHub;
