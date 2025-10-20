import type React from "react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/Shared/UI/Tabs";
import TransactionHistory from "./TransactionHistory";
import WithdrawModal from "./WithdrawModal";

interface TransactionSystemProps {
  walletAddress?: string;
}

const TransactionSystem: React.FC<TransactionSystemProps> = ({
  walletAddress: propWalletAddress
}) => {
  const { walletAddress: urlWalletAddress } = useParams<{
    walletAddress: string;
  }>();
  const walletAddress =
    propWalletAddress ||
    urlWalletAddress ||
    "0x0000000000000000000000000000000000000000";
  const [activeTab, setActiveTab] = useState("history");
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="space-y-2 text-center">
        <h1 className="flex items-center justify-center gap-2 font-bold text-3xl text-gray-900">
          💰 Transaction System
        </h1>
        <p className="text-gray-600">
          Manage your transactions and withdrawals
        </p>
      </div>

      <Tabs className="w-full" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="history">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent className="mt-6" value="history">
          <TransactionHistory
            onWithdrawClick={() => setIsWithdrawModalOpen(true)}
            walletAddress={walletAddress}
          />
        </TabsContent>
      </Tabs>

      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        setIsOpen={setIsWithdrawModalOpen}
        userCoins={1000}
        walletAddress={walletAddress}
      >
        <div />
      </WithdrawModal>
    </div>
  );
};

export default TransactionSystem;
