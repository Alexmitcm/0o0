import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";
import { lensApolloClient, queryClient } from "@/components/Common/Providers";
import cn from "@/helpers/cn";
import errorToast from "@/helpers/errorToast";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { signOut } from "@/store/persisted/useAuthStore";
import { usePreferencesStore } from "@/store/persisted/usePreferencesStore";
import { usePremiumStore } from "@/store/persisted/usePremiumStore";

interface LogoutProps {
  className?: string;
  onClick?: () => void;
}

const Logout = ({ className = "", onClick }: LogoutProps) => {
  const { resetPreferences } = usePreferencesStore();
  const { setCurrentAccount } = useAccountStore();
  const { reset } = usePremiumStore();

  const handleLogout = async () => {
    try {
      console.log("🚪 Starting logout process...");

      // 1. Clear React Query cache (CRITICAL STEP)
      queryClient.clear();
      console.log("✅ React Query cache cleared");

      // 2. Clear Apollo Client cache (CRITICAL STEP)
      lensApolloClient.clearStore();
      console.log("✅ Apollo Client cache cleared");

      // 3. Clear Zustand stores
      resetPreferences();
      setCurrentAccount(undefined);
      reset();
      signOut();
      console.log("✅ Zustand stores cleared");

      // 4. Force page reload to ensure clean state
      setTimeout(() => {
        window.location.href = "/";
      }, 100);
      console.log("✅ Page redirect initiated");

      console.log("🎉 Logout completed successfully!");
    } catch (error) {
      console.error("❌ Error during logout:", error);
      errorToast(error);
    }
  };

  return (
    <button
      className={cn(
        "flex w-full items-center space-x-1.5 px-2 py-1.5 text-left text-gray-700 text-sm dark:text-gray-200",
        className
      )}
      onClick={async () => {
        await handleLogout();
        onClick?.();
      }}
      type="button"
    >
      <ArrowRightStartOnRectangleIcon className="size-4" />
      <div>Logout</div>
    </button>
  );
};

export default Logout;
