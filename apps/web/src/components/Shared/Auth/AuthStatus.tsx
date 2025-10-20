import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  KeyIcon
} from "@heroicons/react/24/outline";
import { useAccount } from "wagmi";
import { hydrateAuthTokens } from "@/store/persisted/useAuthStore";

interface AuthStatusProps {
  className?: string;
  showDetails?: boolean;
}

const AuthStatus: React.FC<AuthStatusProps> = ({
  className = "",
  showDetails = false
}) => {
  const { isConnected, address } = useAccount();
  const { accessToken } = hydrateAuthTokens();
  const user: any = null;

  const isAuthenticated = Boolean(accessToken);
  const isPartiallyConnected = isConnected && !isAuthenticated;

  const getStatusInfo = () => {
    if (isAuthenticated) {
      return {
        color: "green",
        description: "Wallet connected and authenticated",
        details: [
          `Wallet: ${address?.slice(0, 6)}...${address?.slice(-4)}`,
          `Status: ${user?.status || "Standard"}`,
          `Profile: ${user?.linkedProfileId ? "Linked" : "Not linked"}`
        ],
        icon: CheckCircleIcon,
        title: "Fully Connected"
      };
    }

    if (isPartiallyConnected) {
      return {
        color: "yellow",
        description: "Complete authentication to continue",
        details: [
          `Wallet: ${address?.slice(0, 6)}...${address?.slice(-4)}`,
          "Status: Not authenticated",
          "Action: Sign message to complete login"
        ],
        icon: ClockIcon,
        title: "Wallet Connected"
      };
    }

    return {
      color: "red",
      description: "Connect your wallet to get started",
      details: [
        "No wallet connected",
        "Connect wallet to access Hey",
        "Choose from supported wallets"
      ],
      icon: ExclamationTriangleIcon,
      title: "Not Connected"
    };
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  const colorClasses = {
    green: {
      bg: "bg-green-50 dark:bg-green-900/20",
      border: "border-green-200 dark:border-green-800",
      detail: "text-green-700 dark:text-green-300",
      icon: "text-green-600 dark:text-green-400",
      text: "text-green-800 dark:text-green-200"
    },
    red: {
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-200 dark:border-red-800",
      detail: "text-red-700 dark:text-red-300",
      icon: "text-red-600 dark:text-red-400",
      text: "text-red-800 dark:text-red-200"
    },
    yellow: {
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      border: "border-yellow-200 dark:border-yellow-800",
      detail: "text-yellow-700 dark:text-yellow-300",
      icon: "text-yellow-600 dark:text-yellow-400",
      text: "text-yellow-800 dark:text-yellow-200"
    }
  };

  const colors = colorClasses[statusInfo.color as keyof typeof colorClasses];

  return (
    <div
      className={`rounded-lg border p-4 ${colors.bg} ${colors.border} ${className}`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${colors.icon}`} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className={`font-medium text-sm ${colors.text}`}>
            {statusInfo.title}
          </h3>
          <p className={`text-sm ${colors.detail} mt-1`}>
            {statusInfo.description}
          </p>

          {showDetails && statusInfo.details && (
            <ul className="mt-2 space-y-1">
              {statusInfo.details.map((detail, index) => (
                <li
                  className={`text-xs ${colors.detail} flex items-center space-x-1`}
                  key={index}
                >
                  <span className="text-gray-400 dark:text-gray-500">•</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Action Button */}
      {!isAuthenticated && (
        <div className="mt-3 flex justify-end">
          {isConnected ? (
            <button
              className={`text-xs ${colors.text} flex items-center space-x-1 hover:underline`}
              type="button"
            >
              <KeyIcon className="h-3 w-3" />
              <span>Complete Authentication</span>
            </button>
          ) : (
            <button
              className={`text-xs ${colors.text} hover:underline`}
              type="button"
            >
              Connect Wallet
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AuthStatus;
