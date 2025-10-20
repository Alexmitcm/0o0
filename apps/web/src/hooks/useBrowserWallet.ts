import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import {
  detectBrowserWallets,
  getBestAvailableWallet,
  hasBrowserWallet
} from "@/helpers/browserWalletDetection";

export const useBrowserWallet = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const [availableWallets, setAvailableWallets] = useState<
    Array<{
      name: string;
      id: string;
      icon: string;
      available: boolean;
    }>
  >([]);

  const [bestWallet, setBestWallet] = useState<{
    name: string;
    id: string;
    icon: string;
    available: boolean;
  } | null>(null);

  useEffect(() => {
    const wallets = detectBrowserWallets();
    setAvailableWallets(wallets);
    setBestWallet(getBestAvailableWallet());
  }, []);

  const connectToWallet = async (walletId?: string) => {
    const targetWallet = walletId
      ? connectors.find((c) => c.id === walletId)
      : connectors.find((c) => c.id === bestWallet?.id);

    if (targetWallet) {
      try {
        await connect({ connector: targetWallet });
        return { success: true };
      } catch (error) {
        return { error, success: false };
      }
    }

    return { error: "No wallet found", success: false };
  };

  const connectToBestWallet = async () => {
    return connectToWallet();
  };

  const connectToMetaMask = async () => {
    return connectToWallet("metaMask");
  };

  const connectToBraveWallet = async () => {
    return connectToWallet("braveWallet");
  };

  const connectToCoinbaseWallet = async () => {
    return connectToWallet("coinbaseWallet");
  };

  return {
    // State
    address,
    availableWallets,
    bestWallet,

    // Actions
    connect: connectToWallet,
    connectToBestWallet,
    connectToBraveWallet,
    connectToCoinbaseWallet,
    connectToMetaMask,

    // Utilities
    detectWallets: detectBrowserWallets,
    disconnect,
    getBestWallet: getBestAvailableWallet,
    hasWallet: hasBrowserWallet(),
    isConnected,
    isPending
  };
};
