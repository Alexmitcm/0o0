import type { ReactNode } from "react";
import { useUserStatus } from "@/hooks/useUserStatus";

interface AccessControlProps {
  children: ReactNode;
  requirePremium?: boolean;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}

export const AccessControl = ({
  children,
  requirePremium = false,
  fallback,
  loadingFallback = (
    <div className="h-8 w-full animate-pulse rounded bg-gray-200" />
  )
}: AccessControlProps) => {
  const { isPremium, isLoading } = useUserStatus();

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (requirePremium && !isPremium) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Premium-only wrapper component
export const PremiumOnly = ({
  children,
  fallback
}: Omit<AccessControlProps, "requirePremium">) => {
  return (
    <AccessControl fallback={fallback} requirePremium>
      {children}
    </AccessControl>
  );
};

// Standard user upgrade prompt
export const PremiumUpgradePrompt = ({
  title = "Upgrade to Premium",
  description = "Unlock exclusive features and premium content"
}: {
  title?: string;
  description?: string;
}) => {
  return (
    <div className="rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-6 text-center">
      <div className="mb-4">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
          <svg
            className="h-6 w-6 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <title>Premium icon</title>
            <path
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
        </div>
        <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
      <button
        className="rounded-lg bg-purple-600 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-purple-700"
        type="button"
      >
        Upgrade Now
      </button>
    </div>
  );
};
