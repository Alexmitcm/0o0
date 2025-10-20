import { createContext, type ReactNode, useContext } from "react";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";

interface SimpleAuthContextType {
  user: any;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isNewUser: boolean;
  isLoggedIn: boolean;
  isPremium: boolean;
  login: (walletAddress: string, profileId: string) => Promise<any>;
  logout: () => void;
  getStatus: (walletAddress: string) => Promise<any>;
  clearError: () => void;
}

const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(
  undefined
);

interface SimpleAuthProviderProps {
  children: ReactNode;
}

export const SimpleAuthProvider = ({ children }: SimpleAuthProviderProps) => {
  const auth = useSimpleAuth();

  return (
    <SimpleAuthContext.Provider value={auth}>
      {children}
    </SimpleAuthContext.Provider>
  );
};

export const useSimpleAuthContext = () => {
  const context = useContext(SimpleAuthContext);
  if (context === undefined) {
    throw new Error(
      "useSimpleAuthContext must be used within a SimpleAuthProvider"
    );
  }
  return context;
};
