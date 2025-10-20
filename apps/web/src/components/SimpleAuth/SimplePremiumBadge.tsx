import { useSimpleAuthContext } from "./SimpleAuthProvider";

interface SimplePremiumBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const SimplePremiumBadge = ({
  size = "md",
  className = ""
}: SimplePremiumBadgeProps) => {
  const { isPremium, isLoading } = useSimpleAuthContext();

  if (isLoading) {
    return (
      <div
        className={`animate-pulse rounded bg-gray-200 ${getSizeClasses(size)} ${className}`}
      />
    );
  }

  if (!isPremium) {
    return null;
  }

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 font-medium text-white ${getSizeClasses(size)} ${className}`}
    >
      <svg
        aria-label="Premium checkmark"
        className="h-3 w-3"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          clipRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          fillRule="evenodd"
        />
      </svg>
      <span>Pro</span>
    </div>
  );
};

const getSizeClasses = (size: "sm" | "md" | "lg") => {
  switch (size) {
    case "sm":
      return "px-2 py-1 text-xs";
    case "md":
      return "px-3 py-1.5 text-sm";
    case "lg":
      return "px-4 py-2 text-base";
    default:
      return "px-3 py-1.5 text-sm";
  }
};
