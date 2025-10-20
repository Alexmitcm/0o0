import {
  CheckIcon,
  ExclamationTriangleIcon,
  KeyIcon
} from "@heroicons/react/24/outline";
import type { FC } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { Connector } from "wagmi";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import cn from "@/helpers/cn";
import getSafeWalletDetails from "@/helpers/getWalletDetails";

interface ImprovedWalletSelectorProps {
  className?: string;
  showHelpText?: boolean;
}

const ImprovedWalletSelector: FC<ImprovedWalletSelectorProps> = ({
  className = "",
  showHelpText = true
}) => {
  const { connectAsync, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { connector: activeConnector } = useAccount();
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allowedConnectors = [
    "familyAccountsProvider",
    "injected",
    "walletConnect"
  ];

  const filteredConnectors = connectors
    .filter((connector: any) => allowedConnectors.includes(connector.id))
    .sort(
      (a: Connector, b: Connector) =>
        allowedConnectors.indexOf(a.id) - allowedConnectors.indexOf(b.id)
    );

  const handleConnect = async (connector: Connector) => {
    try {
      setError(null);
      setConnectingWallet(connector.id);

      await connectAsync({ connector });

      // Reset state after successful connection
      setConnectingWallet(null);
    } catch (error: any) {
      setConnectingWallet(null);

      // Provide user-friendly error messages
      let errorMessage = "Failed to connect wallet. Please try again.";

      if (error?.message) {
        if (error.message.includes("User rejected")) {
          errorMessage =
            "Connection was cancelled. Please try again if you want to connect.";
        } else if (error.message.includes("Already processing")) {
          errorMessage =
            "Wallet connection is already in progress. Please wait.";
        } else if (error.message.includes("network")) {
          errorMessage =
            "Network error. Please check your internet connection.";
        }
      }

      setError(errorMessage);

      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  if (activeConnector?.id) {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Connected Wallet Display */}
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                  <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div>
                <h3 className="font-medium text-green-800 text-sm dark:text-green-200">
                  Wallet Connected
                </h3>
                <p className="text-green-600 text-xs dark:text-green-400">
                  {activeConnector?.id
                    ? getSafeWalletDetails(
                        activeConnector.id as
                          | "familyAccountsProvider"
                          | "injected"
                          | "walletConnect"
                      ).name
                    : "Unknown Wallet"}
                </p>
              </div>
            </div>
            <button
              className="text-green-600 text-xs underline hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
              onClick={() => disconnect()}
              type="button"
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* Help Text for Next Steps */}
        {showHelpText && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0">
                <svg
                  className="mt-0.5 h-5 w-5 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>Information icon</title>
                  <path
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </div>
              <div className="text-blue-700 text-sm dark:text-blue-300">
                <p className="font-medium">Next Steps:</p>
                <p>
                  Your wallet is connected! You can now proceed to login or
                  signup with your Lens profile.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-red-400" />
            <div className="text-red-700 text-sm dark:text-red-300">
              {error}
            </div>
          </div>
        </div>
      )}

      {/* Wallet Selection */}
      <div className="space-y-3">
        <div className="text-center">
          <h3 className="font-semibold text-gray-900 text-lg dark:text-white">
            Connect Your Wallet
          </h3>
          <p className="mt-1 text-gray-600 text-sm dark:text-gray-400">
            Choose your preferred wallet to get started
          </p>
        </div>

        <div className="space-y-2">
          {filteredConnectors.map((connector: any) => {
            const details = getSafeWalletDetails(
              connector.id as
                | "familyAccountsProvider"
                | "injected"
                | "walletConnect"
            );
            const isConnecting = connectingWallet === connector.id;
            const isDisabled = isPending && !isConnecting;

            return (
              <button
                className={cn(
                  "group flex w-full items-center justify-between overflow-hidden rounded-xl border px-4 py-3 text-left transition-all duration-200",
                  "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
                  "dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 dark:hover:bg-gray-700",
                  isDisabled && "cursor-not-allowed opacity-50",
                  isConnecting &&
                    "border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20"
                )}
                disabled={isDisabled}
                key={connector.id}
                onClick={() => handleConnect(connector)}
                type="button"
              >
                <span className="flex items-center gap-3">
                  <img
                    alt={details.name}
                    className="h-8 w-8 flex-shrink-0"
                    draggable={false}
                    height={32}
                    src={details.logo}
                    width={32}
                  />
                  <div>
                    <div className="font-medium text-gray-900 text-sm dark:text-white">
                      {details.name}
                    </div>
                    <div className="text-gray-500 text-xs dark:text-gray-400">
                      {connector.id === "injected"
                        ? "Browser extension"
                        : "Mobile & Desktop"}
                    </div>
                  </div>
                </span>

                <span className="flex items-center">
                  {isConnecting ? (
                    <div className="flex items-center space-x-2">
                      <svg
                        className="h-4 w-4 animate-spin text-blue-500"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <title>Loading spinner</title>
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          fill="currentColor"
                        />
                      </svg>
                      <span className="text-blue-600 text-xs dark:text-blue-400">
                        Connecting...
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 font-medium text-gray-800 text-xs dark:bg-gray-700 dark:text-gray-200">
                      Connect
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Help Text */}
      {showHelpText && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="flex items-start space-x-2">
            <KeyIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" />
            <div className="text-gray-600 text-xs dark:text-gray-400">
              <p className="font-medium">Don't have a wallet?</p>
              <p>
                You can download popular wallets like{" "}
                <Link
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  rel="noopener noreferrer"
                  target="_blank"
                  to="https://metamask.io"
                >
                  MetaMask
                </Link>
                ,{" "}
                <Link
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  rel="noopener noreferrer"
                  target="_blank"
                  to="https://walletconnect.com"
                >
                  WalletConnect
                </Link>
                , or use your browser's built-in wallet.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImprovedWalletSelector;
