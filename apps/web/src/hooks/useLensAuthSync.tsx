import { useEffect } from "react";
import { useAccount } from "wagmi";
import { hono } from "@/helpers/fetcher";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { hydrateAuthTokens, signIn } from "@/store/persisted/useAuthStore";

export const useLensAuthSync = () => {
  const { address } = useAccount();
  const { currentAccount } = useAccountStore();

  useEffect(() => {
    const syncLensAuth = async () => {
      if (!address) return;

      const { accessToken } = hydrateAuthTokens();
      if (!accessToken) return;

      console.log("🔄 Syncing Lens auth:", {
        address,
        currentAccount: currentAccount?.address || "none",
        hasAccessToken: !!accessToken
      });

      try {
        const result = await hono.auth.exchange({
          accessToken,
          refreshToken: ""
        });
        console.log("✅ Lens auth sync successful:", result);
        signIn({ accessToken: result.accessToken, refreshToken: result.refreshToken });
      } catch (error) {
        // Don't log errors during state clearing - they're expected
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        if (
          !errorMessage.includes("Unauthenticated") &&
          !errorMessage.includes("500")
        ) {
          console.error("❌ Error syncing Lens auth:", error);
        }
      }
    };

    // Add a small delay to allow state clearing to complete
    const timeoutId = setTimeout(syncLensAuth, 100);
    return () => clearTimeout(timeoutId);
  }, [address, currentAccount?.address]); // Add currentAccount to dependency array
};
