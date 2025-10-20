import type React from "react";
import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/Shared/UI/Tabs";
import UserProfile from "./UserProfile";
import UserSettings from "./UserSettings";

interface UserSystemProps {
  walletAddress: string;
  isOwnProfile?: boolean;
}

const UserSystem: React.FC<UserSystemProps> = ({
  walletAddress,
  isOwnProfile = false
}) => {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <Tabs className="w-full" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          {isOwnProfile && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>

        <TabsContent className="mt-6" value="profile">
          <UserProfile
            isOwnProfile={isOwnProfile}
            walletAddress={walletAddress}
          />
        </TabsContent>

        {isOwnProfile && (
          <TabsContent className="mt-6" value="settings">
            <UserSettings walletAddress={walletAddress} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default UserSystem;
