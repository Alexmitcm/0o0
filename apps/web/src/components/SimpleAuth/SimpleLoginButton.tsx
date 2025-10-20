import { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/Shared/UI";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { useSimpleAuthContext } from "./SimpleAuthProvider";

interface SimpleLoginButtonProps {
  className?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const SimpleLoginButton = ({
  className = "",
  onSuccess,
  onError
}: SimpleLoginButtonProps) => {
  const { address, isConnected } = useAccount();
  const { currentAccount } = useAccountStore();
  const { login, isLoading } = useSimpleAuthContext();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (!address || !currentAccount?.address) {
      onError?.("Please connect your wallet and select a profile");
      return;
    }

    setIsLoggingIn(true);
    try {
      await login(address, currentAccount.address);
      onSuccess?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      onError?.(errorMessage);
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (!isConnected) {
    return (
      <Button className={className} disabled>
        Connect Wallet First
      </Button>
    );
  }

  if (!currentAccount?.address) {
    return (
      <Button className={className} disabled>
        Select Profile First
      </Button>
    );
  }

  return (
    <Button
      className={className}
      disabled={isLoading || isLoggingIn}
      onClick={handleLogin}
    >
      {isLoading || isLoggingIn ? "Logging in..." : "Login"}
    </Button>
  );
};
