import type React from "react";
import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/Shared/UI/Tabs";
import AdminDashboard from "./AdminDashboard";
import UserManagement from "./UserManagement";

const AdminSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
      <div className="space-y-2 text-center">
        <h1 className="font-bold text-3xl text-gray-900">Admin System</h1>
        <p className="text-gray-600">
          Manage platform, users, and system settings
        </p>
      </div>

      <Tabs className="w-full" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>

        <TabsContent className="mt-6" value="dashboard">
          <AdminDashboard />
        </TabsContent>

        <TabsContent className="mt-6" value="users">
          <UserManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSystem;
