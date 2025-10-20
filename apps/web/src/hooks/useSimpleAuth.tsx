import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useAccountStore } from "@/store/persisted/useAccountStore";

interface SimpleUser {
  walletAddress: string;
  isPremium: boolean;
  profileId?: string;
  email?: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
}

interface SimpleAuthState {
  user: SimpleUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isNewUser: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

export const useSimpleAuth = () => {
  const { address } = useAccount();
  const { currentAccount } = useAccountStore();

  const [state, setState] = useState<SimpleAuthState>({
    error: null,
    isLoading: false,
    isNewUser: false,
    token: null,
    user: null
  });

  // Get current profile ID from account store
  const currentProfileId = currentAccount?.address;

  // Login function
  const login = useCallback(
    async (walletAddress: string, profileId: string) => {
      if (!walletAddress || !profileId) {
        setState((prev) => ({
          ...prev,
          error: "Wallet address and profile ID are required"
        }));
        return;
      }

      setState((prev) => ({ ...prev, error: null, isLoading: true }));

      try {
        const response = await fetch(`${API_BASE}/api/simple-auth/login`, {
          body: JSON.stringify({
            profileId,
            walletAddress
          }),
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST"
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Login failed");
        }

        setState((prev) => ({
          ...prev,
          error: null,
          isLoading: false,
          isNewUser: data.isNewUser,
          token: data.token,
          user: data.user
        }));

        // Store token in localStorage
        localStorage.setItem("simple_auth_token", data.token);

        return data;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Login failed";
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
  const getStatus = useCallback(async (walletAddress: string) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/simple-auth/status?walletAddress=${walletAddress}`
      );
      const data = await response.json();

      if (data.success) {
        return data;
      }
      throw new Error(data.error || "Failed to get status");
    } catch (error) {
      console.error("Failed to get user status:", error);
      return { isPremium: false };
    }
  }, []);

  // Validate stored token
  const validateToken = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/simple-auth/validate`, {
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
          error: null,
          isLoading: false,
          token,
          user: data.user
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Token validation failed:", error);
      return false;
    }
  }, []);

  // Auto-login when wallet and profile are connected
  useEffect(() => {
    const autoLogin = async () => {
      if (!address || !currentProfileId || state.isLoading) return;

      // Check if we have a valid token first
      const storedToken = localStorage.getItem("simple_auth_token");
      if (storedToken) {
        const isValid = await validateToken(storedToken);
        if (isValid) return;
      }

      // Try to login
      try {
        await login(address, currentProfileId);
      } catch (error) {
        console.error("Auto-login failed:", error);
      }
    };

    autoLogin();
  }, [address, currentProfileId, login, validateToken, state.isLoading]);

  // Logout function
  const logout = useCallback(() => {
    setState({
      error: null,
      isLoading: false,
      isNewUser: false,
      token: null,
      user: null
    });
    localStorage.removeItem("simple_auth_token");
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    clearError,
    error: state.error,
    getStatus,
    isLoading: state.isLoading,
    isLoggedIn: !!state.user && !!state.token,
    isNewUser: state.isNewUser,
    isPremium: state.user?.isPremium || false,

    // Actions
    login,
    logout,
    token: state.token,
    // State
    user: state.user
  };
};
