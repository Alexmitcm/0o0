// Browser wallet detection utility
export const detectBrowserWallets = () => {
  if (typeof window === "undefined") return [];

  const wallets = [];

  // Check for MetaMask
  if (window.ethereum?.isMetaMask) {
    wallets.push({
      available: true,
      icon: "🦊",
      id: "metaMask",
      name: "MetaMask"
    });
  }

  // Check for Brave Wallet
  if (window.ethereum?.isBraveWallet) {
    wallets.push({
      available: true,
      icon: "🦁",
      id: "braveWallet",
      name: "Brave Wallet"
    });
  }

  // Check for Coinbase Wallet
  if (window.ethereum?.isCoinbaseWallet) {
    wallets.push({
      available: true,
      icon: "🪙",
      id: "coinbaseWallet",
      name: "Coinbase Wallet"
    });
  }

  // Check for other common wallets
  if (
    window.ethereum &&
    !window.ethereum.isMetaMask &&
    !window.ethereum.isBraveWallet &&
    !window.ethereum.isCoinbaseWallet
  ) {
    wallets.push({
      available: true,
      icon: "🌐",
      id: "injected",
      name: "Browser Wallet"
    });
  }

  return wallets;
};

// Get the best available wallet
export const getBestAvailableWallet = () => {
  const wallets = detectBrowserWallets();

  // Priority order: MetaMask > Brave > Coinbase > Generic
  const priorityOrder = [
    "metaMask",
    "braveWallet",
    "coinbaseWallet",
    "injected"
  ];

  for (const priorityId of priorityOrder) {
    const wallet = wallets.find((w) => w.id === priorityId);
    if (wallet) {
      return wallet;
    }
  }

  return null;
};

// Check if any browser wallet is available
export const hasBrowserWallet = () => {
  return detectBrowserWallets().length > 0;
};

// Get wallet connection status
export const getWalletConnectionStatus = () => {
  if (typeof window === "undefined") return { address: null, connected: false };

  return {
    address: window.ethereum?.selectedAddress || null,
    connected: !!window.ethereum?.selectedAddress
  };
};
