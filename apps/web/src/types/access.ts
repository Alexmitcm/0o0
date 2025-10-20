export enum UserAccessLevel {
  GUEST = "guest",
  STANDARD = "standard",
  PREMIUM = "premium",
  ADMIN = "admin"
}

export interface AccessControl {
  level: UserAccessLevel;
  canPlayFreeGames: boolean;
  canPlayPremiumGames: boolean;
  canEarnRewards: boolean;
  canViewRewards: boolean;
  canAccessTournaments: boolean;
  canUploadGames: boolean;
  canManageContent: boolean;
  showAds: boolean;
}

export const ACCESS_LEVELS: Record<UserAccessLevel, AccessControl> = {
  [UserAccessLevel.GUEST]: {
    canAccessTournaments: false,
    canEarnRewards: false,
    canManageContent: false,
    canPlayFreeGames: true,
    canPlayPremiumGames: false,
    canUploadGames: false,
    canViewRewards: false,
    level: UserAccessLevel.GUEST,
    showAds: true
  },
  [UserAccessLevel.STANDARD]: {
    canAccessTournaments: true,
    canEarnRewards: true,
    canManageContent: false,
    canPlayFreeGames: true,
    canPlayPremiumGames: false,
    canUploadGames: false,
    canViewRewards: true,
    level: UserAccessLevel.STANDARD,
    showAds: true
  },
  [UserAccessLevel.PREMIUM]: {
    canAccessTournaments: true,
    canEarnRewards: true,
    canManageContent: false,
    canPlayFreeGames: true,
    canPlayPremiumGames: true,
    canUploadGames: true,
    canViewRewards: true,
    level: UserAccessLevel.PREMIUM,
    showAds: false
  },
  [UserAccessLevel.ADMIN]: {
    canAccessTournaments: true,
    canEarnRewards: true,
    canManageContent: true,
    canPlayFreeGames: true,
    canPlayPremiumGames: true,
    canUploadGames: true,
    canViewRewards: true,
    level: UserAccessLevel.ADMIN,
    showAds: false
  }
};

export const getAccessLevel = (user: any): UserAccessLevel => {
  if (!user) return UserAccessLevel.GUEST;

  if (user.role === "admin") return UserAccessLevel.ADMIN;
  if (user.premiumProfile?.isActive) return UserAccessLevel.PREMIUM;
  if (user.walletAddress) return UserAccessLevel.STANDARD;

  return UserAccessLevel.GUEST;
};

export const hasAccess = (user: any, feature: keyof AccessControl): boolean => {
  const level = getAccessLevel(user);
  return Boolean(ACCESS_LEVELS[level][feature]);
};
