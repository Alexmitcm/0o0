import type React from "react";
import { Link } from "react-router-dom";
import LanguageSwitcher from "@/components/Common/LanguageSwitcher";
import cn from "@/helpers/cn";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import SignedAccount from "../Navbar/SignedAccount";
import AuthButtons from "./AuthButtons";
import ProductsMegaMenu from "./ProductsMegaMenu";

interface TopNavProps {
  className?: string;
}

const TopNav: React.FC<TopNavProps> = ({ className = "" }) => {
  const { currentAccount } = useAccountStore();

  // Force refresh to clear cache

  return (
    <header
      className={cn(
        [
          "relative",
          "z-40",
          "shrink-0",
          "w-full",
          "bg-black/60",
          "backdrop-blur-md",
          "border-b",
          "border-white/10"
        ].join(" "),
        className
      )}
    >
      <div className="relative mx-auto flex min-h-12 w-full max-w-6xl flex-wrap items-center justify-between gap-2 overflow-hidden px-2 py-1.5 sm:min-h-14 sm:flex-nowrap sm:gap-0 sm:px-3 sm:py-2 md:min-h-16 md:px-4 md:py-2.5 lg:max-w-7xl">
        {/* Brand */}
        <Link
          aria-label="Home"
          className="flex items-center gap-2 sm:gap-3"
          to="/"
        >
          <img
            alt="0X Arena Game Hub"
            className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10"
            src="/logo.png"
            style={{ filter: "drop-shadow(0 0 8px rgba(139, 92, 246, 0.6))" }}
          />
          <span className="hero-glow-text hidden font-bold text-lg text-white md:inline md:text-xl">
            0X Arena Game Hub
          </span>
          {/* Mobile logo text */}
          <span className="hero-glow-text font-bold text-sm text-white md:hidden">
            0X Arena
          </span>
        </Link>

        {/* Mobile: show Products menu */}
        <div className="md:hidden">
          <ProductsMegaMenu />
        </div>

        {/* Center nav (optional minimal) */}
        <nav
          aria-label="Primary"
          className="hidden items-center gap-6 font-medium text-sm text-white/85 md:flex"
        >
          <Link
            className="hero-glow-text rounded-lg px-3 py-2 transition-all duration-200 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50"
            to="/"
          >
            Home
          </Link>

          <ProductsMegaMenu />

          <Link
            className="hero-glow-text rounded-lg px-3 py-2 transition-all duration-200 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50"
            to="/explore"
          >
            Explore
          </Link>
          <Link
            className="hero-glow-text rounded-lg px-3 py-2 transition-all duration-200 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50"
            to="/support"
          >
            Support
          </Link>
          <Link
            className="hero-glow-text rounded-lg px-3 py-2 transition-all duration-200 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50"
            to="/admin/dashboard"
          >
            Admin
          </Link>
        </nav>

        {/* Right CTAs: Language Switcher + User menu or Auth buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher */}
          <LanguageSwitcher
            showFlags={false}
            showNativeNames={false}
            size="sm"
            variant="dropdown"
          />

          {currentAccount ? (
            <SignedAccount />
          ) : (
            <AuthButtons variant="compact" />
          )}
        </div>
      </div>
      {/* Glowing bottom line */}
      <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
    </header>
  );
};

export default TopNav;
