import React from "react";
import AppFooter from "@/components/Shared/AppFooter";
import LogoBar from "@/components/Shared/LogoBar";
import ConnectedNetworkPoster from "@/components/Shared/UI/ConnectedNetworkPoster";
import HybridNeuralBackground from "@/components/Shared/UI/HybridNeuralBackground";
import NetworkBackground from "@/components/Shared/UI/NetworkBackground";
import RobustVideo from "@/components/Shared/UI/RobustVideo";
import TopNav from "@/components/Shared/UI/TopNav";

type LandingHeroProps = Record<string, never>;

const LandingHero = (_props: LandingHeroProps) => {
  // No action buttons on the hero as per requirements

  // no-op
  const [activeSlideIndex, setActiveSlideIndex] = React.useState(0);
  const contentContainerTokens = [
    "relative",
    "w-full",
    "min-h-0",
    "min-w-0",
    "flex-1",
    "flex",
    "flex-col"
  ].join(" ");
  const appFrameTokens = [
    "relative",
    "w-full",
    "max-w-screen",
    "min-h-screen",
    "bg-black",
    "flex",
    "flex-col",
    "overflow-x-hidden"
  ].join(" ");
  const rowTokens = [
    "relative",
    "flex",
    "flex-1",
    "min-h-0",
    "flex-col",
    "grow",
    "justify-between"
  ].join(" ");
  const carouselContainerTokens = [
    "relative",
    "w-full",
    "min-h-[100vh]",
    "overflow-hidden",
    "focus:outline-none",
    "max-w-screen"
  ].join(" ");
  const slideBaseTokens = [
    "absolute",
    "inset-0",
    "h-full",
    "w-full",
    "will-change-transform",
    "will-change-opacity",
    "transform-gpu",
    "transition-all",
    "duration-500",
    "sm:duration-700",
    "ease-out"
  ].join(" ");
  const activeSlideTokens =
    "opacity-100 z-10 pointer-events-auto scale-100 translate-y-0";
  const inactiveSlideTokens =
    "opacity-0 z-0 pointer-events-none scale-[0.98] translate-y-2";

  const totalSlides = 4;
  const handleNext = React.useCallback(() => {
    setActiveSlideIndex((prev) => (prev + 1) % totalSlides);
  }, []);
  const handlePrevious = React.useCallback(() => {
    setActiveSlideIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, []);
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        handleNext();
        return;
      }
      if (e.key === "ArrowLeft") {
        handlePrevious();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleNext, handlePrevious]);
  const navBaseButtonTokens = [
    "absolute",
    "top-1/2",
    "-translate-y-1/2",
    "z-30",
    "flex",
    "h-6",
    "w-6",
    "sm:h-7",
    "sm:w-7",
    "md:h-8",
    "md:w-8",
    "items-center",
    "justify-center",
    "rounded-full",
    "border",
    "border-brand-500/30",
    "bg-white/10",
    "p-0",
    "text-white",
    "backdrop-blur-sm",
    "transition",
    "hover:shadow-[0_0_24px_rgba(233,21,70,0.45)]",
    "hover:bg-white/15",
    "focus:outline-none",
    "focus:ring-2",
    "focus:ring-brand-500/50",
    "sm:h-12",
    "sm:w-12"
  ].join(" ");
  const containerTokens = [
    "mx-auto",
    "w-full",
    "max-w-6xl",
    "px-4",
    "sm:px-6",
    "md:px-8",
    "lg:px-12"
  ].join(" ");

  const heroCardTokens = [
    "relative",
    "z-50",
    "mx-auto",
    "w-full",
    "max-w-lg",
    "text-center",
    "text-white",
    "sm:max-w-xl",
    "md:max-w-2xl",
    "lg:max-w-3xl",
    "xl:max-w-4xl",
    "md:text-left"
  ].join(" ");

  const heroSectionTokens = [
    "relative",
    "z-10",
    "flex",
    "flex-1",
    "items-center",
    "justify-center",
    "min-h-screen",
    "bg-black",
    "px-4",
    "sm:px-6",
    "md:px-8",
    "lg:px-12"
  ].join(" ");

  const heroParagraphTokens = [
    "animate-fade-up",
    "mt-2",
    "text-sm",
    "text-white/80",
    "sm:mt-3",
    "sm:text-base",
    "md:text-lg",
    "lg:text-xl"
  ].join(" ");

  return (
    <section aria-label="Hero" className={heroSectionTokens}>
      {/* Skip to content for accessibility */}
      <a className="skip-to-content" href="#main-content">
        Skip to main content
      </a>
      <div className={appFrameTokens}>
        {/* Top navigation */}
        <TopNav />
        {/* Content */}
        <div className={rowTokens}>
          <div className={contentContainerTokens}>
            {/* Carousel container */}
            <section
              aria-label="Content carousel"
              className={`${carouselContainerTokens} flex-1`}
              id="main-content"
            >
              {/* Slide 0: Hero (full-bleed) */}
              <div
                className={`${slideBaseTokens} ${activeSlideIndex === 0 ? activeSlideTokens : inactiveSlideTokens}`}
              >
                <div className="absolute inset-0 z-0">
                  <HybridNeuralBackground
                    className="rounded-none"
                    contained
                    interactiveShowCenterLogo={false}
                    interactiveShowStarfield={false}
                    neuralDetail="low"
                    neuralMaxFps={24}
                    neuralPixelRatio={0.8}
                    showInteractive={false}
                    showNeural
                  />
                  {/* Enhanced network overlay - optimized for performance */}
                  <NetworkBackground
                    animationSpeed={0.15}
                    className="z-10"
                    connectionDistance={80}
                    enabled={true}
                    nodeCount={15}
                  />
                </div>
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-white/10" />
                <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
                <div className="absolute inset-0 z-20 flex items-center justify-center px-4 pt-16 sm:justify-start sm:px-6 sm:pt-20">
                  <div className="w-auto max-w-[260px] rounded-lg bg-white/90 p-3 shadow-lg backdrop-blur-sm sm:max-w-[300px] sm:p-4 md:max-w-[360px] md:p-5 lg:max-w-[420px] lg:p-6">
                    <div className="relative">
                      <div
                        className={[
                          "mb-2",
                          "text-gray-700",
                          "text-xs",
                          "uppercase",
                          "tracking-[0.15em]",
                          "font-medium",
                          "sm:mb-3",
                          "sm:text-sm"
                        ].join(" ")}
                      >
                        0X Arena
                      </div>
                      <h1 className="cinematic-title animate-fade-slide font-bold text-sm leading-tight sm:text-base md:text-lg lg:text-xl">
                        <span
                          className={[
                            "bg-gradient-to-r",
                            "from-blue-600",
                            "to-purple-600",
                            "bg-clip-text",
                            "text-transparent",
                            "inline",
                            "font-extrabold"
                          ].join(" ")}
                        >
                          Build your gaming node empire
                        </span>
                      </h1>
                      <p
                        className={[
                          "animate-fade-slide",
                          "mt-1",
                          "font-medium",
                          "text-xs",
                          "leading-tight",
                          "text-gray-600",
                          "sm:text-sm",
                          "md:text-base"
                        ].join(" ")}
                        style={{ animationDelay: ".2s" }}
                      >
                        <span className="text-gray-800">
                          Own your network, grow your teams,
                        </span>
                        <br />
                        <span className="text-gray-600">
                          and play together—powered by web3.
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slide 1: Video (full-bleed) */}
              <div
                className={`${slideBaseTokens} ${activeSlideIndex === 1 ? activeSlideTokens : inactiveSlideTokens}`}
              >
                <RobustVideo
                  aria-label="Hero poster video"
                  autoPlay
                  className="absolute inset-0 h-full w-full"
                  fallbackSrc="/videos/hero-poster.mp4"
                  loop
                  muted
                  onLoadFailure={() =>
                    console.warn("Video failed to load after retries")
                  }
                  onLoadSuccess={() => console.log("Video loaded successfully")}
                  playsInline
                  src="/videos/hero-poster.webm"
                />
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-white/10" />
                <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute inset-0 z-20 flex items-center justify-center px-4 pt-16 sm:justify-start sm:px-6 sm:pt-20">
                  <div className={containerTokens}>
                    <div
                      className={[
                        heroCardTokens,
                        "pointer-events-none text-center sm:text-left"
                      ].join(" ")}
                    >
                      <div className="relative">
                        <div
                          className={[
                            "mb-3",
                            "text-white/70",
                            "text-sm",
                            "uppercase",
                            "tracking-[0.2em]",
                            "font-medium",
                            "hero-glow-text"
                          ].join(" ")}
                        >
                          0X Arena
                        </div>
                        <h2 className="cinematic-title animate-fade-slide text-lg leading-snug sm:text-2xl sm:leading-snug md:text-3xl md:leading-snug lg:text-4xl lg:leading-snug">
                          <span className="block font-extrabold text-white">
                            Experience the world
                          </span>
                          <span className="block font-extrabold text-white">
                            of play
                          </span>
                        </h2>
                        <p
                          className={[
                            heroParagraphTokens,
                            "animate-fade-slide",
                            "mt-3",
                            "sm:mt-4",
                            "md:mt-6",
                            "font-medium",
                            "text-sm",
                            "sm:text-base",
                            "md:text-lg",
                            "lg:text-xl"
                          ].join(" ")}
                          style={{ animationDelay: ".2s" }}
                        >
                          <span className="hero-glow-text text-white/85">
                            Watch the cinematic trailer and discover what awaits
                            you.
                          </span>
                        </p>
                        {/* Action buttons removed */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slide 2: Connected Network (full-bleed) */}
              <div
                className={`${slideBaseTokens} ${activeSlideIndex === 2 ? activeSlideTokens : inactiveSlideTokens}`}
              >
                <ConnectedNetworkPoster
                  className="absolute inset-0 h-full w-full brightness-200 contrast-150 saturate-150 sm:brightness-250"
                  density={35}
                  intensity={1.5}
                  isActive
                  maxNeighbors={5}
                  pixelRatio={1.5}
                  showLocalStars={true}
                  targetFps={60}
                />
                {/* Additional bright overlay for enhanced visibility */}
                <div className="pointer-events-none absolute inset-0 z-5 bg-gradient-to-br from-cyan-400/20 via-purple-500/15 to-blue-400/20 mix-blend-screen" />
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-white/10" />
                <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-r from-black/40 via-black/15 to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute inset-0 z-20 flex items-center justify-center px-4 pt-16 sm:justify-start sm:px-6 sm:pt-20">
                  <div className={containerTokens}>
                    <div
                      className={[
                        heroCardTokens,
                        "pointer-events-none text-center sm:text-left"
                      ].join(" ")}
                    >
                      <div className="relative">
                        <div
                          className={[
                            "mb-3",
                            "text-white/70",
                            "text-sm",
                            "uppercase",
                            "tracking-[0.2em]",
                            "font-medium",
                            "hero-glow-text"
                          ].join(" ")}
                        >
                          0X Arena
                        </div>
                        <h2 className="cinematic-title animate-fade-slide text-[22px] leading-snug sm:text-3xl sm:leading-snug md:text-4xl md:leading-snug">
                          <span className="block font-extrabold text-white">
                            Connect your
                          </span>
                          <span className="block font-extrabold text-white">
                            gaming network
                          </span>
                        </h2>
                        <p
                          className={[
                            heroParagraphTokens,
                            "animate-fade-slide",
                            "mt-4",
                            "sm:mt-6",
                            "font-medium",
                            "text-base",
                            "sm:text-lg",
                            "md:text-xl"
                          ].join(" ")}
                          style={{ animationDelay: ".2s" }}
                        >
                          <span className="hero-glow-text text-white/85">
                            Build alliances, track nodes, and grow your reach.
                          </span>
                        </p>
                        {/* Action buttons removed */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slide 3: Flexible Social Primitives (full-bleed) */}
              <div
                className={`${slideBaseTokens} ${activeSlideIndex === 3 ? activeSlideTokens : inactiveSlideTokens}`}
              >
                {/* Dark background with subtle pattern to match design consistency */}
                <div className="absolute inset-0 z-0 bg-black">
                  {/* Diagonal lines pattern */}
                  <div className="absolute inset-0 bg-[length:20px_20px] bg-[linear-gradient(45deg,transparent_24%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_26%,transparent_27%,transparent_74%,rgba(255,255,255,0.05)_75%,rgba(255,255,255,0.05)_76%,transparent_77%)]" />
                  {/* Dashed grid pattern */}
                  <div className="absolute inset-0 bg-[length:20px_20px] bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)]" />
                </div>

                <div className="absolute inset-0 z-30 flex items-center justify-center px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
                  <div className="mx-auto w-full max-w-5xl">
                    <div className="grid grid-cols-1 items-center gap-6 sm:gap-8 md:gap-12 lg:grid-cols-2 lg:gap-16">
                      {/* Left Section - Text Content */}
                      <div className="space-y-4 text-center sm:space-y-6 lg:text-left">
                        <div className="space-y-2 sm:space-y-4">
                          <h2 className="animate-fade-up font-bold text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl">
                            Flexible Social
                            <br />
                            <span className="text-white">Primitives</span>
                          </h2>
                          <p
                            className="animate-fade-up text-sm text-white/80 sm:text-base md:text-lg lg:text-xl"
                            style={{ animationDelay: "0.1s" }}
                          >
                            Use our modular primitives to build, earn, and
                            scale.
                          </p>
                        </div>
                        <div
                          className="animate-fade-up"
                          style={{ animationDelay: "0.2s" }}
                        >
                          <button
                            className="btn-secondary group inline-flex items-center gap-2 px-4 py-2 text-white transition-all duration-300 sm:gap-3 sm:px-6 sm:py-3 md:px-8 md:py-4"
                            type="button"
                          >
                            <span className="font-medium text-high-contrast text-sm sm:text-base">
                              Learn More
                            </span>
                            <div className="flex h-4 w-4 items-center justify-center sm:h-5 sm:w-5">
                              <svg
                                aria-hidden="true"
                                className="h-3 w-3 text-white transition-transform duration-300 group-hover:translate-x-1 sm:h-4 sm:w-4"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path d="m9 6 6 6-6 6" />
                              </svg>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Right Section - Monochrome Circular Schematic */}
                      <div className="relative flex justify-center lg:justify-end">
                        <div className="relative h-48 w-48 sm:h-64 sm:w-64 md:h-80 md:w-80 lg:h-96 lg:w-96">
                          {/* Radial dashed connections from center to each outer node */}
                          <div className="absolute inset-0">
                            <svg
                              aria-hidden="true"
                              className="h-full w-full"
                              fill="none"
                              viewBox="0 0 384 384"
                            >
                              {/* Center at (192,192). Radius = 120. */}
                              <g
                                className="text-white/30"
                                stroke="currentColor"
                                strokeDasharray="4 6"
                                strokeLinecap="round"
                              >
                                <line x1="192" x2="192" y1="192" y2="72" />
                                <line x1="192" x2="296" y1="192" y2="132" />
                                <line x1="192" x2="296" y1="192" y2="252" />
                                <line x1="192" x2="192" y1="192" y2="312" />
                                <line x1="192" x2="88" y1="192" y2="252" />
                                <line x1="192" x2="88" y1="192" y2="132" />
                              </g>
                            </svg>
                          </div>

                          {/* Nodes: central Social + six uniformly spaced outer nodes */}
                          <div className="absolute inset-0">
                            {/* Central: Social */}
                            <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2">
                              <div className="relative flex h-16 w-20 flex-col items-center justify-center sm:h-20 sm:w-24">
                                <div className="absolute inset-0 rounded-2xl bg-white/10 ring-1 ring-white/20" />
                                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30 sm:h-12 sm:w-12">
                                  <svg
                                    aria-hidden="true"
                                    className="h-5 w-5 text-white/90 sm:h-6 sm:w-6"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.75"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M7 8.5c0-2.2 1.8-4 4-4s4 1.8 4 4" />
                                    <path d="M5 17.5v-3a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v3" />
                                    <circle cx="9" cy="8.5" r="0.5" />
                                    <circle cx="15" cy="8.5" r="0.5" />
                                  </svg>
                                </div>
                                <span className="mt-2 font-medium text-white/90 text-xs">
                                  Social
                                </span>
                              </div>
                            </div>

                            {/* Identify - top (192,72) */}
                            <div
                              className="absolute"
                              style={{
                                left: 192,
                                top: 72,
                                transform: "translate(-50%, -50%)"
                              }}
                            >
                              <div className="relative flex h-12 w-16 flex-col items-center justify-center sm:h-16 sm:w-20">
                                <div className="absolute inset-0 rounded-2xl bg-white/10 ring-1 ring-white/20" />
                                <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30 sm:h-8 sm:w-8">
                                  <svg
                                    aria-hidden="true"
                                    className="h-3 w-3 text-white/90 sm:h-4 sm:w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.75"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle cx="11" cy="11" r="6" />
                                    <path d="m20 20-3.5-3.5" />
                                  </svg>
                                </div>
                                <span className="mt-1 font-medium text-white/90 text-xs">
                                  Identify
                                </span>
                              </div>
                            </div>

                            {/* Connect - top-right (296,132) */}
                            <div
                              className="absolute"
                              style={{
                                left: 296,
                                top: 132,
                                transform: "translate(-50%, -50%)"
                              }}
                            >
                              <div className="relative flex h-12 w-16 flex-col items-center justify-center sm:h-16 sm:w-20">
                                <div className="absolute inset-0 rounded-2xl bg-white/10 ring-1 ring-white/20" />
                                <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30 sm:h-8 sm:w-8">
                                  <svg
                                    aria-hidden="true"
                                    className="h-3 w-3 text-white/90 sm:h-4 sm:w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.75"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle cx="12" cy="12" r="2" />
                                    <circle cx="6" cy="6" r="1.5" />
                                    <circle cx="18" cy="6" r="1.5" />
                                    <circle cx="6" cy="18" r="1.5" />
                                    <circle cx="18" cy="18" r="1.5" />
                                  </svg>
                                </div>
                                <span className="mt-1 font-medium text-white/90 text-xs">
                                  Connect
                                </span>
                              </div>
                            </div>

                            {/* Explore - bottom-right (296,252) */}
                            <div
                              className="absolute"
                              style={{
                                left: 296,
                                top: 252,
                                transform: "translate(-50%, -50%)"
                              }}
                            >
                              <div className="relative flex h-12 w-16 flex-col items-center justify-center sm:h-16 sm:w-20">
                                <div className="absolute inset-0 rounded-2xl bg-white/10 ring-1 ring-white/20" />
                                <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30 sm:h-8 sm:w-8">
                                  <svg
                                    aria-hidden="true"
                                    className="h-3 w-3 text-white/90 sm:h-4 sm:w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.75"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle cx="12" cy="12" r="7" />
                                    <path d="M12 7l3 5-5 3 2-4z" />
                                  </svg>
                                </div>
                                <span className="mt-1 font-medium text-white/90 text-xs">
                                  Explore
                                </span>
                              </div>
                            </div>

                            {/* Transact - bottom (192,312) */}
                            <div
                              className="absolute"
                              style={{
                                left: 192,
                                top: 312,
                                transform: "translate(-50%, -50%)"
                              }}
                            >
                              <div className="relative flex h-12 w-16 flex-col items-center justify-center sm:h-16 sm:w-20">
                                <div className="absolute inset-0 rounded-2xl bg-white/10 ring-1 ring-white/20" />
                                <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30 sm:h-8 sm:w-8">
                                  <svg
                                    aria-hidden="true"
                                    className="h-3 w-3 text-white/90 sm:h-4 sm:w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.75"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M7 12h10M7 12l3-3M7 12l3 3" />
                                  </svg>
                                </div>
                                <span className="mt-1 font-medium text-white/90 text-xs">
                                  Transact
                                </span>
                              </div>
                            </div>

                            {/* Publish - bottom-left (88,252) */}
                            <div
                              className="absolute"
                              style={{
                                left: 88,
                                top: 252,
                                transform: "translate(-50%, -50%)"
                              }}
                            >
                              <div className="relative flex h-12 w-16 flex-col items-center justify-center sm:h-16 sm:w-20">
                                <div className="absolute inset-0 rounded-2xl bg-white/10 ring-1 ring-white/20" />
                                <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30 sm:h-8 sm:w-8">
                                  <svg
                                    aria-hidden="true"
                                    className="h-3 w-3 text-white/90 sm:h-4 sm:w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.75"
                                    viewBox="0 0 24 24"
                                  >
                                    <rect
                                      height="14"
                                      rx="2"
                                      width="12"
                                      x="6"
                                      y="5"
                                    />
                                    <path d="M9 9h6M9 13h6" />
                                  </svg>
                                </div>
                                <span className="mt-1 font-medium text-white/90 text-xs">
                                  Publish
                                </span>
                              </div>
                            </div>

                            {/* Earn - top-left (88,132) */}
                            <div
                              className="absolute"
                              style={{
                                left: 88,
                                top: 132,
                                transform: "translate(-50%, -50%)"
                              }}
                            >
                              <div className="relative flex h-12 w-16 flex-col items-center justify-center sm:h-16 sm:w-20">
                                <div className="absolute inset-0 rounded-2xl bg-white/10 ring-1 ring-white/20" />
                                <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30 sm:h-8 sm:w-8">
                                  <svg
                                    aria-hidden="true"
                                    className="h-3 w-3 text-white/90 sm:h-4 sm:w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.75"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M15.5 6.5H10a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6H8.5" />
                                  </svg>
                                </div>
                                <span className="mt-1 font-medium text-white/90 text-xs">
                                  Earn
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Carousel navigation buttons (positioned relative to carousel) */}
              <button
                aria-label="Previous slide"
                className={`${navBaseButtonTokens} left-1 sm:left-1 md:left-2`}
                onClick={handlePrevious}
                type="button"
              >
                <svg
                  aria-hidden="true"
                  className="h-2 w-2 sm:h-3 sm:w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                aria-label="Next slide"
                className={`${navBaseButtonTokens} right-1 sm:right-1 md:right-2`}
                onClick={handleNext}
                type="button"
              >
                <svg
                  aria-hidden="true"
                  className="h-2 w-2 sm:h-3 sm:w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </button>
            </section>
            {/* Company Logos Bar */}
            <LogoBar className="shrink-0" />
            {/* Footer at the bottom of the flow */}
            <AppFooter className="shrink-0" compact minimal />
          </div>
        </div>
        <style>{`
          @keyframes neonGradient { 
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes fade-up {
            from { 
              opacity: 0; 
              transform: translateY(30px) scale(0.9); 
            }
            to { 
              opacity: 1; 
              transform: translateY(0) scale(1); 
            }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes fade-slide {
            from { 
              opacity: 0; 
              transform: translateX(-20px); 
            }
            to { 
              opacity: 1; 
              transform: translateX(0); 
            }
          }
          .animate-spin-slow {
            animation: spin-slow 25s linear infinite;
          }
          .animate-fade-up {
            animation: fade-up 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            opacity: 0;
          }
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          .animate-shimmer {
            animation: shimmer 2s ease-in-out infinite;
          }
          .animate-fade-slide {
            animation: fade-slide 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            opacity: 0;
          }
          @media (prefers-reduced-motion: reduce) {
            [data-anim="neon"] { animation: none !important; }
            .animate-spin-slow { animation: none !important; }
            .animate-fade-up { 
              animation: none !important; 
              opacity: 1 !important; 
            }
          }
        `}</style>
      </div>
    </section>
  );
};

export default LandingHero;
