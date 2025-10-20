// Core Types for Hey Pro System

// Database Models
export interface PremiumProfile {
  id: string;
  walletAddress: string;
  profileId: string;
  isActive: boolean;
  linkedAt: Date;
  deactivatedAt?: Date;
}

// Wallet Status
export interface WalletStatus {
  isRegistered: boolean;
  walletAddress: string;
}

// Profile Information
export interface ProfileInfo {
  id: string;
  handle: string;
  ownedBy: string;
}

// Service Interfaces
export interface IPremiumService {
  checkWalletStatus(walletAddress: string): Promise<WalletStatus>;
  linkProfile(
    walletAddress: string,
    profileId: string
  ): Promise<PremiumProfile>;
  getPremiumStatus(walletAddress: string, profileId: string): Promise<boolean>;
}

export interface IProfileService {
  getUserProfiles(walletAddress: string): Promise<ProfileInfo[]>;
  validateProfileOwnership(
    walletAddress: string,
    profileId: string
  ): Promise<boolean>;
}

export interface IJwtService {
  generateToken(payload: { isPremium: boolean; profileId: string }): string;
  verifyToken(token: string): { isPremium: boolean; profileId: string };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Authentication Types
export interface AuthPayload {
  isPremium: boolean;
  profileId: string;
  walletAddress: string;
}

// Error Types
export interface ServiceError extends Error {
  code: string;
  statusCode: number;
}
