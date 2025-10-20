import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useAccountStore } from "@/store/persisted/useAccountStore";

interface DualWalletState {
  metaMaskWallet: string | null;
  familyWallet: string | null;
  lensProfiles: any[];
  selectedProfile: any | null;
  isLinked: boolean;
  isPremium: boolean;
  isLoading: boolean;
  error: string | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

export const useDualWallet = () => {
  const { address: metaMaskAddress } = useAccount();
  const { currentAccount } = useAccountStore();

  const [state, setState] = useState<DualWalletState>({
    error: null,
    familyWallet: null,
    isLinked: false,
    isLoading: false,
    isPremium: false,
    lensProfiles: [],
    metaMaskWallet: null,
    selectedProfile: null
  });

  // Get Family Wallet from current account
  const familyWalletAddress = currentAccount?.address;

  // Check premium status
  const checkPremiumStatus = useCallback(async (walletAddress: string) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/dual-auth/premium-status?metaMaskAddress=${walletAddress}`
      );
      const data = await response.json();

      if (data.success) {
        setState((prev) => ({
          ...prev,
          isPremium: data.isPremium,
          metaMaskWallet: walletAddress
        }));
        return data;
      }
      throw new Error(data.error || "Failed to check premium status");
    } catch (error) {
      console.error("Failed to check premium status:", error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Failed to check premium status"
      }));
      return { isPremium: false };
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

  // Link wallets
  const linkWallets = useCallback(
    async (
      metaMaskAddress: string,
      familyWalletAddress: string,
      lensProfileId: string
    ) => {
      setState((prev) => ({ ...prev, error: null, isLoading: true }));

      try {
        const response = await fetch(`${API_BASE}/api/dual-auth/link-wallets`, {
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
            selectedProfile: {
              avatarUrl: data.user.avatarUrl,
              displayName: data.user.displayName,
              id: data.user.lensProfileId
            }
          }));

          // Store token
          localStorage.setItem("dual_wallet_token", data.token);

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

  // Get user status
  const getUserStatus = useCallback(async (metaMaskAddress: string) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/dual-auth/user-status?metaMaskAddress=${metaMaskAddress}`
      );
      const data = await response.json();

      if (data.success) {
        setState((prev) => ({
          ...prev,
          familyWallet: data.familyWalletAddress,
          isLinked: data.isLinked,
          isPremium: data.isPremium,
          selectedProfile: data.lensProfileId
            ? {
                avatarUrl: data.avatarUrl,
                displayName: data.displayName,
                id: data.lensProfileId
              }
            : null
        }));
        return data;
      }
      throw new Error(data.error || "Failed to get user status");
    } catch (error) {
      console.error("Failed to get user status:", error);
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
      const storedToken = localStorage.getItem("dual_wallet_token");
      if (storedToken) {
        const isValid = await validateToken(storedToken);
        if (isValid) return;
      }

      // Check premium status
      await checkPremiumStatus(metaMaskAddress);
    };

    autoCheck();
  }, [metaMaskAddress, checkPremiumStatus, validateToken, state.isLoading]);

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
      metaMaskWallet: null,
      selectedProfile: null
    });
    localStorage.removeItem("dual_wallet_token");
  }, []);

  return {
    // Actions
    checkPremiumStatus,
    clearError,
    error: state.error,
    familyWallet: state.familyWallet,
    getLensProfiles,
    getUserStatus,
    isLinked: state.isLinked,
    isLoading: state.isLoading,
    isPremium: state.isPremium,
    lensProfiles: state.lensProfiles,
    linkWallets,
    logout,
    // State
    metaMaskWallet: state.metaMaskWallet,
    selectedProfile: state.selectedProfile
  };
};
