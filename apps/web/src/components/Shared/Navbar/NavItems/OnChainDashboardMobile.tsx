import { BoltIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

interface OnChainDashboardMobileProps {
  className?: string;
  onClick?: () => void;
}

const OnChainDashboardMobile = ({
  className,
  onClick
}: OnChainDashboardMobileProps) => {
  return (
    <Link
      className={className}
      onClick={onClick}
      to="/settings/onchain-dashboard"
    >
      <div className="flex items-center space-x-3">
        <BoltIcon className="size-5" />
        <span>On-Chain Dashboard</span>
      </div>
    </Link>
  );
};

export default OnChainDashboardMobile;
