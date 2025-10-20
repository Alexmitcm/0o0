import { HEY_API_URL } from "@hey/data/frontend-constants";
import { useQuery } from "@tanstack/react-query";

export interface ReferralNode {
  wallet: string;
  parent: string | null;
  leftChild: string | null;
  rightChild: string | null;
  depth: number;
  balance: string;
  startTime: number;
  isUnbalanced: boolean;
}

interface ReferralTreeResponse {
  data: ReferralNode[];
  meta: {
    rootWallet: string;
    maxDepth: number;
    totalNodes: number;
  };
}

export const useUserReferralTree = () => {
  return useQuery({
    gcTime: 10 * 60 * 1000, // 10 minutes
    queryFn: async (): Promise<ReferralTreeResponse> => {
      try {
        // Temporarily use the working premium tree endpoint
        const testWallet = "0x960fceed1a0ac2cc22e6e7bd6876ca527d31d268";
        const res = await fetch(
          `${HEY_API_URL}/premium/tree/${testWallet}?maxDepth=3`,
          {
            credentials: "include",
            headers: {
              "Content-Type": "application/json"
            },
            method: "GET"
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

        // Transform the data to match our expected format
        const transformedData: ReferralTreeResponse = {
          data: data.data.map((node: any) => ({
            balance: node.balance,
            depth: node.depth,
            isUnbalanced: false, // We'll add this later
            leftChild: node.leftChild,
            parent: node.parent,
            rightChild: node.rightChild,
            startTime: Date.now(),
            wallet: node.address
          })),
          meta: {
            maxDepth: 3,
            rootWallet: testWallet,
            totalNodes: data.data.length
          }
        };

        return transformedData;
      } catch (error) {
        console.error("Referral tree fetch error:", error);
        throw error;
      }
    },
    queryKey: ["user-referral-tree"],
    retry: 2,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};
