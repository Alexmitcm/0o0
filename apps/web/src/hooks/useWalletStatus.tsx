import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";

interface WalletStatusResponse {
  success: boolean;
  data: {
    isRegistered: boolean;
    walletAddress: string;
  };
  status: string;
}

const fetchWalletStatus = async (): Promise<WalletStatusResponse> => {
  const response = await fetch("/api/premium/v2/wallet-status", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("backendToken") || ""}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch wallet status");
  }

  return response.json();
};

export const useWalletStatus = () => {
  const { address, isConnected } = useAccount();

  return useQuery({
    enabled: isConnected && !!address,
    queryFn: fetchWalletStatus,
    queryKey: ["walletStatus", address],
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 2 * 60 * 1000 // Consider data stale after 2 minutes
  });
};
