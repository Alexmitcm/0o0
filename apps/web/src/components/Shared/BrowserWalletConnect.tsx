import { useBrowserWallet } from "@/hooks/useBrowserWallet";

interface BrowserWalletConnectProps {
  className?: string;
}

const BrowserWalletConnect = ({
  className = ""
}: BrowserWalletConnectProps) => {
  const {
    address,
    isConnected,
    isPending,
    availableWallets,
    bestWallet,
    hasWallet,
    connectToBestWallet,
    connectToMetaMask,
    connectToBraveWallet,
    connectToCoinbaseWallet,
    disconnect
  } = useBrowserWallet();

  if (!hasWallet) {
    return (
      <div
        className={`rounded-lg border border-yellow-200 bg-yellow-50 p-4 ${className}`}
      >
        <p className="text-yellow-800">
          No browser wallet detected. Please install MetaMask, Brave Wallet, or
          another Web3 wallet.
        </p>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div
        className={`rounded-lg border border-green-200 bg-green-50 p-4 ${className}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-green-800">Connected</p>
            <p className="text-green-600 text-sm">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
          <button
            className="rounded bg-red-500 px-3 py-1 text-white transition-colors hover:bg-red-600"
            onClick={() => disconnect()}
            type="button"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border border-blue-200 bg-blue-50 p-4 ${className}`}
    >
      <h3 className="mb-3 font-medium text-blue-800">Connect Browser Wallet</h3>

      <div className="space-y-2">
        {bestWallet && (
          <button
            className="w-full rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
            disabled={isPending}
            onClick={connectToBestWallet}
            type="button"
          >
            {isPending
              ? "Connecting..."
              : `Connect to ${bestWallet.name} ${bestWallet.icon}`}
          </button>
        )}

        <div className="grid grid-cols-1 gap-2">
          {availableWallets.map((wallet) => (
            <button
              className="rounded bg-gray-100 px-4 py-2 text-gray-800 transition-colors hover:bg-gray-200 disabled:opacity-50"
              disabled={isPending}
              key={wallet.id}
              onClick={() => {
                switch (wallet.id) {
                  case "metaMask":
                    connectToMetaMask();
                    break;
                  case "braveWallet":
                    connectToBraveWallet();
                    break;
                  case "coinbaseWallet":
                    connectToCoinbaseWallet();
                    break;
                  default:
                    connectToBestWallet();
                }
              }}
              type="button"
            >
              {wallet.icon} {wallet.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrowserWalletConnect;
