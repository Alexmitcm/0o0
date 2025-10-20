/**
 * Reusable loading state component with different variants
 */

import { Loader2Icon } from "lucide-react";
import { memo } from "react";
import styles from "./LoadingState.module.css";

interface LoadingStateProps {
  size?: "sm" | "md" | "lg";
  variant?: "spinner" | "dots" | "pulse" | "skeleton";
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

const LoadingState = memo<LoadingStateProps>(
  ({
    size = "md",
    variant = "spinner",
    text,
    className = "",
    fullScreen = false
  }) => {
    const sizeClasses = {
      lg: "h-12 w-12",
      md: "h-8 w-8",
      sm: "h-4 w-4"
    };

    const textSizeClasses = {
      lg: "text-lg",
      md: "text-base",
      sm: "text-sm"
    };

    const renderSpinner = () => (
      <Loader2Icon
        className={`animate-spin ${sizeClasses[size]} text-blue-500`}
        data-testid="loading-spinner"
      />
    );

    const renderDots = () => {
      const delayClasses = [styles.loadingDot, styles.loadingDotDelay1, styles.loadingDotDelay2];
      
      return (
        <div className="flex space-x-1" data-testid="loading-dots">
          {[0, 1, 2].map((i) => (
            <div
              className={`animate-bounce rounded-full bg-blue-500 ${delayClasses[i]} ${
                size === "sm" ? "h-2 w-2" : size === "md" ? "h-3 w-3" : "h-4 w-4"
              }`}
              key={i}
            />
          ))}
        </div>
      );
    };

    const renderPulse = () => (
      <div
        className={`animate-pulse rounded-full bg-blue-500 ${
          size === "sm" ? "h-4 w-4" : size === "md" ? "h-8 w-8" : "h-12 w-12"
        }`}
        data-testid="loading-pulse"
      />
    );

    const renderSkeleton = () => (
      <div className="space-y-2" data-testid="loading-skeleton">
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
      </div>
    );

    const renderContent = () => {
      switch (variant) {
        case "dots":
          return renderDots();
        case "pulse":
          return renderPulse();
        case "skeleton":
          return renderSkeleton();
        default:
          return renderSpinner();
      }
    };

    const content = (
      <div
        className={`flex flex-col items-center justify-center space-y-2 ${className}`}
      >
        {renderContent()}
        {text && (
          <p
            className={`text-gray-600 dark:text-gray-400 ${textSizeClasses[size]}`}
          >
            {text}
          </p>
        )}
      </div>
    );

    if (fullScreen) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
          {content}
        </div>
      );
    }

    return content;
  }
);

LoadingState.displayName = "LoadingState";

export default LoadingState;

