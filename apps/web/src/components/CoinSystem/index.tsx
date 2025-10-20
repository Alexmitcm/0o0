import type React from "react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/Shared/UI/Tabs";
import CoinBalance from "./CoinBalance";
import CoinHistory from "./CoinHistory";
import CoinTransfer from "./CoinTransfer";

interface CoinSystemProps {
  walletAddress?: string;
}

const CoinSystem: React.FC<CoinSystemProps> = ({
  walletAddress: propWalletAddress
}) => {
  const { walletAddress: urlWalletAddress } = useParams<{
    walletAddress: string;
  }>();
  const walletAddress =
    propWalletAddress ||
    urlWalletAddress ||
    "0x0000000000000000000000000000000000000000";
  const [activeTab, setActiveTab] = useState("balance");

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="space-y-2 text-center">
        <h1 className="font-bold text-3xl text-gray-900">Coin System</h1>
        <p className="text-gray-600">
          Manage coins, transfer and view transaction history
        </p>
      </div>

      <Tabs className="w-full" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="balance">Balance</TabsTrigger>
          <TabsTrigger value="transfer">Transfer</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent className="mt-6" value="balance">
          <CoinBalance walletAddress={walletAddress} />
        </TabsContent>

        <TabsContent className="mt-6" value="transfer">
          <CoinTransfer
            fromWalletAddress={walletAddress}
            onTransferComplete={() => {
              // Optionally switch to history tab after successful transfer
              setActiveTab("history");
            }}
          />
        </TabsContent>

        <TabsContent className="mt-6" value="history">
          <CoinHistory walletAddress={walletAddress} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CoinSystem;
