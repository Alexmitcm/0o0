import type React from "react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/Shared/UI/Tabs";
import NotificationList from "./NotificationList";
import NotificationStats from "./NotificationStats";

interface NotificationSystemProps {
  walletAddress?: string;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  walletAddress: propWalletAddress
}) => {
  const { walletAddress: urlWalletAddress } = useParams<{
    walletAddress: string;
  }>();
  const walletAddress =
    propWalletAddress ||
    urlWalletAddress ||
    "0x0000000000000000000000000000000000000000";
  const [activeTab, setActiveTab] = useState("list");

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="space-y-2 text-center">
        <h1 className="flex items-center justify-center gap-2 font-bold text-3xl text-gray-900">
          🔔 Notification System
        </h1>
        <p className="text-gray-600">
          Manage your notifications and stay updated with the latest events
        </p>
      </div>

      <Tabs className="w-full" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Notification List</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent className="mt-6" value="list">
          <NotificationList walletAddress={walletAddress} />
        </TabsContent>

        <TabsContent className="mt-6" value="stats">
          <NotificationStats walletAddress={walletAddress} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationSystem;
