import { useState } from "react";
import type { Game } from "@/helpers/gameHub";
import GameCard from "./GameCard";

// Empty game object - will be populated with real data from API
const demoGame: Game = {
  categories: [],
  createdAt: "",
  description: "",
  dislikeCount: 0,
  entryFilePath: "",
  gameFileUrl: "",
  gameType: "FreeToPlay",
  height: 0,
  id: "",
  instructions: "",
  isFeatured: false,
  likeCount: 0,
  playCount: 0,
  rating: 0,
  ratingCount: 0,
  slug: "",
  source: "Self",
  status: "Draft",
  tags: [],
  thumb1Url: "",
  thumb2Url: "",
  title: "",
  updatedAt: "",
  user: {
    avatarUrl: "",
    displayName: "",
    username: "",
    walletAddress: ""
  },
  userDislike: false,
  userLike: false,
  userRating: undefined,
  width: 0
};

const GameCardDemo = () => {
  const [showActions, setShowActions] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<
    "default" | "compact" | "featured"
  >("default");

  return (
    <div className="min-h-screen bg-gray-50 p-8 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 font-bold text-4xl text-gray-900 dark:text-white">
            GameCard Component Demo
          </h1>
          <p className="text-gray-600 text-lg dark:text-gray-300">
            Showcasing different variants and features of the enhanced GameCard
            component
          </p>
        </div>

        {/* Controls */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <h2 className="mb-4 font-semibold text-gray-900 text-xl dark:text-white">
            Controls
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label
                className="mb-2 block font-medium text-gray-700 text-sm dark:text-gray-300"
                htmlFor="variant-select"
              >
                Variant
              </label>
              <select
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                id="variant-select"
                onChange={(e) => setSelectedVariant(e.target.value as any)}
                value={selectedVariant}
              >
                <option value="default">Default</option>
                <option value="compact">Compact</option>
                <option value="featured">Featured</option>
              </select>
            </div>

            <div>
              <label
                className="mb-2 block font-medium text-gray-700 text-sm dark:text-gray-300"
                htmlFor="show-actions"
              >
                Show Actions
              </label>
              <input
                checked={showActions}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                id="show-actions"
                onChange={(e) => setShowActions(e.target.checked)}
                type="checkbox"
              />
            </div>
          </div>
        </div>

        {/* Demo Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3">
          {/* Main Demo Card */}
          <div className="lg:col-span-2 xl:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <h3 className="mb-4 font-semibold text-gray-900 text-lg dark:text-white">
                {selectedVariant.charAt(0).toUpperCase() +
                  selectedVariant.slice(1)}{" "}
                Variant
              </h3>
              <GameCard
                game={demoGame}
                showActions={showActions}
                variant={selectedVariant}
              />
            </div>
          </div>

          {/* Compact Variant */}
          <div>
            <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <h3 className="mb-4 font-semibold text-gray-900 text-lg dark:text-white">
                Compact Variant
              </h3>
              <GameCard game={demoGame} showActions={false} variant="compact" />
            </div>
          </div>

          {/* Featured Variant */}
          <div>
            <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <h3 className="mb-4 font-semibold text-gray-900 text-lg dark:text-white">
                Featured Variant
              </h3>
              <GameCard game={demoGame} showActions={true} variant="featured" />
            </div>
          </div>

          {/* Default Variant */}
          <div>
            <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <h3 className="mb-4 font-semibold text-gray-900 text-lg dark:text-white">
                Default Variant
              </h3>
              <GameCard game={demoGame} showActions={true} variant="default" />
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <h2 className="mb-4 font-semibold text-gray-900 text-xl dark:text-white">
            Features
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="mt-2 h-2 w-2 rounded-full bg-blue-500" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Multiple Variants
                </h4>
                <p className="text-gray-600 text-sm dark:text-gray-400">
                  Default, compact, and featured layouts
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-2 h-2 w-2 rounded-full bg-green-500" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Interactive Actions
                </h4>
                <p className="text-gray-600 text-sm dark:text-gray-400">
                  Like, dislike, and rating functionality
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-2 h-2 w-2 rounded-full bg-purple-500" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Enhanced Stats
                </h4>
                <p className="text-gray-600 text-sm dark:text-gray-400">
                  Plays, likes, dislikes, and ratings
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-2 h-2 w-2 rounded-full bg-yellow-500" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Status Badges
                </h4>
                <p className="text-gray-600 text-sm dark:text-gray-400">
                  Published, draft, archived status
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-2 h-2 w-2 rounded-full bg-red-500" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Hover Effects
                </h4>
                <p className="text-gray-600 text-sm dark:text-gray-400">
                  Smooth animations and transitions
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-2 h-2 w-2 rounded-full bg-indigo-500" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Responsive Design
                </h4>
                <p className="text-gray-600 text-sm dark:text-gray-400">
                  Works on all screen sizes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameCardDemo;
