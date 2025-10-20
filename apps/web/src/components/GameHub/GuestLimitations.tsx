import { Button } from "@/components/Shared/UI/Button";

interface GuestLimitationsProps {
  className?: string;
}

const GuestLimitations = ({ className = "" }: GuestLimitationsProps) => {
  const limitations = [
    {
      description: "2 minutes per game session",
      icon: "⏰",
      premium: "Unlimited play time",
      title: "Limited Play Time"
    },
    {
      description: "Access to basic free games",
      icon: "🎮",
      premium: "100+ Premium games",
      title: "Free Games Only"
    },
    {
      description: "Cannot earn USDT or coins",
      icon: "💰",
      premium: "Earn real USDT rewards",
      title: "No Rewards"
    },
    {
      description: "Cannot join tournaments",
      icon: "🏆",
      premium: "Join exclusive tournaments",
      title: "No Tournaments"
    },
    {
      description: "Progress not saved",
      icon: "📊",
      premium: "Full progress tracking",
      title: "No Progress Tracking"
    },
    {
      description: "Cannot like, comment, or share",
      icon: "👥",
      premium: "Full social features",
      title: "No Social Features"
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h2 className="mb-2 font-bold text-2xl text-white">
          Guest Mode Limitations
        </h2>
        <p className="text-gray-400">
          Upgrade to unlock all features and remove limitations
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {limitations.map((limitation, index) => (
          <div
            className="rounded-lg border border-white/10 bg-gray-800/50 p-4"
            key={index}
          >
            <div className="mb-3 text-2xl">{limitation.icon}</div>
            <h3 className="mb-2 font-semibold text-white">
              {limitation.title}
            </h3>
            <p className="mb-3 text-gray-400 text-sm">
              {limitation.description}
            </p>
            <div className="rounded-lg bg-green-500/10 p-2">
              <p className="text-green-400 text-xs">
                <span className="font-semibold">Premium:</span>{" "}
                {limitation.premium}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-purple-500/30 bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-6 text-center">
        <div className="mb-4 text-4xl">⭐</div>
        <h3 className="mb-2 font-bold text-white text-xl">Ready to Upgrade?</h3>
        <p className="mb-6 text-gray-300">
          Get unlimited access to all games, earn real rewards, and join
          exclusive tournaments
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={() => {
              /* Navigate to premium */
            }}
            size="lg"
            variant="primary"
          >
            Upgrade to Premium
          </Button>
          <Button
            onClick={() => {
              /* Navigate to auth */
            }}
            size="lg"
            variant="ghost"
          >
            Login First
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GuestLimitations;
