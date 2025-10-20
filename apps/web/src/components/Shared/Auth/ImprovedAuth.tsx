import { useState } from "react";
import { useAccount } from "wagmi";
import { useAuthModalStore } from "@/store/non-persisted/modal/useAuthModalStore";
import ImprovedSignup from "./ImprovedSignup";
import ImprovedWalletSelector from "./ImprovedWalletSelector";
import Login from "./Login";

const AuthMessage = ({
  title,
  description
}: {
  title: string;
  description: string;
}) => (
  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0">
        <svg
          className="mt-0.5 h-5 w-5 text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      </div>
      <div>
        <h3 className="font-medium text-blue-800 text-sm dark:text-blue-200">
          {title}
        </h3>
        <p className="mt-1 text-blue-700 text-sm dark:text-blue-300">
          {description}
        </p>
      </div>
    </div>
  </div>
);

const NotConnected = ({ isLogin = false }: { isLogin?: boolean }) => (
  <AuthMessage
    description={
      isLogin
        ? "Connect your wallet to access your Hey account and start posting."
        : "Connect your wallet to get started with Hey and create your Lens profile."
    }
    title={`${isLogin ? "Connect" : "Welcome"} to Hey`}
  />
);

const ImprovedAuth = () => {
  const { authModalType } = useAuthModalStore();
  const [hasAccounts, setHasAccounts] = useState(true);
  const { isConnected } = useAccount();

  return (
    <div className="m-5 mx-auto max-w-md">
      {authModalType === "signup" ? (
        <div className="space-y-6">
          <ImprovedSignup />
        </div>
      ) : (
        <div className="space-y-6">
          {isConnected ? (
            hasAccounts ? (
              <AuthMessage
                description="Hey uses this signature to verify that you're the owner of this address."
                title="Please sign the message."
              />
            ) : (
              <div className="space-y-4">
                <AuthMessage
                  description="It looks like you don't have a Hey account yet. Let's create one for you!"
                  title="Ready to join Hey?"
                />
                <div className="text-center">
                  <button
                    className="text-blue-600 text-sm underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    onClick={() => {
                      // Switch to signup mode - use the hook properly
                      const authModalStore = useAuthModalStore();
                      authModalStore.setShowAuthModal(true, "signup");
                    }}
                    type="button"
                  >
                    Create Account Instead
                  </button>
                </div>
              </div>
            )
          ) : (
            <NotConnected isLogin />
          )}

          {isConnected ? (
            <Login setHasAccounts={setHasAccounts} />
          ) : (
            <ImprovedWalletSelector showHelpText={true} />
          )}
        </div>
      )}
    </div>
  );
};

export default ImprovedAuth;
