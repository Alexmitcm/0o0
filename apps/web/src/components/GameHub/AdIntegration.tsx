import { useAccessControl } from "@/hooks/useAccessControl";

interface AdIntegrationProps {
  className?: string;
  type?: "banner" | "video" | "interstitial";
  position?: "top" | "bottom" | "sidebar" | "inline";
}

const AdIntegration = ({
  className = "",
  type = "banner",
  position = "inline"
}: AdIntegrationProps) => {
  const { accessConfig, isPremium } = useAccessControl();

  // Don't show ads for premium users
  if (isPremium || !accessConfig.showAds) {
    return null;
  }

  const getAdConfig = () => {
    switch (type) {
      case "banner":
        return {
          content: "Banner Ad Placeholder",
          height: "h-24"
        };
      case "video":
        return {
          content: "Video Ad Placeholder",
          height: "h-48"
        };
      case "interstitial":
        return {
          content: "Interstitial Ad Placeholder",
          height: "h-96"
        };
      default:
        return {
          content: "Ad Placeholder",
          height: "h-24"
        };
    }
  };

  const adConfig = getAdConfig();

  const getPositionClasses = () => {
    switch (position) {
      case "top":
        return "mb-6";
      case "bottom":
        return "mt-6";
      case "sidebar":
        return "sticky top-4";
      case "inline":
        return "my-6";
      default:
        return "my-6";
    }
  };

  return (
    <div className={`${getPositionClasses()} ${className}`}>
      <div
        className={`${adConfig.height} flex w-full items-center justify-center rounded-lg border border-white/10 bg-gradient-to-r from-blue-600/20 to-purple-600/20`}
      >
        <div className="text-center">
          <div className="mb-2 text-2xl">📺</div>
          <p className="text-gray-400 text-sm">{adConfig.content}</p>
          <p className="mt-1 text-gray-500 text-xs">
            Upgrade to Premium to remove ads
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdIntegration;
