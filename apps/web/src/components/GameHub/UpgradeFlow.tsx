import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/Shared/UI/Button";
import { useAccessControl } from "@/hooks/useAccessControl";
import { UserAccessLevel } from "@/types/access";

interface UpgradeFlowProps {
  feature: string;
  className?: string;
  showPreview?: boolean;
}

const UpgradeFlow = ({
  feature,
  className = "",
  showPreview = true
}: UpgradeFlowProps) => {
  const navigate = useNavigate();
  const { accessLevel, canAccess, getUpgradeMessage } = useAccessControl();
  const [showDetails, setShowDetails] = useState(false);

  const getFeatureInfo = () => {
    switch (feature) {
      case "canPlayPremiumGames":
        return {
          benefits: [
            "100+ Premium Games",
            "Real USDT Rewards",
            "No Advertisements",
            "Priority Support"
          ],
          description: "Access to exclusive Play-to-Earn games",
          icon: "🎮",
          title: "Premium Games"
        };
      case "canEarnRewards":
        return {
          benefits: [
            "Daily Login Bonuses",
            "Achievement Rewards",
            "Tournament Prizes",
            "Referral Bonuses"
          ],
          description: "Earn real USDT by playing games",
          icon: "💰",
          title: "Earn Rewards"
        };
      case "canAccessTournaments":
        return {
          benefits: [
            "Weekly Tournaments",
            "Prize Pools up to $10,000",
            "Leaderboards",
            "Exclusive Rewards"
          ],
          description: "Compete in exclusive tournaments",
          icon: "🏆",
          title: "Tournaments"
        };
      case "canUploadGames":
        return {
          benefits: [
            "Game Upload Portal",
            "Revenue Sharing",
            "Analytics Dashboard",
            "Community Features"
          ],
          description: "Upload your own games to the platform",
          icon: "📤",
          title: "Upload Games"
        };
      default:
        return {
          benefits: [
            "Exclusive Content",
            "Advanced Features",
            "Priority Support",
            "No Advertisements"
          ],
          description: "Access to premium features",
          icon: "⭐",
          title: "Premium Feature"
        };
    }
  };

  const featureInfo = getFeatureInfo();

  // Don't show upgrade flow for users who already have access
  if (canAccess(feature as keyof typeof canAccess)) {
    return (
      <div
        className={`rounded-lg border border-green-500/30 bg-green-500/10 p-4 ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="text-2xl">✅</div>
          <div>
            <h3 className="font-semibold text-green-400">
              {featureInfo.title} - Available
            </h3>
            <p className="text-green-300 text-sm">
              You have access to this feature
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleUpgrade = () => {
    if (accessLevel === UserAccessLevel.GUEST) {
      navigate("/auth");
    } else {
      navigate("/premium");
    }
  };

  return (
    <div
      className={`rounded-lg border border-white/10 bg-gray-800/50 p-6 ${className}`}
    >
      <div className="text-center">
        <div className="mb-4 text-4xl">{featureInfo.icon}</div>
        <h3 className="mb-2 font-bold text-white text-xl">
          {featureInfo.title}
        </h3>
        <p className="mb-4 text-gray-400">{featureInfo.description}</p>

        {showPreview && (
          <div className="mb-6">
            <button
              className="text-purple-400 text-sm hover:text-purple-300"
              onClick={() => setShowDetails(!showDetails)}
              type="button"
            >
              {showDetails ? "Hide" : "Show"} Benefits
            </button>

            {showDetails && (
              <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                {featureInfo.benefits.map((benefit, index) => (
                  <div
                    className="flex items-center gap-2 text-gray-300 text-sm"
                    key={index}
                  >
                    <span className="text-green-400">✓</span>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <Button
            className="w-full"
            onClick={handleUpgrade}
            size="lg"
            variant="primary"
          >
            {accessLevel === UserAccessLevel.GUEST
              ? "Login to Upgrade"
              : "Upgrade to Premium"}
          </Button>

          <p className="text-gray-500 text-xs">
            {getUpgradeMessage(feature as keyof typeof getUpgradeMessage)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpgradeFlow;
