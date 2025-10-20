import {
  Bars3Icon,
  GiftIcon,
  HeartIcon,
  Squares2X2Icon,
  TrophyIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchCategories, type GameCategory } from "@/helpers/gameHub";

interface GameHubSideNavProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const navButtonBase =
  "flex w-full items-center gap-3 rounded-md px-4 py-3 text-gray-300 transition-colors hover:bg-white/5 hover:text-[#00FFFF]";

const GameHubSideNav = ({
  selectedCategory,
  onCategoryChange,
  isOpen,
  onClose
}: GameHubSideNavProps) => {
  const { data, isLoading } = useQuery({
    queryFn: fetchCategories,
    queryKey: ["gamehub-categories"]
  });

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = isOpen ? "hidden" : prev;
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const handleKeyActivate = (fn: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") fn();
  };

  const categories: GameCategory[] = Array.isArray(data?.categories)
    ? data?.categories
    : [];

  return (
    <>
      {/* Overlay */}
      <div
        {...(!isOpen && { "aria-hidden": "true" })}
        className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        } transition-opacity`}
        onClick={onClose}
      />

      {/* Drawer / Fixed Nav */}
      <nav
        aria-label="Game Hub navigation"
        className={`fixed top-0 left-0 z-40 h-screen w-72 border-[#2A2A2A] border-r bg-[#1A1A1A] transition-transform md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between px-4 py-4 md:hidden">
          <div className="flex items-center gap-2 text-white">
            <Bars3Icon className="h-5 w-5" />
            <span className="font-semibold">Menu</span>
          </div>
          <button
            aria-label="Close menu"
            className="rounded-md p-2 text-gray-400 hover:bg-white/5 hover:text-white"
            onClick={onClose}
            onKeyDown={handleKeyActivate(onClose)}
            tabIndex={0}
            type="button"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Branding */}
        <div className="hidden items-center gap-2 px-4 py-6 md:flex">
          <div className="h-3 w-3 rounded-full bg-[#00FFFF] shadow-[0_0_12px_#00FFFF]" />
          <span className="font-bold text-gray-100">Game Hub</span>
        </div>

        {/* Primary */}
        <div className="px-3">
          <div className="px-1 pb-2 font-semibold text-gray-500 text-xs uppercase tracking-wider">
            Navigation
          </div>
          <button
            aria-label="Discover"
            className={navButtonBase}
            onClick={() => {
              onCategoryChange("");
              onClose();
            }}
            onKeyDown={handleKeyActivate(() => {
              onCategoryChange("");
              onClose();
            })}
            tabIndex={0}
            type="button"
          >
            <Squares2X2Icon className="h-5 w-5" />
            <span>Discover</span>
          </button>
          <button
            aria-label="Tournaments"
            className={navButtonBase}
            onClick={() => {
              const el = document.getElementById("tournaments-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
              onClose();
            }}
            onKeyDown={handleKeyActivate(() => {
              const el = document.getElementById("tournaments-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
              onClose();
            })}
            tabIndex={0}
            type="button"
          >
            <TrophyIcon className="h-5 w-5" />
            <span>Tournaments</span>
          </button>
          <button
            aria-label="Favorites"
            className={navButtonBase}
            onClick={() => {
              const el = document.getElementById("liked-games");
              if (el) el.scrollIntoView({ behavior: "smooth" });
              onClose();
            }}
            onKeyDown={handleKeyActivate(() => {
              const el = document.getElementById("liked-games");
              if (el) el.scrollIntoView({ behavior: "smooth" });
              onClose();
            })}
            tabIndex={0}
            type="button"
          >
            <HeartIcon className="h-5 w-5" />
            <span>Favorites</span>
          </button>
          <Link
            aria-label="Loot Boxes"
            className={navButtonBase}
            onClick={() => onClose()}
            onKeyDown={handleKeyActivate(() => onClose())}
            tabIndex={0}
            to="/lootbox"
          >
            <GiftIcon className="h-5 w-5" />
            <span>Loot Boxes</span>
          </Link>
        </div>

        {/* Categories */}
        <div className="mt-6 px-3">
          <div className="px-1 pb-2 font-semibold text-gray-500 text-xs uppercase tracking-wider">
            Categories
          </div>
          <div className="space-y-1">
            <button
              aria-label="All games"
              className={`w-full rounded-md px-4 py-2 text-left text-sm transition-colors ${
                selectedCategory === ""
                  ? "border-[#00FFFF] border-l-2 bg-white/5 text-white"
                  : "text-gray-300 hover:bg-white/5 hover:text-[#00FFFF]"
              }`}
              onClick={() => {
                onCategoryChange("");
                onClose();
              }}
              onKeyDown={handleKeyActivate(() => {
                onCategoryChange("");
                onClose();
              })}
              tabIndex={0}
              type="button"
            >
              All Games
            </button>

            {isLoading && (
              <div className="space-y-1">
                {[...Array(6)].map((_, i) => (
                  <div
                    className="h-8 w-full animate-pulse rounded-md bg-white/5"
                    key={i}
                  />
                ))}
              </div>
            )}

            {!isLoading &&
              categories.map((c) => (
                <button
                  aria-label={`Category ${c.name}`}
                  className={`group w-full rounded-md px-4 py-2 text-left text-sm transition-colors ${
                    selectedCategory === c.slug
                      ? "border-[#00FFFF] border-l-2 bg-white/5 text-white"
                      : "text-gray-300 hover:bg-white/5 hover:text-[#00FFFF]"
                  }`}
                  key={c.id}
                  onClick={() => {
                    onCategoryChange(c.slug);
                    onClose();
                  }}
                  onKeyDown={handleKeyActivate(() => {
                    onCategoryChange(c.slug);
                    onClose();
                  })}
                  tabIndex={0}
                  type="button"
                >
                  <div className="flex items-center justify-between">
                    <span>{c.name}</span>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-gray-400 text-xs">
                      {c._count?.games ?? 0}
                    </span>
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* Footer */}
        <div className="absolute right-0 bottom-0 left-0 border-[#2A2A2A] border-t p-4 text-gray-500 text-xs">
          <p>© Game Hub</p>
        </div>
      </nav>
    </>
  );
};

export default GameHubSideNav;
