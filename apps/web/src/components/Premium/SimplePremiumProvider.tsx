import { useSimplePremium } from "@/hooks/useSimplePremium";

interface SimplePremiumProviderProps {
  children: React.ReactNode;
}

const SimplePremiumProvider = ({ children }: SimplePremiumProviderProps) => {
  // Always call the hook to maintain hooks order
  // The hook will handle the case where account is not available
  useSimplePremium();

  return <>{children}</>;
};

export default SimplePremiumProvider;
