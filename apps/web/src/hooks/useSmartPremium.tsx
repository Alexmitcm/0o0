import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useAccountStore } from "@/store/persisted/useAccountStore";

interface SmartPremiumState {
  metaMaskWallet: string | null;
  familyWallet: string | null;
  lensProfiles: any[];
  selectedProfile: any | null;
  isLinked: boolean;
  isPremium: boolean;
  wasAlreadyPremium: boolean;
  isLoading: boolean;
  error: string | null;
  message: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

export const useSmartPremium = () => {
  const { address: metaMaskAddress } = useAccount();
  const { currentAccount } = useAccountStore();

  const [state, setState] = useState<SmartPremiumState>({
    error: null,
    familyWallet: null,
    isLinked: false,
    isLoading: false,
    isPremium: false,
    lensProfiles: [],
    message: "",
    metaMaskWallet: null,
    selectedProfile: null,
    wasAlreadyPremium: false
  });

  // Get Family Wallet from current account
  const familyWalletAddress = currentAccount?.address;

  // Check smart premium status
  const checkSmartStatus = useCallback(async (walletAddress: string) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/smart-premium/status?metaMaskAddress=${walletAddress}`
      );
      const data = await response.json();

      if (data.success) {
        setState((prev) => ({
          ...prev,
          isPremium: data.isPremium,
          message: data.message,
          metaMaskWallet: walletAddress,
          wasAlreadyPremium: data.wasAlreadyPremium
        }));
        return data;
      }
      throw new Error(data.error || "Failed to check smart premium status");
    } catch (error) {
      console.error("Failed to check smart premium status:", error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Failed to check smart premium status"
      }));
      return { isPremium: false, wasAlreadyPremium: false };
    }
  }, []);

  // Get Lens profiles
  const getLensProfiles = useCallback(async (walletAddress: string) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/dual-auth/lens-profiles?familyWalletAddress=${walletAddress}`
      );
      const data = await response.json();

      if (data.success) {
        setState((prev) => ({
          ...prev,
          familyWallet: walletAddress,
          lensProfiles: data.profiles
        }));
        return data.profiles;
      }
      throw new Error(data.error || "Failed to get Lens profiles");
    } catch (error) {
      console.error("Failed to get Lens profiles:", error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to get Lens profiles"
      }));
      return [];
    }
  }, []);

  // Smart link wallets
  const smartLinkWallets = useCallback(
    async (
      metaMaskAddress: string,
      familyWalletAddress: string,
      lensProfileId: string
    ) => {
      setState((prev) => ({ ...prev, error: null, isLoading: true }));

      try {
        const response = await fetch(`${API_BASE}/api/smart-premium/link`, {
          body: JSON.stringify({
            familyWalletAddress,
            lensProfileId,
            metaMaskAddress
          }),
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST"
        });

        const data = await response.json();

        if (data.success) {
          setState((prev) => ({
            ...prev,
            error: null,
            isLinked: true,
            isLoading: false,
            isPremium: data.user.isPremium,
            message: data.message,
            selectedProfile: {
              avatarUrl: data.user.avatarUrl,
              displayName: data.user.displayName,
              id: data.user.lensProfileId
            },
            wasAlreadyPremium: data.user.wasAlreadyPremium
          }));

          // Store token
          localStorage.setItem("smart_premium_token", data.token);

          return data;
        }
        throw new Error(data.error || "Failed to link wallets");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to link wallets";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false
        }));
        throw error;
      }
    },
    []
  );

  // Get user smart status
  const getUserSmartStatus = useCallback(async (metaMaskAddress: string) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/smart-premium/user-status?metaMaskAddress=${metaMaskAddress}`
      );
      const data = await response.json();

      if (data.success) {
        setState((prev) => ({
          ...prev,
          familyWallet: data.familyWalletAddress,
          isLinked: data.isLinked,
          isPremium: data.isPremium,
          message: data.message,
          selectedProfile: data.lensProfileId
            ? {
                avatarUrl: data.avatarUrl,
                displayName: data.displayName,
                id: data.lensProfileId
              }
            : null,
          wasAlreadyPremium: data.wasAlreadyPremium
        }));
        return data;
      }
      throw new Error(data.error || "Failed to get user smart status");
    } catch (error) {
      console.error("Failed to get user smart status:", error);
      return { isLinked: false, isPremium: false };
    }
  }, []);

  // Validate stored token
  const validateToken = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/dual-auth/validate`, {
        body: JSON.stringify({ token }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      const data = await response.json();

      if (data.success) {
        setState((prev) => ({
          ...prev,
          familyWallet: data.user.familyWalletAddress,
          isLinked: true,
          isPremium: data.user.status === "Premium",
          metaMaskWallet: data.user.walletAddress,
          selectedProfile: data.user.linkedProfileId
            ? {
                id: data.user.linkedProfileId
              }
            : null
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Token validation failed:", error);
      return false;
    }
  }, []);

  // Auto-check when MetaMask is connected
  useEffect(() => {
    const autoCheck = async () => {
      if (!metaMaskAddress || state.isLoading) return;

      // Check if we have a valid token first
      const storedToken = localStorage.getItem("smart_premium_token");
      if (storedToken) {
        const isValid = await validateToken(storedToken);
        if (isValid) return;
      }

      // Check smart premium status
      await checkSmartStatus(metaMaskAddress);
    };

    autoCheck();
  }, [metaMaskAddress, checkSmartStatus, validateToken, state.isLoading]);

  // Auto-get profiles when Family Wallet is connected
  useEffect(() => {
    const autoGetProfiles = async () => {
      if (!familyWalletAddress || state.isLoading) return;
      await getLensProfiles(familyWalletAddress);
    };

    autoGetProfiles();
  }, [familyWalletAddress, getLensProfiles, state.isLoading]);

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Logout
  const logout = useCallback(() => {
    setState({
      error: null,
      familyWallet: null,
      isLinked: false,
      isLoading: false,
      isPremium: false,
      lensProfiles: [],
      message: "",
      metaMaskWallet: null,
      selectedProfile: null,
      wasAlreadyPremium: false
    });
    localStorage.removeItem("smart_premium_token");
  }, []);

  return {
    // Actions
    checkSmartStatus,
    clearError,
    error: state.error,
    familyWallet: state.familyWallet,
    getLensProfiles,
    getUserSmartStatus,
    isLinked: state.isLinked,
    isLoading: state.isLoading,
    isPremium: state.isPremium,
    lensProfiles: state.lensProfiles,
    logout,
    message: state.message,
    // State
    metaMaskWallet: state.metaMaskWallet,
    selectedProfile: state.selectedProfile,
    smartLinkWallets,
    wasAlreadyPremium: state.wasAlreadyPremium
  };
};
