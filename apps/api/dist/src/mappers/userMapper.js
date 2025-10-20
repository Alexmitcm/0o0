"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapUserToProfile = void 0;
const mapUserToProfile = (user) => ({
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
exports.mapUserToProfile = mapUserToProfile;
