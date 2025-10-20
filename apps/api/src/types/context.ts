export interface AppContext {
  Variables: {
    requestId: string;
    account: string | null;
    token: string | null;
    walletAddress: string | null;
    profileId: string | null;
    isPremium: boolean;
  };
}
