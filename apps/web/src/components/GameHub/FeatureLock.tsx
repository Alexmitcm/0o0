import { useAccessControl } from "@/hooks/useAccessControl";
import { UserAccessLevel } from "@/types/access";

interface FeatureLockProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

const FeatureLock = ({
  feature,
  children,
  fallback = null,
  className = ""
}: FeatureLockProps) => {
  const { accessLevel, canAccess, getUpgradeMessage } = useAccessControl();

  // If user has access, show the feature
  if (canAccess(feature as keyof typeof canAccess)) {
    return <>{children}</>;
  }

  // If custom fallback provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default locked state
  const getLockedContent = () => {
    switch (accessLevel) {
      case UserAccessLevel.GUEST:
        return (
          <div
            className={`rounded-lg border border-blue-500/30 bg-blue-500/10 p-6 text-center ${className}`}
          >
            <div className="mb-4 text-4xl">🔓</div>
            <h3 className="mb-2 font-semibold text-lg text-white">
              Login Required
            </h3>
            <p className="text-gray-400 text-sm">
              Please login to access this feature
            </p>
          </div>
        );

      case UserAccessLevel.STANDARD:
        return (
          <div
            className={`rounded-lg border border-purple-500/30 bg-purple-500/10 p-6 text-center ${className}`}
          >
            <div className="mb-4 text-4xl">⭐</div>
            <h3 className="mb-2 font-semibold text-lg text-white">
              Premium Feature
            </h3>
            <p className="text-gray-400 text-sm">
              {getUpgradeMessage(feature as keyof typeof getUpgradeMessage)}
            </p>
          </div>
        );

      default:
        return (
          <div
            className={`rounded-lg border border-gray-500/30 bg-gray-500/10 p-6 text-center ${className}`}
          >
            <div className="mb-4 text-4xl">🔒</div>
            <h3 className="mb-2 font-semibold text-lg text-white">
              Access Denied
            </h3>
            <p className="text-gray-400 text-sm">
              You don't have permission to access this feature
            </p>
          </div>
        );
    }
  };

  return getLockedContent();
};

export default FeatureLock;
