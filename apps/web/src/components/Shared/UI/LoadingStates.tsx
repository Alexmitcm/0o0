import type React from "react";
import cn from "@/helpers/cn";

interface LoadingSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: "primary" | "secondary" | "white" | "gray";
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  color = "primary",
  className = ""
}) => {
  const sizeClasses = {
    lg: "h-8 w-8",
    md: "h-6 w-6",
    sm: "h-4 w-4",
    xl: "h-12 w-12",
    xs: "h-3 w-3"
  };

  const colorClasses = {
    gray: "text-gray-400",
    primary: "text-blue-600",
    secondary: "text-gray-600",
    white: "text-white"
  };

  return (
    <div
      aria-label="Loading"
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-current border-r-transparent border-solid",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      role="status"
    />
  );
};

interface LoadingDotsProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "white";
  className?: string;
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({
  size = "md",
  color = "primary",
  className = ""
}) => {
  const sizeClasses = {
    lg: "h-3 w-3",
    md: "h-2 w-2",
    sm: "h-1 w-1"
  };

  const colorClasses = {
    primary: "bg-blue-600",
    secondary: "bg-gray-600",
    white: "bg-white"
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[0, 1, 2].map((index) => (
        <div
          className={cn(
            "animate-pulse rounded-full",
            sizeClasses[size],
            colorClasses[color]
          )}
          key={index}
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: "1.4s"
          }}
        />
      ))}
    </div>
  );
};

interface SkeletonProps {
  className?: string;
  lines?: number;
  variant?: "text" | "circular" | "rectangular";
  animation?: "pulse" | "wave" | "none";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  lines = 1,
  variant = "rectangular",
  animation = "pulse"
}) => {
  const baseClasses = "bg-gray-300 dark:bg-gray-700";

  const variantClasses = {
    circular: "h-12 w-12 rounded-full",
    rectangular: "h-4 rounded-md",
    text: "h-4 rounded"
  };

  const animationClasses = {
    none: "",
    pulse: "animate-pulse",
    wave: "animate-shimmer"
  };

  const skeletonClasses = cn(
    baseClasses,
    variantClasses[variant],
    animationClasses[animation],
    className
  );

  if (variant === "text" && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            className={cn(
              skeletonClasses,
              index === lines - 1 && "w-3/4" // Last line is shorter
            )}
            key={index}
          />
        ))}
      </div>
    );
  }

  return <div aria-hidden="true" className={skeletonClasses} />;
};

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
  spinner?: React.ReactNode;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  message = "Loading...",
  spinner,
  className = ""
}) => {
  return (
    <div className={cn("relative", className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
          <div className="flex flex-col items-center gap-3">
            {spinner || <LoadingSpinner size="lg" />}
            {message && (
              <p className="text-gray-600 text-sm dark:text-gray-400">
                {message}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface ProgressBarProps {
  progress: number; // 0-100
  size?: "sm" | "md" | "lg";
  color?: "primary" | "success" | "warning" | "danger";
  animated?: boolean;
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  size = "md",
  color = "primary",
  animated = false,
  showPercentage = false,
  className = ""
}) => {
  const sizeClasses = {
    lg: "h-3",
    md: "h-2",
    sm: "h-1"
  };

  const colorClasses = {
    danger: "bg-red-600",
    primary: "bg-blue-600",
    success: "bg-green-600",
    warning: "bg-yellow-600"
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700",
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            colorClasses[color],
            animated && "animate-pulse"
          )}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {showPercentage && (
        <div className="mt-1 text-right">
          <span className="text-gray-500 text-xs dark:text-gray-400">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
};

interface LoadingCardProps {
  className?: string;
  showAvatar?: boolean;
  showImage?: boolean;
  lines?: number;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({
  className = "",
  showAvatar = true,
  showImage = false,
  lines = 3
}) => {
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800",
        className
      )}
    >
      <div className="flex items-start gap-3">
        {showAvatar && (
          <Skeleton className="flex-shrink-0" variant="circular" />
        )}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton lines={lines} variant="text" />
        </div>
      </div>
      {showImage && (
        <div className="mt-3">
          <Skeleton className="h-48 w-full" />
        </div>
      )}
    </div>
  );
};

// Main LoadingStates component
interface LoadingStatesProps {
  type?: "spinner" | "skeleton" | "dots" | "overlay" | "card";
  message?: string;
  className?: string;
  children?: React.ReactNode;
  count?: number;
}

export const LoadingStates: React.FC<LoadingStatesProps> = ({
  type = "spinner",
  message,
  className,
  children,
  count = 3
}) => {
  switch (type) {
    case "spinner":
      return (
        <div
          className={cn(
            "flex flex-col items-center justify-center p-4",
            className
          )}
        >
          <LoadingSpinner />
          {message && (
            <p className="mt-3 text-gray-600 dark:text-gray-400">{message}</p>
          )}
        </div>
      );
    case "skeleton":
      return (
        <div className={cn("space-y-4 p-4", className)}>
          {Array.from({ length: count }).map((_, index) => (
            <Skeleton key={index} />
          ))}
        </div>
      );
    case "dots":
      return (
        <div
          className={cn(
            "flex flex-col items-center justify-center p-4",
            className
          )}
        >
          <LoadingDots />
          {message && (
            <p className="mt-3 text-gray-600 dark:text-gray-400">{message}</p>
          )}
        </div>
      );
    case "overlay":
      return <LoadingOverlay isLoading={true}>{children}</LoadingOverlay>;
    case "card":
      return <LoadingCard />;
    default:
      return children || null;
  }
};

export default {
  LoadingCard,
  LoadingDots,
  LoadingOverlay,
  LoadingSpinner,
  LoadingStates,
  ProgressBar,
  Skeleton
};
