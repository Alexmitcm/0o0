import { useState } from "react";
import { useAccessControl } from "@/hooks/useAccessControl";
import { UserAccessLevel } from "@/types/access";

interface ProgressiveDisclosureProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  feature?: string;
  className?: string;
  defaultExpanded?: boolean;
}

const ProgressiveDisclosure = ({
  children,
  title,
  description,
  feature,
  className = "",
  defaultExpanded = false
}: ProgressiveDisclosureProps) => {
  const { accessLevel, canAccess } = useAccessControl();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const hasAccess = feature
    ? canAccess(feature as keyof typeof canAccess)
    : true;
  const isGuest = accessLevel === UserAccessLevel.GUEST;
  const isStandard = accessLevel === UserAccessLevel.STANDARD;

  const getHeaderIcon = () => {
    if (!hasAccess) {
      if (isGuest) return "🔓";
      if (isStandard) return "⭐";
      return "🔒";
    }
    return isExpanded ? "📖" : "📚";
  };

  const getHeaderColor = () => {
    if (!hasAccess) {
      if (isGuest) return "text-blue-400";
      if (isStandard) return "text-purple-400";
      return "text-gray-400";
    }
    return "text-white";
  };

  const handleToggle = () => {
    if (hasAccess) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div
      className={`rounded-lg border border-white/10 bg-gray-800/50 ${className}`}
    >
      <button
        className={`w-full p-4 text-left transition-colors ${
          hasAccess
            ? "cursor-pointer hover:bg-gray-700/50"
            : "cursor-not-allowed opacity-75"
        }`}
        disabled={!hasAccess}
        onClick={handleToggle}
        type="button"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{getHeaderIcon()}</div>
            <div>
              <h3 className={`font-semibold ${getHeaderColor()}`}>{title}</h3>
              {description && (
                <p className="text-gray-400 text-sm">{description}</p>
              )}
            </div>
          </div>

          {hasAccess && (
            <div className="text-gray-400">{isExpanded ? "▼" : "▶"}</div>
          )}
        </div>
      </button>

      {hasAccess && isExpanded && (
        <div className="border-white/10 border-t p-4">{children}</div>
      )}

      {!hasAccess && (
        <div className="border-white/10 border-t p-4">
          <div className="text-center">
            <p className="mb-3 text-gray-400 text-sm">
              {isGuest
                ? "Login to access this feature"
                : isStandard
                  ? "Upgrade to Premium to access this feature"
                  : "Access denied"}
            </p>
            {isGuest && (
              <button
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
                type="button"
              >
                Login Now
              </button>
            )}
            {isStandard && (
              <button
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm text-white transition-colors hover:bg-purple-700"
                type="button"
              >
                Upgrade to Premium
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressiveDisclosure;
