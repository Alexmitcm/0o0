import {
  Bars3Icon,
  HeartIcon,
  PlayIcon,
  XMarkIcon
} from "@heroicons/react/24/solid";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { fetchCategories, type GameCategory } from "@/helpers/gameHub";
import { useHasPremiumAccess } from "@/helpers/premiumUtils";
import StatusBanner from "../Shared/UI/StatusBanner";

interface GameHubSidebarProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const GameHubSidebar = ({
  selectedCategory,
  onCategoryChange
}: GameHubSidebarProps) => {
  const hasPremiumAccess = useHasPremiumAccess();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: categoriesResponse, isLoading } = useQuery({
    queryFn: fetchCategories,
    queryKey: ["gameCategories"]
  });

  // Extract categories array from response and ensure it's an array
  const categories: GameCategory[] = Array.isArray(
    categoriesResponse?.categories
  )
    ? categoriesResponse.categories
    : [];

  if (isLoading) {
    return (
      <div className="w-full md:w-72">
        <StatusBanner />
        <div className="mt-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              className="h-12 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
              key={i}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        aria-label="Open menu"
        className="fixed top-4 left-4 z-50 rounded-lg bg-white p-2 shadow-lg md:hidden"
        onClick={() => setIsMobileMenuOpen(true)}
        type="button"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-full transform transition-transform duration-300 ease-in-out md:relative md:z-auto md:transform-none ${
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        } w-full md:w-72`}
      >
        <div className="flex h-full flex-col bg-white dark:bg-gray-800">
          {/* Mobile Header */}
          <div className="flex items-center justify-between border-b p-4 md:hidden">
            <h2 className="font-semibold text-gray-900 text-lg dark:text-white">
              Categories
            </h2>
            <button
              aria-label="Close menu"
              className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setIsMobileMenuOpen(false)}
              type="button"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-0">
            <StatusBanner />

            {/* Categories Section */}
            <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <title>Categories icon</title>
                    <path
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 text-lg dark:text-white">
                  Categories
                </h3>
              </div>

              <div className="space-y-2">
                <button
                  className={`hover-scale w-full rounded-lg px-4 py-3 text-left font-medium text-sm transition-all duration-200 ${
                    selectedCategory === ""
                      ? "bg-blue-100 text-blue-700 shadow-sm dark:bg-blue-900/30 dark:text-blue-300"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                  onClick={() => onCategoryChange("")}
                  type="button"
                >
                  All Games
                </button>

                {categories.map((category: GameCategory) => {
                  const isPlayToEarn = category.slug === "play-to-earn-games";
                  const isLocked = isPlayToEarn && !hasPremiumAccess;

                  return (
                    <button
                      className={`w-full rounded-lg px-4 py-3 text-left font-medium text-sm transition-all duration-200 ${
                        selectedCategory === category.slug
                          ? "bg-blue-100 text-blue-700 shadow-sm dark:bg-blue-900/30 dark:text-blue-300"
                          : isLocked
                            ? "cursor-not-allowed text-gray-400 dark:text-gray-600"
                            : "hover-scale text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                      disabled={isLocked}
                      key={category.id}
                      onClick={() =>
                        !isLocked && onCategoryChange(category.slug)
                      }
                      type="button"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{category.name}</span>
                          {isPlayToEarn && <span className="text-xs">💰</span>}
                          {isLocked && <span className="text-xs">🔒</span>}
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 font-medium text-xs ${
                            isLocked
                              ? "bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                          }`}
                        >
                          {category._count?.games || 0}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Collections Section */}
            <div className="mt-6 rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <title>Collections icon</title>
                    <path
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900 text-sm dark:text-white">
                  Collections
                </h4>
              </div>

              <div className="space-y-2">
                <button
                  className="hover-scale flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left font-medium text-red-600 text-sm transition-all duration-200 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  onClick={() => {
                    // Scroll to liked games section
                    document
                      .getElementById("liked-games")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  type="button"
                >
                  <HeartIcon className="h-4 w-4" />
                  Liked Games
                </button>

                <Link
                  className="hover-scale flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left font-medium text-purple-600 text-sm transition-all duration-200 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20"
                  to="/gaming-dashboard/demo"
                >
                  <PlayIcon className="h-4 w-4" />
                  Component Demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GameHubSidebar;
