import { BoltIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { Tooltip } from "@/components/Shared/UI";

const OnChainDashboard = () => {
  return (
    <Link to="/settings/onchain-dashboard">
      <Tooltip content="On-Chain Dashboard">
        <BoltIcon className="size-6" />
      </Tooltip>
    </Link>
  );
};

export default OnChainDashboard;
