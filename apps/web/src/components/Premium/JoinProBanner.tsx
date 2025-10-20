import { SparklesIcon } from "@heroicons/react/24/outline";
import { useSimplePremium } from "@/hooks/useSimplePremium";
import { useProModalStore } from "@/store/non-persisted/modal/useProModalStore";
import { useAccountStore } from "@/store/persisted/useAccountStore";

const JoinProBanner = () => {
  const { premiumStatus, isLoading } = useSimplePremium();
  const { currentAccount } = useAccountStore();
  const { setShow: setShowProModal } = useProModalStore();

  // Only show for Standard users who are authenticated
  if (
    isLoading ||
    premiumStatus?.userStatus !== "Standard" ||
    !currentAccount?.address ||
    premiumStatus?.message?.includes("already connected to another")
  ) {
    return null;
  }

  const handleJoinProClick = () => {
    setShowProModal(true);
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 p-6 text-white shadow-lg">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="-right-4 -top-4 absolute h-32 w-32 rounded-full bg-white" />
        <div className="-bottom-4 -left-4 absolute h-24 w-24 rounded-full bg-white" />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <SparklesIcon className="h-5 w-5" />
              <h3 className="font-bold text-lg">Upgrade to Hey Pro</h3>
            </div>
            <p className="mb-4 text-purple-100 text-sm">
              Unlock exclusive features, earn rewards, and join our premium
              community.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-white/20 px-2 py-1">
                🎯 Referral Rewards
              </span>
              <span className="rounded-full bg-white/20 px-2 py-1">
                💎 Premium Badge
              </span>
              <span className="rounded-full bg-white/20 px-2 py-1">
                🚀 Early Access
              </span>
            </div>
          </div>
          <div className="ml-4 flex flex-col items-end">
            <div className="text-right">
              <div className="font-bold text-2xl">$200</div>
              <div className="text-purple-100 text-xs">One-time payment</div>
            </div>
            <button
              className="mt-3 rounded-lg bg-white px-4 py-2 font-semibold text-purple-600 text-sm transition-colors hover:bg-purple-50"
              onClick={handleJoinProClick}
              type="button"
            >
              Join Pro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinProBanner;
