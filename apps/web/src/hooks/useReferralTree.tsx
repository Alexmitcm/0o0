import { HEY_API_URL } from "@hey/data/frontend-constants";
import { useQuery } from "@tanstack/react-query";

export interface ReferralNode {
  address: string;
  parent: string | null;
  leftChild?: string;
  rightChild?: string;
  depth: number;
  balance: string;
  point: number;
  startTime: string;
}

interface ReferralTreeResponse {
  data: ReferralNode[];
  meta: {
    rootWallet: string;
    maxDepth: number;
    totalNodes: number;
  };
}

export const useReferralTree = (walletAddress: string, maxDepth = 5) => {
  return useQuery({
    enabled: !!walletAddress,
    gcTime: 10 * 60 * 1000, // 10 minutes
    queryFn: async (): Promise<ReferralTreeResponse> => {
      try {
        const res = await fetch(
          `${HEY_API_URL}/premium/tree/${walletAddress}?maxDepth=${maxDepth}`,
          {
            headers: {
              "Content-Type": "application/json"
            }
          }
        );

        if (!res.ok) {
          const errorText = await res.text();
          console.error("Referral tree API error:", res.status, errorText);
          throw new Error(
            `Failed to fetch referral tree: ${res.status} ${res.statusText}`
          );
        }

        const data = await res.json();
        return data;
      } catch (error) {
        console.error("Referral tree fetch error:", error);
        throw error;
      }
    },
    queryKey: ["referral-tree", walletAddress, maxDepth],
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};
