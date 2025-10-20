// Ad Configuration for different providers
export interface AdProviderConfig {
  name: string;
  maxRewardsPerDay: number;
  minCooldown: number; // in seconds
  supportedFormats: string[];
  enabled: boolean;
  apiKey?: string;
  appId?: string;
}

export const AD_PROVIDERS: Record<string, AdProviderConfig> = {
  google: {
    name: "Google AdMob",
    maxRewardsPerDay: 10,
    minCooldown: 30,
    supportedFormats: ["banner", "interstitial", "rewarded"],
    enabled: true,
    apiKey: process.env.REACT_APP_GOOGLE_ADMOB_API_KEY,
    appId: process.env.REACT_APP_GOOGLE_ADMOB_APP_ID
  },
  unity: {
    name: "Unity Ads",
    maxRewardsPerDay: 8,
    minCooldown: 60,
    supportedFormats: ["banner", "interstitial", "rewarded"],
    enabled: true,
    apiKey: process.env.REACT_APP_UNITY_ADS_API_KEY,
    appId: process.env.REACT_APP_UNITY_ADS_APP_ID
  },
  ironsource: {
    name: "IronSource",
    maxRewardsPerDay: 12,
    minCooldown: 45,
    supportedFormats: ["banner", "interstitial", "rewarded"],
    enabled: true,
    apiKey: process.env.REACT_APP_IRONSOURCE_API_KEY,
    appId: process.env.REACT_APP_IRONSOURCE_APP_ID
  }
};

// Default ad placement IDs
export const AD_PLACEMENTS = {
  rewarded: {
    google: "ca-app-pub-3940256099942544/5224354917", // Test placement
    unity: "Rewarded_Android",
    ironsource: "DefaultRewardedVideo"
  },
  interstitial: {
    google: "ca-app-pub-3940256099942544/1033173712", // Test placement
    unity: "Interstitial_Android",
    ironsource: "DefaultInterstitial"
  },
  banner: {
    google: "ca-app-pub-3940256099942544/6300978111", // Test placement
    unity: "Banner_Android",
    ironsource: "DefaultBanner"
  }
};

// Environment configuration
export const AD_CONFIG = {
  development: {
    useMockAds: true,
    mockAdDelay: 2000, // 2 seconds
    mockSuccessRate: 0.9 // 90% success rate
  },
  production: {
    useMockAds: false,
    mockAdDelay: 0,
    mockSuccessRate: 0
  }
};

// Get current environment config
export const getCurrentAdConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return AD_CONFIG[env as keyof typeof AD_CONFIG];
};

// Check if ad provider is enabled
export const isAdProviderEnabled = (provider: string): boolean => {
  return AD_PROVIDERS[provider]?.enabled || false;
};

// Get ad placement ID for provider and format
export const getAdPlacementId = (provider: string, format: string): string => {
  return AD_PLACEMENTS[format as keyof typeof AD_PLACEMENTS]?.[provider as keyof typeof AD_PLACEMENTS[keyof typeof AD_PLACEMENTS]] || "";
};
