import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";

interface LensProfile {
  id: string;
  handle: string;
  ownedBy: string;
}

interface UserProfilesResponse {
  success: boolean;
  data: {
    profiles: LensProfile[];
    walletAddress: string;
  };
  status: string;
}

const fetchUserProfiles = async (): Promise<UserProfilesResponse> => {
  const response = await fetch("/api/premium/profiles", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("backendToken") || ""}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user profiles");
  }

  return response.json();
};

export const useUserLensProfiles = () => {
  const { address, isConnected } = useAccount();

  return useQuery({
    enabled: isConnected && !!address,
    queryFn: fetchUserProfiles,
    queryKey: ["userProfiles", address],
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 5 * 60 * 1000 // Consider data stale after 5 minutes
  });
};
