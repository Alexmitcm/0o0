import { useAccount } from "wagmi";
import { useSimplePremium } from "@/hooks/useSimplePremium";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { usePremiumStore } from "@/store/premiumStore";

const PremiumDebugPanel = () => {
  const { currentAccount } = useAccountStore();
  const { address: connectedWalletAddress } = useAccount();
  const { userStatus, isPremium, linkedProfile } = usePremiumStore();
  const { premiumStatus, isLoading, error } = useSimplePremium();

  return (
    <div className="fixed right-4 bottom-4 z-50 max-w-sm rounded-lg bg-black p-4 text-white text-xs">
      <h3 className="mb-2 font-bold">🔍 Premium Debug</h3>

      <div className="space-y-1">
        <div>Connected Wallet: {connectedWalletAddress?.slice(0, 10)}...</div>
        <div>Lens Wallet: {currentAccount?.address?.slice(0, 10)}...</div>
        <div>Profile: {currentAccount?.address || "None"}</div>
        <div>Store Status: {userStatus}</div>
        <div>Store Premium: {isPremium ? "Yes" : "No"}</div>
        <div>Hook Status: {premiumStatus?.userStatus || "Loading..."}</div>
        <div>Hook Loading: {isLoading ? "Yes" : "No"}</div>
        {error && <div className="text-red-400">Error: {error.message}</div>}
        {linkedProfile && <div>Linked: {linkedProfile.profileId}</div>}
      </div>
    </div>
  );
};

export default PremiumDebugPanel;
