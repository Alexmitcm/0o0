import { createContext, type ReactNode, useContext } from "react";
import { useDualWallet } from "@/hooks/useDualWallet";

interface DualWalletContextType {
  metaMaskWallet: string | null;
  familyWallet: string | null;
  lensProfiles: any[];
  selectedProfile: any | null;
  isLinked: boolean;
  isPremium: boolean;
  isLoading: boolean;
  error: string | null;
  checkPremiumStatus: (walletAddress: string) => Promise<any>;
  getLensProfiles: (walletAddress: string) => Promise<any[]>;
  linkWallets: (
    metaMaskAddress: string,
    familyWalletAddress: string,
    lensProfileId: string
  ) => Promise<any>;
  getUserStatus: (metaMaskAddress: string) => Promise<any>;
  clearError: () => void;
  logout: () => void;
}

const DualWalletContext = createContext<DualWalletContextType | undefined>(
  undefined
);

interface DualWalletProviderProps {
  children: ReactNode;
}

export const DualWalletProvider = ({ children }: DualWalletProviderProps) => {
  const dualWallet = useDualWallet();

  return (
    <DualWalletContext.Provider value={dualWallet}>
      {children}
    </DualWalletContext.Provider>
  );
};

export const useDualWalletContext = () => {
  const context = useContext(DualWalletContext);
  if (context === undefined) {
    throw new Error(
      "useDualWalletContext must be used within a DualWalletProvider"
    );
  }
  return context;
};
