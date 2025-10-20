import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { usePremiumStore } from "@/store/premiumStore";

interface ProBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const ProBadge = ({ className = "", size = "md" }: ProBadgeProps) => {
  const { isPremium } = usePremiumStore();

  if (!isPremium) {
    return null;
  }

  const sizeClasses = {
    lg: "text-base px-4 py-2",
    md: "text-sm px-3 py-1.5",
    sm: "text-xs px-2 py-1"
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 font-medium text-white ${sizeClasses[size]} ${className}`}
    >
      <CheckCircleIcon className="h-4 w-4" />
      <span>Pro</span>
    </div>
  );
};

export default ProBadge;
