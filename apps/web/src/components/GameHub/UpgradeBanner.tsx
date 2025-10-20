import { useNavigate } from "react-router-dom";
import { Button } from "@/components/Shared/UI/Button";
import { useAccessControl } from "@/hooks/useAccessControl";

interface UpgradeBannerProps {
  title: string;
  description: string;
  cta: string;
  features?: string[];
  className?: string;
  onUpgrade?: () => void;
}

const UpgradeBanner = ({
  title,
  description,
  cta,
  features = [],
  className = "",
  onUpgrade
}: UpgradeBannerProps) => {
  const navigate = useNavigate();
  const { isGuest } = useAccessControl();

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
      return;
    }

    if (isGuest) {
      navigate("/auth");
    } else {
      navigate("/premium");
    }
  };

  const getBannerConfig = () => {
    if (isGuest) {
      return {
        borderColor: "border-blue-500/30",
        gradient: "from-blue-600/20 to-purple-600/20",
        icon: "🔓",
        primaryText: "Login to Unlock",
        secondaryText: "Create your account to access all features"
      };
    }

    return {
      borderColor: "border-purple-500/30",
      gradient: "from-purple-600/20 to-pink-600/20",
      icon: "⭐",
      primaryText: "Upgrade to Premium",
      secondaryText: "Get access to exclusive features and rewards"
    };
  };

  const config = getBannerConfig();

  return (
    <div
      className={`rounded-2xl border ${config.borderColor} bg-gradient-to-r ${config.gradient} p-8 ${className}`}
    >
      <div className="text-center">
        <div className="mb-4 text-4xl">{config.icon}</div>
        <h3 className="mb-4 font-bold text-2xl text-white">{title}</h3>
        <p className="mx-auto mb-6 max-w-2xl text-gray-300">{description}</p>

        {features.length > 0 && (
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {features.map((feature, index) => (
              <div
                className="flex items-center gap-2 text-gray-300"
                key={index}
              >
                <span className="text-green-400">✓</span>
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button onClick={handleUpgrade} size="lg" variant="primary">
            {cta}
          </Button>

          {isGuest && (
            <Button
              onClick={() => navigate("/auth")}
              size="lg"
              variant="outline"
            >
              Login First
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpgradeBanner;
