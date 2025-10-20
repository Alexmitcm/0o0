import { useMemo } from "react";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { ACCESS_LEVELS, getAccessLevel, UserAccessLevel } from "@/types/access";

export const useAccessControl = () => {
  const { currentAccount } = useAccountStore();

  const accessLevel = useMemo(() => {
    return getAccessLevel(currentAccount);
  }, [currentAccount]);

  const accessConfig = useMemo(() => {
    return ACCESS_LEVELS[accessLevel];
  }, [accessLevel]);

  const canAccess = (feature: keyof typeof accessConfig) => {
    return accessConfig[feature];
  };

  const isGuest = accessLevel === UserAccessLevel.GUEST;
  const isStandard = accessLevel === UserAccessLevel.STANDARD;
  const isPremium = accessLevel === UserAccessLevel.PREMIUM;
  const isAdmin = accessLevel === UserAccessLevel.ADMIN;

  const needsUpgrade = (feature: keyof typeof accessConfig) => {
    return !canAccess(feature) && accessLevel !== UserAccessLevel.ADMIN;
  };

  const getUpgradeMessage = (feature: keyof typeof accessConfig) => {
    if (isGuest) {
      return "Login to access this feature";
    }
    if (isStandard && !canAccess(feature)) {
      return "Upgrade to Premium to access this feature";
    }
    return "Access denied";
  };

  return {
    accessConfig,
    accessLevel,
    canAccess,
    getUpgradeMessage,
    isAdmin,
    isGuest,
    isPremium,
    isStandard,
    needsUpgrade
  };
};
