import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  WalletIcon
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useSwitchChain
} from "wagmi";
import { arbitrum } from "wagmi/chains";
import { Button } from "../Shared/UI";

const WalletConnection = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const isCorrectNetwork = chainId === arbitrum.id;

  const handleConnect = (connector: any) => {
    connect({ connector });
  };

  const handleSwitchNetwork = () => {
    switchChain({ chainId: arbitrum.id });
  };

  const handleDisconnect = () => {
    disconnect();
    toast.success("Wallet disconnected");
  };

  if (isConnected && address) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-medium text-gray-900 text-sm">Connected</p>
              <p className="font-mono text-gray-500 text-xs">
                {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            </div>
          </div>

          {!isCorrectNetwork && (
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
              <Button onClick={handleSwitchNetwork} size="sm" variant="outline">
                Switch to Arbitrum One
              </Button>
            </div>
          )}

          <Button onClick={handleDisconnect} size="sm" variant="outline">
            Disconnect
          </Button>
        </div>

        {!isCorrectNetwork && (
          <div className="mt-3 rounded-md border border-yellow-200 bg-yellow-50 p-3">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> You're connected to chain ID {chainId}.
              Please switch to Arbitrum One (Chain ID: 42161) to interact with
              the contracts.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="text-center">
        <WalletIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 font-medium text-gray-900 text-sm">
          Connect Wallet
        </h3>
        <p className="mt-1 text-gray-500 text-sm">
          Connect your wallet to access the Smart Contract Control Panel
        </p>

        <div className="mt-4 space-y-2">
          {connectors.map((connector) => (
            <Button
              className="w-full"
              disabled={isPending}
              key={connector.uid}
              onClick={() => handleConnect(connector)}
            >
              {isPending ? "Connecting..." : `Connect ${connector.name}`}
            </Button>
          ))}
        </div>

        <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3">
          <p className="text-blue-800 text-sm">
            <strong>Note:</strong> This panel requires connection to Arbitrum
            One network where the smart contracts are deployed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletConnection;
