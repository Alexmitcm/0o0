import {
  AccessControl,
  PremiumUpgradePrompt
} from "@/components/AccessControl";
import { useUserStatus } from "@/hooks/useUserStatus";

const GameHubAccess = () => {
  const { isPremium, isLoading } = useUserStatus();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-full animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              className="h-32 w-full animate-pulse rounded bg-gray-200"
              key={i}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Free Games - Available to all users */}
      <section>
        <h2 className="mb-4 font-semibold text-gray-900 text-xl">Free Games</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FreeGameCard description="Classic puzzle game" title="Puzzle Game" />
          <FreeGameCard description="Test your memory" title="Memory Game" />
          <FreeGameCard
            description="Retro arcade experience"
            title="Arcade Game"
          />
        </div>
      </section>

      {/* Premium Games - Only for premium users */}
      <AccessControl
        fallback={
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900 text-xl">
              Premium Games
            </h2>
            <PremiumUpgradePrompt
              description="Get access to exclusive games, ad-free experience, and premium rewards"
              title="Unlock Premium Games"
            />
          </div>
        }
        requirePremium
      >
        <section>
          <div className="mb-4 flex items-center gap-2">
            <h2 className="font-semibold text-gray-900 text-xl">
              Premium Games
            </h2>
            <span className="rounded-full bg-purple-100 px-2 py-1 font-medium text-purple-700 text-xs">
              Premium
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <PremiumGameCard
              description="Premium role-playing game"
              title="Exclusive RPG"
            />
            <PremiumGameCard
              description="Advanced strategy experience"
              title="Strategy Game"
            />
            <PremiumGameCard
              description="High-speed racing adventure"
              title="Racing Game"
            />
          </div>
        </section>
      </AccessControl>

      {/* Game Features */}
      <section>
        <h2 className="mb-4 font-semibold text-gray-900 text-xl">
          Game Features
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FeatureCard
            available={true}
            description="Save your game progress and continue later"
            title="Save Progress"
          />
          <FeatureCard
            available={true}
            description="Compete with other players"
            title="Leaderboards"
          />
          <FeatureCard
            available={isPremium}
            description="Play without interruptions"
            title="Ad-Free Experience"
          />
          <FeatureCard
            available={isPremium}
            description="Earn exclusive rewards and XP"
            title="Premium Rewards"
          />
        </div>
      </section>
    </div>
  );
};

const FreeGameCard = ({
  title,
  description
}: {
  title: string;
  description: string;
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
    <h3 className="mb-2 font-medium text-gray-900">{title}</h3>
    <p className="mb-3 text-gray-600 text-sm">{description}</p>
    <button
      className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-blue-700"
      type="button"
    >
      Play Now
    </button>
  </div>
);

const PremiumGameCard = ({
  title,
  description
}: {
  title: string;
  description: string;
}) => (
  <div className="rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-4 transition-shadow hover:shadow-md">
    <div className="mb-2 flex items-center gap-2">
      <h3 className="font-medium text-gray-900">{title}</h3>
      <span className="rounded-full bg-purple-100 px-2 py-1 font-medium text-purple-700 text-xs">
        Premium
      </span>
    </div>
    <p className="mb-3 text-gray-600 text-sm">{description}</p>
    <button
      className="w-full rounded-lg bg-purple-600 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-purple-700"
      type="button"
    >
      Play Now
    </button>
  </div>
);

const FeatureCard = ({
  title,
  description,
  available
}: {
  title: string;
  description: string;
  available: boolean;
}) => (
  <div
    className={`rounded-lg border p-4 ${available ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}
  >
    <div className="mb-2 flex items-center gap-2">
      <h3 className="font-medium text-gray-900">{title}</h3>
      {available ? (
        <span className="rounded-full bg-green-100 px-2 py-1 font-medium text-green-700 text-xs">
          Available
        </span>
      ) : (
        <span className="rounded-full bg-gray-100 px-2 py-1 font-medium text-gray-500 text-xs">
          Premium Only
        </span>
      )}
    </div>
    <p className="text-gray-600 text-sm">{description}</p>
  </div>
);

export default GameHubAccess;
