import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Eye, Lock, Save, Shield, User, X } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  SimpleAlert,
  Skeleton,
  Switch
} from "@/components/Shared/UI";

interface UserSettingsData {
  id: string;
  username: string;
  displayName?: string;
  email?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatar?: string;
  privacy: {
    showWalletAddress: boolean;
    showCoins: boolean;
    showTournaments: boolean;
    showTransactions: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    tournamentUpdates: boolean;
    coinUpdates: boolean;
    socialUpdates: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    loginAlerts: boolean;
    suspiciousActivityAlerts: boolean;
  };
}

interface UserSettingsProps {
  walletAddress: string;
}

const fetchUserSettings = async (
  walletAddress: string
): Promise<UserSettingsData> => {
  const response = await fetch(`/api/users/settings/${walletAddress}`);
  if (!response.ok) {
    throw new Error("Failed to fetch user settings");
  }
  return response.json();
};

const updateUserSettings = async (
  walletAddress: string,
  settings: Partial<UserSettingsData>
) => {
  const response = await fetch(`/api/users/settings/${walletAddress}`, {
    body: JSON.stringify(settings),
    headers: {
      "Content-Type": "application/json"
    },
    method: "PUT"
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update settings");
  }

  return response.json();
};

const UserSettings: React.FC<UserSettingsProps> = ({ walletAddress }) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [settings, setSettings] = useState<Partial<UserSettingsData>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryFn: () => fetchUserSettings(walletAddress),
    queryKey: ["userSettings", walletAddress]
  });

  // Update settings when data is loaded
  React.useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (updatedSettings: Partial<UserSettingsData>) =>
      updateUserSettings(walletAddress, updatedSettings),
    onError: (error: Error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      toast.success("Settings updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["userSettings", walletAddress]
      });
      setHasChanges(false);
    }
  });

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  const handleChange = (path: string, value: any) => {
    const newSettings = { ...settings };
    const keys = path.split(".");
    let current: any = newSettings;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    setSettings(newSettings);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <Skeleton className="mx-auto h-8 w-64" />
          <Skeleton className="mx-auto h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>Error loading settings</p>
            <Button
              className="mt-2"
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="flex items-center justify-center gap-2 font-bold text-3xl text-gray-900">
          <User className="h-8 w-8" />
          User Settings
        </h1>
        <p className="text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Settings Tabs */}
      <div className="flex space-x-1 rounded-lg bg-gray-100 p-1">
        {[
          { icon: User, id: "profile", label: "Profile" },
          { icon: Eye, id: "privacy", label: "Privacy" },
          { icon: Bell, id: "notifications", label: "Notifications" },
          { icon: Shield, id: "security", label: "Security" }
        ].map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              <IconComponent className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Profile Settings */}
      {activeTab === "profile" && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  onChange={(e) => handleChange("displayName", e.target.value)}
                  placeholder="Enter your display name"
                  value={settings.displayName || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input disabled id="username" value={data?.username || ""} />
                <p className="text-gray-500 text-xs">
                  Username cannot be changed
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Input
                id="bio"
                onChange={(e) => handleChange("bio", e.target.value)}
                placeholder="Tell us about yourself..."
                value={settings.bio || ""}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  onChange={(e) => handleChange("location", e.target.value)}
                  placeholder="Your location"
                  value={settings.location || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  onChange={(e) => handleChange("website", e.target.value)}
                  placeholder="https://yourwebsite.com"
                  value={settings.website || ""}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Privacy Settings */}
      {activeTab === "privacy" && (
        <Card>
          <CardHeader>
            <CardTitle>Privacy Settings</CardTitle>
            <p className="text-gray-600 text-sm">
              Control what information is visible to other users
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Wallet Address</p>
                  <p className="text-gray-500 text-sm">
                    Allow others to see your wallet address
                  </p>
                </div>
                <Switch
                  checked={
                    settings.privacy?.showWalletAddress ??
                    data.privacy.showWalletAddress
                  }
                  onCheckedChange={(checked) =>
                    handleChange("privacy.showWalletAddress", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Coin Balance</p>
                  <p className="text-gray-500 text-sm">
                    Allow others to see your coin balance
                  </p>
                </div>
                <Switch
                  checked={
                    settings.privacy?.showCoins ?? data.privacy.showCoins
                  }
                  onCheckedChange={(checked) =>
                    handleChange("privacy.showCoins", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Tournament History</p>
                  <p className="text-gray-500 text-sm">
                    Allow others to see your tournament participation
                  </p>
                </div>
                <Switch
                  checked={
                    settings.privacy?.showTournaments ??
                    data.privacy.showTournaments
                  }
                  onCheckedChange={(checked) =>
                    handleChange("privacy.showTournaments", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Transaction History</p>
                  <p className="text-gray-500 text-sm">
                    Allow others to see your transaction history
                  </p>
                </div>
                <Switch
                  checked={
                    settings.privacy?.showTransactions ??
                    data.privacy.showTransactions
                  }
                  onCheckedChange={(checked) =>
                    handleChange("privacy.showTransactions", checked)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notification Settings */}
      {activeTab === "notifications" && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <p className="text-gray-600 text-sm">
              Choose how you want to be notified about platform activities
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-gray-500 text-sm">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={
                    settings.notifications?.emailNotifications ??
                    data.notifications.emailNotifications
                  }
                  onCheckedChange={(checked) =>
                    handleChange("notifications.emailNotifications", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-gray-500 text-sm">
                    Receive push notifications in browser
                  </p>
                </div>
                <Switch
                  checked={
                    settings.notifications?.pushNotifications ??
                    data.notifications.pushNotifications
                  }
                  onCheckedChange={(checked) =>
                    handleChange("notifications.pushNotifications", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Tournament Updates</p>
                  <p className="text-gray-500 text-sm">
                    Get notified about tournament events
                  </p>
                </div>
                <Switch
                  checked={
                    settings.notifications?.tournamentUpdates ??
                    data.notifications.tournamentUpdates
                  }
                  onCheckedChange={(checked) =>
                    handleChange("notifications.tournamentUpdates", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Coin Updates</p>
                  <p className="text-gray-500 text-sm">
                    Get notified about coin-related activities
                  </p>
                </div>
                <Switch
                  checked={
                    settings.notifications?.coinUpdates ??
                    data.notifications.coinUpdates
                  }
                  onCheckedChange={(checked) =>
                    handleChange("notifications.coinUpdates", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Social Updates</p>
                  <p className="text-gray-500 text-sm">
                    Get notified about social activities
                  </p>
                </div>
                <Switch
                  checked={
                    settings.notifications?.socialUpdates ??
                    data.notifications.socialUpdates
                  }
                  onCheckedChange={(checked) =>
                    handleChange("notifications.socialUpdates", checked)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Settings */}
      {activeTab === "security" && (
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <p className="text-gray-600 text-sm">
              Manage your account security and authentication
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-gray-500 text-sm">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch
                  checked={
                    settings.security?.twoFactorEnabled ??
                    data.security.twoFactorEnabled
                  }
                  onCheckedChange={(checked) =>
                    handleChange("security.twoFactorEnabled", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Login Alerts</p>
                  <p className="text-gray-500 text-sm">
                    Get notified when someone logs into your account
                  </p>
                </div>
                <Switch
                  checked={
                    settings.security?.loginAlerts ?? data.security.loginAlerts
                  }
                  onCheckedChange={(checked) =>
                    handleChange("security.loginAlerts", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Suspicious Activity Alerts</p>
                  <p className="text-gray-500 text-sm">
                    Get notified about suspicious account activity
                  </p>
                </div>
                <Switch
                  checked={
                    settings.security?.suspiciousActivityAlerts ??
                    data.security.suspiciousActivityAlerts
                  }
                  onCheckedChange={(checked) =>
                    handleChange("security.suspiciousActivityAlerts", checked)
                  }
                />
              </div>
            </div>

            <SimpleAlert>
              <Lock className="h-4 w-4" />
              <div>
                For additional security, consider enabling two-factor
                authentication and keeping your wallet secure.
              </div>
            </SimpleAlert>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      {hasChanges && (
        <div className="flex justify-end space-x-3">
          <Button
            onClick={() => {
              setSettings(data);
              setHasChanges(false);
            }}
            variant="outline"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button disabled={updateMutation.isPending} onClick={handleSave}>
            {updateMutation.isPending ? (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserSettings;
