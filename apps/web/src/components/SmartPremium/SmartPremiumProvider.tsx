import { createContext, type ReactNode, useContext } from "react";
import { useSmartPremium } from "@/hooks/useSmartPremium";

interface SmartPremiumContextType {
  metaMaskWallet: string | null;
  familyWallet: string | null;
  lensProfiles: any[];
  selectedProfile: any | null;
  isLinked: boolean;
  isPremium: boolean;
  wasAlreadyPremium: boolean;
  isLoading: boolean;
  error: string | null;
  message: string;
  checkSmartStatus: (walletAddress: string) => Promise<any>;
  getLensProfiles: (walletAddress: string) => Promise<any[]>;
  smartLinkWallets: (
    metaMaskAddress: string,
    familyWalletAddress: string,
    lensProfileId: string
  ) => Promise<any>;
  getUserSmartStatus: (metaMaskAddress: string) => Promise<any>;
  clearError: () => void;
  logout: () => void;
}

const SmartPremiumContext = createContext<SmartPremiumContextType | undefined>(
  undefined
);

interface SmartPremiumProviderProps {
  children: ReactNode;
}

export const SmartPremiumProvider = ({
  children
}: SmartPremiumProviderProps) => {
  const smartPremium = useSmartPremium();

  return (
    <SmartPremiumContext.Provider value={smartPremium}>
      {children}
    </SmartPremiumContext.Provider>
  );
};

export const useSmartPremiumContext = () => {
  const context = useContext(SmartPremiumContext);
  if (context === undefined) {
    throw new Error(
      "useSmartPremiumContext must be used within a SmartPremiumProvider"
    );
  }
  return context;
};
