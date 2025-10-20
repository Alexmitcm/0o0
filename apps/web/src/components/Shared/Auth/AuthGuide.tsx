import {
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  KeyIcon,
  UserPlusIcon,
  WalletIcon
} from "@heroicons/react/24/outline";
import { useState } from "react";

interface AuthGuideProps {
  type: "login" | "signup";
  className?: string;
}

const AuthGuide: React.FC<AuthGuideProps> = ({ type, className = "" }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const steps =
    type === "signup"
      ? [
          {
            description:
              "Connect your Web3 wallet like MetaMask, WalletConnect, or browser wallet",
            icon: WalletIcon,
            tips: [
              "Make sure you have a wallet installed",
              "Ensure you have some ETH for gas fees",
              "Keep your wallet unlocked during the process"
            ],
            title: "Connect Your Wallet"
          },
          {
            description: "Pick a unique username for your Lens profile",
            icon: UserPlusIcon,
            tips: [
              "Username must be 3-26 characters long",
              "Only letters, numbers, and underscores allowed",
              "Your username will be permanent"
            ],
            title: "Choose Username"
          },
          {
            description: "Sign a message to prove you own the wallet",
            icon: KeyIcon,
            tips: [
              "This is free and doesn't cost gas",
              "The message is safe to sign",
              "This verifies your identity"
            ],
            title: "Sign Message"
          },
          {
            description: "Your Lens profile is now live and ready to use",
            icon: CheckIcon,
            tips: [
              "You can now post, follow, and interact",
              "Your profile is stored on the blockchain",
              "Welcome to the decentralized social web!"
            ],
            title: "Profile Created"
          }
        ]
      : [
          {
            description:
              "Connect the same wallet you used to create your account",
            icon: WalletIcon,
            tips: [
              "Use the same wallet address",
              "Make sure your wallet is unlocked",
              "Check your network connection"
            ],
            title: "Connect Your Wallet"
          },
          {
            description: "Choose your Lens profile to login with",
            icon: KeyIcon,
            tips: [
              "Select your main profile",
              "You can switch between profiles later",
              "Each profile has its own content"
            ],
            title: "Select Account"
          },
          {
            description:
              "Sign the authentication message to access your account",
            icon: CheckIcon,
            tips: [
              "This is free and secure",
              "Your wallet will prompt you to sign",
              "You'll be logged in after signing"
            ],
            title: "Sign & Login"
          }
        ];

  const commonIssues = [
    {
      icon: ExclamationTriangleIcon,
      solutions: [
        "Refresh the page and try again",
        "Make sure your wallet extension is unlocked",
        "Try a different browser or incognito mode",
        "Check if your wallet is up to date"
      ],
      title: "Wallet not connecting?"
    },
    {
      icon: ExclamationTriangleIcon,
      solutions: [
        "Try adding numbers or underscores",
        "Use a variation of your preferred name",
        "Check if the username is actually available",
        "Consider using your full name"
      ],
      title: "Username already taken?"
    },
    {
      icon: ExclamationTriangleIcon,
      solutions: [
        "Make sure you have enough ETH for gas",
        "Check your network connection",
        "Try increasing the gas limit",
        "Wait a moment and try again"
      ],
      title: "Transaction failed?"
    },
    {
      icon: ExclamationTriangleIcon,
      solutions: [
        "Make sure you're using the correct wallet",
        "Check if you created the profile on the same network",
        "Try refreshing the page",
        "Contact support if the issue persists"
      ],
      title: "Can't find my profile?"
    }
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toggle Button */}
      <button
        className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 text-left transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        <div className="flex items-center space-x-2">
          <InformationCircleIcon className="h-5 w-5 text-blue-500" />
          <span className="font-medium text-gray-900 text-sm dark:text-white">
            {type === "signup" ? "How to create your account" : "How to login"}
          </span>
        </div>
        <svg
          className={`h-4 w-4 text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M19 9l-7 7-7-7"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-6">
          {/* Steps */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm dark:text-white">
              Step-by-step process:
            </h3>
            {steps.map((step, index) => (
              <div className="flex space-x-3" key={index}>
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                    <step.icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-blue-600 text-xs dark:text-blue-400">
                      Step {index + 1}
                    </span>
                  </div>
                  <h4 className="mt-1 font-medium text-gray-900 text-sm dark:text-white">
                    {step.title}
                  </h4>
                  <p className="mt-1 text-gray-600 text-xs dark:text-gray-400">
                    {step.description}
                  </p>
                  {step.tips && (
                    <ul className="mt-2 space-y-1">
                      {step.tips.map((tip, tipIndex) => (
                        <li
                          className="flex items-start space-x-1 text-gray-500 text-xs dark:text-gray-400"
                          key={tipIndex}
                        >
                          <span className="text-gray-400 dark:text-gray-500">
                            •
                          </span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Common Issues */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm dark:text-white">
              Common issues & solutions:
            </h3>
            {commonIssues.map((issue, index) => (
              <div
                className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/10"
                key={index}
              >
                <div className="flex items-start space-x-2">
                  <issue.icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                  <div className="flex-1">
                    <h4 className="font-medium text-xs text-yellow-800 dark:text-yellow-200">
                      {issue.title}
                    </h4>
                    <ul className="mt-1 space-y-1">
                      {issue.solutions.map((solution, solutionIndex) => (
                        <li
                          className="flex items-start space-x-1 text-xs text-yellow-700 dark:text-yellow-300"
                          key={solutionIndex}
                        >
                          <span className="text-yellow-500 dark:text-yellow-400">
                            •
                          </span>
                          <span>{solution}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Help Link */}
          <div className="text-center">
            <p className="text-gray-500 text-xs dark:text-gray-400">
              Still having trouble?{" "}
              <a
                className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                href="https://hey.xyz/support"
                rel="noopener noreferrer"
                target="_blank"
              >
                Contact our support team
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthGuide;
