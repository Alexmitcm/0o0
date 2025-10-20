import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import { useHasPremiumAccess } from "@/helpers/premiumUtils";

interface PremiumBadgeProps {
  className?: string;
  showText?: boolean;
}

const PremiumBadge = ({
  className = "",
  showText = true
}: PremiumBadgeProps) => {
  const hasPremiumAccess = useHasPremiumAccess();

  if (!hasPremiumAccess) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <CheckBadgeIcon className="size-4 text-brand-500" />
      {showText && (
        <span className="font-medium text-brand-500 text-xs">Premium</span>
      )}
    </div>
  );
};

export default PremiumBadge;
