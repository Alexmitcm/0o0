import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
// import { fa } from "date-fns/locale";
import {
  Award,
  Calendar,
  Coins,
  Crown,
  Edit,
  MapPin,
  Shield,
  Star,
  Trophy,
  User,
  Zap
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Skeleton
} from "@/components/Shared/UI";

interface UserProfileData {
  id: string;
  username: string;
  displayName?: string;
  walletAddress: string;
  bio?: string;
  location?: string;
  website?: string;
  avatar?: string;
  coins: number;
  staminaLevel: number;
  todaysPoints: number;
  experienceCoins: number;
  achievementCoins: number;
  socialCoins: number;
  premiumCoins: number;
  createdAt: string;
  lastActiveAt: string;
  transactionCount: number;
  tournamentCount: number;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: string;
  }>;
  recentTournaments: Array<{
    id: string;
    name: string;
    rank: number;
    prizeAmount: number;
    completedAt: string;
  }>;
}

interface UserProfileProps {
  walletAddress: string;
  isOwnProfile?: boolean;
}

const fetchUserProfile = async (
  walletAddress: string
): Promise<UserProfileData> => {
  const response = await fetch(`/api/users/profile/${walletAddress}`);
  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }
  return response.json();
};

const UserProfile: React.FC<UserProfileProps> = ({
  walletAddress,
  isOwnProfile = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    bio: "",
    displayName: "",
    location: "",
    website: ""
  });

  const {
    data: profile,
    isLoading,
    error
  } = useQuery({
    queryFn: () => fetchUserProfile(walletAddress),
    queryKey: ["userProfile", walletAddress],
    refetchInterval: 30000
  });

  const handleEdit = () => {
    if (profile) {
      setEditData({
        bio: profile.bio || "",
        displayName: profile.displayName || "",
        location: profile.location || "",
        website: profile.website || ""
      });
    }
    setIsEditing(true);
  };

  const handleSave = () => {
    // Save functionality is handled by parent component
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
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
            <p>Error loading user profile</p>
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

  if (!profile) return null;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start space-x-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile.avatar ? (
                <img
                  alt="Profile"
                  className="h-24 w-24 rounded-full object-cover"
                  src={profile.avatar}
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-200">
                  <User className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h1 className="font-bold text-2xl text-gray-900">
                    {profile.displayName || profile.username}
                  </h1>
                  <p className="text-gray-600">@{profile.username}</p>
                  <p className="text-gray-500 text-sm">
                    {profile.walletAddress.slice(0, 6)}...
                    {profile.walletAddress.slice(-4)}
                  </p>

                  {/* Bio */}
                  {isEditing ? (
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Input
                        id="bio"
                        onChange={(e) =>
                          setEditData({ ...editData, bio: e.target.value })
                        }
                        placeholder="Tell us about yourself..."
                        value={editData.bio}
                      />
                    </div>
                  ) : (
                    profile.bio && (
                      <p className="mt-2 text-gray-700">{profile.bio}</p>
                    )
                  )}

                  {/* Location & Website */}
                  <div className="mt-2 flex flex-wrap gap-4 text-gray-500 text-sm">
                    {isEditing ? (
                      <>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <Input
                            className="w-32"
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                location: e.target.value
                              })
                            }
                            placeholder="Location"
                            value={editData.location}
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <Shield className="h-4 w-4" />
                          <Input
                            className="w-48"
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                website: e.target.value
                              })
                            }
                            placeholder="Website"
                            value={editData.website}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        {profile.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{profile.location}</span>
                          </div>
                        )}
                        {profile.website && (
                          <div className="flex items-center gap-1">
                            <Shield className="h-4 w-4" />
                            <a
                              className="text-blue-600 hover:underline"
                              href={profile.website}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              {profile.website}
                            </a>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Join Date */}
                  <div className="mt-2 flex items-center gap-1 text-gray-500 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Joined{" "}
                      {formatDistanceToNow(new Date(profile.createdAt), {
                        addSuffix: true
                      })}
                    </span>
                  </div>
                </div>

                {/* Edit Button */}
                {isOwnProfile && (
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          onClick={handleCancel}
                          size="sm"
                          variant="outline"
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleSave} size="sm">
                          Save
                        </Button>
                      </>
                    ) : (
                      <Button onClick={handleEdit} size="sm" variant="outline">
                        <Edit className="mr-1 h-4 w-4" />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Coins className="h-4 w-4 text-yellow-500" />
              Total Coins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {profile.coins.toLocaleString()}
            </div>
            <p className="text-gray-500 text-xs">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-blue-500" />
              Stamina Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{profile.staminaLevel}</div>
            <p className="text-gray-500 text-xs">Current level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4 text-purple-500" />
              Tournaments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{profile.tournamentCount}</div>
            <p className="text-gray-500 text-xs">Participated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-green-500" />
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{profile.transactionCount}</div>
            <p className="text-gray-500 text-xs">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Coin Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Coin Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="font-bold text-2xl text-green-600">
                {profile.experienceCoins.toLocaleString()}
              </div>
              <p className="text-gray-500 text-sm">Experience</p>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl text-yellow-600">
                {profile.achievementCoins.toLocaleString()}
              </div>
              <p className="text-gray-500 text-sm">Achievement</p>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl text-purple-600">
                {profile.socialCoins.toLocaleString()}
              </div>
              <p className="text-gray-500 text-sm">Social</p>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl text-orange-600">
                {profile.premiumCoins.toLocaleString()}
              </div>
              <p className="text-gray-500 text-sm">Premium</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      {profile.achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {profile.achievements.map((achievement) => (
                <div
                  className="flex items-center space-x-3 rounded-lg border p-3"
                  key={achievement.id}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                    <Award className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">
                      {achievement.name}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {achievement.description}
                    </p>
                    <p className="text-gray-400 text-xs">
                      Earned{" "}
                      {formatDistanceToNow(new Date(achievement.earnedAt), {
                        addSuffix: true
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Tournaments */}
      {profile.recentTournaments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Recent Tournaments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profile.recentTournaments.map((tournament) => (
                <div
                  className="flex items-center justify-between rounded-lg border p-3"
                  key={tournament.id}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                      <Trophy className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">{tournament.name}</p>
                      <p className="text-gray-500 text-sm">
                        Rank #{tournament.rank} •{" "}
                        {tournament.prizeAmount.toLocaleString()} coins
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    Completed
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserProfile;
