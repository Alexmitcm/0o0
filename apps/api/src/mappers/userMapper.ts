export interface UserWithRelations {
  walletAddress: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  twitterHandle?: string | null;
  registrationDate: Date;
  lastActiveAt: Date;
  totalLogins: number;
  status: "Standard" | "Premium";
  premiumProfile?: { profileId: string; linkedAt: Date } | null;
}

export const mapUserToProfile = (user: UserWithRelations) => ({
  avatarUrl: user.avatarUrl || undefined,
  bio: user.bio || undefined,
  displayName: user.displayName || undefined,
  email: user.email || undefined,
  lastActiveAt: user.lastActiveAt,
  linkedProfileId: user.premiumProfile?.profileId,
  location: user.location || undefined,
  referrerAddress: undefined,
  registrationDate: user.registrationDate,
  status: user.status,
  totalLogins: user.totalLogins,
  twitterHandle: user.twitterHandle || undefined,
  username: user.username || undefined,
  walletAddress: user.walletAddress,
  website: user.website || undefined
});
