import { useNavigate } from "react-router-dom";
import { Button } from "@/components/Shared/UI/Button";
import { useAccessControl } from "@/hooks/useAccessControl";
import { UserAccessLevel } from "@/types/access";

interface SmartCTAProps {
  feature: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "ghost";
}

const SmartCTA = ({
  feature,
  className = "",
  size = "md",
  variant = "primary"
}: SmartCTAProps) => {
  // Suppress unused parameter warning for className
  void className;
  const navigate = useNavigate();
  const { accessLevel, canAccess, getUpgradeMessage } = useAccessControl();

  const getCTAConfig = () => {
    switch (accessLevel) {
      case UserAccessLevel.GUEST:
        return {
          action: () => navigate("/auth"),
          icon: "🔓",
          text: "Login to Access",
          variant: "primary" as const
        };

      case UserAccessLevel.STANDARD:
        if (canAccess(feature as keyof typeof canAccess)) {
          return {
            action: () => {},
            icon: "✅",
            text: "Access Feature",
            variant: "secondary" as const
          };
        }
        return {
          action: () => navigate("/premium"),
          icon: "⭐",
          text: "Upgrade to Premium",
          variant: "primary" as const
        };

      case UserAccessLevel.PREMIUM:
      case UserAccessLevel.ADMIN:
        return {
          action: () => {},
          icon: "✅",
          text: "Access Feature",
          variant: "secondary" as const
        };

      default:
        return {
          action: () => navigate("/auth"),
          icon: "🔒",
          text: "Login Required",
          variant: "ghost" as const
        };
    }
  };

  const config = getCTAConfig();
  const upgradeMessage = getUpgradeMessage(
    feature as keyof typeof getUpgradeMessage
  );

  return (
    <div className={`space-y-2 ${className}`}>
      <Button
        className="w-full"
        onClick={config.action}
        size={size}
        variant={config.variant}
      >
        <span className="flex items-center gap-2">
          <span>{config.icon}</span>
          <span>{config.text}</span>
        </span>
      </Button>

      {accessLevel === UserAccessLevel.STANDARD &&
        !canAccess(feature as keyof typeof canAccess) && (
          <p className="text-center text-gray-400 text-xs">{upgradeMessage}</p>
        )}
    </div>
  );
};

export default SmartCTA;
