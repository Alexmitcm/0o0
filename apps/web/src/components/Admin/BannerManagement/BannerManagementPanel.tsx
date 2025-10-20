import { Button } from "@headlessui/react";
import {
  ArrowUpTrayIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import { useEffect, useId, useState } from "react";
import Card from "../../Shared/UI/Card";

interface Banner {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  priority: number;
  type: "hero" | "tournament" | "promotion";
  createdAt: string;
  updatedAt: string;
}

interface BannerStats {
  totalBanners: number;
  activeBanners: number;
  heroBanners: number;
  tournamentBanners: number;
  promotionBanners: number;
  upcomingBanners: number;
}

const BannerManagementPanel = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [stats, setStats] = useState<BannerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Generate unique IDs for form elements
  const searchInputId = useId();
  const typeFilterId = useId();
  const bannerTitleId = useId();
  const bannerDescriptionId = useId();
  const bannerTypeId = useId();
  const bannerPriorityId = useId();
  const bannerStartTimeId = useId();
  const bannerEndTimeId = useId();

  // Fetch banners and stats
  const fetchData = async () => {
    try {
      // For now, use mock data since there are no public banner endpoints
      const mockBanners: Banner[] = [
        {
          createdAt: "2024-10-01T10:00:00Z",
          description: "Join the ultimate gaming platform",
          endTime: "2024-12-31T23:59:59Z",
          id: "1",
          imageUrl: "/banners/hero-banner-1.jpg",
          isActive: true,
          mobileImageUrl: "/banners/hero-banner-1-mobile.jpg",
          priority: 1,
          startTime: "2024-10-01T00:00:00Z",
          title: "Welcome to 0xArena",
          type: "hero",
          updatedAt: "2024-10-15T14:30:00Z"
        },
        {
          createdAt: "2024-10-15T09:00:00Z",
          description: "Compete for the grand prize",
          endTime: "2024-10-25T23:59:59Z",
          id: "2",
          imageUrl: "/banners/tournament-chess.jpg",
          isActive: true,
          mobileImageUrl: "/banners/tournament-chess-mobile.jpg",
          priority: 2,
          startTime: "2024-10-20T00:00:00Z",
          title: "Chess Tournament Championship",
          type: "tournament",
          updatedAt: "2024-10-15T09:00:00Z"
        },
        {
          createdAt: "2024-10-10T08:00:00Z",
          description: "Get 50% off premium features",
          endTime: "2024-10-20T23:59:59Z",
          id: "3",
          imageUrl: "/banners/promotion-premium.jpg",
          isActive: false,
          mobileImageUrl: "/banners/promotion-premium-mobile.jpg",
          priority: 3,
          startTime: "2024-10-10T00:00:00Z",
          title: "Premium Upgrade Special",
          type: "promotion",
          updatedAt: "2024-10-16T12:00:00Z"
        },
        {
          createdAt: "2024-10-16T16:00:00Z",
          description: "Check out our latest game collection",
          endTime: "2024-11-30T23:59:59Z",
          id: "4",
          imageUrl: "/banners/hero-games.jpg",
          isActive: false,
          mobileImageUrl: "/banners/hero-games-mobile.jpg",
          priority: 4,
          startTime: "2024-11-01T00:00:00Z",
          title: "New Games Available",
          type: "hero",
          updatedAt: "2024-10-16T16:00:00Z"
        }
      ];

      const mockStats: BannerStats = {
        activeBanners: 2,
        heroBanners: 2,
        promotionBanners: 1,
        totalBanners: 4,
        tournamentBanners: 1,
        upcomingBanners: 1
      };

      setBanners(mockBanners);
      setStats(mockStats);
    } catch (error) {
      console.error("Error fetching banner data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter banners
  const filteredBanners = banners.filter((banner) => {
    const matchesSearch =
      banner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      banner.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || banner.type === selectedType;
    return matchesSearch && matchesType;
  });

  // Get unique types
  const types = ["all", ...Array.from(new Set(banners.map((b) => b.type)))];

  // Handle banner actions
  const handleBannerAction = async (bannerId: string, action: string) => {
    // For now, just show a message that this feature requires admin authentication
    alert(
      `Banner action "${action}" requires admin authentication. This will be implemented when proper admin endpoints are available.`
    );

    // TODO: Implement proper banner actions when admin endpoints are available
    console.log("Banner action requested:", action, "for banner:", bannerId);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "hero":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "tournament":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "promotion":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-2xl text-gray-900 dark:text-white">
            Banner Management
          </h2>
          <p className="text-gray-600 text-sm dark:text-gray-400">
            Manage site banners, hero slides, and promotional content
          </p>
        </div>
        <Button
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={() => setShowUploadModal(true)}
        >
          <PlusIcon className="h-4 w-4" />
          Upload Banner
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowUpTrayIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm dark:text-gray-400">
                    Total Banners
                  </p>
                  <p className="font-semibold text-2xl text-gray-900 dark:text-white">
                    {stats.totalBanners}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                    <div className="h-4 w-4 rounded-full bg-green-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm dark:text-gray-400">
                    Active Banners
                  </p>
                  <p className="font-semibold text-2xl text-gray-900 dark:text-white">
                    {stats.activeBanners}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
                    <div className="h-4 w-4 rounded-full bg-yellow-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm dark:text-gray-400">
                    Upcoming
                  </p>
                  <p className="font-semibold text-2xl text-gray-900 dark:text-white">
                    {stats.upcomingBanners}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative">
                <input
                  aria-label="Search banners"
                  className="rounded-lg border border-gray-300 px-3 py-2 pl-10 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  id={searchInputId}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search banners..."
                  type="text"
                  value={searchTerm}
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg
                    aria-label="Search icon"
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    role="img"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                </div>
              </div>

              <select
                aria-label="Filter by type"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                id={typeFilterId}
                onChange={(e) => setSelectedType(e.target.value)}
                value={selectedType}
              >
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type === "all"
                      ? "All Types"
                      : type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-gray-600 text-sm dark:text-gray-400">
              Showing {filteredBanners.length} of {banners.length} banners
            </div>
          </div>
        </div>
      </Card>

      {/* Banners Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredBanners.map((banner) => (
          <Card key={banner.id}>
            <div className="p-4">
              <div className="mb-4">
                <img
                  alt={banner.title}
                  className="h-32 w-full rounded-lg object-cover"
                  src={banner.imageUrl}
                />
              </div>

              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 text-lg dark:text-white">
                  {banner.title}
                </h3>
                {banner.description && (
                  <p className="text-gray-600 text-sm dark:text-gray-400">
                    {banner.description}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 font-semibold text-xs ${getStatusColor(banner.isActive)}`}
                  >
                    {banner.isActive ? "Active" : "Inactive"}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 font-semibold text-xs ${getTypeColor(banner.type)}`}
                  >
                    {banner.type.charAt(0).toUpperCase() + banner.type.slice(1)}
                  </span>
                  <span className="rounded-full bg-gray-100 px-2 py-1 font-semibold text-gray-800 text-xs dark:bg-gray-700 dark:text-gray-200">
                    Priority {banner.priority}
                  </span>
                </div>
              </div>

              <div className="mb-4 text-gray-600 text-xs dark:text-gray-400">
                <div>
                  Start: {new Date(banner.startTime).toLocaleDateString()}
                </div>
                <div>End: {new Date(banner.endTime).toLocaleDateString()}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
                  onClick={() => setSelectedBanner(banner)}
                >
                  <EyeIcon className="h-4 w-4" />
                  View
                </Button>

                <Button
                  className="flex items-center gap-1 rounded-lg bg-yellow-600 px-3 py-2 text-white hover:bg-yellow-700"
                  onClick={() => handleBannerAction(banner.id, "edit")}
                >
                  <PencilIcon className="h-4 w-4" />
                  Edit
                </Button>

                <Button
                  className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-white hover:bg-red-700"
                  onClick={() => handleBannerAction(banner.id, "delete")}
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Banner Details Modal */}
      {selectedBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-2xl">
            <div className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <h3 className="font-semibold text-gray-900 text-lg dark:text-white">
                  {selectedBanner.title}
                </h3>
                <Button
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={() => setSelectedBanner(null)}
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <img
                    alt={selectedBanner.title}
                    className="h-48 w-full rounded-lg object-cover"
                    src={selectedBanner.imageUrl}
                  />
                </div>

                <div>
                  <label
                    className="block font-medium text-gray-700 text-sm dark:text-gray-300"
                    htmlFor={bannerTitleId}
                  >
                    Title
                  </label>
                  <p
                    className="text-gray-900 text-sm dark:text-white"
                    id={bannerTitleId}
                  >
                    {selectedBanner.title}
                  </p>
                </div>

                {selectedBanner.description && (
                  <div>
                    <label
                      className="block font-medium text-gray-700 text-sm dark:text-gray-300"
                      htmlFor={bannerDescriptionId}
                    >
                      Description
                    </label>
                    <p
                      className="text-gray-900 text-sm dark:text-white"
                      id={bannerDescriptionId}
                    >
                      {selectedBanner.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block font-medium text-gray-700 text-sm dark:text-gray-300"
                      htmlFor={bannerTypeId}
                    >
                      Type
                    </label>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 font-semibold text-xs ${getTypeColor(selectedBanner.type)}`}
                      id={bannerTypeId}
                    >
                      {selectedBanner.type.charAt(0).toUpperCase() +
                        selectedBanner.type.slice(1)}
                    </span>
                  </div>

                  <div>
                    <label
                      className="block font-medium text-gray-700 text-sm dark:text-gray-300"
                      htmlFor={bannerPriorityId}
                    >
                      Priority
                    </label>
                    <p
                      className="text-gray-900 text-sm dark:text-white"
                      id={bannerPriorityId}
                    >
                      {selectedBanner.priority}
                    </p>
                  </div>

                  <div>
                    <label
                      className="block font-medium text-gray-700 text-sm dark:text-gray-300"
                      htmlFor={bannerStartTimeId}
                    >
                      Start Time
                    </label>
                    <p
                      className="text-gray-900 text-sm dark:text-white"
                      id={bannerStartTimeId}
                    >
                      {new Date(selectedBanner.startTime).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <label
                      className="block font-medium text-gray-700 text-sm dark:text-gray-300"
                      htmlFor={bannerEndTimeId}
                    >
                      End Time
                    </label>
                    <p
                      className="text-gray-900 text-sm dark:text-white"
                      id={bannerEndTimeId}
                    >
                      {new Date(selectedBanner.endTime).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Upload Modal Placeholder */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <h3 className="font-semibold text-gray-900 text-lg dark:text-white">
                  Upload Banner
                </h3>
                <Button
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={() => setShowUploadModal(false)}
                >
                  ✕
                </Button>
              </div>

              <div className="text-center">
                <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-600 text-sm dark:text-gray-400">
                  Banner upload feature will be implemented when admin endpoints
                  are available.
                </p>
                <Button
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  onClick={() => setShowUploadModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BannerManagementPanel;
