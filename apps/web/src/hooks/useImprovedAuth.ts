import { useCallback, useEffect, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useAuthModalStore } from "@/store/non-persisted/modal/useAuthModalStore";
import { hydrateAuthTokens } from "@/store/persisted/useAuthStore";

interface AuthState {
  isConnected: boolean;
  isAuthenticated: boolean;
  isConnecting: boolean;
  error: string | null;
  user: any | null;
}

interface AuthActions {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  showLogin: () => void;
  showSignup: () => void;
  clearError: () => void;
  retryConnection: () => Promise<void>;
}

export const useImprovedAuth = (): AuthState & AuthActions => {
  const { isConnected, isConnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const { setShowAuthModal } = useAuthModalStore();
  const { accessToken } = hydrateAuthTokens();
  const user: any = null;

  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const isAuthenticated = Boolean(accessToken);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const connectWallet = useCallback(async () => {
    try {
      setError(null);
      setIsAuthenticating(true);

      // This will be handled by the wallet selector component
      // The actual connection logic is in the ImprovedWalletSelector
    } catch (error: any) {
      setError(error?.message || "Failed to connect wallet");
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    try {
      disconnect();
      setError(null);
    } catch (error: any) {
      setError(error?.message || "Failed to disconnect wallet");
    }
  }, [disconnect]);

  const showLogin = useCallback(() => {
    setShowAuthModal(true, "login");
  }, [setShowAuthModal]);

  const showSignup = useCallback(() => {
    setShowAuthModal(true, "signup");
  }, [setShowAuthModal]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const retryConnection = useCallback(async () => {
    setError(null);
    await connectWallet();
  }, [connectWallet]);

  return {
    clearError,

    // Actions
    connectWallet,
    disconnectWallet,
    error,
    isAuthenticated,
    // State
    isConnected,
    isConnecting: isConnecting || isAuthenticating,
    retryConnection,
    showLogin,
    showSignup,
    user
  };
};
