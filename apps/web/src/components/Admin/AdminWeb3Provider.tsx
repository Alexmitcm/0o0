import { WALLETCONNECT_PROJECT_ID } from "@hey/data/constants";
import { familyAccountsConnector } from "family";
import type { ReactNode } from "react";
import { http } from "viem";
import { createConfig, WagmiProvider } from "wagmi";
import { arbitrum } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

// Admin panel specific configuration for Arbitrum One
const connectors = [
  // Wrap family connector in try-catch to handle initialization errors
  (() => {
    try {
      return familyAccountsConnector();
    } catch (error) {
      console.warn("Failed to initialize family connector:", error);
      return null;
    }
  })(),
  walletConnect({ projectId: WALLETCONNECT_PROJECT_ID }),
  injected()
].filter(
  (connector): connector is NonNullable<typeof connector> => connector !== null
);

const config = createConfig({
  chains: [arbitrum], // Only Arbitrum One for admin panel
  connectors,
  transports: {
    [arbitrum.id]: http("https://arb1.arbitrum.io/rpc") // Public Arbitrum RPC
  }
});

interface AdminWeb3ProviderProps {
  children: ReactNode;
}

const AdminWeb3Provider = ({ children }: AdminWeb3ProviderProps) => {
  return <WagmiProvider config={config}>{children}</WagmiProvider>;
};

export default AdminWeb3Provider;
