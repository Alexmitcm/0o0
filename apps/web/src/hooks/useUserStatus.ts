import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

export type UserStatus = "Standard" | "Premium";

interface UserStatusResponse {
  status: UserStatus;
  isPremium: boolean;
  linkedProfileId?: string;
}

export const useUserStatus = () => {
  const { address } = useAccount(); // Family Wallet
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkUserStatus = async (walletAddress: string) => {
    if (!walletAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/status", {
        body: JSON.stringify({ walletAddress }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user status");
      }

      const data: UserStatusResponse = await response.json();
      setStatus(data.status);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      setStatus("Standard"); // Default to Standard on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      checkUserStatus(address);
    } else {
      setStatus(null);
      setError(null);
    }
  }, [address]);

  return {
    error,
    isLoading,
    isPremium: status === "Premium",
    isStandard: status === "Standard",
    refetch: () => address && checkUserStatus(address),
    status
  };
};
