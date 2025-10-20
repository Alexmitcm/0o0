import { useState } from "react";
import { Button } from "@/components/Shared/UI/Button";

interface ErrorRecoveryProps {
  error: Error;
  onRetry: () => void;
  onReport: (error: Error) => void;
  className?: string;
}

const ErrorRecovery = ({
  error,
  onRetry,
  onReport,
  className = ""
}: ErrorRecoveryProps) => {
  const [isReporting, setIsReporting] = useState(false);
  const [reported, setReported] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    onRetry();
  };

  const handleReport = async () => {
    try {
      setIsReporting(true);
      await onReport(error);
      setReported(true);
    } catch (err) {
      console.error("Failed to report error:", err);
    } finally {
      setIsReporting(false);
    }
  };

  const getErrorType = () => {
    if (error.message.includes("network") || error.message.includes("fetch")) {
      return {
        description:
          "Unable to connect to the server. Please check your internet connection.",
        icon: "🌐",
        suggestions: [
          "Check your internet connection",
          "Try refreshing the page",
          "Check if the server is running"
        ],
        title: "Network Error"
      };
    }

    if (error.message.includes("auth") || error.message.includes("login")) {
      return {
        description:
          "There was an issue with your login session. Please try logging in again.",
        icon: "🔐",
        suggestions: [
          "Try logging in again",
          "Clear your browser cache",
          "Check if your session has expired"
        ],
        title: "Authentication Error"
      };
    }

    if (error.message.includes("game") || error.message.includes("play")) {
      return {
        description:
          "There was an issue loading or playing the game. Please try again.",
        icon: "🎮",
        suggestions: [
          "Try playing a different game",
          "Refresh the page",
          "Check if the game file is available"
        ],
        title: "Game Error"
      };
    }

    return {
      description:
        "An unexpected error occurred. Please try again or contact support.",
      icon: "⚠️",
      suggestions: [
        "Try refreshing the page",
        "Clear your browser cache",
        "Contact support if the issue persists"
      ],
      title: "Unknown Error"
    };
  };

  const errorType = getErrorType();

  return (
    <div
      className={`rounded-lg border border-red-500/30 bg-red-500/10 p-6 ${className}`}
    >
      <div className="text-center">
        <div className="mb-4 text-4xl">{errorType.icon}</div>
        <h3 className="mb-2 font-bold text-white text-xl">{errorType.title}</h3>
        <p className="mb-6 text-gray-300">{errorType.description}</p>

        {/* Error Details */}
        <details className="mb-6 text-left">
          <summary className="mb-2 cursor-pointer text-gray-400 text-sm">
            Error Details
          </summary>
          <div className="rounded border bg-gray-800 p-3 text-gray-300 text-xs">
            <pre className="whitespace-pre-wrap">{error.message}</pre>
            {error.stack && (
              <pre className="mt-2 whitespace-pre-wrap text-gray-500">
                {error.stack}
              </pre>
            )}
          </div>
        </details>

        {/* Suggestions */}
        <div className="mb-6 text-left">
          <h4 className="mb-3 font-semibold text-sm text-white">
            Try these solutions:
          </h4>
          <ul className="space-y-2">
            {errorType.suggestions.map((suggestion, index) => (
              <li
                className="flex items-start gap-2 text-gray-300 text-sm"
                key={index}
              >
                <span className="text-green-400">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              disabled={retryCount >= 3}
              onClick={handleRetry}
              variant="primary"
            >
              {retryCount >= 3
                ? "Max Retries Reached"
                : `Try Again (${retryCount}/3)`}
            </Button>

            <Button onClick={() => window.location.reload()} variant="ghost">
              Refresh Page
            </Button>
          </div>

          {/* Error Reporting */}
          <div className="border-white/10 border-t pt-4">
            <p className="mb-3 text-gray-400 text-sm">
              Help us improve by reporting this error
            </p>
            <Button
              disabled={isReporting || reported}
              onClick={handleReport}
              size="sm"
              variant="secondary"
            >
              {isReporting
                ? "Reporting..."
                : reported
                  ? "Reported ✓"
                  : "Report Error"}
            </Button>
          </div>
        </div>

        {/* Retry Count Warning */}
        {retryCount >= 2 && (
          <div className="mt-4 rounded-lg bg-yellow-500/10 p-3">
            <p className="text-sm text-yellow-400">
              Multiple retries detected. If the problem persists, please contact
              support.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorRecovery;
